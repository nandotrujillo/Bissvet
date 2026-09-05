const express = require('express');
const router = express.Router();

const pool = require('../../database/mysql');


// =====================================================
// LISTAR SERVICIOS
// GET /api/servicios
// =====================================================

router.get('/', async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT
                s.IdServicio,
                s.IdCategoriaServicio,
                s.Nombre,
                s.Descripcion,
                s.Precio,
                s.Activo,
                s.IdEmpresa,
                cs.Nombre AS NombreCategoria
            FROM servicios s
            LEFT JOIN categoriasservicio cs
                ON s.IdCategoriaServicio = cs.IdCategoriaServicio
            ORDER BY s.Nombre
        `);

        res.json({
            ok: true,
            datos: rows
        });

    } catch (error) {

        console.error('Error obteniendo servicios:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo servicios'
        });

    }

});


// =====================================================
// OBTENER SERVICIO POR ID
// GET /api/servicios/:id
// =====================================================

router.get('/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const [rows] = await pool.query(`
            SELECT
                s.IdServicio,
                s.IdCategoriaServicio,
                s.Nombre,
                s.Descripcion,
                s.Precio,
                s.Activo,
                s.IdEmpresa,
                cs.Nombre AS NombreCategoria
            FROM servicios s
            LEFT JOIN categoriasservicio cs
                ON s.IdCategoriaServicio = cs.IdCategoriaServicio
            WHERE s.IdServicio = ?
        `, [id]);

        if (rows.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Servicio no encontrado'
            });

        }

        res.json({
            ok: true,
            datos: rows[0]
        });

    } catch (error) {

        console.error('Error obteniendo servicio:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo el servicio'
        });

    }

});


// =====================================================
// CREAR SERVICIO
// POST /api/servicios
// =====================================================

router.post('/', async (req, res) => {

    try {

        const {
            IdCategoriaServicio,
            Nombre,
            Descripcion,
            Precio,
            Activo,
            IdEmpresa
        } = req.body;


        if (!Nombre || !Nombre.trim()) {

            return res.status(400).json({
                ok: false,
                mensaje: 'El nombre del servicio es obligatorio'
            });

        }


        const [resultado] = await pool.query(`
            INSERT INTO servicios
            (
                IdCategoriaServicio,
                Nombre,
                Descripcion,
                Precio,
                Activo,
                IdEmpresa
            )
            VALUES (?, ?, ?, ?, ?, ?)
        `, [

            IdCategoriaServicio ?? null,
            Nombre.trim(),
            Descripcion ?? null,
            Precio ?? 0,
            Activo ?? 1,
            IdEmpresa ?? null

        ]);


        res.status(201).json({

            ok: true,

            mensaje: 'Servicio creado correctamente',

            IdServicio: resultado.insertId

        });


    } catch (error) {

        console.error('Error creando servicio:', error);

        res.status(500).json({

            ok: false,

            mensaje: 'Error creando el servicio'

        });

    }

});


// =====================================================
// ACTUALIZAR SERVICIO
// PUT /api/servicios/:id
// =====================================================

router.put('/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const {
            IdCategoriaServicio,
            Nombre,
            Descripcion,
            Precio,
            Activo,
            IdEmpresa
        } = req.body;


        if (!Nombre || !Nombre.trim()) {

            return res.status(400).json({
                ok: false,
                mensaje: 'El nombre del servicio es obligatorio'
            });

        }


        const [resultado] = await pool.query(`
            UPDATE servicios

            SET
                IdCategoriaServicio = ?,
                Nombre = ?,
                Descripcion = ?,
                Precio = ?,
                Activo = ?,
                IdEmpresa = ?

            WHERE IdServicio = ?

        `, [

            IdCategoriaServicio ?? null,
            Nombre.trim(),
            Descripcion ?? null,
            Precio ?? 0,
            Activo ?? 1,
            IdEmpresa ?? null,
            id

        ]);


        if (resultado.affectedRows === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Servicio no encontrado'
            });

        }


        res.json({

            ok: true,

            mensaje: 'Servicio actualizado correctamente'

        });


    } catch (error) {

        console.error('Error actualizando servicio:', error);

        res.status(500).json({

            ok: false,

            mensaje: 'Error actualizando el servicio'

        });

    }

});


// =====================================================
// ELIMINAR SERVICIO
// DELETE /api/servicios/:id
// =====================================================

router.delete('/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const [resultado] = await pool.query(`
            DELETE FROM servicios
            WHERE IdServicio = ?
        `, [id]);


        if (resultado.affectedRows === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Servicio no encontrado'
            });

        }


        res.json({

            ok: true,

            mensaje: 'Servicio eliminado correctamente'

        });


    } catch (error) {

        console.error('Error eliminando servicio:', error);

        res.status(500).json({

            ok: false,

            mensaje: 'Error eliminando el servicio'

        });

    }

});


module.exports = router;
