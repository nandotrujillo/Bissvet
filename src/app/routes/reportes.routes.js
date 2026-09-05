const express = require('express');
const router = express.Router();

const pool = require('../../database/mysql');
const { registrarAuditoria } = require('../../middleware/auditoria.js');
const PDFDocument = require('pdfkit');

function obtenerIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.socket?.remoteAddress
        || req.ip
        || null;
}

// =============================================================================
// Catálogo de reportes disponibles del módulo REPORTES.
// =============================================================================
const CATALOGO = [
    { id: 'ventas',   titulo: 'Reporte de ventas',        descripcion: 'Ventas por rango de fechas con clientes y totales' },
    { id: 'cartera',  titulo: 'Movimientos de caja',      descripcion: 'Jornadas, ingresos, egresos y descuadres' },
    { id: 'inventario', titulo: 'Inventario por bodega',  descripcion: 'Existencias de productos con costo promedio' },
    { id: 'kardex',   titulo: 'Kárdex de producto',       descripcion: 'Movimientos de un producto con saldos' },
    { id: 'compras',  titulo: 'Reporte de compras',       descripcion: 'Compras por rango de fechas con proveedores' },
    { id: 'clientes', titulo: 'Clientes',                 descripcion: 'Clientes registrados y sus mascotas' },
    { id: 'citas',    titulo: 'Citas veterinarias',       descripcion: 'Citas por rango de fechas con estado' }
];

const METADATA = {
    ventas: {
        titulo: 'REPORTE DE VENTAS',
        columnas: ['NumeroVenta', 'Fecha', 'Cliente', 'DocumentoCliente', 'Bodega', 'Estado', 'Subtotal', 'Descuento', 'Impuesto', 'Total', 'Utilidad']
    },
    cartera: {
        titulo: 'MOVIMIENTOS DE CAJA',
        columnas: ['Fecha', 'Caja', 'Bodega', 'Apertura', 'Ingresos', 'Egresos', 'Saldo', 'Estado', 'Entregado', 'Descuadre']
    },
    inventario: {
        titulo: 'INVENTARIO POR BODEGA',
        columnas: ['Bodega', 'Producto', 'Lote', 'Cantidad']
    },
    kardex: {
        titulo: 'KARDEX DE PRODUCTO',
        columnas: ['Fecha', 'Bodega', 'Movimiento', 'Documento', 'Entrada', 'Salida', 'SaldoCantidad', 'CostoPromedio', 'SaldoValor']
    },
    compras: {
        titulo: 'REPORTE DE COMPRAS',
        columnas: ['Numero', 'Fecha', 'Proveedor', 'Bodega', 'Estado', 'Subtotal', 'Descuento', 'Impuesto', 'Total']
    },
    clientes: {
        titulo: 'CLIENTES',
        columnas: ['Cliente', 'Documento', 'Telefono', 'Correo', 'Mascotas']
    },
    citas: {
        titulo: 'CITAS VETERINARIAS',
        columnas: ['Fecha', 'Hora', 'Paciente', 'Servicio', 'Veterinario', 'Estado', 'Precio']
    }
};

// =============================================================================
// GET /api/reportes/catalogo   (PROTEGIDO - REPORTES.CONSULTAR)
// =============================================================================
router.get('/catalogo', async (req, res) => {
    res.json({ ok: true, datos: CATALOGO });
});

// =============================================================================
// GET /api/reportes/:id   (PROTEGIDO - REPORTES.CONSULTAR)
// Datos del reporte. La consulta externa (cliente/mascota) puede ir sin token.
// =============================================================================
router.get('/:id', async (req, res) => {
    const id = (req.params.id || '').toLowerCase();

    try {
        const delReporte = await consultarReporte(
            id,
            req.query,
            req.auth ? req.auth.IdEmpresa : null
        );

        if (!delReporte.ok) {
            return res.status(delReporte.codigo).json(delReporte);
        }

        res.json({ ok: true, datos: delReporte.datos, total: delReporte.datos.length });
    } catch (error) {
        console.error(`Error generando reporte ${id}:`, error);
        res.status(500).json({ ok: false, mensaje: 'Error generando reporte', error: error.message });
    }
});

// =============================================================================
// GET /api/reportes/:id/exportar   (PROTEGIDO - REPORTES.EXPORTAR)
// Exporta el reporte a CSV.
// =============================================================================
router.get('/:id/exportar', async (req, res) => {
    const id = (req.params.id || '').toLowerCase();
    const meta = METADATA[id];
    if (!meta) {
        return res.status(404).json({ ok: false, mensaje: 'Reporte no existe' });
    }

    // Reutiliza la consulta del reporte (GET /:id) apuntando a la misma lógica.
    const delReporte = await consultarReporte(id, req.query, req.auth ? req.auth.IdEmpresa : null);
    if (!delReporte.ok) {
        return res.status(delReporte.codigo).json(delReporte);
    }

    const filas = delReporte.datos;
    const escape = (v) => {
        if (v === null || v === undefined) return '';
        const s = String(v);
        return /[",;\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    };

    // Nombres de columna amigables
    const nombresColumna = {
        NumeroVenta: 'Documento', Fecha: 'Fecha', Cliente: 'Cliente',
        DocumentoCliente: 'Identificacion', Bodega: 'Bodega', Estado: 'Estado',
        Subtotal: 'Subtotal', Descuento: 'Descuento', Impuesto: 'Impuesto',
        Total: 'Total', Utilidad: 'Utilidad', Caja: 'Caja', Apertura: 'Apertura',
        Ingresos: 'Ingresos', Egresos: 'Egresos', Saldo: 'Saldo', Entregado: 'Entregado',
        Descuadre: 'Descuadre', Producto: 'Producto', CodigoProducto: 'Codigo',
        Lote: 'Lote', Cantidad: 'Cantidad', Movimiento: 'Movimiento',
        Documento: 'Documento', Entrada: 'Entrada', Salida: 'Salida',
        SaldoCantidad: 'SaldoCantidad', CostoPromedio: 'CostoPromedio',
        SaldoValor: 'SaldoValor', Numero: 'Documento', Proveedor: 'Proveedor',
        NitProveedor: 'NIT', OrigenProveedor: 'Origen', Telefono: 'Telefono',
        Correo: 'Correo', Mascotas: 'Mascotas', Hora: 'Hora', Paciente: 'Paciente',
        Servicio: 'Servicio', Veterinario: 'Veterinario', Precio: 'Precio'
    };

    const columnas = meta.columnas;
    let csv = columnas.map(c => escape(nombresColumna[c] || c)).join(';') + '\r\n';
    for (const fila of filas) {
        csv += columnas.map(c => escape(fila[c])).join(';') + '\r\n';
    }

    await registrarAuditoria({
        IdEmpresa: req.auth ? req.auth.IdEmpresa : null,
        UsuarioId: req.auth ? req.auth.UsuarioId : null,
        Tabla: 'reportes',
        RegistroId: null,
        Accion: 'EXPORTAR',
        DireccionIP: obtenerIP(req),
        DatosNuevos: { reporte: id, formato: 'csv', filtros: req.query },
        Descripcion: `Exportación CSV del reporte ${id}`
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_${id}.csv"`);
    res.send('\uFEFF' + csv);
});

// =============================================================================
// GET /api/reportes/:id/imprimir   (PROTEGIDO - REPORTES.IMPRIMIR)
// Genera PDF del reporte.
// =============================================================================
router.get('/:id/imprimir', async (req, res) => {
    const id = (req.params.id || '').toLowerCase();
    const meta = METADATA[id];
    if (!meta) {
        return res.status(404).json({ ok: false, mensaje: 'Reporte no existe' });
    }

    const delReporte = await consultarReporte(id, req.query, req.auth ? req.auth.IdEmpresa : null);
    if (!delReporte.ok) {
        return res.status(delReporte.codigo).json(delReporte);
    }

    const doc = new PDFDocument({ margin: 30 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="reporte_${id}.pdf"`);

    // Nombre de empresa
    let nombreEmpresa = 'BissVet';
    if (req.auth && req.auth.IdEmpresa) {
        try {
            const [emp] = await pool.query(
                `SELECT NombreComercial FROM empresas WHERE IdEmpresa = ?`, [req.auth.IdEmpresa]);
            if (emp.length) nombreEmpresa = emp[0].NombreComercial;
        } catch (e) { /* conserva valor por defecto */ }
    }

    doc.pipe(res);

    doc.fontSize(14).text(nombreEmpresa, { align: 'center' });
    doc.fontSize(11).text(meta.titulo, { align: 'center' });
    const fechaGeneracion = new Date().toLocaleString('es-CO');
    doc.fontSize(8).text(`Generado el ${fechaGeneracion}`, { align: 'center' });
    doc.moveDown();

    const columnas = meta.columnas;
    const anchoPagina = doc.page.width - 60;
    const anchoCol = anchoPagina / columnas.length;

    const textoX = (i) => 32 + i * anchoCol;

    const dibujarCabecera = () => {
        doc.rect(30, doc.y + 4, anchoPagina, 18).fill('#2563eb');
        columnas.forEach((c, i) => {
            doc.fillColor('white').fontSize(7)
                .text(c, textoX(i) + 2, doc.y + 8, { width: anchoCol - 4, ellipsis: true });
        });
        doc.y += 22;
    };

    dibujarCabecera();

    doc.fillColor('#111827').fontSize(7);
    for (const fila of delReporte.datos) {
        if (doc.y > doc.page.height - 60) {
            doc.addPage();
            doc.fillColor('#111827');
            dibujarCabecera();
        }
        const altoFila = 14;

        const celdaX = (i) => textoX(i) + 2;
        const valorEnFila = (i) => {
            const valor = fila[columnas[i]];
            return valor === null || valor === undefined ? '' : String(valor);
        };

        // Textos de todas las columnas primero para conocer la altura real
        const desplazamientos = [];
        columnas.forEach((c, i) => {
            desplazamientos[i] = doc.heightOfString(valorEnFila(i), { width: anchoCol - 4 });
        });
        const altoReal = Math.max(altoFila, ...desplazamientos) + 4;

        if (doc.y + altoReal > doc.page.height - 60) {
            doc.addPage();
            doc.fillColor('#111827');
            dibujarCabecera();
        }

        columnas.forEach((c, i) => {
            const altura = desplazamientos[i];
            const desplazamiento = (altoReal - altura) / 2;
            doc.text(valorEnFila(i), celdaX(i), doc.y + desplazamiento, { width: anchoCol - 4 });
        });
        doc.y += altoReal;

        // Línea separadora sutil
        doc.moveTo(30, doc.y - 2)
           .lineTo(doc.page.width - 30, doc.y - 2)
           .lineWidth(0.3)
           .strokeColor('#e5e7eb')
           .stroke();
    }

    await registrarAuditoria({
        IdEmpresa: req.auth ? req.auth.IdEmpresa : null,
        UsuarioId: req.auth ? req.auth.UsuarioId : null,
        Tabla: 'reportes',
        RegistroId: null,
        Accion: 'IMPRIMIR',
        DireccionIP: obtenerIP(req),
        DatosNuevos: { reporte: id, formato: 'pdf', filtros: req.query },
        Descripcion: `Impresión PDF del reporte ${id}`
    });

    doc.end();
});

// =============================================================================
// Ayudante: ejecuta la consulta de un reporte y devuelve {ok, datos, codigo}
// =============================================================================
async function consultarReporte(id, query, IdEmpresa) {
    const { desde, hasta, producto, estado, idProducto } = query;
    const emp = IdEmpresa || query.idEmpresa || null;
    if (!emp) {
        return { ok: false, codigo: 400, mensaje: 'No se determinó la empresa para el reporte' };
    }

    try {
        let querySQL;
        let params = [];

        if (id === 'ventas') {
            const cond = ['v.IdEmpresa = ?', "v.Estado <> 'ANULADA'"];
            const p = [emp];
            if (desde) { cond.push('v.Fecha >= ?'); p.push(desde); }
            if (hasta) { cond.push('v.Fecha <= ?'); p.push(hasta); }
            if (estado) { cond.push('v.Estado = ?'); p.push(estado); }
            querySQL = `
                SELECT
                    v.NumeroVenta, DATE_FORMAT(v.Fecha, '%Y-%m-%d') AS Fecha,
                    CONCAT_WS(' ', c.PrimerNombre, c.PrimerApellido) AS Cliente,
                    CONCAT(c.TipoDocumento, ' ', c.NumeroDocumento) AS DocumentoCliente,
                    b.NombreBodega AS Bodega, v.Estado,
                    v.Subtotal, v.Descuento, v.Impuesto, v.Total, v.Utilidad
                FROM ventas v
                INNER JOIN clientes c ON c.ClienteId = v.IdCliente
                LEFT JOIN bodegas b   ON b.Id = v.IdBodega
                WHERE ${cond.join(' AND ')}
                ORDER BY v.Fecha DESC, v.NumeroVenta DESC`;
            params = p;
        } else if (id === 'cartera') {
            const cond = ['c.idEmpresa = ?'];
            const p = [emp];
            if (desde) { cond.push('c.diaProceso >= ?'); p.push(desde); }
            if (hasta) { cond.push('c.diaProceso <= ?'); p.push(hasta); }
            querySQL = `
                SELECT
                    c.diaProceso AS Fecha, c.cajaMesa AS Caja,
                    b.NombreBodega AS Bodega, c.Valor AS Apertura,
                    COALESCE((SELECT SUM(d.ValorMov) FROM cajeromovdet d
                              INNER JOIN tipomovcaja t ON d.TipoMov = t.id
                              WHERE d.IdCajaMov = c.Id AND t.Signo = '+'), 0) AS Ingresos,
                    COALESCE((SELECT SUM(d.ValorMov) FROM cajeromovdet d
                              INNER JOIN tipomovcaja t ON d.TipoMov = t.id
                              WHERE d.IdCajaMov = c.Id AND t.Signo = '-'), 0) AS Egresos,
                    (c.Valor
                     + COALESCE((SELECT SUM(d.ValorMov) FROM cajeromovdet d
                                 INNER JOIN tipomovcaja t ON d.TipoMov = t.id
                                 WHERE d.IdCajaMov = c.Id AND t.Signo = '+'), 0)
                     - COALESCE((SELECT SUM(d.ValorMov) FROM cajeromovdet d
                                 INNER JOIN tipomovcaja t ON d.TipoMov = t.id
                                 WHERE d.IdCajaMov = c.Id AND t.Signo = '-'), 0)) AS Saldo,
                    CASE WHEN c.Cierre = 0 THEN 'ABIERTA' ELSE 'CERRADA' END AS Estado,
                    c.valorEntregado AS Entregado, c.Descuadre
                FROM cajeromov c
                LEFT JOIN bodegas b ON b.Id = c.IdBodega
                WHERE ${cond.join(' AND ')}
                ORDER BY c.diaProceso DESC, c.Id DESC`;
            params = p;
        } else if (id === 'inventario') {
            const cond = ['i.IdEmpresa = ?', 'i.Cantidad <> 0'];
            const p = [emp];
            if (producto) { cond.push('i.IdProducto = ?'); p.push(Number(producto)); }
            querySQL = `
                SELECT
                    b.NombreBodega AS Bodega,
                    p.CodigoProducto, p.NombreProducto AS Producto,
                    COALESCE(l.NumeroLote, 'S/L') AS Lote,
                    i.Cantidad
                FROM inventario i
                INNER JOIN bodegas b   ON b.Id = i.IdBodega
                INNER JOIN productos p ON p.IdProducto = i.IdProducto
                LEFT JOIN lotes l      ON l.IdLote = i.IdLote
                WHERE ${cond.join(' AND ')}
                ORDER BY b.NombreBodega, p.NombreProducto`;
            params = p;
        } else if (id === 'kardex') {
            const cond = ['k.IdEmpresa = ?'];
            const p = [emp];
            if (desde) { cond.push('DATE(k.Fecha) >= ?'); p.push(desde); }
            if (hasta) { cond.push('DATE(k.Fecha) <= ?'); p.push(hasta); }
            const fProducto = producto || idProducto;
            if (fProducto) { cond.push('k.IdProducto = ?'); p.push(Number(fProducto)); }
            querySQL = `
                SELECT
                    DATE_FORMAT(k.Fecha, '%Y-%m-%d') AS Fecha,
                    b.NombreBodega AS Bodega,
                    k.TipoMovimiento AS Movimiento,
                    CONCAT(k.DocumentoTipo, CASE WHEN k.IdDocumento IS NOT NULL
                                          THEN CONCAT(' ', k.IdDocumento) ELSE '' END) AS Documento,
                    k.EntradaCantidad AS Entrada, k.SalidaCantidad AS Salida,
                    k.SaldoCantidad, k.CostoPromedio, k.SaldoValor
                FROM kardex k
                INNER JOIN bodegas b ON b.Id = k.IdBodega
                WHERE ${cond.join(' AND ')}
                ORDER BY k.Fecha ASC, k.IdKardex ASC`;
            params = p;
        } else if (id === 'compras') {
            const cond = ['c.IdEmpresa = ?', "c.Estado <> 'ANULADA'"];
            const p = [emp];
            if (desde) { cond.push('c.Fecha >= ?'); p.push(desde); }
            if (hasta) { cond.push('c.Fecha <= ?'); p.push(hasta); }
            if (estado) { cond.push('c.Estado = ?'); p.push(estado); }
            querySQL = `
                SELECT
                    c.Numero, c.Fecha,
                    p.Nit, p.Nombre AS Proveedor,
                    b.NombreBodega AS Bodega, c.Estado,
                    c.Subtotal, c.Descuento, c.Impuesto, c.Total
                FROM compras c
                INNER JOIN proveedores p ON p.IdProveedor = c.IdProveedor
                LEFT JOIN bodegas b      ON b.Id = c.IdBodega
                WHERE ${cond.join(' AND ')}
                ORDER BY c.Fecha DESC, c.Numero DESC`;
            params = p;
        } else if (id === 'clientes') {
            const cond = [];
            const p = [];
            querySQL = `
                SELECT
                    CONCAT_WS(' ', c.PrimerNombre, c.SegundoNombre, c.PrimerApellido, c.SegundoApellido) AS Cliente,
                    CONCAT(c.TipoDocumento, ' ', c.NumeroDocumento) AS Documento,
                    c.Telefono, c.Correo,
                    COALESCE(cant.Mascotas, 0) AS Mascotas
                FROM clientes c
                LEFT JOIN (SELECT ClienteId, COUNT(*) AS Mascotas
                           FROM mascotas GROUP BY ClienteId) cant ON cant.ClienteId = c.ClienteId
                ${cond.length ? `WHERE ${cond.join(' AND ')}` : ''}
                ORDER BY Cliente`;
            params = p;
        } else if (id === 'citas') {
            const cond = [];
            const p = [];
            if (desde) { cond.push('c.FechaCita >= ?'); p.push(desde); }
            if (hasta) { cond.push('c.FechaCita <= ?'); p.push(hasta); }
            if (estado) { cond.push('c.Estado = ?'); p.push(estado); }
            querySQL = `
                SELECT
                    c.FechaCita AS Fecha, c.HoraCita AS Hora,
                    m.Nombre AS Paciente,
                    s.Nombre AS Servicio,
                    CONCAT_WS(' ', v.PrimerNombre, v.PrimerApellido) AS Veterinario,
                    c.Estado, c.Precio
                FROM citas c
                INNER JOIN mascotas m    ON m.IdMascota = c.IdMascota
                INNER JOIN servicios s   ON s.IdServicio = c.IdServicio
                LEFT JOIN veterinarios v ON v.IdVeterinario = c.IdVeterinario
                ${cond.length ? `WHERE ${cond.join(' AND ')}` : ''}
                ORDER BY c.FechaCita DESC, c.HoraCita DESC`;
            params = p;
        } else {
            return { ok: false, codigo: 404, mensaje: 'Reporte no existe' };
        }

        const [rows] = await pool.query(querySQL, params);
        return { ok: true, datos: rows };
    } catch (error) {
        console.error(`Error en consultarReporte ${id}:`, error);
        return { ok: false, codigo: 500, mensaje: 'Error generando reporte', error: error.message };
    }
}

module.exports = router;