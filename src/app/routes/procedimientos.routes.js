const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql.js');

// ========================================
// LISTAR PROCEDIMIENTOS
// ========================================
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT p.*, hc.IdMascota, m.Nombre AS NombreMascota, s.Nombre AS NombreServicio
            FROM procedimientos p
            INNER JOIN historiasclinicas hc ON p.IdHistoriaClinica = hc.IdHistoriaClinica
            INNER JOIN mascotas m ON hc.IdMascota = m.IdMascota
            LEFT JOIN servicios s ON p.IdServicio = s.IdServicio
            WHERE p.IdEmpresa = ?
            ORDER BY p.Fecha DESC
        `, [req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar procedimientos:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar procedimientos', error: error.message });
    }
});

// ========================================
// LISTAR PROCEDIMIENTOS POR HISTORIA CLINICA
// ========================================
router.get('/historia/:idHistoriaClinica', async (req, res) => {
    try {
        const idHistoriaClinica = Number(req.params.idHistoriaClinica);
        const [rows] = await pool.query(`
            SELECT p.*, s.Nombre AS NombreServicio
            FROM procedimientos p
            LEFT JOIN servicios s ON p.IdServicio = s.IdServicio
            WHERE p.IdHistoriaClinica = ? AND p.IdEmpresa = ?
            ORDER BY p.Fecha DESC
        `, [idHistoriaClinica, req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar procedimientos:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar procedimientos', error: error.message });
    }
});

// ========================================
// OBTENER PROCEDIMIENTO POR ID
// ========================================
router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [rows] = await pool.query(`
            SELECT p.*, s.Nombre AS NombreServicio
            FROM procedimientos p
            LEFT JOIN servicios s ON p.IdServicio = s.IdServicio
            WHERE p.IdProcedimiento = ? AND p.IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        if (rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Procedimiento no encontrado' });
        }
        res.json({ ok: true, datos: rows[0] });
    } catch (error) {
        console.error('Error al obtener procedimiento:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener procedimiento', error: error.message });
    }
});

// ========================================
// CREAR PROCEDIMIENTO
// ========================================
router.post('/', async (req, res) => {
    try {
        const {
            IdHistoriaClinica,
            IdServicio,
            NombreProcedimiento,
            Fecha,
            Descripcion,
            Resultado,
            Observaciones,
            UsuarioIdCreacion
        } = req.body;

        if (!IdHistoriaClinica || !NombreProcedimiento) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Los campos IdHistoriaClinica y NombreProcedimiento son obligatorios'
            });
        }

        const [result] = await pool.query(`
            INSERT INTO procedimientos (
                IdHistoriaClinica, IdServicio, NombreProcedimiento, Fecha,
                Descripcion, Resultado, Observaciones,
                FechaCreacion, UsuarioIdCreacion,
                IdEmpresa
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
        `, [
            IdHistoriaClinica,
            IdServicio || null,
            NombreProcedimiento,
            Fecha || new Date(),
            Descripcion || null,
            Resultado || null,
            Observaciones || null,
            UsuarioIdCreacion || null,
            req.auth.IdEmpresa
        ]);

        res.status(201).json({ ok: true, mensaje: 'Procedimiento registrado correctamente', IdProcedimiento: result.insertId });
    } catch (error) {
        console.error('Error al crear procedimiento:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al crear procedimiento', error: error.message });
    }
});

// ========================================
// ACTUALIZAR PROCEDIMIENTO
// ========================================
router.put('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const {
            IdServicio,
            NombreProcedimiento,
            Fecha,
            Descripcion,
            Resultado,
            Observaciones
        } = req.body;

        const [result] = await pool.query(`
            UPDATE procedimientos SET
                IdServicio = ?,
                NombreProcedimiento = ?,
                Fecha = ?,
                Descripcion = ?,
                Resultado = ?,
                Observaciones = ?
            WHERE IdProcedimiento = ? AND IdEmpresa = ?
        `, [
            IdServicio || null,
            NombreProcedimiento,
            Fecha,
            Descripcion || null,
            Resultado || null,
            Observaciones || null,
            id,
            req.auth.IdEmpresa
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Procedimiento no encontrado' });
        }
        res.json({ ok: true, mensaje: 'Procedimiento actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar procedimiento:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al actualizar procedimiento', error: error.message });
    }
});

// ========================================
// ELIMINAR PROCEDIMIENTO (historico, se mantiene)
// ========================================
router.delete('/:id', async (req, res) => {
    return res.status(403).json({
        ok: false,
        mensaje: 'No se permite eliminar procedimientos. La información clínica es histórica.'
    });
});

module.exports = router;
