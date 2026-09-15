const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql');

// =====================================================
// LISTAR MARCAS  (GET /api/marcas)
// Devuelve las marcas globales y las propias de la empresa.
// =====================================================
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT Id, Nombre, Descripcion, Activo,
                   FechaCreacion, FechaModificacion
            FROM marcas
            WHERE Activo = 1 AND (IdEmpresa = ? OR IdEmpresa IS NULL)
            ORDER BY Nombre
        `, [req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error listando marcas:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando marcas', error: error.message });
    }
});

// =====================================================
// OBTENER MARCA  (GET /api/marcas/:id)
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT Id, Nombre, Descripcion, Activo, FechaCreacion, FechaModificacion
             FROM marcas WHERE Id = ? AND (IdEmpresa = ? OR IdEmpresa IS NULL)`,
            [req.params.id, req.auth.IdEmpresa]
        );
        if (rows.length === 0)
            return res.status(404).json({ ok: false, mensaje: 'Marca no encontrada' });
        res.json({ ok: true, datos: rows[0] });
    } catch (error) {
        console.error('Error obteniendo marca:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando marca', error: error.message });
    }
});

// =====================================================
// CREAR MARCA  (POST /api/marcas)
// =====================================================
router.post('/', async (req, res) => {
    try {
        const { Nombre, Descripcion, Activo } = req.body;

        if (!Nombre || !Nombre.trim())
            return res.status(400).json({ ok: false, mensaje: 'El nombre es obligatorio' });

        const [resultado] = await pool.query(
            `INSERT INTO marcas (Nombre, Descripcion, Activo, UsuarioIdCreacion, IdEmpresa)
             VALUES (?, ?, ?, ?, ?)`,
            [Nombre.trim(), Descripcion || null, Activo ?? 1, req.auth.UsuarioId, req.auth.IdEmpresa]
        );
        res.status(201).json({ ok: true, mensaje: 'Marca creada', Id: resultado.insertId });
    } catch (error) {
        console.error('Error creando marca:', error);
        res.status(500).json({ ok: false, mensaje: 'Error creando marca', error: error.message });
    }
});

// =====================================================
// ACTUALIZAR MARCA  (PUT /api/marcas/:id)
// =====================================================
router.put('/:id', async (req, res) => {
    try {
        const { Nombre, Descripcion, Activo } = req.body;

        if (!Nombre || !Nombre.trim())
            return res.status(400).json({ ok: false, mensaje: 'El nombre es obligatorio' });

        const [resultado] = await pool.query(
            `UPDATE marcas SET
                Nombre = ?, Descripcion = ?, Activo = ?,
                FechaModificacion = NOW(), UsuarioIdModificacion = ?
             WHERE Id = ? AND (IdEmpresa = ? OR IdEmpresa IS NULL)`,
            [Nombre.trim(), Descripcion || null, Activo ?? 1, req.auth.UsuarioId, req.params.id, req.auth.IdEmpresa]
        );
        if (resultado.affectedRows === 0)
            return res.status(404).json({ ok: false, mensaje: 'Marca no encontrada' });
        res.json({ ok: true, mensaje: 'Marca actualizada' });
    } catch (error) {
        console.error('Error actualizando marca:', error);
        res.status(500).json({ ok: false, mensaje: 'Error actualizando marca', error: error.message });
    }
});

// =====================================================
// ELIMINAR MARCA  (DELETE /api/marcas/:id)
// No se elimina si está usada por productos.
// =====================================================
router.delete('/:id', async (req, res) => {
    try {
        const [uso] = await pool.query(
            `SELECT COUNT(*) AS total FROM productos WHERE IdMarca = ? AND IdEmpresa = ?`,
            [req.params.id, req.auth.IdEmpresa]
        );
        if (uso[0].total > 0)
            return res.status(409).json({ ok: false, mensaje: `No se puede eliminar: está asociada a ${uso[0].total} producto(s)` });

        const [resultado] = await pool.query(
            `DELETE FROM marcas WHERE Id = ? AND (IdEmpresa = ? OR IdEmpresa IS NULL)`,
            [req.params.id, req.auth.IdEmpresa]
        );
        if (resultado.affectedRows === 0)
            return res.status(404).json({ ok: false, mensaje: 'Marca no encontrada' });
        res.json({ ok: true, mensaje: 'Marca eliminada' });
    } catch (error) {
        console.error('Error eliminando marca:', error);
        res.status(500).json({ ok: false, mensaje: 'Error eliminando marca', error: error.message });
    }
});

module.exports = router;