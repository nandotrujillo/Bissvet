const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql.js');

// ========================================
// LISTAR DIAGNOSTICOS
// ========================================
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT d.*, hc.IdMascota
            FROM diagnosticos d
            INNER JOIN historiasclinicas hc ON d.IdHistoriaClinica = hc.IdHistoriaClinica
            WHERE d.IdEmpresa = ?
            ORDER BY d.IdDiagnostico DESC
        `, [req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar diagnósticos:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar diagnósticos', error: error.message });
    }
});

// ========================================
// LISTAR DIAGNOSTICOS POR HISTORIA CLINICA
// ========================================
router.get('/historia/:idHistoriaClinica', async (req, res) => {
    try {
        const idHistoriaClinica = Number(req.params.idHistoriaClinica);
        const [rows] = await pool.query(`
            SELECT * FROM diagnosticos
            WHERE IdHistoriaClinica = ? AND IdEmpresa = ?
            ORDER BY IdDiagnostico ASC
        `, [idHistoriaClinica, req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar diagnósticos:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar diagnósticos', error: error.message });
    }
});

// ========================================
// OBTENER DIAGNOSTICO POR ID
// ========================================
router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [rows] = await pool.query(`
            SELECT * FROM diagnosticos WHERE IdDiagnostico = ? AND IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        if (rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Diagnóstico no encontrado' });
        }
        res.json({ ok: true, datos: rows[0] });
    } catch (error) {
        console.error('Error al obtener diagnóstico:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener diagnóstico', error: error.message });
    }
});

// ========================================
// CREAR DIAGNOSTICO
// ========================================
router.post('/', async (req, res) => {
    try {
        const {
            IdHistoriaClinica,
            Diagnostico,
            CodigoDiagnostico,
            TipoDiagnostico,
            Observaciones,
            UsuarioIdCreacion
        } = req.body;

        if (!IdHistoriaClinica || !Diagnostico) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Los campos IdHistoriaClinica y Diagnostico son obligatorios'
            });
        }

        const [result] = await pool.query(`
            INSERT INTO diagnosticos (
                IdHistoriaClinica, Diagnostico, CodigoDiagnostico,
                TipoDiagnostico, Observaciones,
                FechaCreacion, UsuarioIdCreacion,
                IdEmpresa
            ) VALUES (?, ?, ?, ?, ?, NOW(), ?, ?)
        `, [
            IdHistoriaClinica,
            Diagnostico,
            CodigoDiagnostico || null,
            TipoDiagnostico || 'Presuntivo',
            Observaciones || null,
            req.auth.UsuarioId,
            req.auth.IdEmpresa
        ]);

        res.status(201).json({ ok: true, mensaje: 'Diagnóstico registrado correctamente', IdDiagnostico: result.insertId });
    } catch (error) {
        console.error('Error al crear diagnóstico:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al crear diagnóstico', error: error.message });
    }
});

// ========================================
// ACTUALIZAR DIAGNOSTICO
// ========================================
router.put('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const {
            Diagnostico,
            CodigoDiagnostico,
            TipoDiagnostico,
            Observaciones
        } = req.body;

        const [result] = await pool.query(`
            UPDATE diagnosticos SET
                Diagnostico = ?,
                CodigoDiagnostico = ?,
                TipoDiagnostico = ?,
                Observaciones = ?
            WHERE IdDiagnostico = ? AND IdEmpresa = ?
        `, [
            Diagnostico,
            CodigoDiagnostico || null,
            TipoDiagnostico,
            Observaciones || null,
            id,
            req.auth.IdEmpresa
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Diagnóstico no encontrado' });
        }
        res.json({ ok: true, mensaje: 'Diagnóstico actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar diagnóstico:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al actualizar diagnóstico', error: error.message });
    }
});

// ========================================
// ELIMINAR DIAGNOSTICO
// ========================================
router.delete('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [result] = await pool.query(`
            DELETE FROM diagnosticos WHERE IdDiagnostico = ? AND IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Diagnóstico no encontrado' });
        }
        res.json({ ok: true, mensaje: 'Diagnóstico eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar diagnóstico:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al eliminar diagnóstico', error: error.message });
    }
});

module.exports = router;
