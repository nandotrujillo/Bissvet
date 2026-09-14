const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql');

// =====================================================
// LISTAR UNIDADES DE MEDIDA  (GET /api/unidades-medida)
// Devuelve las unidades globales y las propias de la empresa.
// =====================================================
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT Id, Unidad, Descripcion, Activo,
                   FechaCreacion, FechaModificacion
            FROM unidades_medida
            WHERE Activo = 1 AND (IdEmpresa = ? OR IdEmpresa IS NULL)
            ORDER BY Unidad
        `, [req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error listando unidades de medida:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando unidades de medida', error: error.message });
    }
});

// =====================================================
// OBTENER UNIDAD DE MEDIDA  (GET /api/unidades-medida/:id)
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT Id, Unidad, Descripcion, Activo, FechaCreacion, FechaModificacion
             FROM unidades_medida WHERE Id = ? AND (IdEmpresa = ? OR IdEmpresa IS NULL)`,
            [req.params.id, req.auth.IdEmpresa]
        );
        if (rows.length === 0)
            return res.status(404).json({ ok: false, mensaje: 'Unidad de medida no encontrada' });
        res.json({ ok: true, datos: rows[0] });
    } catch (error) {
        console.error('Error obteniendo unidad de medida:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando unidad de medida', error: error.message });
    }
});

// =====================================================
// CREAR UNIDAD DE MEDIDA  (POST /api/unidades-medida)
// =====================================================
router.post('/', async (req, res) => {
    try {
        const { Unidad, Descripcion, Activo, UsuarioIdCreacion } = req.body;

        if (!Unidad || !Unidad.trim())
            return res.status(400).json({ ok: false, mensaje: 'La unidad es obligatoria' });
        if (Unidad.trim().length > 20)
            return res.status(400).json({ ok: false, mensaje: 'La unidad no puede superar 20 caracteres' });

        const [resultado] = await pool.query(
            `INSERT INTO unidades_medida (Unidad, Descripcion, Activo, UsuarioIdCreacion, IdEmpresa)
             VALUES (?, ?, ?, ?, ?)`,
            [Unidad.trim(), Descripcion || null, Activo ?? 1, UsuarioIdCreacion || null, req.auth.IdEmpresa]
        );
        res.status(201).json({ ok: true, mensaje: 'Unidad de medida creada', Id: resultado.insertId });
    } catch (error) {
        console.error('Error creando unidad de medida:', error);
        res.status(500).json({ ok: false, mensaje: 'Error creando unidad de medida', error: error.message });
    }
});

// =====================================================
// ACTUALIZAR UNIDAD DE MEDIDA  (PUT /api/unidades-medida/:id)
// =====================================================
router.put('/:id', async (req, res) => {
    try {
        const { Unidad, Descripcion, Activo, UsuarioIdModificacion } = req.body;

        if (!Unidad || !Unidad.trim())
            return res.status(400).json({ ok: false, mensaje: 'La unidad es obligatoria' });
        if (Unidad.trim().length > 20)
            return res.status(400).json({ ok: false, mensaje: 'La unidad no puede superar 20 caracteres' });

        const [resultado] = await pool.query(
            `UPDATE unidades_medida SET
                Unidad = ?, Descripcion = ?, Activo = ?,
                FechaModificacion = NOW(), UsuarioIdModificacion = ?
             WHERE Id = ? AND (IdEmpresa = ? OR IdEmpresa IS NULL)`,
            [Unidad.trim(), Descripcion || null, Activo ?? 1, UsuarioIdModificacion || null, req.params.id, req.auth.IdEmpresa]
        );
        if (resultado.affectedRows === 0)
            return res.status(404).json({ ok: false, mensaje: 'Unidad de medida no encontrada' });
        res.json({ ok: true, mensaje: 'Unidad de medida actualizada' });
    } catch (error) {
        console.error('Error actualizando unidad de medida:', error);
        res.status(500).json({ ok: false, mensaje: 'Error actualizando unidad de medida', error: error.message });
    }
});

// =====================================================
// ELIMINAR UNIDAD DE MEDIDA  (DELETE /api/unidades-medida/:id)
// No se elimina si está usada por productos.
// =====================================================
router.delete('/:id', async (req, res) => {
    try {
        const [uso] = await pool.query(
            `SELECT COUNT(*) AS total FROM productos WHERE IdUnidadMedida = ? AND IdEmpresa = ?`,
            [req.params.id, req.auth.IdEmpresa]
        );
        if (uso[0].total > 0)
            return res.status(409).json({ ok: false, mensaje: `No se puede eliminar: está asociada a ${uso[0].total} producto(s)` });

        const [resultado] = await pool.query(
            `DELETE FROM unidades_medida WHERE Id = ? AND (IdEmpresa = ? OR IdEmpresa IS NULL)`,
            [req.params.id, req.auth.IdEmpresa]
        );
        if (resultado.affectedRows === 0)
            return res.status(404).json({ ok: false, mensaje: 'Unidad de medida no encontrada' });
        res.json({ ok: true, mensaje: 'Unidad de medida eliminada' });
    } catch (error) {
        console.error('Error eliminando unidad de medida:', error);
        res.status(500).json({ ok: false, mensaje: 'Error eliminando unidad de medida', error: error.message });
    }
});

module.exports = router;