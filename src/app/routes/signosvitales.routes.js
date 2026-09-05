const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql.js');

// ========================================
// LISTAR SIGNOS VITALES
// ========================================
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT sv.*, hc.IdMascota
            FROM signosvitales sv
            INNER JOIN historiasclinicas hc ON sv.IdHistoriaClinica = hc.IdHistoriaClinica
            ORDER BY sv.IdSignosVitales DESC
        `);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar signos vitales:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar signos vitales', error: error.message });
    }
});

// ========================================
// OBTENER SIGNOS VITALES POR HISTORIA CLINICA
// ========================================
router.get('/historia/:idHistoriaClinica', async (req, res) => {
    try {
        const idHistoriaClinica = Number(req.params.idHistoriaClinica);
        const [rows] = await pool.query(`
            SELECT * FROM signosvitales
            WHERE IdHistoriaClinica = ?
        `, [idHistoriaClinica]);

        res.json({ ok: true, datos: rows[0] || null });
    } catch (error) {
        console.error('Error al obtener signos vitales:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener signos vitales', error: error.message });
    }
});

// ========================================
// OBTENER SIGNOS VITALES POR ID
// ========================================
router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [rows] = await pool.query(`
            SELECT * FROM signosvitales WHERE IdSignosVitales = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Signos vitales no encontrados' });
        }
        res.json({ ok: true, datos: rows[0] });
    } catch (error) {
        console.error('Error al obtener signos vitales:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener signos vitales', error: error.message });
    }
});

// ========================================
// CREAR SIGNOS VITALES
// ========================================
router.post('/', async (req, res) => {
    try {
        const {
            IdHistoriaClinica,
            Peso,
            Temperatura,
            FrecuenciaCardiaca,
            FrecuenciaRespiratoria,
            EstadoHidratacion,
            CondicionCorporal,
            Mucosas,
            TiempoLlenadoCapilar,
            Observaciones
        } = req.body;

        if (!IdHistoriaClinica) {
            return res.status(400).json({ ok: false, mensaje: 'El campo IdHistoriaClinica es obligatorio' });
        }

        const [result] = await pool.query(`
            INSERT INTO signosvitales (
                IdHistoriaClinica, Peso, Temperatura, FrecuenciaCardiaca,
                FrecuenciaRespiratoria, EstadoHidratacion, CondicionCorporal,
                Mucosas, TiempoLlenadoCapilar, Observaciones, FechaCreacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            IdHistoriaClinica,
            Peso || null,
            Temperatura || null,
            FrecuenciaCardiaca || null,
            FrecuenciaRespiratoria || null,
            EstadoHidratacion || null,
            CondicionCorporal || null,
            Mucosas || null,
            TiempoLlenadoCapilar || null,
            Observaciones || null
        ]);

        res.status(201).json({ ok: true, mensaje: 'Signos vitales registrados correctamente', IdSignosVitales: result.insertId });
    } catch (error) {
        console.error('Error al crear signos vitales:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al crear signos vitales', error: error.message });
    }
});

// ========================================
// ACTUALIZAR SIGNOS VITALES
// ========================================
router.put('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const {
            Peso,
            Temperatura,
            FrecuenciaCardiaca,
            FrecuenciaRespiratoria,
            EstadoHidratacion,
            CondicionCorporal,
            Mucosas,
            TiempoLlenadoCapilar,
            Observaciones
        } = req.body;

        const [result] = await pool.query(`
            UPDATE signosvitales SET
                Peso = ?,
                Temperatura = ?,
                FrecuenciaCardiaca = ?,
                FrecuenciaRespiratoria = ?,
                EstadoHidratacion = ?,
                CondicionCorporal = ?,
                Mucosas = ?,
                TiempoLlenadoCapilar = ?,
                Observaciones = ?
            WHERE IdSignosVitales = ?
        `, [
            Peso || null,
            Temperatura || null,
            FrecuenciaCardiaca || null,
            FrecuenciaRespiratoria || null,
            EstadoHidratacion || null,
            CondicionCorporal || null,
            Mucosas || null,
            TiempoLlenadoCapilar || null,
            Observaciones || null,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Signos vitales no encontrados' });
        }
        res.json({ ok: true, mensaje: 'Signos vitales actualizados correctamente' });
    } catch (error) {
        console.error('Error al actualizar signos vitales:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al actualizar signos vitales', error: error.message });
    }
});

module.exports = router;
