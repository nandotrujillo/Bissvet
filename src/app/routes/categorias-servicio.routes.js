const express = require('express');
const router = express.Router();

const pool = require('../../database/mysql');


// =====================================================
// LISTAR CATEGORÍAS DE SERVICIO
// =====================================================

router.get('/', async (req, res) => {

    console.log('GET /api/categorias-servicio');

    try {

        const [rows] = await pool.query(`
            SELECT
                IdCategoriaServicio,
                Nombre,
                Descripcion,
                Activo,idModulos
            FROM categoriasservicio
            WHERE IdEmpresa = ? OR IdEmpresa IS NULL
            ORDER BY Nombre
        `, [req.auth.IdEmpresa]);

        res.json({
            ok: true,
            datos: rows
        });

    } catch (error) {

        console.error(
            'Error obteniendo categorías de servicio:',
            error
        );

        res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo categorías de servicio',
            error: error.message
        });

    }

});


// =====================================================
// CREAR CATEGORÍA DE SERVICIO
// =====================================================

router.post('/', async (req, res) => {

    console.log('POST /api/categorias-servicio');

    try {

        const { Nombre, Descripcion, Activo, idModulos } = req.body;

        if (!Nombre || !Nombre.trim()) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El nombre de la categoría es obligatorio'
            });
        }

        const [result] = await pool.query(`
            INSERT INTO categoriasservicio (
                Nombre, Descripcion, Activo, idModulos,
                FechaCreacion, IdEmpresa
            ) VALUES (?, ?, ?, ?, NOW(), ?)
        `, [
            Nombre.trim(),
            Descripcion || null,
            Activo !== undefined ? Activo : 1,
            idModulos || null,
            req.auth.IdEmpresa
        ]);

        res.status(201).json({
            ok: true,
            mensaje: 'Categoría creada correctamente',
            IdCategoriaServicio: result.insertId
        });

    } catch (error) {

        console.error('Error creando categoría de servicio:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error creando categoría de servicio',
            error: error.message
        });

    }

});


// =====================================================
// ACTUALIZAR CATEGORÍA DE SERVICIO
// =====================================================

router.put('/:id', async (req, res) => {

    console.log('PUT /api/categorias-servicio/' + req.params.id);

    try {

        const id = Number(req.params.id);
        const { Nombre, Descripcion, Activo, idModulos } = req.body;

        if (!Nombre || !Nombre.trim()) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El nombre de la categoría es obligatorio'
            });
        }

        const [result] = await pool.query(`
            UPDATE categoriasservicio
            SET Nombre = ?,
                Descripcion = ?,
                Activo = ?,
                idModulos = ?
            WHERE IdCategoriaServicio = ? AND IdEmpresa = ?
        `, [
            Nombre.trim(),
            Descripcion || null,
            Activo !== undefined ? Activo : 1,
            idModulos || null,
            id,
            req.auth.IdEmpresa
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Categoría no encontrada'
            });
        }

        res.json({
            ok: true,
            mensaje: 'Categoría actualizada correctamente'
        });

    } catch (error) {

        console.error('Error actualizando categoría de servicio:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error actualizando categoría de servicio',
            error: error.message
        });

    }

});


// =====================================================
// ELIMINAR CATEGORÍA DE SERVICIO
// =====================================================

router.delete('/:id', async (req, res) => {

    console.log('DELETE /api/categorias-servicio/' + req.params.id);

    try {

        const id = Number(req.params.id);

        const [result] = await pool.query(`
            DELETE FROM categoriasservicio
            WHERE IdCategoriaServicio = ? AND IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        if (result.affectedRows === 0) {
            return res.status(404).json({
                ok: false,
                mensaje: 'Categoría no encontrada'
            });
        }

        res.json({
            ok: true,
            mensaje: 'Categoría eliminada correctamente'
        });

    } catch (error) {

        console.error('Error eliminando categoría de servicio:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error eliminando categoría de servicio',
            error: error.message
        });

    }

});


module.exports = router;