const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql.js');

// ========================================
// LISTAR DETALLES POR RECETA
// ========================================
router.get('/receta/:idReceta', async (req, res) => {
    try {
        const idReceta = Number(req.params.idReceta);
        const [rows] = await pool.query(`
            SELECT * FROM detallerecetas
            WHERE IdReceta = ? AND IdEmpresa = ?
            ORDER BY IdDetalleReceta ASC
        `, [idReceta, req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar detalles de receta:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar detalles', error: error.message });
    }
});

// ========================================
// OBTENER DETALLE POR ID
// ========================================
router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [rows] = await pool.query(`
            SELECT * FROM detallerecetas WHERE IdDetalleReceta = ? AND IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        if (rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Detalle no encontrado' });
        }
        res.json({ ok: true, datos: rows[0] });
    } catch (error) {
        console.error('Error al obtener detalle:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener detalle', error: error.message });
    }
});

// ========================================
// CREAR DETALLE DE RECETA
// ========================================
router.post('/', async (req, res) => {
    try {
        const {
            IdReceta, IdProducto, Medicamento, Concentracion,
            FormaFarmaceutica, Dosis, UnidadDosis, Frecuencia,
            ViaAdministracion, Duracion, Cantidad,
            Indicaciones, Observaciones
        } = req.body;

        if (!IdReceta || !Medicamento) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Los campos IdReceta y Medicamento son obligatorios'
            });
        }

        const [result] = await pool.query(`
            INSERT INTO detallerecetas (
                IdReceta, IdProducto, Medicamento, Concentracion,
                FormaFarmaceutica, Dosis, UnidadDosis, Frecuencia,
                ViaAdministracion, Duracion, Cantidad,
                Indicaciones, Observaciones, FechaCreacion,
                IdEmpresa
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
        `, [
            IdReceta,
            IdProducto || null,
            Medicamento,
            Concentracion || null,
            FormaFarmaceutica || null,
            Dosis || null,
            UnidadDosis || null,
            Frecuencia || null,
            ViaAdministracion || null,
            Duracion || null,
            Cantidad || null,
            Indicaciones || null,
            Observaciones || null,
            req.auth.IdEmpresa
        ]);

        res.status(201).json({ ok: true, mensaje: 'Medicamento agregado correctamente', IdDetalleReceta: result.insertId });
    } catch (error) {
        console.error('Error al crear detalle:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al crear detalle', error: error.message });
    }
});

// ========================================
// ACTUALIZAR DETALLE DE RECETA
// ========================================
router.put('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const {
            IdProducto, Medicamento, Concentracion,
            FormaFarmaceutica, Dosis, UnidadDosis, Frecuencia,
            ViaAdministracion, Duracion, Cantidad,
            Indicaciones, Observaciones
        } = req.body;

        const [result] = await pool.query(`
            UPDATE detallerecetas SET
                IdProducto = ?,
                Medicamento = ?,
                Concentracion = ?,
                FormaFarmaceutica = ?,
                Dosis = ?,
                UnidadDosis = ?,
                Frecuencia = ?,
                ViaAdministracion = ?,
                Duracion = ?,
                Cantidad = ?,
                Indicaciones = ?,
                Observaciones = ?
            WHERE IdDetalleReceta = ? AND IdEmpresa = ?
        `, [
            IdProducto || null,
            Medicamento,
            Concentracion || null,
            FormaFarmaceutica || null,
            Dosis || null,
            UnidadDosis || null,
            Frecuencia || null,
            ViaAdministracion || null,
            Duracion || null,
            Cantidad || null,
            Indicaciones || null,
            Observaciones || null,
            id,
            req.auth.IdEmpresa
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Detalle no encontrado' });
        }
        res.json({ ok: true, mensaje: 'Detalle actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar detalle:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al actualizar detalle', error: error.message });
    }
});

// ========================================
// ELIMINAR DETALLE DE RECETA
// ========================================
router.delete('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [result] = await pool.query(`
            DELETE FROM detallerecetas WHERE IdDetalleReceta = ? AND IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Detalle no encontrado' });
        }
        res.json({ ok: true, mensaje: 'Detalle eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar detalle:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al eliminar detalle', error: error.message });
    }
});

module.exports = router;
