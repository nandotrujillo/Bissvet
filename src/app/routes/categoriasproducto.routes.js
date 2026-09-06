const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql');

// =====================================================
// LISTAR CATEGORÍAS DE PRODUCTOS
// GET /api/categorias-producto
// =====================================================
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT IdCategoriaProducto, Nombre, Descripcion, Activo,
                   FechaCreacion, FechaModificacion
            FROM categoriasproducto
            WHERE IdEmpresa = ?
            ORDER BY Nombre
        `, [req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error listando categorías:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando categorías', error: error.message });
    }
});

// =====================================================
// OBTENER CATEGORÍA
// GET /api/categorias-producto/:id
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM categoriasproducto WHERE IdCategoriaProducto = ? AND IdEmpresa = ?`,
            [req.params.id, req.auth.IdEmpresa]
        );
        if (rows.length === 0)
            return res.status(404).json({ ok: false, mensaje: 'Categoría no encontrada' });
        res.json({ ok: true, datos: rows[0] });
    } catch (error) {
        console.error('Error obteniendo categoría:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando categoría', error: error.message });
    }
});

// =====================================================
// CREAR CATEGORÍA
// POST /api/categorias-producto
// =====================================================
router.post('/', async (req, res) => {
    try {
        const { Nombre, Descripcion, Activo, UsuarioIdCreacion } = req.body;
        if (!Nombre || !Nombre.trim())
            return res.status(400).json({ ok: false, mensaje: 'El nombre es obligatorio' });

        const [resultado] = await pool.query(
            `INSERT INTO categoriasproducto (Nombre, Descripcion, Activo, UsuarioIdCreacion, IdEmpresa)
             VALUES (?, ?, ?, ?, ?)`,
            [Nombre.trim(), Descripcion || null, Activo ?? 1, UsuarioIdCreacion || null, req.auth.IdEmpresa]
        );
        res.status(201).json({ ok: true, mensaje: 'Categoría creada', IdCategoriaProducto: resultado.insertId });
    } catch (error) {
        console.error('Error creando categoría:', error);
        res.status(500).json({ ok: false, mensaje: 'Error creando categoría', error: error.message });
    }
});

// =====================================================
// ACTUALIZAR CATEGORÍA
// PUT /api/categorias-producto/:id
// =====================================================
router.put('/:id', async (req, res) => {
    try {
        const { Nombre, Descripcion, Activo, UsuarioIdModificacion } = req.body;
        if (!Nombre || !Nombre.trim())
            return res.status(400).json({ ok: false, mensaje: 'El nombre es obligatorio' });

        const [resultado] = await pool.query(
            `UPDATE categoriasproducto
             SET Nombre = ?, Descripcion = ?, Activo = ?,
                 FechaModificacion = NOW(), UsuarioIdModificacion = ?
             WHERE IdCategoriaProducto = ? AND IdEmpresa = ?`,
            [Nombre.trim(), Descripcion || null, Activo ?? 1, UsuarioIdModificacion || null, req.params.id, req.auth.IdEmpresa]
        );
        if (resultado.affectedRows === 0)
            return res.status(404).json({ ok: false, mensaje: 'Categoría no encontrada' });
        res.json({ ok: true, mensaje: 'Categoría actualizada' });
    } catch (error) {
        console.error('Error actualizando categoría:', error);
        res.status(500).json({ ok: false, mensaje: 'Error actualizando categoría', error: error.message });
    }
});

// =====================================================
// ELIMINAR CATEGORÍA
// DELETE /api/categorias-producto/:id
// =====================================================
router.delete('/:id', async (req, res) => {
    try {
        const [resultado] = await pool.query(
            `DELETE FROM categoriasproducto WHERE IdCategoriaProducto = ? AND IdEmpresa = ?`,
            [req.params.id, req.auth.IdEmpresa]
        );
        if (resultado.affectedRows === 0)
            return res.status(404).json({ ok: false, mensaje: 'Categoría no encontrada' });
        res.json({ ok: true, mensaje: 'Categoría eliminada' });
    } catch (error) {
        console.error('Error eliminando categoría:', error);
        res.status(500).json({ ok: false, mensaje: 'Error eliminando categoría', error: error.message });
    }
});

module.exports = router;