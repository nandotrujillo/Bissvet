const express = require('express');
const router = express.Router();
const multer = require('multer');
const pool = require('../../database/mysql');
const invBusiness = require('../Services/inventarioBusiness');

const upload = multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: 5 * 1024 * 1024, files: 1 }
});

// =====================================================
// Utilitarios de CSV
// =====================================================
function detectarSeparador(linea) {
    const puntos = (linea.match(/;/g) || []).length;
    const comas = (linea.match(/,/g) || []).length;
    return puntos >= comas ? ';' : ',';
}

function dividirLinea(linea, sep) {
    const out = [];
    let campo = '';
    let dentro = false;
    for (let i = 0; i < linea.length; i++) {
        const ch = linea[i];
        if (ch === '"') {
            dentro = !dentro;
        } else if (ch === sep && !dentro) {
            out.push(campo.trim());
            campo = '';
        } else {
            campo += ch;
        }
    }
    out.push(campo.trim());
    return out;
}

// =====================================================
// Registro único de inventario inicial (usado por JSON y CSV)
// Devuelve { status, json } o { status:null, resultados }.
// =====================================================
async function registrarInicial(conn, IdBodega, Items, UsuarioId, IdEmpresa) {
    for (const item of Items) {
        if (!item.IdProducto)
            return { status: 400, json: { ok: false, mensaje: 'Cada producto debe tener IdProducto' } };
        if (!item.Cantidad || item.Cantidad <= 0)
            return { status: 400, json: { ok: false, mensaje: `Cantidad inválida para producto ${item.IdProducto}` } };
        if (item.CostoUnitario === undefined || item.CostoUnitario < 0)
            return { status: 400, json: { ok: false, mensaje: `Costo unitario inválido para producto ${item.IdProducto}` } };

        const [movs] = await conn.query(
            `SELECT COUNT(*) AS total FROM kardex WHERE IdProducto = ? AND IdBodega = ?`,
            [item.IdProducto, IdBodega]
        );
        if (movs[0].total > 0)
            return {
                status: 409,
                json: {
                    ok: false,
                    mensaje: `El producto ${item.IdProducto} ya tiene movimientos en esta bodega. Use ajustes para modificar.`
                }
            };
    }

    const resultados = [];
    for (const item of Items) {
        const resultado = await invBusiness.registrarEntrada(conn, {
            IdProducto: item.IdProducto,
            IdBodega,
            TipoMovimiento: 'INVENTARIO_INICIAL',
            DocumentoTipo: 'INVENTARIO_INICIAL',
            IdDocumento: null,
            cantidad: item.Cantidad,
            costoUnitario: item.CostoUnitario,
            costoTotal: item.Cantidad * item.CostoUnitario,
            UsuarioId,
            IdEmpresa,
            Observaciones: 'Inventario inicial del sistema'
        });
        resultados.push(resultado);
    }

    return { status: null, resultados };
}

// =====================================================
// CONSULTAR INVENTARIO POR BODEGA  (GET /api/inventario)
// Filtros: ?bodega=1, ?producto=1, ?buscar=nombre
// =====================================================
router.get('/', async (req, res) => {
    try {
        const condiciones = [];
        const params = [];
        if (req.query.bodega)   { condiciones.push('i.IdBodega = ?'); params.push(Number(req.query.bodega)); }
        if (req.query.producto) { condiciones.push('i.IdProducto = ?'); params.push(Number(req.query.producto)); }
        if (req.query.buscar) {
            condiciones.push('(p.NombreProducto LIKE ? OR p.CodigoProducto LIKE ?)');
            const t = `%${req.query.buscar}%`; params.push(t, t);
        }
        condiciones.push('i.IdEmpresa = ?');
        params.push(req.auth?.IdEmpresa ?? null);
        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

        const [rows] = await pool.query(`
            SELECT
                i.IdInventario, i.IdProducto, p.CodigoProducto, p.NombreProducto,
                p.CodigoBarras,
                i.IdBodega, b.CodigoBodega, b.NombreBodega,
                i.Cantidad, i.CostoPromedio, i.CostoTotal,
                p.PrecioVenta,
                CASE WHEN p.PrecioVenta > 0 AND i.CostoPromedio > 0
                     THEN ROUND(p.PrecioVenta - i.CostoPromedio, 4) ELSE 0 END AS MargenUnitario,
                CASE WHEN i.CostoPromedio > 0 AND p.PrecioVenta > 0
                     THEN ROUND(((p.PrecioVenta - i.CostoPromedio) / p.CostoPromedio) * 100, 2) ELSE 0 END AS MargenPorcentaje,
                CASE WHEN i.Cantidad <= 0 THEN 'AGOTADO'
                     WHEN p.StockMinimo > 0 AND i.Cantidad <= p.StockMinimo THEN 'STOCK BAJO'
                     WHEN p.StockMaximo > 0 AND i.Cantidad >= p.StockMaximo THEN 'STOCK ALTO'
                     ELSE 'OK' END AS Alerta,
                p.StockMinimo, p.StockMaximo,
                i.FechaUltimoMovimiento
            FROM inventario i
            INNER JOIN productos p ON p.IdProducto = i.IdProducto
            INNER JOIN bodegas b   ON b.Id = i.IdBodega
            ${where}
            ORDER BY p.NombreProducto, b.NombreBodega
        `, params);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error consultando inventario:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando inventario', error: error.message });
    }
});

// =====================================================
// INVENTARIO CONSOLIDADO POR PRODUCTO  (GET /api/inventario/consolidado)
// =====================================================
router.get('/consolidado', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT
                p.IdProducto, p.CodigoProducto, p.NombreProducto,
                SUM(i.Cantidad) AS TotalExistencia,
                CASE WHEN SUM(i.Cantidad) > 0 THEN ROUND(SUM(i.CostoTotal) / SUM(i.Cantidad), 4) ELSE 0 END AS CostoPromedioConsolidado,
                ROUND(SUM(i.CostoTotal), 2) AS ValorTotal,
                p.PrecioVenta,
                p.StockMinimo, p.StockMaximo,
                CASE WHEN SUM(i.Cantidad) <= 0 THEN 'AGOTADO'
                     WHEN p.StockMinimo > 0 AND SUM(i.Cantidad) <= p.StockMinimo THEN 'STOCK BAJO'
                     ELSE 'OK' END AS Alerta
            FROM inventario i
            INNER JOIN productos p ON p.IdProducto = i.IdProducto
            WHERE p.Activo = 1 AND i.IdEmpresa = ?
            GROUP BY p.IdProducto, p.CodigoProducto, p.NombreProducto,
                     p.PrecioVenta, p.StockMinimo, p.StockMaximo
            ORDER BY p.NombreProducto
        `, [req.auth?.IdEmpresa ?? null]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error consultando inventario consolidado:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando inventario consolidado', error: error.message });
    }
});

// =====================================================
// INVENTARIO INICIAL  (POST /api/inventario/inicial)
// Registra el stock inicial de múltiples productos en una bodega.
// Solo permite si el producto+bodega NO tiene movimientos previos en Kardex.
// Body: { IdBodega, UsuarioId, Items: [{ IdProducto, Cantidad, CostoUnitario }] }
// =====================================================
router.post('/inicial', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const { IdBodega, Items } = req.body;
        const UsuarioId = req.auth?.UsuarioId ?? null;
        const IdEmpresa = req.auth?.IdEmpresa ?? null;

        if (!IdBodega)
            return res.status(400).json({ ok: false, mensaje: 'El IdBodega es obligatorio' });
        if (!Items || !Items.length)
            return res.status(400).json({ ok: false, mensaje: 'Debe agregar al menos un producto' });

        const r = await registrarInicial(conn, IdBodega, Items, UsuarioId, IdEmpresa);
        if (r.status)
            return res.status(r.status).json(r.json);

        await conn.commit();
        res.status(201).json({ ok: true, mensaje: 'Inventario inicial registrado', datos: r.resultados });
    } catch (error) {
        await conn.rollback();
        console.error('Error en inventario inicial:', error);
        res.status(500).json({ ok: false, mensaje: 'Error registrando inventario inicial', error: error.message });
    } finally {
        conn.release();
    }
});

// =====================================================
// INVENTARIO INICIAL POR CSV  (POST /api/inventario/inicial/csv)
// Carga un archivo CSV con columnas: CodigoProducto | Cantidad | CostoUnitario
// (también acepta IdProducto en la primera columna).
// Separador aceptado: ; o ,   |  FormData: IdBodega + archivo
// =====================================================
router.post('/inicial/csv', upload.single('archivo'), async (req, res) => {
    const conn = await pool.getConnection();
    try {
        const IdBodega = req.body?.IdBodega;
        const UsuarioId = req.auth?.UsuarioId ?? null;
        const IdEmpresa = req.auth?.IdEmpresa ?? null;

        if (!IdBodega)
            return res.status(400).json({ ok: false, mensaje: 'El IdBodega es obligatorio' });
        if (!req.file)
            return res.status(400).json({ ok: false, mensaje: 'Debe adjuntar el archivo CSV' });

        const csvOK = (req.file.originalname || '').match(/\.(csv|txt)$/i) || req.file.mimetype.includes('csv') || req.file.mimetype.includes('text');
        if (!csvOK)
            return res.status(400).json({ ok: false, mensaje: 'El archivo debe ser CSV (.csv o .txt)' });

        const texto = req.file.buffer.toString('utf8').replace(/^\uFEFF/, '');
        const lineas = texto.split(/\r?\n/).map(l => l.trim()).filter(l => l.length > 0);
        if (!lineas.length)
            return res.status(400).json({ ok: false, mensaje: 'El archivo está vacío' });

        const sep = detectarSeparador(lineas[0]);
        const cabeceras = dividirLinea(lineas[0], sep).map(h => h.toLowerCase().replace(/\s+/g, ''));

        if (!cabeceras.length)
            return res.status(400).json({ ok: false, mensaje: 'El archivo no tiene encabezados válidos' });

        const idxProducto = cabeceras.findIndex(h => ['codigoproducto', 'codigo', 'idproducto'].includes(h));
        const idxCantidad = cabeceras.findIndex(h => ['cantidad', 'existencia', 'stock'].includes(h));
        const idxCosto = cabeceras.findIndex(h => ['costounitario', 'costounidad', 'costo'].includes(h));

        if (idxProducto === -1 || idxCantidad === -1 || idxCosto === -1)
            return res.status(400).json({
                ok: false,
                mensaje: 'El encabezado debe incluir: CodigoProducto ; Cantidad ; CostoUnitario'
            });

        const porCodigo = cabeceras[idxProducto] !== 'idproducto';

        await conn.beginTransaction();

        const Items = [];
        const errores = [];

        for (let i = 1; i < lineas.length; i++) {
            const fila = dividirLinea(lineas[i], sep);
            const filaNum = i + 1;

            if (fila.length < 3) {
                errores.push(`Fila ${filaNum}: debe tener 3 columnas`);
                continue;
            }

            const cantidad = Number(String(fila[idxCantidad] ?? '').replace(',', '.'));
            const costo = Number(String(fila[idxCosto] ?? '').replace(',', '.'));

            if (!isFinite(cantidad) || cantidad <= 0) {
                errores.push(`Fila ${filaNum}: cantidad inválida "${fila[idxCantidad]}"`);
                continue;
            }
            if (!isFinite(costo) || costo < 0) {
                errores.push(`Fila ${filaNum}: costo unitario inválido "${fila[idxCosto]}"`);
                continue;
            }

            let IdProducto = null;
            const ref = String(fila[idxProducto] ?? '').trim();
            if (porCodigo) {
                const [p] = await conn.query(
                    `SELECT IdProducto FROM productos WHERE CodigoProducto = ? AND IdEmpresa = ?`,
                    [ref, IdEmpresa]
                );
                IdProducto = p.length ? p[0].IdProducto : null;
                if (!IdProducto) {
                    errores.push(`Fila ${filaNum}: código "${ref}" no existe`);
                    continue;
                }
            } else {
                IdProducto = Number(ref);
                if (!IdProducto) {
                    errores.push(`Fila ${filaNum}: IdProducto inválido "${ref}"`);
                    continue;
                }
                const [p] = await conn.query(
                    `SELECT IdProducto FROM productos WHERE IdProducto = ? AND IdEmpresa = ?`,
                    [IdProducto, IdEmpresa]
                );
                if (!p.length) {
                    errores.push(`Fila ${filaNum}: producto ${IdProducto} no pertenece a la empresa`);
                    continue;
                }
            }

            const [movs] = await conn.query(
                `SELECT COUNT(*) AS total FROM kardex WHERE IdProducto = ? AND IdBodega = ?`,
                [IdProducto, IdBodega]
            );
            if (movs[0].total > 0) {
                errores.push(`Fila ${filaNum}: producto ${ref} ya tiene movimientos en esta bodega`);
                continue;
            }

            Items.push({ IdProducto, Cantidad: cantidad, CostoUnitario: costo });
        }

        if (!Items.length) {
            await conn.rollback();
            return res.status(400).json({ ok: false, mensaje: 'No se pudo procesar ninguna fila del archivo', errores });
        }

        const r = await registrarInicial(conn, IdBodega, Items, UsuarioId, IdEmpresa);
        if (r.status) {
            await conn.rollback();
            return res.status(r.status).json({ ...r.json, errores });
        }

        await conn.commit();
        res.status(201).json({
            ok: true,
            mensaje: `Inventario inicial registrado: ${Items.length} producto(s)`,
            registrados: Items.length,
            errores,
            datos: r.resultados
        });
    } catch (error) {
        await conn.rollback();
        console.error('Error en inventario inicial CSV:', error);
        res.status(500).json({ ok: false, mensaje: 'Error procesando el archivo CSV', error: error.message });
    } finally {
        conn.release();
    }
});

module.exports = router;