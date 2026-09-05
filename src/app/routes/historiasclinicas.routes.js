const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql.js');

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
            ORDER BY hc.FechaAtencion DESC
        `);
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
            WHERE hc.IdMascota = ?
            ORDER BY hc.FechaAtencion DESC
        `, [idMascota]);
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
            WHERE hc.IdHistoriaClinica = ?
        `, [id]);

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
                FechaCreacion, UsuarioIdCreacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
        `, [
            IdCita || null,
            IdMascota,
            IdVeterinario,
            FechaAtencion || new Date(),
            MotivoConsulta,
            EnfermedadActual || null,
            Observaciones || null,
            Estado || 'Abierta',
            UsuarioIdCreacion || null
        ]);

        if (IdCita) {
            await pool.query(`UPDATE citas SET Estado = 'Atendida' WHERE IdCita = ?`, [IdCita]);
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
            WHERE IdHistoriaClinica = ?
        `, [
            IdCita || null,
            IdMascota,
            IdVeterinario,
            FechaAtencion,
            MotivoConsulta,
            EnfermedadActual || null,
            Observaciones || null,
            Estado,
            UsuarioIdModificacion || null,
            id
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
        const { UsuarioIdModificacion } = req.body;

        const [result] = await pool.query(`
            UPDATE historiasclinicas SET
                Estado = 'Cerrada',
                FechaModificacion = NOW(),
                UsuarioIdModificacion = ?
            WHERE IdHistoriaClinica = ?
        `, [UsuarioIdModificacion || null, id]);

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
