const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql.js');
const PDFDocument = require('pdfkit');
const { registrarAuditoria } = require('../../middleware/auditoria.js');

// =====================================================
// Ayudantes para generación del PDF de historia clínica
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
    doc.rect(30, y, 4, 14).fill('#2563eb');
    doc.fillColor('#2563eb').font('Helvetica-Bold').fontSize(9)
        .text(` ${titulo}`, 36, y + 1, { width: doc.page.width - 66, lineBreak: false });
    doc.moveTo(30, y + 18).lineTo(doc.page.width - 30, y + 18)
        .lineWidth(0.5).strokeColor('#2563eb').stroke();
    doc.y = y + 22;
    doc.fillColor('#111827').font('Helvetica');
}

// Dibuja "Etiqueta: valor" con ajuste de línea (un campo por fila).
function dibujarCampo(doc, etiqueta, valor, salto = 0.08) {
    const texto = valor !== null && valor !== undefined && String(valor).trim() !== '' ? String(valor) : '—';
    if (doc.y > doc.page.height - 60) doc.addPage();
    doc.moveDown(salto);
    doc.font('Helvetica-Bold').fontSize(8).fillColor('#4b5563');
    doc.text(`${etiqueta}: `, 36, doc.y, { continued: true, width: doc.page.width - 66, lineBreak: false });
    doc.font('Helvetica').fillColor('#111827')
        .text(texto, { width: doc.page.width - 66, lineBreak: true });
}

// Dibuja una tabla ligera. columnas: [{t, a}], filas: [[celda, ...]]
function dibujarTabla(doc, columnas, filas) {
    if (!filas || filas.length === 0) {
        doc.font('Helvetica-Oblique').fontSize(8).fillColor('#9ca3af')
            .text('Sin registros.', 36, doc.y, { width: 500 });
        doc.moveDown(0.3);
        doc.fillColor('#111827').font('Helvetica');
        return;
    }
    const margen = 36;
    const anchoTotal = doc.page.width - margen * 2;
    const totalPesos = columnas.reduce((s, c) => s + c.a, 0);
    const xs = [];
    let acc = margen;
    const anchos = columnas.map(c => (anchoTotal * c.a) / totalPesos);
    for (const a of anchos) { xs.push(acc); acc += a; }

    const y0 = doc.y;
    doc.rect(margen, y0, anchoTotal, 16).fill('#2563eb');
    doc.fillColor('white').font('Helvetica-Bold').fontSize(7);
    columnas.forEach((c, i) => {
        doc.text(c.t, xs[i] + 3, y0 + 5, { width: anchos[i] - 4, height: 12, ellipsis: true, lineBreak: false });
    });
    doc.y = y0 + 18;

    doc.fillColor('#111827').font('Helvetica').fontSize(7);
    for (const fila of filas) {
        const alturas = fila.map((cell, i) =>
            doc.heightOfString(String(cell ?? ''), { width: anchos[i] - 6 }));
        const alto = Math.max(15, ...alturas) + 6;
        if (doc.y + alto > doc.page.height - 60) { doc.addPage(); doc.fillColor('#111827').font('Helvetica').fontSize(7); }
        const base = doc.y;
        fila.forEach((cell, i) => {
            const altura = alturas[i];
            doc.text(String(cell ?? ''), xs[i] + 3, base + (alto - altura) / 2, { width: anchos[i] - 6, lineBreak: true });
        });
        doc.y = base + alto;
        doc.moveTo(margen, doc.y - 2).lineTo(doc.page.width - margen, doc.y - 2)
            .lineWidth(0.2).strokeColor('#e5e7eb').stroke();
    }
    doc.moveDown(0.2);
}

// ========================================
// LISTAR HISTORIAS CLINICAS
// ========================================
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                hc.*,
                m.Nombre AS NombreMascota,
                m.Especie,
                m.Raza,
                m.Sexo,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario
            FROM historiasclinicas hc
            INNER JOIN mascotas m ON hc.IdMascota = m.IdMascota
            INNER JOIN veterinarios v ON hc.IdVeterinario = v.IdVeterinario
            WHERE hc.IdEmpresa = ?
            ORDER BY hc.FechaAtencion DESC
        `, [req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar historias clínicas:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar historias clínicas', error: error.message });
    }
});

// ========================================
// LISTAR HISTORIAS CLINICAS POR MASCOTA
// ========================================
router.get('/mascota/:idMascota', async (req, res) => {
    try {
        const idMascota = Number(req.params.idMascota);
        const [rows] = await pool.query(`
            SELECT 
                hc.*,
                m.Nombre AS NombreMascota,
                m.Especie,
                m.Raza,
                m.Sexo,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario,
                v.TarjetaProfesional
            FROM historiasclinicas hc
            INNER JOIN mascotas m ON hc.IdMascota = m.IdMascota
            INNER JOIN veterinarios v ON hc.IdVeterinario = v.IdVeterinario
            WHERE hc.IdMascota = ? AND hc.IdEmpresa = ?
            ORDER BY hc.FechaAtencion DESC
        `, [idMascota, req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar historias clínicas por mascota:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar historias clínicas', error: error.message });
    }
});

// ========================================
// OBTENER HISTORIA CLINICA POR ID
// ========================================
router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [rows] = await pool.query(`
            SELECT 
                hc.*,
                m.Nombre AS NombreMascota,
                m.Especie,
                m.Raza,
                m.Sexo,
                m.FechaNacimiento,
                m.Peso,
                m.Color,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario,
                v.TarjetaProfesional,
                v.Especialidad,
                CONCAT(cl.PrimerNombre, ' ', cl.PrimerApellido) AS NombreCliente,
                cl.Telefono AS TelefonoCliente,
                cl.Correo AS CorreoCliente,
                cl.Direccion AS DireccionCliente
            FROM historiasclinicas hc
            INNER JOIN mascotas m ON hc.IdMascota = m.IdMascota
            INNER JOIN veterinarios v ON hc.IdVeterinario = v.IdVeterinario
            INNER JOIN clientes cl ON m.ClienteId = cl.ClienteId
            WHERE hc.IdHistoriaClinica = ? AND hc.IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        if (rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Historia clínica no encontrada' });
        }
        res.json({ ok: true, datos: rows[0] });
    } catch (error) {
        console.error('Error al obtener historia clínica:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener historia clínica', error: error.message });
    }
});

// ========================================
// GENERAR PDF DE HISTORIA CLINICA
// GET /api/historiasclinicas/:id/pdf
// ========================================
router.get('/:id/pdf', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const IdEmpresa = req.auth.IdEmpresa;

        const [hc] = await pool.query(`
            SELECT
                hc.*,
                m.Nombre AS NombreMascota,
                m.Especie, m.Raza, m.Sexo,
                m.FechaNacimiento, m.Peso, m.Color,
                CONCAT_WS(' ', v.PrimerNombre, v.SegundoNombre, v.PrimerApellido, v.SegundoApellido) AS NombreVeterinario,
                v.TarjetaProfesional, v.Especialidad,
                CONCAT_WS(' ', cl.PrimerNombre, cl.SegundoNombre, cl.PrimerApellido, cl.SegundoApellido) AS NombreCliente,
                cl.TipoDocumento, cl.NumeroDocumento,
                cl.Telefono AS TelefonoCliente,
                cl.Correo AS CorreoCliente,
                cl.Direccion AS DireccionCliente
            FROM historiasclinicas hc
            INNER JOIN mascotas m ON hc.IdMascota = m.IdMascota
            INNER JOIN veterinarios v ON hc.IdVeterinario = v.IdVeterinario
            INNER JOIN clientes cl ON m.ClienteId = cl.ClienteId
            WHERE hc.IdHistoriaClinica = ? AND hc.IdEmpresa = ?
        `, [id, IdEmpresa]);
        if (hc.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Historia clínica no encontrada' });
        }
        const h = hc[0];

        const [antecedentes] = await pool.query(
            `SELECT * FROM antecedentes WHERE IdMascota = ? AND IdEmpresa = ?`,
            [h.IdMascota, IdEmpresa]
        );
        const [signos] = await pool.query(
            `SELECT * FROM signosvitales WHERE IdHistoriaClinica = ? AND IdEmpresa = ?`,
            [id, IdEmpresa]
        );
        const [examen] = await pool.query(
            `SELECT * FROM examenfisico WHERE IdHistoriaClinica = ? AND IdEmpresa = ?`,
            [id, IdEmpresa]
        );
        const [diagnosticos] = await pool.query(
            `SELECT * FROM diagnosticos WHERE IdHistoriaClinica = ? AND IdEmpresa = ? ORDER BY IdDiagnostico ASC`,
            [id, IdEmpresa]
        );
        const [tratamientos] = await pool.query(
            `SELECT * FROM tratamientos WHERE IdHistoriaClinica = ? AND IdEmpresa = ? ORDER BY FechaInicio ASC`,
            [id, IdEmpresa]
        );
        const [recetas] = await pool.query(`
            SELECT r.*, CONCAT_WS(' ', v.PrimerNombre, v.PrimerApellido) AS NombreVeterinario, v.TarjetaProfesional
            FROM recetas r
            INNER JOIN veterinarios v ON r.IdVeterinario = v.IdVeterinario
            WHERE r.IdHistoriaClinica = ? AND r.IdEmpresa = ?
            ORDER BY r.Fecha DESC
        `, [id, IdEmpresa]);
        const detalleRecetas = {};
        for (const receta of recetas) {
            const [det] = await pool.query(
                `SELECT * FROM detallerecetas WHERE IdReceta = ? AND IdEmpresa = ? ORDER BY IdDetalleReceta ASC`,
                [receta.IdReceta, IdEmpresa]
            );
            detalleRecetas[receta.IdReceta] = det;
        }
        const [procedimientos] = await pool.query(`
            SELECT p.*, s.Nombre AS NombreServicio
            FROM procedimientos p
            LEFT JOIN servicios s ON p.IdServicio = s.IdServicio
            WHERE p.IdHistoriaClinica = ? AND p.IdEmpresa = ?
            ORDER BY p.Fecha ASC
        `, [id, IdEmpresa]);
        const [cirugias] = await pool.query(`
            SELECT ci.*, CONCAT_WS(' ', v.PrimerNombre, v.PrimerApellido) AS NombreVeterinario
            FROM cirugias ci
            INNER JOIN veterinarios v ON ci.IdVeterinario = v.IdVeterinario
            WHERE ci.IdHistoriaClinica = ? AND ci.IdEmpresa = ?
            ORDER BY ci.FechaCirugia ASC
        `, [id, IdEmpresa]);
        const [controles] = await pool.query(`
            SELECT con.*, CONCAT_WS(' ', v.PrimerNombre, v.PrimerApellido) AS NombreVeterinario
            FROM controles con
            INNER JOIN veterinarios v ON con.IdVeterinario = v.IdVeterinario
            WHERE con.IdHistoriaClinica = ? AND con.IdEmpresa = ?
            ORDER BY con.FechaControl ASC
        `, [id, IdEmpresa]);

        let nombreEmpresa = 'BissVet';
        const [emp] = await pool.query(
            `SELECT NombreComercial FROM empresas WHERE IdEmpresa = ?`,
            [IdEmpresa]
        );
        if (emp.length && emp[0].NombreComercial) nombreEmpresa = emp[0].NombreComercial;

        const sv = signos[0] || {};
        const ef = examen[0] || {};
        const ant = antecedentes[0] || {};

        const doc = new PDFDocument({ margin: 30, size: 'A4', layout: 'portrait' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename="historia_clinica_${id}.pdf"`);
        doc.pipe(res);

        // Encabezado general
        doc.font('Helvetica-Bold').fontSize(14).fillColor('#111827')
            .text(nombreEmpresa, { align: 'center' });
        doc.fontSize(11).fillColor('#2563eb')
            .text('HISTORIA CLÍNICA VETERINARIA', { align: 'center' });
        doc.fontSize(8).fillColor('#6b7280')
            .text(`N° ${id} · Atendido el ${formatearFechaHora(h.FechaAtencion)} · Estado: ${h.Estado || ''}`, { align: 'center' });
        doc.moveDown(0.6);

        // Información del paciente
        dibujarSeccion(doc, 'INFORMACIÓN DEL PACIENTE');
        dibujarCampo(doc, 'Paciente', h.NombreMascota);
        dibujarCampo(doc, 'Especie / Raza / Sexo', ` ${h.Especie || ''} / ${h.Raza || ''} / ${h.Sexo || ''}`);
        dibujarCampo(doc, 'Edad', calcularEdad(h.FechaNacimiento));
        dibujarCampo(doc, 'Peso', h.Peso !== null && h.Peso !== undefined ? `${h.Peso} kg` : '');
        dibujarCampo(doc, 'Color', h.Color);
        dibujarCampo(doc, 'Propietario', h.NombreCliente);
        dibujarCampo(doc, 'Documento propietario', h.TipoDocumento && h.NumeroDocumento ? `${h.TipoDocumento} ${h.NumeroDocumento}` : '');
        dibujarCampo(doc, 'Teléfono / Correo', h.TelefonoCliente && h.CorreoCliente ? `${h.TelefonoCliente} · ${h.CorreoCliente}` : `${h.TelefonoCliente || h.CorreoCliente || ''}`);
        dibujarCampo(doc, 'Dirección', h.DireccionCliente);

        // Atención
        dibujarSeccion(doc, 'ATENCIÓN');
        dibujarCampo(doc, 'Veterinario', [h.NombreVeterinario, h.TarjetaProfesional ? `TP: ${h.TarjetaProfesional}` : null, h.Especialidad].filter(Boolean).join(' · '));
        dibujarCampo(doc, 'Motivo de consulta', h.MotivoConsulta);
        dibujarCampo(doc, 'Enfermedad actual', h.EnfermedadActual);
        dibujarCampo(doc, 'Observaciones', h.Observaciones);

        // Antecedentes
        dibujarSeccion(doc, 'ANTECEDENTES');
        dibujarCampo(doc, 'Enfermedades anteriores', ant.EnfermedadesAnteriores);
        dibujarCampo(doc, 'Cirugías anteriores', ant.CirugiasAnteriores);
        dibujarCampo(doc, 'Alergias', ant.Alergias);
        dibujarCampo(doc, 'Vacunación', ant.Vacunacion);
        dibujarCampo(doc, 'Desparasitación', ant.Desparasitacion);
        dibujarCampo(doc, 'Medicamentos actuales', ant.MedicamentosActuales);
        dibujarCampo(doc, 'Tratamientos anteriores', ant.TratamientosAnteriores);
        dibujarCampo(doc, 'Antecedentes hereditarios', ant.AntecedentesHereditarios);
        dibujarCampo(doc, 'Alimentación', ant.Alimentacion);
        dibujarCampo(doc, 'Hábitos', ant.Habitos);
        dibujarCampo(doc, 'Observaciones', ant.Observaciones);

        // Signos vitales
        dibujarSeccion(doc, 'SIGNOS VITALES');
        dibujarCampo(doc, 'Peso', sv.Peso !== null && sv.Peso !== undefined ? `${sv.Peso} kg` : '');
        dibujarCampo(doc, 'Temperatura', sv.Temperatura !== null && sv.Temperatura !== undefined ? `${sv.Temperatura} °C` : '');
        dibujarCampo(doc, 'Frecuencia cardíaca', sv.FrecuenciaCardiaca !== null && sv.FrecuenciaCardiaca !== undefined ? `${sv.FrecuenciaCardiaca} lpm` : '');
        dibujarCampo(doc, 'Frecuencia respiratoria', sv.FrecuenciaRespiratoria !== null && sv.FrecuenciaRespiratoria !== undefined ? `${sv.FrecuenciaRespiratoria} rpm` : '');
        dibujarCampo(doc, 'Estado de hidratación', sv.EstadoHidratacion);
        dibujarCampo(doc, 'Condición corporal', sv.CondicionCorporal);
        dibujarCampo(doc, 'Mucosas', sv.Mucosas);
        dibujarCampo(doc, 'Tiempo llenado capilar', sv.TiempoLlenadoCapilar !== null && sv.TiempoLlenadoCapilar !== undefined ? `${sv.TiempoLlenadoCapilar} s` : '');
        dibujarCampo(doc, 'Observaciones', sv.Observaciones);

        // Examen físico (solo campos con valor)
        dibujarSeccion(doc, 'EXAMEN FÍSICO POR SISTEMAS');
        const camposExamen = [
            ['Estado general', ef.EstadoGeneral], ['Cabeza', ef.Cabeza], ['Ojos', ef.Ojos],
            ['Oídos', ef.Oidos], ['Nariz', ef.Nariz], ['Boca', ef.Boca], ['Cuello', ef.Cuello],
            ['Sistema respiratorio', ef.SistemaRespiratorio], ['Sistema cardiovascular', ef.SistemaCardiovascular],
            ['Abdomen', ef.Abdomen], ['Sistema digestivo', ef.SistemaDigestivo],
            ['Sistema urinario', ef.SistemaUrinario], ['Sistema reproductivo', ef.SistemaReproductivo],
            ['Sistema musculoesquelético', ef.SistemaMusculoesqueletico], ['Piel y pelaje', ef.PielYPelaje],
            ['Sistema neurológico', ef.SistemaNeurologico], ['Ganglios', ef.Ganglios],
            ['Otros hallazgos', ef.OtrosHallazgos], ['Observaciones generales', ef.ObservacionesGenerales]
        ];
        let algunoEf = false;
        for (const [etiqueta, valor] of camposExamen) {
            if (valor !== null && valor !== undefined && String(valor).trim() !== '') {
                dibujarCampo(doc, etiqueta, valor);
                algunoEf = true;
            }
        }
        if (!algunoEf) {
            doc.font('Helvetica-Oblique').fontSize(8).fillColor('#9ca3af')
                .text('Sin registros de examen físico.', 36, doc.y, { width: 500 });
            doc.moveDown(0.3);
            doc.fillColor('#111827').font('Helvetica');
        }

        // Diagnósticos
        dibujarSeccion(doc, 'DIAGNÓSTICOS');
        dibujarTabla(doc,
            [{ t: 'Código', a: 2 }, { t: 'Diagnóstico', a: 5 }, { t: 'Tipo', a: 3 }, { t: 'Observaciones', a: 5 }],
            diagnosticos.map(d => [d.CodigoDiagnostico || '', d.Diagnostico || '', d.TipoDiagnostico || '', d.Observaciones || ''])
        );

        // Tratamientos
        dibujarSeccion(doc, 'TRATAMIENTOS');
        dibujarTabla(doc,
            [{ t: 'Tratamiento', a: 4 }, { t: 'Inicio', a: 2 }, { t: 'Fin', a: 2 }, { t: 'Estado', a: 2 }, { t: 'Indicaciones', a: 4 }],
            tratamientos.map(t => [
                t.NombreTratamiento || '',
                formatearFecha(t.FechaInicio),
                formatearFecha(t.FechaFin),
                t.Estado || '',
                t.Indicaciones || ''
            ])
        );

        // Recetas
        dibujarSeccion(doc, 'RECETAS');
        if (!recetas.length) {
            doc.font('Helvetica-Oblique').fontSize(8).fillColor('#9ca3af')
                .text('Sin recetas registradas.', 36, doc.y, { width: 500 });
            doc.moveDown(0.3);
            doc.fillColor('#111827').font('Helvetica');
        }
        for (const receta of recetas) {
            dibujarCampo(doc, 'Receta', `${formatearFecha(receta.Fecha)} · ${receta.NombreVeterinario || ''} · Estado: ${receta.Estado || ''}`, 0.2);
            if (receta.Observaciones) dibujarCampo(doc, 'Observaciones', receta.Observaciones);
            if (receta.IndicacionesGenerales) dibujarCampo(doc, 'Indicaciones generales', receta.IndicacionesGenerales);
            dibujarTabla(doc,
                [{ t: 'Medicamento', a: 4 }, { t: 'Concentración', a: 2 }, { t: 'Dosis', a: 2 },
                 { t: 'Frecuencia / Vía', a: 3 }, { t: 'Duración / Cant.', a: 2 }, { t: 'Indicaciones', a: 4 }],
                (detalleRecetas[receta.IdReceta] || []).map(det => [
                    [det.Medicamento, det.FormaFarmaceutica].filter(Boolean).join(' · '),
                    det.Concentracion || '',
                    [det.Dosis, det.UnidadDosis].filter(Boolean).join(' '),
                    [det.Frecuencia, det.ViaAdministracion].filter(Boolean).join(' · '),
                    [det.Duracion, det.Cantidad !== null && det.Cantidad !== undefined ? `Cant: ${det.Cantidad}` : null].filter(Boolean).join(' · '),
                    det.Indicaciones || ''
                ])
            );
        }

        // Procedimientos
        dibujarSeccion(doc, 'PROCEDIMIENTOS');
        dibujarTabla(doc,
            [{ t: 'Fecha', a: 2 }, { t: 'Procedimiento', a: 4 }, { t: 'Servicio', a: 3 }, { t: 'Resultado', a: 4 }],
            procedimientos.map(p => [
                formatearFecha(p.Fecha),
                p.NombreProcedimiento || '',
                p.NombreServicio || '',
                p.Resultado || ''
            ])
        );

        // Cirugías
        dibujarSeccion(doc, 'CIRUGÍAS');
        dibujarTabla(doc,
            [{ t: 'Fecha', a: 2 }, { t: 'Tipo de cirugía', a: 4 }, { t: 'Motivo', a: 4 }, { t: 'Estado', a: 2 }],
            cirugias.map(c => [
                formatearFecha(c.FechaCirugia || c.FechaProgramacion),
                c.TipoCirugia || '',
                c.Motivo || '',
                c.Estado || ''
            ])
        );

        // Controles
        dibujarSeccion(doc, 'CONTROLES / EVOLUCIÓN');
        dibujarTabla(doc,
            [{ t: 'Fecha', a: 2 }, { t: 'Motivo', a: 4 }, { t: 'Evolución', a: 5 }, { t: 'Recomendaciones', a: 4 }],
            controles.map(c => [
                formatearFechaHora(c.FechaControl),
                c.Motivo || '',
                c.Evolucion || '',
                c.Recomendaciones || ''
            ])
        );

        // Firma veterinario
        doc.moveDown(2);
        if (doc.y + 90 > doc.page.height) { doc.addPage(); }
        doc.moveTo(60, doc.y).lineTo(doc.page.width - 60, doc.y)
            .lineWidth(0.8).strokeColor('#111827').stroke();
        doc.moveDown(0.8);
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#111827')
            .text(String(h.NombreVeterinario || ''), 60, doc.y, { width: doc.page.width - 120 });
        doc.font('Helvetica').fontSize(8).fillColor('#6b7280')
            .text(h.TarjetaProfesional ? `Tarjeta profesional: ${h.TarjetaProfesional}` : '', { width: doc.page.width - 120 });
        doc.moveDown(0.8);
        doc.fontSize(7).fillColor('#9ca3af')
            .text(`Documento generado el ${formatearFechaHora(new Date())} por ${nombreEmpresa}.`, 60, doc.y, { width: doc.page.width - 120 });

        await registrarAuditoria({
            IdEmpresa,
            UsuarioId: req.auth.UsuarioId || null,
            Tabla: 'historiasclinicas',
            RegistroId: id,
            Accion: 'EXPORTAR',
            DireccionIP: obtenerIP(req),
            DatosNuevos: { formato: 'pdf' },
            Descripcion: `Generación de PDF de historia clínica ${id}`
        });

        doc.end();
    } catch (error) {
        console.error('Error generando PDF de historia clínica:', error);
        if (!res.headersSent) {
            res.status(500).json({ ok: false, mensaje: 'Error generando PDF', error: error.message });
        } else {
            res.end();
        }
    }
});

// ========================================
// CREAR HISTORIA CLINICA
// ========================================
router.post('/', async (req, res) => {
    try {
        const {
            IdCita,
            IdMascota,
            IdVeterinario,
            FechaAtencion,
            MotivoConsulta,
            EnfermedadActual,
            Observaciones,
            Estado,
            UsuarioIdCreacion
        } = req.body;

        if (!IdMascota || !IdVeterinario || !MotivoConsulta) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Los campos IdMascota, IdVeterinario y MotivoConsulta son obligatorios'
            });
        }

        const [result] = await pool.query(`
            INSERT INTO historiasclinicas (
                IdCita, IdMascota, IdVeterinario, FechaAtencion,
                MotivoConsulta, EnfermedadActual, Observaciones, Estado,
                FechaCreacion, UsuarioIdCreacion,
                IdEmpresa
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
        `, [
            IdCita || null,
            IdMascota,
            IdVeterinario,
            FechaAtencion || new Date(),
            MotivoConsulta,
            EnfermedadActual || null,
            Observaciones || null,
            Estado || 'Abierta',
            req.auth.UsuarioId,
            req.auth.IdEmpresa
        ]);

        if (IdCita) {
            await pool.query(`UPDATE citas SET Estado = 'Atendida' WHERE IdCita = ? AND IdEmpresa = ?`, [IdCita, req.auth.IdEmpresa]);
        }

        res.status(201).json({
            ok: true,
            mensaje: 'Historia clínica creada correctamente',
            IdHistoriaClinica: result.insertId
        });
    } catch (error) {
        console.error('Error al crear historia clínica:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al crear historia clínica', error: error.message });
    }
});

// ========================================
// ACTUALIZAR HISTORIA CLINICA
// ========================================
router.put('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const {
            IdCita,
            IdMascota,
            IdVeterinario,
            FechaAtencion,
            MotivoConsulta,
            EnfermedadActual,
            Observaciones,
            Estado,
            UsuarioIdModificacion
        } = req.body;

        const [result] = await pool.query(`
            UPDATE historiasclinicas SET
                IdCita = ?,
                IdMascota = ?,
                IdVeterinario = ?,
                FechaAtencion = ?,
                MotivoConsulta = ?,
                EnfermedadActual = ?,
                Observaciones = ?,
                Estado = ?,
                FechaModificacion = NOW(),
                UsuarioIdModificacion = ?
            WHERE IdHistoriaClinica = ? AND IdEmpresa = ?
        `, [
            IdCita || null,
            IdMascota,
            IdVeterinario,
            FechaAtencion,
            MotivoConsulta,
            EnfermedadActual || null,
            Observaciones || null,
            Estado,
            req.auth.UsuarioId,
            id,
            req.auth.IdEmpresa
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Historia clínica no encontrada' });
        }
        res.json({ ok: true, mensaje: 'Historia clínica actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar historia clínica:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al actualizar historia clínica', error: error.message });
    }
});

// ========================================
// CERRAR HISTORIA CLINICA
// ========================================
router.put('/:id/cerrar', async (req, res) => {
    try {
        const id = Number(req.params.id);

        const [result] = await pool.query(`
            UPDATE historiasclinicas SET
                Estado = 'Cerrada',
                FechaModificacion = NOW(),
                UsuarioIdModificacion = ?
            WHERE IdHistoriaClinica = ? AND IdEmpresa = ?
        `, [req.auth.UsuarioId, id, req.auth.IdEmpresa]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Historia clínica no encontrada' });
        }
        res.json({ ok: true, mensaje: 'Historia clínica cerrada correctamente' });
    } catch (error) {
        console.error('Error al cerrar historia clínica:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al cerrar historia clínica', error: error.message });
    }
});

module.exports = router;
