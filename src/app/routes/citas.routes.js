const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql.js');
const PDFDocument = require('pdfkit');
const { registrarAuditoria } = require('../../middleware/auditoria.js');

// =====================================================
// Ayudantes para generación del PDF de citas
// =====================================================

function obtenerIP(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim()
        || req.socket?.remoteAddress
        || req.ip
        || null;
}

function formatearFecha(v) {
    if (!v) return '';
    const s = String(v).slice(0, 10);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? `${m[3]}/${m[2]}/${m[1]}` : s;
}

function formatearFechaHora(v) {
    if (!v) return '';
    const s = String(v);
    const m = s.match(/^(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})/);
    if (m) return `${m[3]}/${m[2]}/${m[1]} ${m[4]}:${m[5]}`;
    return formatearFecha(s);
}

function calcularEdad(fechaNacimiento) {
    if (!fechaNacimiento) return '';
    const nac = new Date(String(fechaNacimiento).slice(0, 10));
    if (isNaN(nac.getTime())) return '';
    const hoy = new Date();
    let anos = hoy.getFullYear() - nac.getFullYear();
    let meses = hoy.getMonth() - nac.getMonth();
    if (meses < 0) { anos--; meses += 12; }
    if (anos > 0) return `${anos} año(s) ${meses} mes(es)`;
    return `${meses} mes(es)`;
}

function dibujarSeccion(doc, titulo) {
    doc.moveDown(0.6);
    if (doc.y > doc.page.height - 70) doc.addPage();
    const y = doc.y;
    doc.rect(30, y, 4, 14).fill('#174a32');
    doc.fillColor('#174a32').font('Helvetica-Bold').fontSize(9)
        .text(` ${titulo}`, 36, y + 1, { width: doc.page.width - 66, lineBreak: false });
    doc.moveTo(30, y + 18).lineTo(doc.page.width - 30, y + 18)
        .lineWidth(0.5).strokeColor('#174a32').stroke();
    doc.y = y + 22;
    doc.fillColor('#111827').font('Helvetica');
}

function dibujarCampo(doc, etiqueta, valor, salto = 0.08) {
    const texto = valor !== null && valor !== undefined && String(valor).trim() !== '' ? String(valor) : '—';
    if (doc.y > doc.page.height - 60) doc.addPage();
    doc.moveDown(salto);
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#4b5563');
    doc.text(`${etiqueta}: `, 36, doc.y, { continued: true, width: doc.page.width - 66, lineBreak: false });
    doc.font('Helvetica').fillColor('#111827')
        .text(texto, { width: doc.page.width - 66, lineBreak: true });
}

// ========================================
// GENERAR PDF COMPROBANTE DE CITA
// GET /api/citas/:id/pdf
// ========================================
router.get('/:id/pdf', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const IdEmpresa = req.auth.IdEmpresa;

        const [rows] = await pool.query(`
            SELECT 
                c.*,
                m.Nombre AS NombreMascota,
                m.Especie, m.Raza, m.Sexo,
                m.FechaNacimiento,
                CONCAT_WS(' ', v.PrimerNombre, v.SegundoNombre, v.PrimerApellido, v.SegundoApellido) AS NombreVeterinario,
                v.TarjetaProfesional, v.Especialidad,
                s.Nombre AS NombreServicio,
                CONCAT_WS(' ', cl.PrimerNombre, cl.SegundoNombre, cl.PrimerApellido, cl.SegundoApellido) AS NombreCliente,
                cl.TipoDocumento, cl.NumeroDocumento,
                cl.Telefono AS TelefonoCliente,
                cl.Correo AS CorreoCliente,
                cl.Direccion AS DireccionCliente
            FROM citas c
            INNER JOIN mascotas m ON c.IdMascota = m.IdMascota
            INNER JOIN veterinarios v ON c.IdVeterinario = v.IdVeterinario
            INNER JOIN servicios s ON c.IdServicio = s.IdServicio
            INNER JOIN clientes cl ON m.ClienteId = cl.ClienteId
            WHERE c.IdCita = ? AND c.IdEmpresa = ?
        `, [id, IdEmpresa]);

        if (rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada' });
        }
        const c = rows[0];

        let empresa = {};
        const [emp] = await pool.query(`
            SELECT NombreComercial, RazonSocial, Nit, Direccion, Telefono, Correo
            FROM empresas WHERE IdEmpresa = ?
        `, [IdEmpresa]);
        if (emp.length) empresa = emp[0];

        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'portrait' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="comprobante_cita_${id}.pdf"`);
        doc.pipe(res);

        // Encabezado general
        const nombreEmpresa = empresa.NombreComercial || empresa.RazonSocial || 'BissVet';
        doc.font('Helvetica-Bold').fontSize(15).fillColor('#111827')
            .text(nombreEmpresa, { align: 'center' });
        doc.fontSize(11).fillColor('#174a32')
            .text('COMPROBANTE DE CITA VETERINARIA', { align: 'center' });
        doc.fontSize(8).fillColor('#6b7280')
            .text(`N° ${id} · ${formatearFecha(c.FechaCita)} · ${c.HoraCita || ''} · Estado: ${c.Estado || ''}`, { align: 'center' });
        if (empresa.Direccion || empresa.Telefono || empresa.Correo) {
            doc.fontSize(7).fillColor('#9ca3af')
                .text([empresa.Direccion, empresa.Telefono, empresa.Correo].filter(Boolean).join('  |  '), { align: 'center' });
        }
        doc.moveDown(0.8);

        // Cliente
        dibujarSeccion(doc, 'INFORMACIÓN DEL CLIENTE');
        dibujarCampo(doc, 'Cliente', c.NombreCliente);
        dibujarCampo(doc, 'Documento', `${c.TipoDocumento || ''} ${c.NumeroDocumento || ''}`.trim());
        dibujarCampo(doc, 'Teléfono', c.TelefonoCliente);
        dibujarCampo(doc, 'Correo', c.CorreoCliente);

        // Paciente
        dibujarSeccion(doc, 'INFORMACIÓN DEL PACIENTE');
        dibujarCampo(doc, 'Mascota', c.NombreMascota);
        dibujarCampo(doc, 'Especie / Raza / Sexo', `${c.Especie || ''} / ${c.Raza || ''} / ${c.Sexo || ''}`);
        dibujarCampo(doc, 'Edad', calcularEdad(c.FechaNacimiento));

        // Cita
        dibujarSeccion(doc, 'DETALLE DE LA CITA');
        dibujarCampo(doc, 'Fecha', formatearFecha(c.FechaCita));
        dibujarCampo(doc, 'Hora', c.HoraCita || '');
        dibujarCampo(doc, 'Servicio', c.NombreServicio);
        dibujarCampo(doc, 'Veterinario', `${c.NombreVeterinario || ''}${c.TarjetaProfesional ? ' · TP ' + c.TarjetaProfesional : ''}`);
        dibujarCampo(doc, 'Precio', c.Precio != null ? `$${Number(c.Precio).toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 })}` : '');
        dibujarCampo(doc, 'Motivo de consulta', c.MotivoConsulta);
        dibujarCampo(doc, 'Observaciones', c.Observaciones);
        dibujarCampo(doc, 'Estado', c.Estado);

        // Nota para el cliente
        doc.moveDown(1);
        doc.rect(30, doc.y, doc.page.width - 60, 1).fill('#e5e7eb');
        doc.moveDown(0.6);
        doc.font('Helvetica-Oblique').fontSize(8).fillColor('#6b7280')
            .text(
                'Le recordamos llegar con 10 minutos de anticipación. ' +
                'Si no puede asistir, por favor cancele o reprograme la cita con tiempo.',
                36, doc.y, { width: doc.page.width - 66 }
            );

        doc.moveDown(0.8);
        doc.font('Helvetica').fontSize(7).fillColor('#9ca3af')
            .text(`Documento generado el ${formatearFechaHora(new Date())} por ${nombreEmpresa}.`, 60, doc.y, { width: doc.page.width - 120 });

        await registrarAuditoria({
            UsuarioId: (req.auth && req.auth.UsuarioId) || null,
            IdEmpresa: IdEmpresa,
            Modulo: 'CITAS',
            Accion: 'EXPORTAR',
            Descripcion: `PDF de cita #${id}`,
            DireccionIP: obtenerIP(req)
        });

        doc.end();
    } catch (error) {
        console.error('Error al generar PDF de cita:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, mensaje: 'Error al generar el PDF de la cita', error: error.message });
        }
    }
});

// ========================================
// LISTAR CITAS
// ========================================
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                c.*,
                m.Nombre AS NombreMascota,
                m.Especie,
                m.Raza,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario,
                s.Nombre AS NombreServicio,
                s.Precio,
                s.IdCategoriaServicio
            FROM citas c
            INNER JOIN mascotas m ON c.IdMascota = m.IdMascota
            INNER JOIN veterinarios v ON c.IdVeterinario = v.IdVeterinario
            INNER JOIN servicios s ON c.IdServicio = s.IdServicio
            WHERE c.IdEmpresa = ?
            ORDER BY c.FechaCita DESC, c.HoraCita DESC
        `, [req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar citas:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar citas', error: error.message });
    }
});

// ========================================
// OBTENER CITA POR ID
// ========================================
router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [rows] = await pool.query(`
            SELECT 
                c.*,
                m.Nombre AS NombreMascota,
                m.Especie,
                m.Raza,
                m.Sexo,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario,
                v.TarjetaProfesional,
                v.Especialidad,
                s.Nombre AS NombreServicio,
                s.Precio,
                CONCAT(cl.PrimerNombre, ' ', cl.PrimerApellido) AS NombreCliente,
                cl.Telefono AS TelefonoCliente
            FROM citas c
            INNER JOIN mascotas m ON c.IdMascota = m.IdMascota
            INNER JOIN veterinarios v ON c.IdVeterinario = v.IdVeterinario
            INNER JOIN servicios s ON c.IdServicio = s.IdServicio
            INNER JOIN clientes cl ON m.ClienteId = cl.ClienteId
            WHERE c.IdCita = ? AND c.IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        if (rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada' });
        }
        res.json({ ok: true, datos: rows[0] });
    } catch (error) {
        console.error('Error al obtener cita:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener cita', error: error.message });
    }
});

// ========================================
// CREAR CITA
// ========================================
router.post('/', async (req, res) => {
    try {
        const {
            IdMascota,
            IdVeterinario,
            IdServicio,
            FechaCita,
            HoraCita,
            Estado,
            MotivoConsulta,
            Observaciones,
            Precio,
            UsuarioIdVeterinario,
            UsuarioIdCreacion
        } = req.body;

        if (!IdMascota || !IdVeterinario || !IdServicio || !FechaCita || !HoraCita) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Los campos IdMascota, IdVeterinario, IdServicio, FechaCita y HoraCita son obligatorios'
            });
        }

        const [result] = await pool.query(`
            INSERT INTO citas (
                IdMascota, IdVeterinario, IdServicio, FechaCita, HoraCita,
                Estado, MotivoConsulta, Observaciones, Precio,
                UsuarioIdVeterinario, FechaCreacion, UsuarioIdCreacion,
                IdEmpresa
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
        `, [
            IdMascota,
            IdVeterinario,
            IdServicio,
            FechaCita,
            HoraCita,
            Estado || 'Pendiente',
            MotivoConsulta || null,
            Observaciones || null,
            Precio ?? 0,
            UsuarioIdVeterinario || null,
            req.auth.UsuarioId,
            req.auth.IdEmpresa
        ]);

        res.status(201).json({
            ok: true,
            mensaje: 'Cita creada correctamente',
            IdCita: result.insertId
        });
    } catch (error) {
        console.error('Error al crear cita:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al crear cita', error: error.message });
    }
});

// ========================================
// ACTUALIZAR CITA
// ========================================
router.put('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const {
            IdMascota,
            IdVeterinario,
            IdServicio,
            FechaCita,
            HoraCita,
            Estado,
            MotivoConsulta,
            Observaciones,
            Precio,
            UsuarioIdModificacion
        } = req.body;

        const [result] = await pool.query(`
            UPDATE citas SET
                IdMascota = ?,
                IdVeterinario = ?,
                IdServicio = ?,
                FechaCita = ?,
                HoraCita = ?,
                Estado = ?,
                MotivoConsulta = ?,
                Observaciones = ?,
                Precio = ?,
                FechaModificacion = NOW(),
                UsuarioIdModificacion = ?
            WHERE IdCita = ? AND IdEmpresa = ?
        `, [
            IdMascota,
            IdVeterinario,
            IdServicio,
            FechaCita,
            HoraCita,
            Estado,
            MotivoConsulta || null,
            Observaciones || null,
            Precio ?? 0,
            req.auth.UsuarioId,
            id,
            req.auth.IdEmpresa
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada' });
        }
        res.json({ ok: true, mensaje: 'Cita actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar cita:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al actualizar cita', error: error.message });
    }
});

// ========================================
// ELIMINAR CITA (soft delete)
// ========================================
router.delete('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [result] = await pool.query(`
            UPDATE citas SET
                Estado = 'Cancelada',
                FechaModificacion = NOW()
            WHERE IdCita = ? AND IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada' });
        }
        res.json({ ok: true, mensaje: 'Cita cancelada correctamente' });
    } catch (error) {
        console.error('Error al cancelar cita:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al cancelar cita', error: error.message });
    }
});

// ========================================
// LISTAR CITAS POR MASCOTA
// ========================================
router.get('/mascota/:idMascota', async (req, res) => {
    try {
        const idMascota = Number(req.params.idMascota);
        const [rows] = await pool.query(`
            SELECT 
                c.*,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario,
                s.Nombre AS NombreServicio
            FROM citas c
            INNER JOIN veterinarios v ON c.IdVeterinario = v.IdVeterinario
            INNER JOIN servicios s ON c.IdServicio = s.IdServicio
            WHERE c.IdMascota = ? AND c.IdEmpresa = ?
            ORDER BY c.FechaCita DESC, c.HoraCita DESC
        `, [idMascota, req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar citas por mascota:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar citas', error: error.message });
    }
});

// ========================================
// LISTAR CITAS POR FECHA
// ========================================
router.get('/fecha/:fecha', async (req, res) => {
    try {
        const fecha = req.params.fecha;
        const [rows] = await pool.query(`
            SELECT 
                c.*,
                m.Nombre AS NombreMascota,
                m.Especie,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario,
                s.Nombre AS NombreServicio
            FROM citas c
            INNER JOIN mascotas m ON c.IdMascota = m.IdMascota
            INNER JOIN veterinarios v ON c.IdVeterinario = v.IdVeterinario
            INNER JOIN servicios s ON c.IdServicio = s.IdServicio
            WHERE c.FechaCita = ? AND c.IdEmpresa = ?
            ORDER BY c.HoraCita ASC
        `, [fecha, req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar citas por fecha:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar citas', error: error.message });
    }
});

// ========================================
// LISTAR CITAS POR VETERINARIO
// ========================================
router.get('/veterinario/:idVeterinario', async (req, res) => {
    try {
        const idVeterinario = Number(req.params.idVeterinario);
        const [rows] = await pool.query(`
            SELECT 
                c.*,
                m.Nombre AS NombreMascota,
                m.Especie,
                s.Nombre AS NombreServicio
            FROM citas c
            INNER JOIN mascotas m ON c.IdMascota = m.IdMascota
            INNER JOIN servicios s ON c.IdServicio = s.IdServicio
            WHERE c.IdVeterinario = ? AND c.IdEmpresa = ?
            ORDER BY c.FechaCita DESC, c.HoraCita DESC
        `, [idVeterinario, req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar citas por veterinario:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar citas', error: error.message });
    }
});

module.exports = router;
