const express = require('express');
const router = express.Router();

const { sql, conectar } = require('../services/database.service');


// ==========================================
// GET - Listar categorías
// ==========================================
router.get('/', async (req, res) => {

    try {

        const pool = await conectar();

        const result = await pool.request()
            .query(`
                SELECT
                    IdCategoriaServicio,
                    Nombre,
                    Descripcion,
                    Activo
                FROM CategoriasServicio
                ORDER BY Nombre
            `);

        res.json({
            ok: true,
            data: result.recordset
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al consultar las categorías'
        });

    }
});


// ==========================================
// GET - Obtener categoría por ID
// ==========================================
router.get('/:id', async (req, res) => {

    try {

        const pool = await conectar();

        const result = await pool.request()
            .input('IdCategoriaServicio', sql.Int, req.params.id)
            .query(`
                SELECT
                    IdCategoriaServicio,
                    Nombre,
                    Descripcion,
                    Activo
                FROM CategoriasServicio
                WHERE IdCategoriaServicio = @IdCategoriaServicio
            `);

        if (result.recordset.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Categoría no encontrada'
            });

        }

        res.json({
            ok: true,
            data: result.recordset[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al consultar la categoría'
        });

    }
});


// ==========================================
// POST - Crear categoría
// ==========================================
router.post('/', async (req, res) => {

    try {

        const { Nombre, Descripcion, UsuarioId } = req.body;

        if (!Nombre) {

            return res.status(400).json({
                ok: false,
                mensaje: 'El nombre de la categoría es obligatorio'
            });

        }

        const pool = await conectar();

        const result = await pool.request()
            .input('Nombre', sql.NVarChar(100), Nombre)
            .input('Descripcion', sql.NVarChar(300), Descripcion || null)
            .query(`
                INSERT INTO CategoriasServicio
                (
                    Nombre,
                    Descripcion,
                    Activo
                )
                OUTPUT INSERTED.*
                VALUES
                (
                    @Nombre,
                    @Descripcion,
                    1
                )
            `);

        res.status(201).json({
            ok: true,
            mensaje: 'Categoría creada correctamente',
            data: result.recordset[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al crear la categoría'
        });

    }
});


// ==========================================
// PUT - Actualizar categoría
// ==========================================
router.put('/:id', async (req, res) => {

    try {

        const { Nombre, Descripcion, Activo } = req.body;

        const pool = await conectar();

        const result = await pool.request()
            .input('IdCategoriaServicio', sql.Int, req.params.id)
            .input('Nombre', sql.NVarChar(100), Nombre)
            .input('Descripcion', sql.NVarChar(300), Descripcion || null)
            .input('Activo', sql.Bit, Activo)
            .query(`
                UPDATE CategoriasServicio
                SET
                    Nombre = @Nombre,
                    Descripcion = @Descripcion,
                    Activo = @Activo
                OUTPUT INSERTED.*
                WHERE IdCategoriaServicio = @IdCategoriaServicio
            `);

        if (result.recordset.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Categoría no encontrada'
            });

        }

        res.json({
            ok: true,
            mensaje: 'Categoría actualizada correctamente',
            data: result.recordset[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al actualizar la categoría'
        });

    }
});


// ==========================================
// DELETE - Desactivar categoría
// ==========================================
router.delete('/:id', async (req, res) => {

    try {

        const pool = await conectar();

        const result = await pool.request()
            .input('IdCategoriaServicio', sql.Int, req.params.id)
            .query(`
                UPDATE CategoriasServicio
                SET Activo = 0
                OUTPUT INSERTED.*
                WHERE IdCategoriaServicio = @IdCategoriaServicio
            `);

        if (result.recordset.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Categoría no encontrada'
            });

        }

        res.json({
            ok: true,
            mensaje: 'Categoría desactivada correctamente',
            data: result.recordset[0]
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al desactivar la categoría'
        });

    }
});


module.exports = router;