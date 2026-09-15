const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql.js');

// ========================================
// LISTAR CIRUGIAS
// ========================================
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                ci.*,
                m.Nombre AS NombreMascota,
                m.Especie,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario
            FROM cirugias ci
            INNER JOIN mascotas m ON ci.IdMascota = m.IdMascota
            INNER JOIN veterinarios v ON ci.IdVeterinario = v.IdVeterinario
            WHERE ci.IdEmpresa = ?
            ORDER BY ci.FechaProgramacion DESC
        `, [req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar cirugías:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar cirugías', error: error.message });
    }
});

// ========================================
// LISTAR CIRUGIAS POR MASCOTA
// ========================================
router.get('/mascota/:idMascota', async (req, res) => {
    try {
        const idMascota = Number(req.params.idMascota);
        const [rows] = await pool.query(`
            SELECT 
                ci.*,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario
            FROM cirugias ci
            INNER JOIN veterinarios v ON ci.IdVeterinario = v.IdVeterinario
            WHERE ci.IdMascota = ? AND ci.IdEmpresa = ?
            ORDER BY ci.FechaProgramacion DESC
        `, [idMascota, req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar cirugías por mascota:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar cirugías', error: error.message });
    }
});

// ========================================
// LISTAR CIRUGIAS POR HISTORIA CLINICA
// ========================================
router.get('/historia/:idHistoriaClinica', async (req, res) => {
    try {
        const idHistoriaClinica = Number(req.params.idHistoriaClinica);
        const [rows] = await pool.query(`
            SELECT * FROM cirugias
            WHERE IdHistoriaClinica = ? AND IdEmpresa = ?
            ORDER BY FechaProgramacion DESC
        `, [idHistoriaClinica, req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar cirugías por historia:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar cirugías', error: error.message });
    }
});

// ========================================
// OBTENER CIRUGIA POR ID (con pre, anestesia y post)
// ========================================
router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [cirugia] = await pool.query(`
            SELECT 
                ci.*,
                m.Nombre AS NombreMascota,
                m.Especie,
                m.Raza,
                m.Sexo,
                m.Peso,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario,
                v.TarjetaProfesional,
                v.Especialidad,
                CONCAT(cl.PrimerNombre, ' ', cl.PrimerApellido) AS NombreCliente,
                cl.Telefono AS TelefonoCliente
            FROM cirugias ci
            INNER JOIN mascotas m ON ci.IdMascota = m.IdMascota
            INNER JOIN veterinarios v ON ci.IdVeterinario = v.IdVeterinario
            INNER JOIN clientes cl ON m.ClienteId = cl.ClienteId
            WHERE ci.IdCirugia = ? AND ci.IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        if (cirugia.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Cirugía no encontrada' });
        }

        const [preoperatorio] = await pool.query(`
            SELECT * FROM registropreoperatorio WHERE IdCirugia = ? AND IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        const [anestesico] = await pool.query(`
            SELECT * FROM registroanestesico WHERE IdCirugia = ? AND IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        const [postoperatorio] = await pool.query(`
            SELECT * FROM registropostoperatorio WHERE IdCirugia = ? AND IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        res.json({
            ok: true,
            datos: {
                ...cirugia[0],
                preoperatorio: preoperatorio[0] || null,
                anestesico: anestesico[0] || null,
                postoperatorio: postoperatorio[0] || null
            }
        });
    } catch (error) {
        console.error('Error al obtener cirugía:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener cirugía', error: error.message });
    }
});

// ========================================
// CREAR CIRUGIA
// ========================================
router.post('/', async (req, res) => {
    try {
        const {
            IdHistoriaClinica, IdMascota, IdVeterinario,
            FechaProgramacion, FechaCirugia, TipoCirugia, Motivo,
            DiagnosticoPreoperatorio, DiagnosticoPostoperatorio,
            ProcedimientoRealizado, TipoAnestesia, Observaciones,
            Estado, UsuarioIdCreacion
        } = req.body;

        if (!IdMascota || !IdVeterinario || !TipoCirugia) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Los campos IdMascota, IdVeterinario y TipoCirugia son obligatorios'
            });
        }

        const [result] = await pool.query(`
            INSERT INTO cirugias (
                IdHistoriaClinica, IdMascota, IdVeterinario,
                FechaProgramacion, FechaCirugia, TipoCirugia, Motivo,
                DiagnosticoPreoperatorio, DiagnosticoPostoperatorio,
                ProcedimientoRealizado, TipoAnestesia, Observaciones,
                Estado, FechaCreacion, UsuarioIdCreacion,
                IdEmpresa
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
        `, [
            IdHistoriaClinica || null,
            IdMascota,
            IdVeterinario,
            FechaProgramacion || null,
            FechaCirugia || null,
            TipoCirugia,
            Motivo || null,
            DiagnosticoPreoperatorio || null,
            DiagnosticoPostoperatorio || null,
            ProcedimientoRealizado || null,
            TipoAnestesia || null,
            Observaciones || null,
            Estado || 'Programada',
            req.auth.UsuarioId,
            req.auth.IdEmpresa
        ]);

        res.status(201).json({ ok: true, mensaje: 'Cirugía registrada correctamente', IdCirugia: result.insertId });
    } catch (error) {
        console.error('Error al crear cirugía:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al crear cirugía', error: error.message });
    }
});

// ========================================
// ACTUALIZAR CIRUGIA
// ========================================
router.put('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const {
            FechaProgramacion, FechaCirugia, TipoCirugia, Motivo,
            DiagnosticoPreoperatorio, DiagnosticoPostoperatorio,
            ProcedimientoRealizado, TipoAnestesia, Observaciones,
            Estado, UsuarioIdModificacion
        } = req.body;

        const [result] = await pool.query(`
            UPDATE cirugias SET
                FechaProgramacion = ?,
                FechaCirugia = ?,
                TipoCirugia = ?,
                Motivo = ?,
                DiagnosticoPreoperatorio = ?,
                DiagnosticoPostoperatorio = ?,
                ProcedimientoRealizado = ?,
                TipoAnestesia = ?,
                Observaciones = ?,
                Estado = ?,
                UsuarioIdModificacion = ?
            WHERE IdCirugia = ? AND IdEmpresa = ?
        `, [
            FechaProgramacion || null,
            FechaCirugia || null,
            TipoCirugia,
            Motivo || null,
            DiagnosticoPreoperatorio || null,
            DiagnosticoPostoperatorio || null,
            ProcedimientoRealizado || null,
            TipoAnestesia || null,
            Observaciones || null,
            Estado,
            req.auth.UsuarioId,
            id,
            req.auth.IdEmpresa
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Cirugía no encontrada' });
        }
        res.json({ ok: true, mensaje: 'Cirugía actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar cirugía:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al actualizar cirugía', error: error.message });
    }
});

// ========================================
// REGISTRAR PREOPERATORIO DE CIRUGIA
// ========================================
router.post('/:id/preoperatorio', async (req, res) => {
    try {
        const idCirugia = Number(req.params.id);
        const {
            Peso, Temperatura, FrecuenciaCardiaca, FrecuenciaRespiratoria,
            EstadoGeneral, ExamenesPrequirurgicos, RiesgoAnestesico,
            Ayuno, Observaciones, UsuarioIdCreacion
        } = req.body;

        const [existing] = await pool.query(
            `SELECT IdRegistroPreoperatorio FROM registropreoperatorio WHERE IdCirugia = ? AND IdEmpresa = ?`,
            [idCirugia, req.auth.IdEmpresa]
        );

        let resultId;
        if (existing.length > 0) {
            await pool.query(`
                UPDATE registropreoperatorio SET
                    Peso = ?, Temperatura = ?, FrecuenciaCardiaca = ?,
                    FrecuenciaRespiratoria = ?, EstadoGeneral = ?,
                    ExamenesPrequirurgicos = ?, RiesgoAnestesico = ?,
                    Ayuno = ?, Observaciones = ?
                WHERE IdCirugia = ? AND IdEmpresa = ?
            `, [
                Peso || null, Temperatura || null, FrecuenciaCardiaca || null,
                FrecuenciaRespiratoria || null, EstadoGeneral || null,
                ExamenesPrequirurgicos || null, RiesgoAnestesico || null,
                Ayuno || null, Observaciones || null, idCirugia, req.auth.IdEmpresa
            ]);
            resultId = existing[0].IdRegistroPreoperatorio;
            return res.json({ ok: true, mensaje: 'Preoperatorio actualizado correctamente', IdRegistroPreoperatorio: resultId });
        }

        const [result] = await pool.query(`
            INSERT INTO registropreoperatorio (
                IdCirugia, Peso, Temperatura, FrecuenciaCardiaca,
                FrecuenciaRespiratoria, EstadoGeneral, ExamenesPrequirurgicos,
                RiesgoAnestesico, Ayuno, Observaciones,
                FechaCreacion, UsuarioIdCreacion,
                IdEmpresa
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
        `, [
            idCirugia,
            Peso || null, Temperatura || null, FrecuenciaCardiaca || null,
            FrecuenciaRespiratoria || null, EstadoGeneral || null,
            ExamenesPrequirurgicos || null, RiesgoAnestesico || null,
            Ayuno || null, Observaciones || null,
            req.auth.UsuarioId,
            req.auth.IdEmpresa
        ]);

        res.status(201).json({ ok: true, mensaje: 'Preoperatorio registrado correctamente', IdRegistroPreoperatorio: result.insertId });
    } catch (error) {
        console.error('Error al registrar preoperatorio:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al registrar preoperatorio', error: error.message });
    }
});

// ========================================
// REGISTRAR ANESTESICO DE CIRUGIA
// ========================================
router.post('/:id/anestesico', async (req, res) => {
    try {
        const idCirugia = Number(req.params.id);
        const {
            MedicamentosAnestesicos, Dosis, HoraAdministracion,
            ViaAdministracion, HoraInicio, HoraFin,
            SignosVitales, Observaciones, Complicaciones, UsuarioIdCreacion
        } = req.body;

        const [existing] = await pool.query(
            `SELECT IdRegistroAnestesico FROM registroanestesico WHERE IdCirugia = ? AND IdEmpresa = ?`,
            [idCirugia, req.auth.IdEmpresa]
        );

        if (existing.length > 0) {
            await pool.query(`
                UPDATE registroanestesico SET
                    MedicamentosAnestesicos = ?, Dosis = ?, HoraAdministracion = ?,
                    ViaAdministracion = ?, HoraInicio = ?, HoraFin = ?,
                    SignosVitales = ?, Observaciones = ?, Complicaciones = ?
                WHERE IdCirugia = ? AND IdEmpresa = ?
            `, [
                MedicamentosAnestesicos || null, Dosis || null, HoraAdministracion || null,
                ViaAdministracion || null, HoraInicio || null, HoraFin || null,
                SignosVitales || null, Observaciones || null, Complicaciones || null,
                idCirugia, req.auth.IdEmpresa
            ]);
            return res.json({ ok: true, mensaje: 'Registro anestésico actualizado correctamente' });
        }

        const [result] = await pool.query(`
            INSERT INTO registroanestesico (
                IdCirugia, MedicamentosAnestesicos, Dosis, HoraAdministracion,
                ViaAdministracion, HoraInicio, HoraFin,
                SignosVitales, Observaciones, Complicaciones,
                FechaCreacion, UsuarioIdCreacion,
                IdEmpresa
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
        `, [
            idCirugia,
            MedicamentosAnestesicos || null, Dosis || null, HoraAdministracion || null,
            ViaAdministracion || null, HoraInicio || null, HoraFin || null,
            SignosVitales || null, Observaciones || null, Complicaciones || null,
            req.auth.UsuarioId,
            req.auth.IdEmpresa
        ]);

        res.status(201).json({ ok: true, mensaje: 'Registro anestésico guardado correctamente', IdRegistroAnestesico: result.insertId });
    } catch (error) {
        console.error('Error al registrar anestésico:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al registrar anestésico', error: error.message });
    }
});

// ========================================
// REGISTRAR POSTOPERATORIO DE CIRUGIA
// ========================================
router.post('/:id/postoperatorio', async (req, res) => {
    try {
        const idCirugia = Number(req.params.id);
        const {
            EstadoPostoperatorio, Medicamentos, Tratamiento, Recomendaciones,
            Alimentacion, Restricciones, Cuidados, SignosDeAlarma,
            FechaControl, Observaciones, UsuarioIdCreacion
        } = req.body;

        const [existing] = await pool.query(
            `SELECT IdRegistroPostoperatorio FROM registropostoperatorio WHERE IdCirugia = ? AND IdEmpresa = ?`,
            [idCirugia, req.auth.IdEmpresa]
        );

        if (existing.length > 0) {
            await pool.query(`
                UPDATE registropostoperatorio SET
                    EstadoPostoperatorio = ?, Medicamentos = ?, Tratamiento = ?,
                    Recomendaciones = ?, Alimentacion = ?, Restricciones = ?,
                    Cuidados = ?, SignosDeAlarma = ?, FechaControl = ?, Observaciones = ?
                WHERE IdCirugia = ? AND IdEmpresa = ?
            `, [
                EstadoPostoperatorio || null, Medicamentos || null, Tratamiento || null,
                Recomendaciones || null, Alimentacion || null, Restricciones || null,
                Cuidados || null, SignosDeAlarma || null, FechaControl || null, Observaciones || null,
                idCirugia, req.auth.IdEmpresa
            ]);
            return res.json({ ok: true, mensaje: 'Postoperatorio actualizado correctamente' });
        }

        const [result] = await pool.query(`
            INSERT INTO registropostoperatorio (
                IdCirugia, EstadoPostoperatorio, Medicamentos, Tratamiento,
                Recomendaciones, Alimentacion, Restricciones,
                Cuidados, SignosDeAlarma, FechaControl, Observaciones,
                FechaCreacion, UsuarioIdCreacion,
                IdEmpresa
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
        `, [
            idCirugia,
            EstadoPostoperatorio || null, Medicamentos || null, Tratamiento || null,
            Recomendaciones || null, Alimentacion || null, Restricciones || null,
            Cuidados || null, SignosDeAlarma || null, FechaControl || null, Observaciones || null,
            req.auth.UsuarioId,
            req.auth.IdEmpresa
        ]);

        res.status(201).json({ ok: true, mensaje: 'Postoperatorio registrado correctamente', IdRegistroPostoperatorio: result.insertId });
    } catch (error) {
        console.error('Error al registrar postoperatorio:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al registrar postoperatorio', error: error.message });
    }
});

module.exports = router;
