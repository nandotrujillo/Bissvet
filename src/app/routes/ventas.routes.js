const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql');
const invBusiness = require('../Services/inventarioBusiness');
const cajaBusiness = require('../Services/cajaBusiness');
const parametrosBusiness = require('../Services/parametrosBusiness');
const { authorize, obtenerPermisosUsuario } = require('../../middleware/authorize');
const { registrarAuditoria } = require('../../middleware/auditoria.js');
const PDFDocument = require('pdfkit');

// Verifica si el usuario tiene un permiso concreto (perfil + rol + usuario,
// con precedencia DENEGAR > PERMITIR, igual que el middleware authorize).
async function tienePermiso(UsuarioId, IdPerfil, codigo) {
    if (!UsuarioId) return false;
    const permisos = await obtenerPermisosUsuario(UsuarioId, IdPerfil);
    return permisos.get(codigo) === true;
}

function obtenerIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.socket?.remoteAddress
        || req.ip
        || null;
}

// Formatea un número COP sin símbolo (para el PDF).
function formatoCOP(v) {
    const n = Number(v || 0);
    return n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

// =====================================================
// LISTAR VENTAS  (GET /api/ventas)
// Filtros: ?doc=1, ?estado=CONFIRMADA, ?cliente=1, ?bodega=1, ?desde&hasta
// =====================================================
router.get('/', async (req, res) => {
    try {
        const condiciones = ['v.IdEmpresa = ?'];
        const params = [req.auth.IdEmpresa];
        if (req.query.doc)      { condiciones.push('v.IdVenta = ?'); params.push(Number(req.query.doc)); }
        if (req.query.estado)   { condiciones.push('v.Estado = ?'); params.push(req.query.estado); }
        if (req.query.cliente)  { condiciones.push('v.IdCliente = ?'); params.push(Number(req.query.cliente)); }
        if (req.query.vendedor) { condiciones.push('v.IdVendedor = ?'); params.push(Number(req.query.vendedor)); }
        if (req.query.bodega)   { condiciones.push('v.IdBodega = ?'); params.push(Number(req.query.bodega)); }
        if (req.query.desde) { condiciones.push('v.Fecha >= ?'); params.push(req.query.desde); }
        if (req.query.hasta) { condiciones.push('v.Fecha <= ?'); params.push(req.query.hasta); }
        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

        const [rows] = await pool.query(`
            SELECT
                v.IdVenta, v.NumeroVenta, v.Fecha, v.Estado,
                v.IdCliente,
                CONCAT_WS(' ', c.PrimerNombre, c.SegundoNombre,
                          c.PrimerApellido, c.SegundoApellido) AS NombreCliente,
                v.IdVendedor,
                CONCAT_WS(' ', ven.PrimerNombre, ven.SegundoNombre,
                          ven.PrimerApellido, ven.SegundoApellido) AS NombreVendedor,
                v.TipoPago, v.PorcentajeImpuesto,
                v.IdBodega, b.NombreBodega,
                v.Subtotal, v.Descuento, v.Impuesto, v.Total,
                v.CostoTotal, v.Utilidad,
                v.Observaciones, v.UsuarioIdCreacion,
                v.FechaCreacion, v.FechaConfirmacion, v.FechaAnulacion,
                (SELECT COUNT(*) FROM ventas_detalle vd WHERE vd.IdVenta = v.IdVenta AND vd.IdEmpresa = v.IdEmpresa) AS TotalItems
            FROM ventas v
            INNER JOIN clientes c    ON c.ClienteId = v.IdCliente
            LEFT JOIN Usuarios ven   ON ven.UsuarioId = v.IdVendedor
            INNER JOIN bodegas b     ON b.Id = v.IdBodega
            ${where}
            ORDER BY v.Fecha DESC, v.IdVenta DESC
        `, params);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error listando ventas:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando ventas', error: error.message });
    }
});

// =====================================================
// OBTENER VENTA CON DETALLE  (GET /api/ventas/:id)
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const [cabecera] = await pool.query(`
            SELECT
                v.IdVenta, v.NumeroVenta, v.Fecha, v.Estado,
                v.IdCliente,
                CONCAT_WS(' ', c.PrimerNombre, c.SegundoNombre,
                          c.PrimerApellido, c.SegundoApellido) AS NombreCliente,
                v.IdVendedor,
                CONCAT_WS(' ', ven.PrimerNombre, ven.SegundoNombre,
                          ven.PrimerApellido, ven.SegundoApellido) AS NombreVendedor,
                v.TipoPago, v.PorcentajeImpuesto,
                v.IdBodega, b.NombreBodega,
                v.Subtotal, v.Descuento, v.Impuesto, v.Total,
                v.CostoTotal, v.Utilidad,
                v.Observaciones, v.UsuarioIdCreacion, v.FechaCreacion,
                v.UsuarioIdConfirmacion, v.FechaConfirmacion,
                v.UsuarioIdAnulacion, v.FechaAnulacion
            FROM ventas v
            INNER JOIN clientes c    ON c.ClienteId = v.IdCliente
            LEFT JOIN Usuarios ven   ON ven.UsuarioId = v.IdVendedor
            INNER JOIN bodegas b     ON b.Id = v.IdBodega
            WHERE v.IdVenta = ? AND v.IdEmpresa = ?
        `, [req.params.id, req.auth.IdEmpresa]);
        if (cabecera.length === 0)
            return res.status(404).json({ ok: false, mensaje: 'Venta no encontrada' });

        const [detalle] = await pool.query(`
            SELECT
                vd.IdDetalleVenta, vd.IdVenta, vd.IdProducto, vd.IdServicio,
                p.CodigoProducto, p.NombreProducto,
                s.Nombre AS NombreServicio,
                COALESCE(p.NombreProducto, s.Nombre) AS DescripcionItem,
                vd.Cantidad, vd.PrecioUnitario, vd.Descuento, vd.Impuesto, vd.Total,
                vd.CostoUnitario, vd.CostoTotal, vd.Utilidad
            FROM ventas_detalle vd
            LEFT JOIN productos p ON p.IdProducto = vd.IdProducto
            LEFT JOIN servicios s ON s.IdServicio = vd.IdServicio
            WHERE vd.IdVenta = ? AND vd.IdEmpresa = ?
        `, [req.params.id, req.auth.IdEmpresa]);

        res.json({ ok: true, datos: { ...cabecera[0], Detalle: detalle } });
    } catch (error) {
        console.error('Error obteniendo venta:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando venta', error: error.message });
    }
});

// Calcula el impuesto de una línea según el % global de la venta
// y deja los totales redondeados a 2 decimales.
function calcularLinea(base, descuento, pct) {
    const subLinea = base - descuento;
    const imp = Math.round(subLinea * pct) / 100;
    return { subLinea, imp, linea: subLinea + imp };
}

// =====================================================
// CREAR VENTA (BORRADOR)  (POST /api/ventas)
// El número de venta se genera automáticamente (V-N) por empresa.
// Body: { IdCliente, IdVendedor, TipoPago, PorcentajeImpuesto, IdBodega,
//         Fecha, Observaciones,
//         Detalle: [{ IdProducto | IdServicio, Cantidad, PrecioUnitario,
//                     Descuento }] }
// - Ítem con IdProducto => afecta inventario/kardex al confirmar.
// - Ítem con IdServicio => línea de servicio (sin inventario); el precio se
//   toma de la tabla `servicios` si no se envía PrecioUnitario.
// La empresa y el usuario se toman de la sesión (req.auth).
// No afecta inventario hasta CONFIRMAR.
// =====================================================
router.post('/', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const {
            IdCliente, IdVendedor, TipoPago, PorcentajeImpuesto, IdBodega,
            Fecha, Observaciones, Detalle
        } = req.body;

        // La empresa y el usuario SIEMPRE provienen de la sesión (JWT),
        // nunca del body.
        const UsuarioIdCreacion = req.auth?.UsuarioId ?? null;
        const IdEmpresa = req.auth?.IdEmpresa ?? null;

        if (!IdCliente)
            return res.status(400).json({ ok: false, mensaje: 'El cliente es obligatorio' });
        if (!IdVendedor)
            return res.status(400).json({ ok: false, mensaje: 'El vendedor es obligatorio' });
        if (!TipoPago || !TipoPago.trim())
            return res.status(400).json({ ok: false, mensaje: 'El tipo de pago es obligatorio' });
        if (!IdBodega)
            return res.status(400).json({ ok: false, mensaje: 'La bodega es obligatoria' });
        if (!Detalle || !Detalle.length)
            return res.status(400).json({ ok: false, mensaje: 'Debe agregar al menos un producto o servicio' });

        // Control de caja por día: si la empresa lo tiene activo y no hay una
        // jornada ABIERTA hoy, no se permite ni siquiera crear la venta/factura.
        await cajaBusiness.verificarCajaAbiertaDelDia(conn, req.auth.IdEmpresa, new Date());

        // Si la venta incluye líneas de SERVICIO (facturación desde Citas),
        // exige el permiso FACTURACION.SERVICIOS del rol/perfil/usuario.
        if (Detalle.some((d) => !!d.IdServicio && !d.IdProducto)) {
            const puedeFacturar = await tienePermiso(
                req.auth.UsuarioId,
                req.auth.IdPerfil,
                'FACTURACION.SERVICIOS'
            );
            if (!puedeFacturar) {
                await conn.rollback();
                return res.status(403).json({
                    ok: false,
                    mensaje: 'No autorizado: se requiere el permiso FACTURACION.SERVICIOS para facturar servicios'
                });
            }
        }

        let pct = PorcentajeImpuesto;
        if (pct === undefined || pct === null || pct === '') {
            pct = await parametrosBusiness.obtenerImpuestoVentas(conn, req.auth.IdEmpresa);
        }
        pct = Number(pct) || 0;
        if (pct < 0 || pct > 100)
            return res.status(400).json({ ok: false, mensaje: 'El porcentaje de impuesto debe estar entre 0 y 100' });

        // Número automático secuencial por empresa: V-1, V-2, ...
        const [seq] = IdEmpresa
            ? await conn.query(
                `SELECT IFNULL(MAX(CAST(SUBSTRING_INDEX(NumeroVenta,'-',-1) AS UNSIGNED)), 0) + 1 AS siguiente
                 FROM ventas WHERE IdEmpresa = ?`, [IdEmpresa])
            : await conn.query(
                `SELECT IFNULL(MAX(CAST(SUBSTRING_INDEX(NumeroVenta,'-',-1) AS UNSIGNED)), 0) + 1 AS siguiente
                 FROM ventas WHERE IdEmpresa IS NULL`);
        const NumeroVenta = `V-${seq[0].siguiente}`;

        const [duplicado] = IdEmpresa
            ? await conn.query(`SELECT IdVenta FROM ventas WHERE NumeroVenta = ? AND IdEmpresa = ?`, [NumeroVenta, IdEmpresa])
            : await conn.query(`SELECT IdVenta FROM ventas WHERE NumeroVenta = ? AND IdEmpresa IS NULL`, [NumeroVenta]);
        if (duplicado.length > 0)
            return res.status(409).json({ ok: false, mensaje: 'El número de venta ya existe, intente de nuevo' });

        let Subtotal = 0, Descuento = 0, Impuesto = 0, Total = 0;
        for (const item of Detalle) {
            const esServicio = !!item.IdServicio && !item.IdProducto;
            const esProducto = !!item.IdProducto;

            if (!esServicio && !esProducto) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: 'Cada detalle debe tener IdProducto o IdServicio' }); }
            if (!item.Cantidad || item.Cantidad <= 0) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: `Cantidad inválida en la línea ${item.IdProducto || item.IdServicio}` }); }

            let precio;
            if (esProducto) {
                const [producto] = await conn.query(
                    `SELECT PrecioVenta FROM productos WHERE IdProducto = ? AND IdEmpresa = ?`, [item.IdProducto, req.auth.IdEmpresa]
                );
                if (producto.length === 0) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: `Producto ${item.IdProducto} no encontrado` }); }
                precio = item.PrecioUnitario ?? producto[0].PrecioVenta;
            } else {
                const [servicio] = await conn.query(
                    `SELECT Precio FROM servicios WHERE IdServicio = ? AND IdEmpresa = ?`, [item.IdServicio, req.auth.IdEmpresa]
                );
                if (servicio.length === 0) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: `Servicio ${item.IdServicio} no encontrado` }); }
                precio = item.PrecioUnitario ?? Number(servicio[0].Precio);
            }

            const base = item.Cantidad * precio;
            const desc = item.Descuento ?? 0;
            const { subLinea, imp, linea } = calcularLinea(base, desc, pct);
            Subtotal += subLinea;
            Descuento += desc;
            Impuesto += imp;
            Total += linea;
        }

        const [cabecera] = await conn.query(
            `INSERT INTO ventas (
                IdCliente, IdVendedor, TipoPago, PorcentajeImpuesto, IdBodega, Fecha,
                NumeroVenta,
                Subtotal, Descuento, Impuesto, Total,
                CostoTotal, Utilidad, Estado, Observaciones, UsuarioIdCreacion, IdEmpresa
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 'BORRADOR', ?, ?, ?)`,
            [
                IdCliente, IdVendedor, TipoPago, pct, IdBodega, Fecha || new Date(),
                NumeroVenta,
                Subtotal, Descuento, Impuesto, Total,
                Observaciones || null, UsuarioIdCreacion || null, IdEmpresa || null
            ]
        );
        const IdVenta = cabecera.insertId;

        for (const item of Detalle) {
            const esServicio = !!item.IdServicio && !item.IdProducto;
            let precio;
            if (esServicio) {
                const [servicio] = await conn.query(
                    `SELECT Precio FROM servicios WHERE IdServicio = ? AND IdEmpresa = ?`, [item.IdServicio, req.auth.IdEmpresa]
                );
                precio = item.PrecioUnitario ?? Number(servicio[0].Precio);
            } else {
                const [producto] = await conn.query(
                    `SELECT PrecioVenta FROM productos WHERE IdProducto = ? AND IdEmpresa = ?`, [item.IdProducto, req.auth.IdEmpresa]
                );
                precio = item.PrecioUnitario ?? producto[0].PrecioVenta;
            }
            const base = item.Cantidad * precio;
            const desc = item.Descuento ?? 0;
            const { imp, linea } = calcularLinea(base, desc, pct);
            await conn.query(
                `INSERT INTO ventas_detalle (
                    IdVenta, IdProducto, IdServicio, Cantidad, PrecioUnitario,
                    Descuento, Impuesto, Total, CostoUnitario, CostoTotal, Utilidad,
                    IdEmpresa
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?)`,
                [IdVenta, esServicio ? null : item.IdProducto, esServicio ? item.IdServicio : null, item.Cantidad, precio, desc, imp, linea, req.auth.IdEmpresa]
            );
        }

        await conn.commit();
        res.status(201).json({ ok: true, mensaje: 'Venta creada en estado BORRADOR', IdVenta, NumeroVenta });
    } catch (error) {
        await conn.rollback();
        if (error.code === 'ER_DUP_ENTRY') {
            return res.status(409).json({ ok: false, mensaje: 'El número de venta ya existe, intente de nuevo' });
        }
        if (error.codigo === 'SIN_CAJA_ABIERTA') {
            return res.status(409).json({ ok: false, mensaje: error.message });
        }
        console.error('Error creando venta:', error);
        res.status(500).json({ ok: false, mensaje: 'Error creando venta', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// ACTUALIZAR VENTA (solo BORRADOR)  (PUT /api/ventas/:id)
// Reemplaza cabecera y detalle. Conserva el número y la empresa actuales.
// =====================================================
router.put('/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const { IdCliente, IdVendedor, TipoPago, PorcentajeImpuesto, IdBodega, Fecha, Observaciones, UsuarioIdModificacion, Detalle } = req.body;
        const IdVenta = Number(req.params.id);

        const [actual] = await conn.query(`SELECT Estado, NumeroVenta, IdEmpresa FROM ventas WHERE IdVenta = ? AND IdEmpresa = ?`, [IdVenta, req.auth.IdEmpresa]);
        if (actual.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Venta no encontrada' }); }
        if (req.auth.IdEmpresa !== actual[0].IdEmpresa) { await conn.rollback(); return res.status(403).json({ ok: false, mensaje: 'No autorizado para modificar esta venta' }); }
        if (actual[0].Estado !== 'BORRADOR') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'Solo se pueden editar ventas en BORRADOR' }); }

        if (!IdCliente)
            return res.status(400).json({ ok: false, mensaje: 'El cliente es obligatorio' });
        if (!IdVendedor)
            return res.status(400).json({ ok: false, mensaje: 'El vendedor es obligatorio' });
        if (!TipoPago || !TipoPago.trim())
            return res.status(400).json({ ok: false, mensaje: 'El tipo de pago es obligatorio' });
        if (!Detalle || !Detalle.length)
            return res.status(400).json({ ok: false, mensaje: 'Debe agregar al menos un producto o servicio' });

        let pct = PorcentajeImpuesto;
        if (pct === undefined || pct === null || pct === '') {
            pct = await parametrosBusiness.obtenerImpuestoVentas(conn, req.auth.IdEmpresa);
        }
        pct = Number(pct) || 0;
        if (pct < 0 || pct > 100)
            return res.status(400).json({ ok: false, mensaje: 'El porcentaje de impuesto debe estar entre 0 y 100' });

        let Subtotal = 0, Descuento = 0, Impuesto = 0, Total = 0;
        for (const item of Detalle) {
            const esServicio = !!item.IdServicio && !item.IdProducto;
            const esProducto = !!item.IdProducto;
            if (!esServicio && !esProducto) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: 'Detalle inválido' }); }
            if (!item.Cantidad || item.Cantidad <= 0) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: 'Cantidad inválida' }); }

            let precio;
            if (esProducto) {
                const [producto] = await conn.query(
                    `SELECT PrecioVenta FROM productos WHERE IdProducto = ? AND IdEmpresa = ?`, [item.IdProducto, req.auth.IdEmpresa]
                );
                if (producto.length === 0) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: `Producto ${item.IdProducto} no encontrado` }); }
                precio = item.PrecioUnitario ?? producto[0].PrecioVenta;
            } else {
                const [servicio] = await conn.query(
                    `SELECT Precio FROM servicios WHERE IdServicio = ? AND IdEmpresa = ?`, [item.IdServicio, req.auth.IdEmpresa]
                );
                if (servicio.length === 0) { await conn.rollback(); return res.status(400).json({ ok: false, mensaje: `Servicio ${item.IdServicio} no encontrado` }); }
                precio = item.PrecioUnitario ?? Number(servicio[0].Precio);
            }

            const base = item.Cantidad * precio;
            const desc = item.Descuento ?? 0;
            const { subLinea, imp, linea } = calcularLinea(base, desc, pct);
            Subtotal += subLinea; Descuento += desc; Impuesto += imp; Total += linea;
        }

        await conn.query(
            `UPDATE ventas SET NumeroVenta=?, IdCliente=?, IdVendedor=?, TipoPago=?, PorcentajeImpuesto=?,
                IdBodega=?, Fecha=?,
                Subtotal=?, Descuento=?, Impuesto=?, Total=?, Observaciones=?
             WHERE IdVenta=? AND IdEmpresa=?`,
            [actual[0].NumeroVenta, IdCliente, IdVendedor, TipoPago, pct, IdBodega, Fecha || new Date(), Subtotal, Descuento, Impuesto, Total, Observaciones || null, IdVenta, req.auth.IdEmpresa]
        );
        await conn.query(`DELETE FROM ventas_detalle WHERE IdVenta = ? AND IdEmpresa = ?`, [IdVenta, req.auth.IdEmpresa]);
        for (const item of Detalle) {
            const esServicio = !!item.IdServicio && !item.IdProducto;
            let precio;
            if (esServicio) {
                const [servicio] = await conn.query(
                    `SELECT Precio FROM servicios WHERE IdServicio = ? AND IdEmpresa = ?`, [item.IdServicio, req.auth.IdEmpresa]
                );
                precio = item.PrecioUnitario ?? Number(servicio[0].Precio);
            } else {
                const [producto] = await conn.query(
                    `SELECT PrecioVenta FROM productos WHERE IdProducto = ? AND IdEmpresa = ?`, [item.IdProducto, req.auth.IdEmpresa]
                );
                precio = item.PrecioUnitario ?? producto[0].PrecioVenta;
            }
            const base = item.Cantidad * precio;
            const desc = item.Descuento ?? 0;
            const { imp, linea } = calcularLinea(base, desc, pct);
            await conn.query(
                `INSERT INTO ventas_detalle (
                    IdVenta, IdProducto, IdServicio, Cantidad, PrecioUnitario,
                    Descuento, Impuesto, Total, CostoUnitario, CostoTotal, Utilidad,
                    IdEmpresa
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, 0, 0, ?)`,
                [IdVenta, esServicio ? null : item.IdProducto, esServicio ? item.IdServicio : null, item.Cantidad, precio, desc, imp, linea, req.auth.IdEmpresa]
            );
        }

        await conn.commit();
        res.json({ ok: true, mensaje: 'Venta actualizada' });
    } catch (error) {
        await conn.rollback();
        console.error('Error actualizando venta:', error);
        res.status(500).json({ ok: false, mensaje: 'Error actualizando venta', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// CONFIRMAR VENTA  (POST /api/ventas/:id/confirmar)
// Transaction:
//   1. Verifica estado BORRADOR
//   2. Para cada detalle: registra SALIDA en Kardex (VENTA) al costo CPP vigente
//   3. Actualiza CostoUnitario/CostoTotal/Utilidad del detalle y cabecera
//   4. Marca venta como CONFIRMADA
// =====================================================
router.post('/:id/confirmar', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const IdVenta = Number(req.params.id);
        // El usuario que confirma proviene de la sesión, no del body.
        const UsuarioIdConfirmacion = req.auth?.UsuarioId ?? null;

        const [venta] = await conn.query(
            `SELECT v.IdVenta, v.IdBodega, v.IdEmpresa, v.Estado, v.NumeroVenta,
                    v.Total, v.TipoPago, v.IdCliente,
                    CONCAT_WS(' ', c.PrimerNombre, c.SegundoNombre,
                              c.PrimerApellido, c.SegundoApellido) AS NombreCliente
             FROM ventas v
             INNER JOIN clientes c ON c.ClienteId = v.IdCliente
             WHERE v.IdVenta = ? AND v.IdEmpresa = ?
             FOR UPDATE`,
            [IdVenta, req.auth.IdEmpresa]
        );
        if (venta.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Venta no encontrada' }); }
        if (venta[0].Estado === 'CONFIRMADA') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'La venta ya está confirmada' }); }
        if (venta[0].Estado === 'ANULADA') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'No se puede confirmar una venta anulada' }); }

        const [detalle] = await conn.query(
            `SELECT IdDetalleVenta, IdProducto, IdServicio, Cantidad, PrecioUnitario, Descuento, Impuesto, Total
             FROM ventas_detalle WHERE IdVenta = ? AND IdEmpresa = ?`, [IdVenta, req.auth.IdEmpresa]
        );

        // Si la venta incluye líneas de SERVICIO, el usuario que confirma debe
        // tener el permiso FACTURACION.SERVICIOS (facturación desde Citas).
        if (detalle.some((d) => !!d.IdServicio && !d.IdProducto)) {
            const puedeFacturar = await tienePermiso(
                req.auth.UsuarioId,
                req.auth.IdPerfil,
                'FACTURACION.SERVICIOS'
            );
            if (!puedeFacturar) {
                await conn.rollback();
                return res.status(403).json({
                    ok: false,
                    mensaje: 'No autorizado: se requiere el permiso FACTURACION.SERVICIOS para confirmar la facturación'
                });
            }
        }

        let CostoTotal = 0, Utilidad = 0;
        const movimientos = [];

        // "controla" = la empresa valida/descuenta existencias de producto.
        const controla = await parametrosBusiness.empresaControlaExistencias(conn, req.auth.IdEmpresa);

        for (const item of detalle) {
            // Línea SIN control de inventario: un servicio siempre, o un
            // producto cuando la empresa tiene ControlExistencias = 0. No
            // afecta inventario ni kardex; va directo a utilidad (ingreso).
            const sinInventario = item.IdServicio && !item.IdProducto ? true
                                : (!controla && item.IdProducto);
            if (sinInventario) {
                const UtilidadLinea = Number(item.Total);
                await conn.query(
                    `UPDATE ventas_detalle
                     SET CostoUnitario = 0, CostoTotal = 0, Utilidad = ?
                     WHERE IdVenta = ? AND IdEmpresa = ? AND IdDetalleVenta = ?`,
                    [UtilidadLinea, IdVenta, req.auth.IdEmpresa, item.IdDetalleVenta]
                );
                CostoTotal += 0;
                Utilidad += UtilidadLinea;
                continue;
            }

            const salida = await invBusiness.registrarSalida(conn, {
                IdProducto: item.IdProducto,
                IdBodega: venta[0].IdBodega,
                TipoMovimiento: 'VENTA',
                DocumentoTipo: 'VENTA',
                IdDocumento: IdVenta,
                cantidad: item.Cantidad,
                UsuarioId: UsuarioIdConfirmacion,
                IdEmpresa: req.auth?.IdEmpresa ?? null,
                Observaciones: 'Salida por venta confirmada'
            });

            const CostoUnitario = Number(salida.costoUnitario);
            const CostoTotalLinea = Number(salida.costoTotal);
            const UtilidadLinea = Number(item.Total) - CostoTotalLinea;

            await conn.query(
                `UPDATE ventas_detalle
                 SET CostoUnitario = ?, CostoTotal = ?, Utilidad = ?
                 WHERE IdVenta = ? AND IdProducto = ? AND IdEmpresa = ?`,
                [CostoUnitario, CostoTotalLinea, UtilidadLinea, IdVenta, item.IdProducto, req.auth.IdEmpresa]
            );

            CostoTotal += CostoTotalLinea;
            Utilidad += UtilidadLinea;
            movimientos.push(salida);
        }

        await conn.query(
            `UPDATE ventas SET Estado = 'CONFIRMADA', CostoTotal = ?, Utilidad = ?,
                UsuarioIdConfirmacion = ?, FechaConfirmacion = NOW()
             WHERE IdVenta = ? AND IdEmpresa = ?`,
            [CostoTotal, Utilidad, UsuarioIdConfirmacion || null, IdVenta, req.auth.IdEmpresa]
        );

        // La venta confirmada genera el ingreso en la jornada de caja abierta
        // de la empresa (quien la registre: admin o vendedor).
        const movCaja = await cajaBusiness.registrarMovimientoVenta(conn, {
            IdEmpresa: req.auth.IdEmpresa,
            UsuarioId: UsuarioIdConfirmacion,
            NumeroVenta: venta[0].NumeroVenta,
            ValorMov: venta[0].Total,
            TipoPago: venta[0].TipoPago,
            Cliente: venta[0].NombreCliente,
            Accion: 'CONFIRMAR',
            Fecha: new Date()
        });

        await conn.commit();
        res.json({ ok: true, mensaje: 'Venta confirmada, inventario actualizado (CPP vigente)', movimientos, movCaja });
    } catch (error) {
        await conn.rollback();
        console.error('Error confirmando venta:', error);
        if (error.codigo === 'INSUFICIENTE' || error.codigo === 'SIN_CAJA_ABIERTA' || error.codigo === 'SIN_TIPO_CAJA') {
            return res.status(409).json({ ok: false, mensaje: error.message });
        }
        res.status(500).json({ ok: false, mensaje: 'Error confirmando venta', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// ANULAR VENTA  (POST /api/ventas/:id/anular)
// Transaction:
//   1. Verifica estado CONFIRMADA
//   2. Registra ENTRADA reversa en Kardex por cada detalle (costo congelado)
//   3. Recalcula CPP en inventario
//   4. Marca venta ANULADA y resetea costo/utilidad
// =====================================================
router.post('/:id/anular', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const IdVenta = Number(req.params.id);
        // El usuario que anula proviene de la sesión, no del body.
        const UsuarioIdAnulacion = req.auth?.UsuarioId ?? null;
        const { MotivoAnulacion } = req.body;

        const [venta] = await conn.query(
            `SELECT v.IdVenta, v.IdBodega, v.IdEmpresa, v.Estado, v.NumeroVenta,
                    v.Total, v.TipoPago, v.IdCliente,
                    CONCAT_WS(' ', c.PrimerNombre, c.SegundoNombre,
                              c.PrimerApellido, c.SegundoApellido) AS NombreCliente
             FROM ventas v
             INNER JOIN clientes c ON c.ClienteId = v.IdCliente
             WHERE v.IdVenta = ? AND v.IdEmpresa = ?
             FOR UPDATE`,
            [IdVenta, req.auth.IdEmpresa]
        );
        if (venta.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Venta no encontrada' }); }
        if (venta[0].Estado !== 'CONFIRMADA') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'Solo se pueden anular ventas CONFIRMADAS' }); }

        const [detalle] = await conn.query(
            `SELECT IdProducto, IdServicio, Cantidad, CostoUnitario FROM ventas_detalle WHERE IdVenta = ? AND IdEmpresa = ?`, [IdVenta, req.auth.IdEmpresa]
        );

        // "controla" = la empresa valida/descuenta existencias de producto.
        const controla = await parametrosBusiness.empresaControlaExistencias(conn, req.auth.IdEmpresa);

        const movimientos = [];
        for (const item of detalle) {
            // Línea sin control de inventario: servicio, o producto con
            // ControlExistencias = 0. No afecta inventario ni kardex.
            const sinInventario = item.IdServicio && !item.IdProducto ? true
                                : (!controla && item.IdProducto);
            if (sinInventario) {
                continue;
            }
            const entrada = await invBusiness.registrarEntrada(conn, {
                IdProducto: item.IdProducto,
                IdBodega: venta[0].IdBodega,
                TipoMovimiento: 'OTRO',
                DocumentoTipo: 'VENTA',
                IdDocumento: IdVenta,
                cantidad: item.Cantidad,
                costoUnitario: item.CostoUnitario,
                costoTotal: item.Cantidad * item.CostoUnitario,
                UsuarioId: UsuarioIdAnulacion,
                IdEmpresa: req.auth?.IdEmpresa ?? null,
                Observaciones: MotivoAnulacion || 'Anulación de venta'
            });
            movimientos.push(entrada);
        }

        await conn.query(
            `UPDATE ventas SET Estado = 'ANULADA', CostoTotal = 0, Utilidad = 0,
                UsuarioIdAnulacion = ?, FechaAnulacion = NOW()
             WHERE IdVenta = ? AND IdEmpresa = ?`,
            [UsuarioIdAnulacion || null, IdVenta, req.auth.IdEmpresa]
        );

        // Se revierte el movimiento de caja de la venta anulada (valor negativo)
        // en la jornada abierta de la empresa.
        const movCaja = await cajaBusiness.registrarMovimientoVenta(conn, {
            IdEmpresa: req.auth.IdEmpresa,
            UsuarioId: UsuarioIdAnulacion,
            NumeroVenta: venta[0].NumeroVenta,
            ValorMov: venta[0].Total,
            TipoPago: venta[0].TipoPago,
            Cliente: venta[0].NombreCliente,
            Accion: 'ANULAR',
            Fecha: new Date()
        });

        await conn.commit();
        res.json({ ok: true, mensaje: 'Venta anulada, inventario restaurado', movimientos, movCaja });
    } catch (error) {
        await conn.rollback();
        console.error('Error anulando venta:', error);
        if (error.codigo === 'SIN_CAJA_ABIERTA' || error.codigo === 'SIN_TIPO_CAJA') {
            return res.status(409).json({ ok: false, mensaje: error.message });
        }
        res.status(500).json({ ok: false, mensaje: 'Error anulando venta', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// ELIMINAR VENTA (solo BORRADOR, sin movimientos)
// DELETE /api/ventas/:id
// =====================================================
router.delete('/:id', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();
        const IdVenta = Number(req.params.id);

        const [actual] = await conn.query(`SELECT Estado FROM ventas WHERE IdVenta = ? AND IdEmpresa = ?`, [IdVenta, req.auth.IdEmpresa]);
        if (actual.length === 0) { await conn.rollback(); return res.status(404).json({ ok: false, mensaje: 'Venta no encontrada' }); }
        if (actual[0].Estado !== 'BORRADOR') { await conn.rollback(); return res.status(409).json({ ok: false, mensaje: 'Solo se pueden eliminar ventas en BORRADOR' }); }

        await conn.query(`DELETE FROM ventas_detalle WHERE IdVenta = ? AND IdEmpresa = ?`, [IdVenta, req.auth.IdEmpresa]);
        await conn.query(`DELETE FROM ventas WHERE IdVenta = ? AND IdEmpresa = ?`, [IdVenta, req.auth.IdEmpresa]);

        await conn.commit();
        res.json({ ok: true, mensaje: 'Venta eliminada' });
    } catch (error) {
        await conn.rollback();
        console.error('Error eliminando venta:', error);
        res.status(500).json({ ok: false, mensaje: 'Error eliminando venta', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// IMPRIMIR VENTA (PDF)  (GET /api/ventas/:id/imprimir)
// Genera la factura de una venta (CONFIRMADA o BORRADOR) en PDF con datos
// de la empresa, cabecera, detalle y totales. Aislada por empresa.
// =====================================================
router.get('/:id/imprimir', authorize('VENTAS.IMPRIMIR'), async (req, res) => {
    try {
        const IdVenta = Number(req.params.id);

        const [cabecera] = await pool.query(`
            SELECT
                v.IdVenta, v.NumeroVenta, v.Fecha, v.Estado,
                v.IdCliente,
                CONCAT_WS(' ', c.PrimerNombre, c.SegundoNombre,
                          c.PrimerApellido, c.SegundoApellido) AS NombreCliente,
                v.IdVendedor,
                CONCAT_WS(' ', ven.PrimerNombre, ven.SegundoNombre,
                          ven.PrimerApellido, ven.SegundoApellido) AS NombreVendedor,
                v.TipoPago, v.PorcentajeImpuesto,
                v.IdBodega, b.NombreBodega,
                v.Subtotal, v.Descuento, v.Impuesto, v.Total,
                v.Observaciones
            FROM ventas v
            INNER JOIN clientes c    ON c.ClienteId = v.IdCliente
            LEFT JOIN Usuarios ven   ON ven.UsuarioId = v.IdVendedor
            INNER JOIN bodegas b     ON b.Id = v.IdBodega
            WHERE v.IdVenta = ? AND v.IdEmpresa = ?
        `, [IdVenta, req.auth.IdEmpresa]);
        if (cabecera.length === 0)
            return res.status(404).json({ ok: false, mensaje: 'Venta no encontrada' });

        const [detalle] = await pool.query(`
            SELECT
                COALESCE(p.NombreProducto, s.Nombre) AS DescripcionItem,
                vd.Cantidad, vd.PrecioUnitario, vd.Descuento, vd.Impuesto, vd.Total
            FROM ventas_detalle vd
            LEFT JOIN productos p ON p.IdProducto = vd.IdProducto
            LEFT JOIN servicios s ON s.IdServicio = vd.IdServicio
            WHERE vd.IdVenta = ? AND vd.IdEmpresa = ?
        `, [IdVenta, req.auth.IdEmpresa]);

        const [emp] = await pool.query(
            `SELECT NombreComercial, RazonSocial, Nit, Direccion, Telefono, Correo
             FROM empresas WHERE IdEmpresa = ?`,
            [req.auth.IdEmpresa]
        );
        const e = emp[0] || {};

        const doc = new PDFDocument({ margin: 35 });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition',
            `attachment; filename="factura_${cabecera[0].NumeroVenta}.pdf"`);
        doc.pipe(res);

        const derecha = 150;

        // Encabezado factura
        doc.fontSize(18).fillColor('#1f2937').text(e.NombreComercial || 'BissVet', { align: 'left' });
        doc.fontSize(9).fillColor('#6b7280');
        if (e.Direccion) doc.text(`Dirección: ${e.Direccion}`);
        if (e.Telefono) doc.text(`Teléfono: ${e.Telefono}`);
        if (e.Nit) doc.text(`NIT: ${e.Nit}`);
        doc.moveDown(0.2);
        doc.fillColor('#2563eb').fontSize(15).text('FACTURA DE VENTA', { align: 'right' });
        doc.fillColor('#374151').fontSize(10).text(cabecera[0].NumeroVenta, { align: 'right' });
        doc.moveDown();

        doc.moveTo(35, doc.y).lineTo(doc.page.width - 35, doc.y)
           .lineWidth(1).strokeColor('#2563eb').stroke();
        doc.moveDown(0.5);

        // Datos del documento
        const detFecha = new Date(cabecera[0].Fecha).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });
        doc.fontSize(10).fillColor('#111827');
        doc.text(`Cliente: ${cabecera[0].NombreCliente || '-'}`, { continued: false });
        doc.text(`Fecha: ${detFecha}`);
        doc.text(`Vendedor: ${cabecera[0].NombreVendedor || '-'}`);
        doc.text(`Tipo de pago: ${cabecera[0].TipoPago || '-'}`);
        doc.text(`Bodega: ${cabecera[0].NombreBodega || '-'}`);
        doc.text(`Estado: ${cabecera[0].Estado}`);
        doc.moveDown();

        // Tabla de detalle
        const colX = {
            concepto: 35,
            cantidad: 282,
            precio: 322,
            descuento: 388,
            impuesto: 447,
            total: 500
        };
        const dibujarCabeceraTabla = () => {
            const yCab = doc.y;
            doc.rect(35, yCab, doc.page.width - 70, 18).fill('#1f2937');
            doc.fillColor('white').fontSize(8);
            doc.text('Concepto', colX.concepto + 3, yCab + 5, { lineBreak: false });
            doc.text('Cant.', colX.cantidad + 3, yCab + 5, { lineBreak: false });
            doc.text('Valor', colX.precio + 3, yCab + 5, { width: 62, align: 'right', lineBreak: false });
            doc.text('Desc.', colX.descuento + 3, yCab + 5, { width: 55, align: 'right', lineBreak: false });
            doc.text('IVA', colX.impuesto + 3, yCab + 5, { width: 50, align: 'right', lineBreak: false });
            doc.text('Total', colX.total + 3, yCab + 5, { width: 72, align: 'right', lineBreak: false });
            doc.y = yCab + 22;
        };
        dibujarCabeceraTabla();

        doc.fillColor('#111827').fontSize(9);
        for (const it of detalle) {
            if (doc.y > doc.page.height - 80) {
                doc.addPage();
                dibujarCabeceraTabla();
            }
            const yFila = doc.y + 3;
            doc.text(String(it.DescripcionItem || 'S/N'), colX.concepto, yFila, { width: 240, lineBreak: false });
            doc.text(String(it.Cantidad), colX.cantidad + 3, yFila, { width: 36, lineBreak: false });
            doc.text(formatoCOP(it.PrecioUnitario), colX.precio + 3, yFila, { width: 62, align: 'right', lineBreak: false });
            doc.text(formatoCOP(it.Descuento), colX.descuento + 3, yFila, { width: 55, align: 'right', lineBreak: false });
            doc.text(formatoCOP(it.Impuesto), colX.impuesto + 3, yFila, { width: 50, align: 'right', lineBreak: false });
            doc.text(formatoCOP(it.Total), colX.total + 3, yFila, { width: 72, align: 'right', lineBreak: false });
            doc.y = yFila + 14;
        }

        doc.moveDown(0.5);
        doc.moveTo(35, doc.y).lineTo(doc.page.width - 35, doc.y)
           .lineWidth(0.5).strokeColor('#d1d5db').stroke();
        doc.moveDown(0.5);

        const filaTotal = (label, valor, color) => {
            const y0 = doc.y;
            doc.fontSize(10).fillColor('#374151').text(label, colX.precio, y0, { width: 180, align: 'left', lineBreak: false });
            doc.fontSize(10).fillColor(color || '#111827').text(`$ ${formatoCOP(valor)}`, colX.total, y0, { width: 72, align: 'right', lineBreak: false });
            doc.y = y0 + 14;
        };
        filaTotal('Subtotal:', cabecera[0].Subtotal);
        filaTotal('Descuento:', `- ${formatoCOP(cabecera[0].Descuento)}`);
        filaTotal('IVA:', cabecera[0].Impuesto);
        const yTotal = doc.y;
        doc.fontSize(12).fillColor('#1f2937').text('TOTAL:', colX.precio, yTotal, { width: 180, align: 'left', lineBreak: false });
        doc.fontSize(13).fillColor('#16a34a').text(`$ ${formatoCOP(cabecera[0].Total)}`, colX.total, yTotal, { width: 72, align: 'right', lineBreak: false });
        doc.y = yTotal + 18;
        doc.x = 35;

        doc.moveDown(1);
        if (cabecera[0].Observaciones) {
            doc.fontSize(8).fillColor('#6b7280').text(`Observaciones: ${cabecera[0].Observaciones}`, 35, doc.y, { width: doc.page.width - 70 });
        }
        doc.moveDown(1);
        doc.fontSize(7).fillColor('#9ca3af').text(
            `Generado por BissVet el ${new Date().toLocaleString('es-CO')}. Documento de venta ${cabecera[0].NumeroVenta}.`,
            35, doc.y, { width: doc.page.width - 70, align: 'center' }
        );

        await registrarAuditoria({
            IdEmpresa: req.auth.IdEmpresa,
            UsuarioId: req.auth.UsuarioId,
            Tabla: 'ventas',
            RegistroId: IdVenta,
            Accion: 'IMPRIMIR',
            DireccionIP: obtenerIP(req),
            DatosNuevos: { NumeroVenta: cabecera[0].NumeroVenta, formato: 'pdf' },
            Descripcion: `Impresión de factura ${cabecera[0].NumeroVenta}`
        });

        doc.end();
    } catch (error) {
        console.error('Error imprimiendo venta:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, mensaje: 'Error generando la factura', error: error.message });
        } else {
            res.end();
        }
    }
});

module.exports = router;