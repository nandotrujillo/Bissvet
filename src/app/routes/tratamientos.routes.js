const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql.js');

// ========================================
// LISTAR TRATAMIENTOS
// ========================================
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT t.*, hc.IdMascota, m.Nombre AS NombreMascota
            FROM tratamientos t
            INNER JOIN historiasclinicas hc ON t.IdHistoriaClinica = hc.IdHistoriaClinica
            INNER JOIN mascotas m ON hc.IdMascota = m.IdMascota
            ORDER BY t.FechaCreacion DESC
        `);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar tratamientos:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar tratamientos', error: error.message });
    }
});

// ========================================
// LISTAR TRATAMIENTOS POR HISTORIA CLINICA
// ========================================
router.get('/historia/:idHistoriaClinica', async (req, res) => {
    try {
        const idHistoriaClinica = Number(req.params.idHistoriaClinica);
        const [rows] = await pool.query(`
            SELECT * FROM tratamientos
            WHERE IdHistoriaClinica = ?
            ORDER BY FechaInicio DESC
        `, [idHistoriaClinica]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar tratamientos:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar tratamientos', error: error.message });
    }
});

// ========================================
// LISTAR TRATAMIENTOS ACTIVOS POR MASCOTA
// ========================================
router.get('/mascota/:idMascota/activos', async (req, res) => {
    try {
        const idMascota = Number(req.params.idMascota);
        const [rows] = await pool.query(`
            SELECT t.*, hc.FechaAtencion
            FROM tratamientos t
            INNER JOIN historiasclinicas hc ON t.IdHistoriaClinica = hc.IdHistoriaClinica
            WHERE hc.IdMascota = ? AND t.Estado = 'Activo'
            ORDER BY t.FechaInicio DESC
        `, [idMascota]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar tratamientos activos:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar tratamientos', error: error.message });
    }
});

// ========================================
// OBTENER TRATAMIENTO POR ID
// ========================================
router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [rows] = await pool.query(`
            SELECT * FROM tratamientos WHERE IdTratamiento = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Tratamiento no encontrado' });
        }
        res.json({ ok: true, datos: rows[0] });
    } catch (error) {
        console.error('Error al obtener tratamiento:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener tratamiento', error: error.message });
    }
});

// ========================================
// CREAR TRATAMIENTO
// ========================================
router.post('/', async (req, res) => {
    try {
        const {
            IdHistoriaClinica,
            NombreTratamiento,
            Descripcion,
            FechaInicio,
            FechaFin,
            Indicaciones,
            Observaciones,
            Estado,
            UsuarioIdCreacion
        } = req.body;

        if (!IdHistoriaClinica || !NombreTratamiento) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Los campos IdHistoriaClinica y NombreTratamiento son obligatorios'
            });
        }

        const [result] = await pool.query(`
            INSERT INTO tratamientos (
                IdHistoriaClinica, NombreTratamiento, Descripcion,
                FechaInicio, FechaFin, Indicaciones, Observaciones, Estado,
                FechaCreacion, UsuarioIdCreacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
        `, [
            IdHistoriaClinica,
            NombreTratamiento,
            Descripcion || null,
            FechaInicio || null,
            FechaFin || null,
            Indicaciones || null,
            Observaciones || null,
            Estado || 'Activo',
            UsuarioIdCreacion || null
        ]);

        res.status(201).json({ ok: true, mensaje: 'Tratamiento creado correctamente', IdTratamiento: result.insertId });
    } catch (error) {
        console.error('Error al crear tratamiento:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al crear tratamiento', error: error.message });
    }
});

// ========================================
// ACTUALIZAR TRATAMIENTO
// ========================================
router.put('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const {
            NombreTratamiento,
            Descripcion,
            FechaInicio,
            FechaFin,
            Indicaciones,
            Observaciones,
            Estado,
            UsuarioIdModificacion
        } = req.body;

        const [result] = await pool.query(`
            UPDATE tratamientos SET
                NombreTratamiento = ?,
                Descripcion = ?,
                FechaInicio = ?,
                FechaFin = ?,
                Indicaciones = ?,
                Observaciones = ?,
                Estado = ?,
                FechaModificacion = NOW(),
                UsuarioIdModificacion = ?
            WHERE IdTratamiento = ?
        `, [
            NombreTratamiento,
            Descripcion || null,
            FechaInicio || null,
            FechaFin || null,
            Indicaciones || null,
            Observaciones || null,
            Estado,
            UsuarioIdModificacion || null,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Tratamiento no encontrado' });
        }
        res.json({ ok: true, mensaje: 'Tratamiento actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar tratamiento:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al actualizar tratamiento', error: error.message });
    }
});

// ========================================
// FINALIZAR TRATAMIENTO
// ========================================
router.put('/:id/finalizar', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const { UsuarioIdModificacion } = req.body;

        const [result] = await pool.query(`
            UPDATE tratamientos SET
                Estado = 'Finalizado',
                FechaFin = CURDATE(),
                FechaModificacion = NOW(),
                UsuarioIdModificacion = ?
            WHERE IdTratamiento = ?
        `, [UsuarioIdModificacion || null, id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Tratamiento no encontrado' });
        }
        res.json({ ok: true, mensaje: 'Tratamiento finalizado correctamente' });
    } catch (error) {
        console.error('Error al finalizar tratamiento:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al finalizar tratamiento', error: error.message });
    }
});

// ========================================
// ELIMINAR TRATAMIENTO
// ========================================
router.delete('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [result] = await pool.query(`
            DELETE FROM tratamientos WHERE IdTratamiento = ?
        `, [id]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Tratamiento no encontrado' });
        }
        res.json({ ok: true, mensaje: 'Tratamiento eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar tratamiento:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al eliminar tratamiento', error: error.message });
    }
});

module.exports = router;
