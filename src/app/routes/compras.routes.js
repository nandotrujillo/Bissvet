const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql');
const invBusiness = require('../Services/inventarioBusiness');
const cajaBusiness = require('../Services/cajaBusiness');

// =====================================================
// LISTAR COMPRAS  (GET /api/compras)
// Filtros: ?doc=1, ?estado=CONFIRMADA, ?proveedor=1, ?bodega=1, ?desde&hasta
// =====================================================
router.get('/', async (req, res) => {
    try {
        const condiciones = [];
        const params = [];
        if (req.query.doc)        { condiciones.push('c.IdCompra = ?'); params.push(Number(req.query.doc)); }
        if (req.query.estado)     { condiciones.push('c.Estado = ?'); params.push(req.query.estado); }
        if (req.query.proveedor)  { condiciones.push('c.IdProveedor = ?'); params.push(Number(req.query.proveedor)); }
        if (req.query.bodega)     { condiciones.push('c.IdBodega = ?'); params.push(Number(req.query.bodega)); }
        if (req.query.desde) { condiciones.push('c.Fecha >= ?'); params.push(req.query.desde); }
        if (req.query.hasta) { condiciones.push('c.Fecha <= ?'); params.push(req.query.hasta); }
        condiciones.push('c.IdEmpresa = ?');
        params.push(req.auth?.IdEmpresa ?? null);
        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

        const [rows] = await pool.query(`
            SELECT
                c.IdCompra, c.Numero, c.Fecha, c.Estado,
                c.IdProveedor, pr.Nombre AS NombreProveedor, pr.Nit,
                c.IdBodega, b.NombreBodega,
                c.Subtotal, c.Descuento, c.Impuesto, c.Total,
                c.MetodoPago, c.SaldoPendiente,
                c.TipoDocumento, c.NumeroDocumentoProveedor,
                c.Observaciones, c.UsuarioIdCreacion,
                c.FechaCreacion, c.FechaConfirmacion, c.FechaAnulacion,
                (SELECT COUNT(*) FROM compras_detalle cd WHERE cd.IdCompra = c.IdCompra) AS TotalItems,
                (SELECT COUNT(*) FROM compras_detalle cd WHERE cd.IdCompra = c.IdCompra) AS TotalLineas
            FROM compras c
            INNER JOIN proveedores pr ON pr.IdProveedor = c.IdProveedor
            INNER JOIN bodegas b      ON b.Id = c.IdBodega
            ${where}
            ORDER BY c.Fecha DESC, c.IdCompra DESC
        `, params);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error listando compras:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando compras', error: error.message });
    }
});

// =====================================================
// OBTENER COMPRA CON DETALLE  (GET /api/compras/:id)
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const [cabecera] = await pool.query(`
            SELECT
                c.IdCompra, c.Numero, c.Fecha, c.Estado,
                c.IdProveedor, pr.Nombre AS NombreProveedor, pr.Nit,
                c.IdBodega, b.NombreBodega,
                c.Subtotal, c.Descuento, c.Impuesto, c.Total,
                c.MetodoPago, c.SaldoPendiente,
                c.TipoDocumento, c.NumeroDocumentoProveedor,
                c.Observaciones, c.UsuarioIdCreacion, c.FechaCreacion,
                c.UsuarioIdConfirmacion, c.FechaConfirmacion,
                c.UsuarioIdAnulacion, c.FechaAnulacion
            FROM compras c
            INNER JOIN proveedores pr ON pr.IdProveedor = c.IdProveedor
            INNER JOIN bodegas b      ON b.Id = c.IdBodega
            WHERE c.IdCompra = ? AND c.IdEmpresa = ?
        `, [req.params.id, req.auth?.IdEmpresa ?? null]);
        if (cabecera.length === 0)
            return res.status(404).json({ ok: false, mensaje: 'Compra no encontrada' });

        const [detalle] = await pool.query(`
            SELECT
                cd.IdDetalleCompra, cd.IdCompra, cd.IdProducto,
                p.CodigoProducto, p.NombreProducto,
                cd.IdLote, l.NumeroLote, l.FechaVencimiento,
                cd.Cantidad, cd.CostoUnitario, cd.Descuento, cd.Impuesto, cd.Total,
                ROUND(cd.Cantidad * cd.CostoUnitario, 4) AS TotalSinImpuesto
            FROM compras_detalle cd
            INNER JOIN productos p ON p.IdProducto = cd.IdProducto
            LEFT JOIN lotes l      ON l.IdLote = cd.IdLote
            WHERE cd.IdCompra = ?
        `, [req.params.id]);

        const [cuotas] = await pool.query(`
            SELECT
                pc.IdPagoCompra, pc.NumeroCuota, pc.ValorCuota,
                pc.SaldoPendiente, pc.FechaVencimiento, pc.Estado,
                COALESCE((SELECT SUM(a.ValorAbono) FROM pagos_compras_abonos a
                          WHERE a.IdPagoCompra = pc.IdPagoCompra), 0) AS TotalAbonado,
                (SELECT COUNT(*) FROM pagos_compras_abonos a
                 WHERE a.IdPagoCompra = pc.IdPagoCompra) AS NumeroAbonos
            FROM pagos_compras pc
            WHERE pc.IdCompra = ? AND pc.IdEmpresa = ?
            ORDER BY pc.NumeroCuota
        `, [req.params.id, req.auth?.IdEmpresa ?? null]);

        res.json({ ok: true, datos: { ...cabecera[0], Detalle: detalle, Cuotas: cuotas } });
    } catch (error) {
        console.error('Error obteniendo compra:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando compra', error: error.message });
    }
});

// =====================================================
// CREAR COMPRA (BORRADOR)  (POST /api/compras)
// Body: { Numero, IdProveedor, IdBodega, Fecha, Observaciones, UsuarioIdCreacion,
//         Detalle: [{ IdProducto, Cantidad, CostoUnitario, Descuento, Impuesto }] }
// No afecta inventario hasta CONFIRMAR.
// =====================================================
router.post('/', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const {
            Numero, IdProveedor, IdBodega, Fecha, Observaciones,
            MetodoPago, TipoDocumento, NumeroDocumentoProveedor, Detalle
        } = req.body;
        // Usuario y empresa provienen de la sesión, no del body.
        const UsuarioIdCreacion = req.auth?.UsuarioId ?? null;
        const IdEmpresa = req.auth?.IdEmpresa ?? null;

        // Número de documento: si no se envía, se genera automáticamente (C-N).
        let numeroFinal = Numero;
        if (!numeroFinal || !numeroFinal.trim()) {
            const [seq] = await conn.query(
                `SELECT IFNULL(MAX(CAST(SUBSTRING_INDEX(Numero,'-',-1) AS UNSIGNED)), 0) + 1 AS siguiente
                 FROM compras
                 WHERE IdEmpresa = ? AND Numero LIKE 'C-%'
                   AND SUBSTRING_INDEX(Numero,'-',-1) REGEXP '^[0-9]+$'`,
                [IdEmpresa]
            );
            numeroFinal = `C-${seq[0].siguiente}`;
        } else {
            numeroFinal = numeroFinal.trim();
        }
        if (!IdProveedor)
            return res.status(400).json({ ok: false, mensaje: 'El proveedor es obligatorio' });
        if (!IdBodega)
            return res.status(400).json({ ok: false, mensaje: 'La bodega es obligatoria' });
        if (!Detalle || !Detalle.length)
            return res.status(400).json({ ok: false, mensaje: 'Debe agregar al menos un producto' });

        // Verificar duplicado de número (dentro de la misma empresa)
        const [duplicado] = await conn.query(
            `SELECT IdCompra FROM compras WHERE Numero = ? AND IdEmpresa = ?`,
            [numeroFinal, IdEmpresa]
        );
        if (duplicado.length > 0)
            return res.status(409).json({ ok: false, mensaje: 'Ya existe una compra con ese número' });

        // Calcular totales
        let Subtotal = 0, Descuento = 0, Impuesto = 0, Total = 0;
        for (const item of Detalle) {
            if (!item.IdProducto) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: 'Cada detalle debe tener IdProducto' }); }
            if (!item.Cantidad || item.Cantidad <= 0) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: `Cantidad inválida para producto ${item.IdProducto}` }); }
            if (item.CostoUnitario === undefined || item.CostoUnitario < 0) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: `Costo inválido para producto ${item.IdProducto}` }); }

            const base = item.Cantidad * item.CostoUnitario;
            const desc = item.Descuento ?? 0;
            const imp = item.Impuesto ?? 0;
            const subLinea = base - desc;
            Subtotal += subLinea;
            Descuento += desc;
            Impuesto += imp;
            Total += subLinea + imp;
        }

        const [cabecera] = await conn.query(
            `INSERT INTO compras (
                Numero, IdProveedor, IdBodega, Fecha, Subtotal, Descuento,
                Impuesto, Total, MetodoPago, SaldoPendiente,
                TipoDocumento, NumeroDocumentoProveedor,
                Estado, Observaciones,
                UsuarioIdCreacion, IdEmpresa
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'BORRADOR', ?, ?, ?)`,
            [
                numeroFinal, IdProveedor, IdBodega, Fecha || new Date(),
                Subtotal, Descuento, Impuesto, Total,
                MetodoPago === 'CREDITO' ? 'CREDITO' : 'CONTADO',
                MetodoPago === 'CREDITO' ? Total : 0,
                (TipoDocumento || '').trim() || null,
                (NumeroDocumentoProveedor || '').trim() || null,
                Observaciones || null, UsuarioIdCreacion, IdEmpresa
            ]
        );
        const IdCompra = cabecera.insertId;

        for (const item of Detalle) {
            const base = item.Cantidad * item.CostoUnitario;
            const desc = item.Descuento ?? 0;
            const imp = item.Impuesto ?? 0;
            const subLinea = base - desc;
            await conn.query(
                `INSERT INTO compras_detalle (
                    IdCompra, IdProducto, IdLote, Cantidad, CostoUnitario,
                    Descuento, Impuesto, Total, IdEmpresa
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
                [
                    IdCompra, item.IdProducto, item.IdLote || null,
                    item.Cantidad, item.CostoUnitario, desc, imp, subLinea + imp,
                    IdEmpresa
                ]
            );
        }

        await conn.commit();
        res.status(201).json({ ok: true, mensaje: 'Compra creada en estado BORRADOR', IdCompra, Numero: numeroFinal });
    } catch (error) {
        await conn.rollback();
        console.error('Error creando compra:', error);
        res.status(500).json({ ok: false, mensaje: 'Error creando compra', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// ACTUALIZAR COMPRA (solo BORRADOR)  (PUT /api/compras/:id)
// Reemplaza cabecera y detalle.
// =====================================================
router.put('/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const { Numero, IdProveedor, IdBodega, Fecha, Observaciones, MetodoPago, TipoDocumento, NumeroDocumentoProveedor, UsuarioIdModificacion, Detalle } = req.body;
        const IdCompra = Number(req.params.id);

        const [actual] = await conn.query(`SELECT Estado FROM compras WHERE IdCompra = ?`, [IdCompra]);
        if (actual.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Compra no encontrada' }); }
        if (actual[0].Estado !== 'BORRADOR') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'Solo se pueden editar compras en BORRADOR' }); }

        if (!Numero || !Detalle || !Detalle.length)
            return res.status(400).json({ ok: false, mensaje: 'Número y detalle son obligatorios' });

        let Subtotal = 0, Descuento = 0, Impuesto = 0, Total = 0;
        for (const item of Detalle) {
            if (!item.IdProducto) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: 'Detalle inválido' }); }
            const base = item.Cantidad * item.CostoUnitario;
            const desc = item.Descuento ?? 0;
            const imp = item.Impuesto ?? 0;
            const subLinea = base - desc;
            Subtotal += subLinea; Descuento += desc; Impuesto += imp; Total += subLinea + imp;
        }

        const metodo = MetodoPago === 'CREDITO' ? 'CREDITO' : 'CONTADO';

        await conn.query(
            `UPDATE compras SET Numero=?, IdProveedor=?, IdBodega=?, Fecha=?,
                Subtotal=?, Descuento=?, Impuesto=?, Total=?,
                MetodoPago=?, SaldoPendiente=?, Observaciones=?,
                TipoDocumento=?, NumeroDocumentoProveedor=?
             WHERE IdCompra=?`,
            [Numero.trim(), IdProveedor, IdBodega, Fecha || new Date(), Subtotal, Descuento, Impuesto, Total,
             metodo, metodo === 'CREDITO' ? Total : 0, Observaciones || null,
             (TipoDocumento || '').trim() || null,
             (NumeroDocumentoProveedor || '').trim() || null,
             IdCompra]
        );
        await conn.query(`DELETE FROM compras_detalle WHERE IdCompra = ?`, [IdCompra]);
        for (const item of Detalle) {
            const base = item.Cantidad * item.CostoUnitario;
            const desc = item.Descuento ?? 0;
            const imp = item.Impuesto ?? 0;
            const subLinea = base - desc;
            await conn.query(
                `INSERT INTO compras_detalle (IdCompra, IdProducto, IdLote, Cantidad, CostoUnitario, Descuento, Impuesto, Total)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
                [IdCompra, item.IdProducto, item.IdLote || null, item.Cantidad, item.CostoUnitario, desc, imp, subLinea + imp]
            );
        }

        await conn.commit();
        res.json({ ok: true, mensaje: 'Compra actualizada' });
    } catch (error) {
        await conn.rollback();
        console.error('Error actualizando compra:', error);
        res.status(500).json({ ok: false, mensaje: 'Error actualizando compra', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// CONFIRMAR COMPRA  (POST /api/compras/:id/confirmar)
// Transaction:
//   1. Verifica estado BORRADOR
//   2. Para cada detalle: registra ENTRADA en Kardex (COMPRA)
//   3. Recalcula CPP en inventario del producto+bodega
//   4. Actualiza costo promedio del producto
//   5. Procesa el pago (opción B3 híbrido):
//        - MetodoPago CONTADO|CREDITO
//        - AfectaCaja: si se registra egreso en la jornada de caja abierta
//          (sólo cuando la empresa usa control de caja).
//        - PagoInicial: monto que sale de caja en el momento (default Total en
//          CONTADO, 0 en CREDITO).
//        - Cuotas: para CREDITO, desglose del saldo diferido.
//   6. Marca compra como CONFIRMADA
// =====================================================
router.post('/:id/confirmar', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const IdCompra = Number(req.params.id);
        // El usuario que confirma proviene de la sesión, no del body.
        const UsuarioIdConfirmacion = req.auth?.UsuarioId ?? null;
        const IdEmpresa = req.auth?.IdEmpresa ?? null;

        const {
            AfectaCaja,
            MetodoPago,
            PagoInicial,
            Cuotas
        } = req.body;

        const [compra] = await conn.query(
            `SELECT c.IdCompra, c.IdBodega, c.Estado, c.Total, c.Numero,
                    c.IdProveedor, pr.Nombre AS NombreProveedor
             FROM compras c
             LEFT JOIN proveedores pr ON pr.IdProveedor = c.IdProveedor
             WHERE c.IdCompra = ? AND c.IdEmpresa = ? FOR UPDATE`,
            [IdCompra, IdEmpresa]
        );
        if (compra.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Compra no encontrada' }); }
        if (compra[0].Estado === 'CONFIRMADA') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'La compra ya está confirmada' }); }
        if (compra[0].Estado === 'ANULADA') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'No se puede confirmar una compra anulada' }); }

        const [detalle] = await conn.query(
            `SELECT IdProducto, IdLote, Cantidad, CostoUnitario, Impuesto, Descuento, Total
             FROM compras_detalle WHERE IdCompra = ?`, [IdCompra]
        );

        const movimientos = [];
        for (const item of detalle) {
            const entrada = await invBusiness.registrarEntrada(conn, {
                IdProducto: item.IdProducto,
                IdBodega: compra[0].IdBodega,
                TipoMovimiento: 'COMPRA',
                DocumentoTipo: 'COMPRA',
                IdDocumento: IdCompra,
                cantidad: item.Cantidad,
                costoUnitario: item.CostoUnitario,
                costoTotal: item.Cantidad * item.CostoUnitario,
                UsuarioId: UsuarioIdConfirmacion,
                IdEmpresa: IdEmpresa,
                Observaciones: 'Entrada por compra confirmada'
            });

            // Actualizar costo promedio y costo actual del producto
            await conn.query(
                `UPDATE productos SET CostoActual = ?, CostoPromedio = ?
                 WHERE IdProducto = ?`,
                [item.CostoUnitario, entrada.CostoPromedio, item.IdProducto]
            );

            movimientos.push(entrada);
        }

        // ============================================================
        // PROCESO DE PAGO (opción B3 híbrido)
        // ============================================================
        const total = Number(compra[0].Total) || 0;
        const metodo = MetodoPago === 'CREDITO' ? 'CREDITO' : 'CONTADO';
        const afectaCaja = AfectaCaja === true || AfectaCaja === 1;

        let pagoInicial = 0;
        let saldoPendiente = total;
        if (metodo === 'CONTADO') {
            // En contado el egreso cubre el total (o un pago inicial que deja saldo).
            pagoInicial = (PagoInicial !== undefined && PagoInicial !== null && PagoInicial !== '')
                ? Number(PagoInicial) : total;
            if (pagoInicial < 0) pagoInicial = 0;
            if (pagoInicial > total) pagoInicial = total;
            saldoPendiente = Math.max(0, total - pagoInicial);
        } else {
            // En crédito el pago inicial es opcional (por defecto 0).
            pagoInicial = (PagoInicial !== undefined && PagoInicial !== null && PagoInicial !== '')
                ? Number(PagoInicial) : 0;
            if (pagoInicial < 0) pagoInicial = 0;
            if (pagoInicial > total) pagoInicial = total;
            saldoPendiente = Math.max(0, total - pagoInicial);
        }

        // Movimiento de caja (egreso) por el pago inicial, sólo si afecta caja.
        let movCaja = null;
        if (afectaCaja && pagoInicial > 0) {
            movCaja = await cajaBusiness.registrarMovimientoCompra(conn, {
                IdEmpresa,
                UsuarioId: UsuarioIdConfirmacion,
                NumeroCompra: compra[0].Numero,
                ValorMov: pagoInicial,
                NombreProveedor: compra[0].NombreProveedor,
                IdProveedor: compra[0].IdProveedor,
                Accion: 'CONFIRMAR',
                Fecha: new Date(),
                validarSaldo: true
            });
        }

        // Si CONTADO paga todo y deja saldo 0, no se crean cuotas.
        // Si queda saldo pendiente (contado parcial o crédito), se crean cuotas.
        let cuotasCreadas = [];
        if (saldoPendiente > 0) {
            const cuotasReq = Array.isArray(Cuotas) ? Cuotas.filter(c => c && Number(c.ValorCuota) > 0) : [];
            let desglose;
            if (cuotasReq.length) {
                const sumaCuotas = cuotasReq.reduce((s, c) => s + Number(c.ValorCuota), 0);
                if (Math.abs(sumaCuotas - saldoPendiente) > 0.01) {
                    await conn.rollback();
                    return res.status(400).json({ ok: false, mensaje: 'La suma de las cuotas no coincide con el saldo pendiente' });
                }
                desglose = cuotasReq;
            } else {
                desglose = [{ ValorCuota: saldoPendiente, FechaVencimiento: null }];
            }
            for (let i = 0; i < desglose.length; i++) {
                const vc = Number(desglose[i].ValorCuota);
                const [cuota] = await conn.query(
                    `INSERT INTO pagos_compras
                       (IdCompra, IdEmpresa, NumeroCuota, ValorCuota, SaldoPendiente, FechaVencimiento, Estado, UsuarioIdCreacion)
                     VALUES (?, ?, ?, ?, ?, ?, 'PENDIENTE', ?)`,
                    [IdCompra, IdEmpresa, i + 1, vc, vc, desglose[i].FechaVencimiento || null, UsuarioIdConfirmacion]
                );
                cuotasCreadas.push({ IdPagoCompra: cuota.insertId, NumeroCuota: i + 1, ValorCuota: vc });
            }
        }

        await conn.query(
            `UPDATE compras SET Estado = 'CONFIRMADA',
                MetodoPago = ?, SaldoPendiente = ?,
                UsuarioIdConfirmacion = ?, FechaConfirmacion = NOW()
             WHERE IdCompra = ?`,
            [metodo, saldoPendiente, UsuarioIdConfirmacion || null, IdCompra]
        );

        await conn.commit();
        res.json({
            ok: true,
            mensaje: 'Compra confirmada, inventario actualizado (CPP recalculado)',
            movimientos,
            movCaja,
            Pago: { MetodoPago: metodo, PagoInicial: pagoInicial, SaldoPendiente: saldoPendiente },
            cuotas: cuotasCreadas
        });
    } catch (error) {
        await conn.rollback();
        console.error('Error confirmando compra:', error);
        const status = error.codigo === 'CAJA_SALDO_INSUFICIENTE' || error.codigo === 'SIN_CAJA_ABIERTA'
            ? 409 : 500;
        res.status(status).json({ ok: false, mensaje: error.message || 'Error confirmando compra', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// ANULAR COMPRA  (POST /api/compras/:id/anular)
// Transaction:
//   1. Verifica estado CONFIRMADA
//   2. Registra SALIDA reversa en Kardex por cada detalle
//   3. Disminuye existencias y CPP
//   4. Marca compra ANULADA
// =====================================================
router.post('/:id/anular', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const IdCompra = Number(req.params.id);
        const { MotivoAnulacion } = req.body;
        // El usuario que anula proviene de la sesión, no del body.
        const UsuarioIdAnulacion = req.auth?.UsuarioId ?? null;
        const IdEmpresa = req.auth?.IdEmpresa ?? null;

        const [compra] = await conn.query(
            `SELECT c.IdCompra, c.IdBodega, c.Estado, c.Total, c.MetodoPago, c.SaldoPendiente, c.Numero,
                    c.IdProveedor, pr.Nombre AS NombreProveedor
             FROM compras c
             LEFT JOIN proveedores pr ON pr.IdProveedor = c.IdProveedor
             WHERE c.IdCompra = ? AND c.IdEmpresa = ? FOR UPDATE`,
            [IdCompra, IdEmpresa]
        );
        if (compra.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Compra no encontrada' }); }
        if (compra[0].Estado !== 'CONFIRMADA') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'Solo se pueden anular compras CONFIRMADAS' }); }

        const [detalle] = await conn.query(
            `SELECT IdProducto, Cantidad, CostoUnitario FROM compras_detalle WHERE IdCompra = ?`, [IdCompra]
        );

        const movimientos = [];
        for (const item of detalle) {
            // Reversión: salida a costo del documento original
            const salida = await invBusiness.revertirEntrada(conn, {
                IdProducto: item.IdProducto,
                IdBodega: compra[0].IdBodega,
                TipoMovimiento: 'OTRO',
                DocumentoTipo: 'COMPRA',
                IdDocumento: IdCompra,
                cantidad: item.Cantidad,
                costoUnitario: item.CostoUnitario,
                UsuarioId: UsuarioIdAnulacion,
                IdEmpresa: IdEmpresa,
                Observaciones: MotivoAnulacion || 'Anulación de compra'
            });
            movimientos.push(salida);
        }

        // Revertir los egresos de caja ligados a la compra (número de documento).
        // Se revierte la suma de los egresos registrados en la jornada abierta que
        // usen como referencia el número de esta compra.
        let movCaja = null;
        const [egresos] = await conn.query(
            `SELECT COALESCE(SUM(d.ValorMov), 0) AS TotalEgreso
             FROM cajeromovdet d
             INNER JOIN tipomovcaja t ON d.TipoMov = t.id
             WHERE d.idEmpresa = ? AND d.NroDocumentoProveedor = ? AND d.ValorMov > 0`,
            [IdEmpresa, String(compra[0].Numero).slice(0, 10)]
        );
        const montoEgreso = Number(egresos[0].TotalEgreso) || 0;
        if (montoEgreso > 0) {
            movCaja = await cajaBusiness.registrarMovimientoCompra(conn, {
                IdEmpresa,
                UsuarioId: UsuarioIdAnulacion,
                NumeroCompra: compra[0].Numero,
                ValorMov: montoEgreso,
                NombreProveedor: compra[0].NombreProveedor,
                IdProveedor: compra[0].IdProveedor,
                Accion: 'ANULAR',
                Fecha: new Date(),
                validarSaldo: false
            });
        }

        // Cancelar cuotas pendientes (las abonadas no se revierten automáticamente).
        await conn.query(
            `UPDATE pagos_compras SET Estado = 'CANCELADA'
             WHERE IdCompra = ? AND Estado = 'PENDIENTE'`,
            [IdCompra]
        );

        await conn.query(
            `UPDATE compras SET Estado = 'ANULADA', SaldoPendiente = 0,
                UsuarioIdAnulacion = ?, FechaAnulacion = NOW()
             WHERE IdCompra = ?`,
            [UsuarioIdAnulacion || null, IdCompra]
        );

        await conn.commit();
        res.json({ ok: true, mensaje: 'Compra anulada, inventario revertido', movimientos, movCaja });
    } catch (error) {
        await conn.rollback();
        console.error('Error anulando compra:', error);
        res.status(500).json({ ok: false, mensaje: 'Error anulando compra', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// ABONAR A CUENTA POR PAGAR / CUOTA  (POST /api/compras/:id/abono)
// Body: { IdPagoCompra, ValorAbono, AfectaCaja }
// Registra un abono sobre una cuota PENDIENTE; si AfectaCaja y la empresa usa
// control de caja, se registra el egreso correspondiente (validando saldo).
// =====================================================
router.post('/:id/abono', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const IdCompra = Number(req.params.id);
        const { IdPagoCompra, ValorAbono, AfectaCaja } = req.body;
        const UsuarioId = req.auth?.UsuarioId ?? null;
        const IdEmpresa = req.auth?.IdEmpresa ?? null;

        const monto = Number(ValorAbono);
        if (!IdPagoCompra || !monto || monto <= 0) {
            await conn.rollback();
            return res.status(400).json({ ok: false, mensaje: 'IdPagoCompra y ValorAbono (mayor a 0) son obligatorios' });
        }

        const [compra] = await conn.query(
            `SELECT c.IdCompra, c.Numero, c.Estado, c.IdProveedor, c.SaldoPendiente,
                    pr.Nombre AS NombreProveedor
             FROM compras c
             LEFT JOIN proveedores pr ON pr.IdProveedor = c.IdProveedor
             WHERE c.IdCompra = ? AND c.IdEmpresa = ? FOR UPDATE`,
            [IdCompra, IdEmpresa]
        );
        if (compra.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Compra no encontrada' }); }
        if (compra[0].Estado !== 'CONFIRMADA') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'Solo se pueden abonar compras CONFIRMADAS' }); }

        const [cuota] = await conn.query(
            `SELECT IdPagoCompra, ValorCuota, SaldoPendiente, Estado
             FROM pagos_compras WHERE IdPagoCompra = ? AND IdCompra = ? AND IdEmpresa = ? FOR UPDATE`,
            [IdPagoCompra, IdCompra, IdEmpresa]
        );
        if (cuota.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Cuota no encontrada' }); }
        if (cuota[0].Estado !== 'PENDIENTE') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'La cuota no está pendiente de pago' }); }
        if (monto > Number(cuota[0].SaldoPendiente)) {
            await conn.rollback();
            return res.status(400).json({ ok: false, mensaje: `El abono supera el saldo pendiente de la cuota ($${Number(cuota[0].SaldoPendiente).toLocaleString('es-CO')})` });
        }

        // Egreso de caja por el abono, si afecta caja.
        let movCaja = null;
        if (AfectaCaja === true || AfectaCaja === 1) {
            movCaja = await cajaBusiness.registrarMovimientoCompra(conn, {
                IdEmpresa,
                UsuarioId,
                NumeroCompra: compra[0].Numero,
                ValorMov: monto,
                NombreProveedor: compra[0].NombreProveedor,
                IdProveedor: compra[0].IdProveedor,
                Accion: 'CONFIRMAR',
                Fecha: new Date(),
                validarSaldo: true
            });
        }

        const nuevoSaldoCuota = Math.max(0, Number(cuota[0].SaldoPendiente) - monto);
        const estadoCuota = nuevoSaldoCuota === 0 ? 'PAGADA' : 'PENDIENTE';

        const [abono] = await conn.query(
            `INSERT INTO pagos_compras_abonos
               (IdPagoCompra, IdCompra, IdEmpresa, ValorAbono, IdCajaMov, MetodoCaja, UsuarioIdCreacion)
             VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [IdPagoCompra, IdCompra, IdEmpresa, monto,
             movCaja ? movCaja.IdMov : null,
             movCaja && movCaja.registrado ? 1 : 0,
             UsuarioId]
        );

        await conn.query(
            `UPDATE pagos_compras
                SET SaldoPendiente = ?, Estado = ?,
                    FechaPagoCompleto = ?
             WHERE IdPagoCompra = ?`,
            [nuevoSaldoCuota, estadoCuota, estadoCuota === 'PAGADA' ? new Date() : null, IdPagoCompra]
        );

        // Recalcular saldo pendiente global de la compra.
        const [sumSaldo] = await conn.query(
            `SELECT COALESCE(SUM(SaldoPendiente), 0) AS Resta
             FROM pagos_compras WHERE IdCompra = ? AND IdEmpresa = ? AND Estado <> 'CANCELADA'`,
            [IdCompra, IdEmpresa]
        );
        await conn.query(`UPDATE compras SET SaldoPendiente = ? WHERE IdCompra = ?`,
            [Number(sumSaldo[0].Resta) || 0, IdCompra]);

        await conn.commit();
        res.json({
            ok: true,
            mensaje: 'Abono registrado',
            IdAbono: abono.insertId,
            Cuota: { IdPagoCompra, SaldoPendiente: nuevoSaldoCuota, Estado: estadoCuota },
            movCaja
        });
    } catch (error) {
        await conn.rollback();
        console.error('Error registrando abono:', error);
        const status = error.codigo === 'CAJA_SALDO_INSUFICIENTE' || error.codigo === 'SIN_CAJA_ABIERTA'
            ? 409 : 500;
        res.status(status).json({ ok: false, mensaje: error.message || 'Error registrando abono', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// ELIMINAR COMPRA (solo BORRADOR, sin movimientos)
// DELETE /api/compras/:id
// =====================================================
router.delete('/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const IdCompra = Number(req.params.id);

        const [actual] = await conn.query(`SELECT Estado FROM compras WHERE IdCompra = ?`, [IdCompra]);
        if (actual.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Compra no encontrada' }); }
        if (actual[0].Estado !== 'BORRADOR') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'Solo se pueden eliminar compras en BORRADOR' }); }

        await conn.query(`DELETE FROM compras_detalle WHERE IdCompra = ?`, [IdCompra]);
        await conn.query(`DELETE FROM compras WHERE IdCompra = ?`, [IdCompra]);

        await conn.commit();
        res.json({ ok: true, mensaje: 'Compra eliminada' });
    } catch (error) {
        await conn.rollback();
        console.error('Error eliminando compra:', error);
        res.status(500).json({ ok: false, mensaje: 'Error eliminando compra', error: error.message });
    } finally {
        conn.release();
    }
});

module.exports = router;