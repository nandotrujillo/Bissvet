const express = require('express');
const router = express.Router();

const pool = require('../../database/mysql');
const { registrarAuditoria } = require('../../middleware/auditoria.js');
const { verificarModuloContratado } = require('../../middleware/suscripcion');
const PDFDocument = require('pdfkit');

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

// Columnas numéricas: moneda (con símbolo $) y cantidades (con separador de miles).
const COLUMNAS_MONEDA = [
    'Subtotal', 'Descuento', 'Impuesto', 'Total', 'Utilidad',
    'Apertura', 'Ingresos', 'Egresos', 'Saldo', 'Entregado', 'Descuadre',
    'Precio', 'CostoPromedio', 'SaldoValor', 'ValorCuota', 'SaldoPendiente'
];
const COLUMNAS_CANTIDAD = ['Cantidad', 'Entrada', 'Salida', 'SaldoCantidad', 'Mascotas', 'Cuota'];

// Formatea el valor de una celda para el PDF según su tipo de columna.
function formatearCeldaPDF(columna, valor) {
    if (valor === null || valor === undefined) return '';
    if (COLUMNAS_MONEDA.includes(columna)) return `$ ${formatoCOP(valor)}`;
    if (COLUMNAS_CANTIDAD.includes(columna)) return formatoCOP(valor);
    return String(valor);
}

// Totales a imprimir en el pie de cada reporte (sumatorias de columnas).
function calcularTotales(id, datos, agrupar) {
    const suma = (col) => datos.reduce((acc, f) => acc + (Number(f[col]) || 0), 0);
    const ultimo = (col) => (datos.length ? Number(datos[datos.length - 1][col]) || 0 : 0);
    const s = (col, esCop = true) => ({ columna: col, esCop, valor: suma(col) });
    const u = (col, esCop = true) => ({ columna: col, esCop, valor: ultimo(col) });
    switch (id) {
        case 'ventas': {
            const totales = [s('Subtotal'), s('Descuento'), s('Impuesto'), s('Total'), s('Utilidad')];
            if (agrupar === '1') {
                totales.unshift({ columna: 'Cantidad', esCop: false, valor: suma('Cantidad') });
            }
            return totales;
        }
        case 'compras':
            return [s('Subtotal'), s('Descuento'), s('Impuesto'), s('Total')];
        case 'inventario':
            return [{ columna: 'Cantidad', esCop: false, valor: suma('Cantidad') }];
        case 'kardex':
            return [s('Entrada', false), s('Salida', false), u('SaldoCantidad', false), u('SaldoValor')];
        case 'cartera':
            return [s('Apertura'), s('Ingresos'), s('Egresos'), s('Saldo')];
        case 'cuentaspagar':
            return [s('ValorCuota'), s('SaldoPendiente')];
        default:
            return [];
    }
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
    { id: 'citas',    titulo: 'Citas veterinarias',       descripcion: 'Citas por rango de fechas con estado' },
    { id: 'cuentaspagar', titulo: 'Cuentas por pagar',    descripcion: 'Cuotas de compras a crédito con saldo pendiente por proveedor' }
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
        columnas: ['Numero', 'Fecha', 'Proveedor', 'Nit', 'TipoDocumento', 'NumeroDocumentoProveedor', 'Bodega', 'Estado', 'Subtotal', 'Descuento', 'Impuesto', 'Total']
    },
    clientes: {
        titulo: 'CLIENTES',
        columnas: ['Cliente', 'Documento', 'Telefono', 'Correo', 'Mascotas']
    },
    citas: {
        titulo: 'CITAS VETERINARIAS',
        columnas: ['Fecha', 'Hora', 'Paciente', 'Servicio', 'Veterinario', 'Estado', 'Precio']
    },
    cuentaspagar: {
        titulo: 'CUENTAS POR PAGAR',
        columnas: ['IdProveedor', 'Proveedor', 'NitProveedor', 'NumeroCompra', 'Fecha', 'Cuota', 'Vencimiento', 'ValorCuota', 'SaldoPendiente', 'Estado']
    }
};

// Metadatos cuando el reporte se agrupa por producto (opción "agrupar").
const METADATA_AGRUPADO = {
    ventas: {
        titulo: 'REPORTE DE VENTAS POR PRODUCTO',
        columnas: ['CodigoProducto', 'Producto', 'Cantidad', 'Subtotal', 'Descuento', 'Impuesto', 'Total', 'Utilidad']
    },
    kardex: {
        titulo: 'KARDEX DE PRODUCTO (AGRUPADO POR PRODUCTO)',
        columnas: ['CodigoProducto', 'Producto', 'Entrada', 'Salida', 'SaldoCantidad', 'CostoPromedio', 'SaldoValor']
    }
};

// Mapa: cada reporte requiere que la empresa tenga contratado un módulo específico.
// Si el módulo no está en el plan, el reporte no debe devolver datos.
const REPORTES_MODULOS = {
    ventas: 'VENTAS',
    cartera: 'CAJA',
    inventario: 'INVENTARIOS',
    kardex: 'INVENTARIOS',
    compras: 'COMPRAS',
    clientes: 'CLIENTES',
    citas: 'CITAS',
    cuentaspagar: 'COMPRAS'
};

function esAgrupado(id, query) {
    return (id === 'ventas' || id === 'kardex') && query.agrupar === '1';
}

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
    const meta = esAgrupado(id, req.query) ? METADATA_AGRUPADO[id] : METADATA[id];
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

    // Las columnas numéricas se exportan con formato es-CO (miles '.', decimal ',',
    // 0-2 decimales) y SIN comillas ni símbolo $, para que Excel las totalice.
    const esColumnaNumerica = (col) => COLUMNAS_MONEDA.includes(col) || COLUMNAS_CANTIDAD.includes(col);
    const celdaCSV = (col, valor) => {
        if (valor === null || valor === undefined) return '';
        if (esColumnaNumerica(col)) return formatoCOP(valor);
        return escape(valor);
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
        NitProveedor: 'NIT', Nit: 'NIT', OrigenProveedor: 'Origen', Telefono: 'Telefono',
        Correo: 'Correo', Mascotas: 'Mascotas', Hora: 'Hora', Paciente: 'Paciente',
        Servicio: 'Servicio', Veterinario: 'Veterinario', Precio: 'Precio',
        Cuota: 'Cuota', Vencimiento: 'Vencimiento', NumeroCompra: 'Compra',
        ValorCuota: 'Valor Cuota', SaldoPendiente: 'Saldo Pendiente'
    };

    const columnas = meta.columnas;
    let csv = columnas.map(c => escape(nombresColumna[c] || c)).join(';') + '\r\n';
    for (const fila of filas) {
        csv += columnas.map(c => celdaCSV(c, fila[c])).join(';') + '\r\n';
    }

    // =========================================================================
    // FORMATO SIIGO: específico para compras (importación de comprobantes).
    // Se activa con ?formato=siigo en el reporte de compras.
    // Columnas: fecha; proveedor; identificación; tipo de documento; nro. doc.;
    //           subtotal; descuento; impuesto; total.
    // =========================================================================
    if (id === 'compras' && req.query.formato === 'siigo') {
        const filasSiigo = (delReporte.datos || []).map(f => ({ ...f })).filter(f => f.Total > 0);
        const formatFecha = (v) => {
            if (!v) return '';
            if (v instanceof Date && !isNaN(v)) {
                const dd = String(v.getDate()).padStart(2, '0');
                const mm = String(v.getMonth() + 1).padStart(2, '0');
                return `${dd}/${mm}/${v.getFullYear()}`;
            }
            const s = String(v).slice(0, 10);
            const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
            return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
        };
        const cabeceraSiigo = [
            'Fecha', 'Proveedor', 'Identificacion', 'TipoDocumento',
            'NumeroDocumentoProveedor', 'Subtotal', 'Descuento',
            'Impuesto', 'Total'
        ];
        csv = cabeceraSiigo.join(';') + '\r\n';
        for (const fila of filasSiigo) {
            csv += [
                escape(formatFecha(fila.Fecha)),
                escape(fila.Proveedor),
                escape(fila.Nit),
                escape(fila.TipoDocumento),
                escape(fila.NumeroDocumentoProveedor),
                celdaCSV('Subtotal', fila.Subtotal),
                celdaCSV('Descuento', fila.Descuento),
                celdaCSV('Impuesto', fila.Impuesto),
                celdaCSV('Total', fila.Total)
            ].join(';') + '\r\n';
        }
    }

    await registrarAuditoria({
        IdEmpresa: req.auth ? req.auth.IdEmpresa : null,
        UsuarioId: req.auth ? req.auth.UsuarioId : null,
        Tabla: 'reportes',
        RegistroId: null,
        Accion: 'EXPORTAR',
        DireccionIP: obtenerIP(req),
        DatosNuevos: { reporte: id, formato: req.query.formato === 'siigo' ? 'siigo' : 'csv', filtros: req.query },
        Descripcion: `Exportación ${req.query.formato === 'siigo' ? 'SIIGO' : 'CSV'} del reporte ${id}`
    });

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    const nombreArchivo = req.query.formato === 'siigo' ? `compras_siigo.csv` : `reporte_${id}.csv`;
    res.setHeader('Content-Disposition', `attachment; filename="${nombreArchivo}"`);
    res.send('\uFEFF' + csv);
});

// =============================================================================
// GET /api/reportes/:id/imprimir   (PROTEGIDO - REPORTES.IMPRIMIR)
// Genera PDF del reporte.
// =============================================================================
router.get('/:id/imprimir', async (req, res) => {
    const id = (req.params.id || '').toLowerCase();
    const meta = esAgrupado(id, req.query) ? METADATA_AGRUPADO[id] : METADATA[id];
    if (!meta) {
        return res.status(404).json({ ok: false, mensaje: 'Reporte no existe' });
    }

    const delReporte = await consultarReporte(id, req.query, req.auth ? req.auth.IdEmpresa : null);
    if (!delReporte.ok) {
        return res.status(delReporte.codigo).json(delReporte);
    }

    const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'portrait' });
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
        const yCab = doc.y + 4;
        doc.rect(30, yCab, anchoPagina, 18).fill('#2563eb');
        columnas.forEach((c, i) => {
            doc.fillColor('white').fontSize(7)
                .text(c, textoX(i) + 2, yCab + 6, { width: anchoCol - 4, ellipsis: true, lineBreak: false, height: 12 });
        });
        doc.y = yCab + 22;
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
        const valorEnFila = (i) => formatearCeldaPDF(columnas[i], fila[columnas[i]]);

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

        const yFila = doc.y;
        columnas.forEach((c, i) => {
            const altura = desplazamientos[i];
            const desplazamiento = (altoReal - altura) / 2;
            doc.text(valorEnFila(i), celdaX(i), yFila + desplazamiento, { width: anchoCol - 4, lineBreak: false });
        });
        doc.y = yFila + altoReal;

        // Línea separadora sutil
        doc.moveTo(30, doc.y - 2)
           .lineTo(doc.page.width - 30, doc.y - 2)
           .lineWidth(0.3)
           .strokeColor('#e5e7eb')
           .stroke();
    }

    // Pie de página: totales del reporte (ventas, compras, inventario, kardex)
    const totales = calcularTotales(id, delReporte.datos, req.query.agrupar);
    const totalesVisibles = totales
        .map(t => ({ t, idx: columnas.indexOf(t.columna) }))
        .filter(x => x.idx >= 0);

    if (totalesVisibles.length) {
        doc.moveDown(1);
        doc.moveTo(30, doc.y).lineTo(doc.page.width - 30, doc.y)
           .lineWidth(0.8).strokeColor('#2563eb').stroke();
        doc.moveDown(0.6);
        const yTot = doc.y;
        doc.fontSize(9).fillColor('#111827').text('TOTALES:', 32, yTot + 2, { lineBreak: false });
        totalesVisibles.forEach(x => {
            const valorF = x.t.esCop ? `$ ${formatoCOP(x.t.valor)}` : formatoCOP(x.t.valor);
            doc.fontSize(8).fillColor('#111827')
                .text(valorF, textoX(x.idx) + 2, yTot, { width: anchoCol - 4, align: 'left', lineBreak: false });
        });
        doc.y = yTot + 14;
        doc.moveDown(0.5);

        // Detalle consolidado para movimientos de caja
        if (id === 'cartera') {
            const totalesPorColumna = {};
            totalesVisibles.forEach(x => { totalesPorColumna[x.t.columna] = x.t.valor; });
            const consolidado = [
                `Ingresos: $ ${formatoCOP(totalesPorColumna.Ingresos || 0)}`,
                `Egresos: $ ${formatoCOP(totalesPorColumna.Egresos || 0)}`,
                `Saldo: $ ${formatoCOP(totalesPorColumna.Saldo || 0)}`
            ];
            doc.moveDown(0.5);
            doc.fontSize(9).fillColor('#111827')
                .text(consolidado.join('    |    '), 32, doc.y, { width: anchoPagina, align: 'center', lineBreak: false });
            doc.y += 12;
        }
    }

    // Fecha de generación al pie
    doc.moveDown(0.5);
    doc.fontSize(7).fillColor('#9ca3af')
        .text(`Generado el ${fechaGeneracion}`, 30, doc.y, { width: anchoPagina, align: 'center', lineBreak: false });
    doc.y += 10;

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
    const { desde, hasta, producto, estado, idProducto, agrupar } = query;
    const emp = IdEmpresa || query.idEmpresa || null;
    if (!emp) {
        return { ok: false, codigo: 400, mensaje: 'No se determinó la empresa para el reporte' };
    }

    // Validar que la empresa tenga contratado el módulo del que provienen los datos del reporte
    const moduloRequerido = REPORTES_MODULOS[id];
    if (moduloRequerido) {
        const tieneModulo = await verificarModuloContratado(emp, moduloRequerido);
        if (!tieneModulo) {
            return {
                ok: false,
                codigo: 403,
                mensaje: `El reporte de ${id} no está disponible: requiere el módulo ${moduloRequerido} que no está contratado en su plan`
            };
        }
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

            if (agrupar === '1') {
                // Ventas agrupadas por producto/servicio vendido.
                querySQL = `
                    SELECT
                        COALESCE(p.CodigoProducto, '') AS CodigoProducto,
                        COALESCE(p.NombreProducto, s.Nombre) AS Producto,
                        SUM(vd.Cantidad) AS Cantidad,
                        SUM(vd.PrecioUnitario * vd.Cantidad - vd.Descuento) AS Subtotal,
                        SUM(vd.Descuento) AS Descuento,
                        SUM(vd.Impuesto) AS Impuesto,
                        SUM(vd.Total) AS Total,
                        SUM(vd.Utilidad) AS Utilidad
                    FROM ventas_detalle vd
                    INNER JOIN ventas v ON v.IdVenta = vd.IdVenta AND v.IdEmpresa = vd.IdEmpresa
                    LEFT JOIN productos p  ON p.IdProducto = vd.IdProducto
                    LEFT JOIN servicios s ON s.IdServicio = vd.IdServicio
                    WHERE ${cond.join(' AND ')}
                    GROUP BY COALESCE(p.NombreProducto, s.Nombre), COALESCE(p.CodigoProducto, '')
                    ORDER BY COALESCE(p.NombreProducto, s.Nombre)`;
                params = p;
            } else {
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
            }
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

            if (agrupar === '1') {
                // Kárdex agrupado por producto: suma de entradas/salidas
                // y saldo final (último movimiento) por producto.
                querySQL = `
                    SELECT
                        pro.CodigoProducto,
                        pro.NombreProducto AS Producto,
                        SUM(t.EntradaCantidad) AS Entrada,
                        SUM(t.SalidaCantidad) AS Salida,
                        MAX(CASE WHEN t.ultimo = 1 THEN t.SaldoCantidad END) AS SaldoCantidad,
                        MAX(CASE WHEN t.ultimo = 1 THEN t.CostoPromedio END) AS CostoPromedio,
                        MAX(CASE WHEN t.ultimo = 1 THEN t.SaldoValor END) AS SaldoValor
                    FROM (
                        SELECT k.*,
                               ROW_NUMBER() OVER (
                                   PARTITION BY k.IdProducto
                                   ORDER BY k.Fecha DESC, k.IdKardex DESC
                               ) AS ultimo
                        FROM kardex k
                        WHERE ${cond.join(' AND ')}
                    ) t
                    INNER JOIN productos pro ON pro.IdProducto = t.IdProducto
                    GROUP BY pro.CodigoProducto, pro.NombreProducto, t.IdProducto
                    ORDER BY pro.NombreProducto`;
            } else {
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
            }
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
                    c.TipoDocumento, c.NumeroDocumentoProveedor,
                    c.Subtotal, c.Descuento, c.Impuesto, c.Total
                FROM compras c
                INNER JOIN proveedores p ON p.IdProveedor = c.IdProveedor
                LEFT JOIN bodegas b      ON b.Id = c.IdBodega
                WHERE ${cond.join(' AND ')}
                ORDER BY c.Fecha DESC, c.Numero DESC`;
            params = p;
        } else if (id === 'clientes') {
            const cond = ['c.IdEmpresa = ?'];
            const p = [emp];
            querySQL = `
                SELECT
                    CONCAT_WS(' ', c.PrimerNombre, c.SegundoNombre, c.PrimerApellido, c.SegundoApellido) AS Cliente,
                    CONCAT(c.TipoDocumento, ' ', c.NumeroDocumento) AS Documento,
                    c.Telefono, c.Correo,
                    COALESCE(cant.Mascotas, 0) AS Mascotas
                FROM clientes c
                LEFT JOIN (SELECT ClienteId, COUNT(*) AS Mascotas
                           FROM mascotas
                           WHERE IdEmpresa = ?
                           GROUP BY ClienteId) cant ON cant.ClienteId = c.ClienteId
                WHERE ${cond.join(' AND ')}
                ORDER BY Cliente`;
            params = [emp, emp];
        } else if (id === 'citas') {
            const cond = ['c.IdEmpresa = ?'];
            const p = [emp];
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
        } else if (id === 'cuentaspagar') {
            // Reporte de cuentas por pagar: SÓLO disponible en los planes
            // EMPRESARIAL y PROFESIONAL (no en BASICO).
            const [susc] = await pool.query(
                `SELECT p.CodigoPlan
                 FROM suscripciones s
                 INNER JOIN planes p ON p.IdPlan = s.IdPlan
                 WHERE s.IdEmpresa = ? AND s.Estado IN ('ACTIVA','PRUEBA')
                 ORDER BY s.IdSuscripcion DESC LIMIT 1`,
                [emp]
            );
            const codigoPlan = susc[0]?.CodigoPlan || null;
            if (codigoPlan !== 'EMPRESARIAL' && codigoPlan !== 'PROFESIONAL') {
                return {
                    ok: false,
                    codigo: 403,
                    mensaje: 'El reporte de cuentas por pagar solo está disponible en los planes Empresarial y Profesional'
                };
            }

            const cond = ['pc.IdEmpresa = ?', "pc.Estado = 'PENDIENTE'"];
            const p = [emp];
            const fProveedor = query.proveedor || query.idProveedor;
            if (fProveedor) { cond.push('c.IdProveedor = ?'); p.push(Number(fProveedor)); }
            querySQL = `
                SELECT
                    c.IdProveedor, pr.Nombre AS Proveedor, pr.Nit AS NitProveedor,
                    c.Numero AS NumeroCompra, DATE_FORMAT(c.Fecha, '%Y-%m-%d') AS Fecha,
                    pc.NumeroCuota AS Cuota,
                    DATE_FORMAT(pc.FechaVencimiento, '%Y-%m-%d') AS Vencimiento,
                    pc.ValorCuota, pc.SaldoPendiente, pc.Estado
                FROM pagos_compras pc
                INNER JOIN compras c ON c.IdCompra = pc.IdCompra AND c.IdEmpresa = pc.IdEmpresa
                INNER JOIN proveedores pr ON pr.IdProveedor = c.IdProveedor
                WHERE ${cond.join(' AND ')}
                ORDER BY pr.Nombre, c.Numero, pc.NumeroCuota`;
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