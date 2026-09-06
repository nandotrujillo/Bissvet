const express = require('express');
const router = express.Router();

const pool = require('../../database/mysql');


// =====================================================
// LISTAR BODEGAS
// GET /api/bodegas
// =====================================================

router.get('/', async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT
                Id,
                CodigoBodega,
                NombreBodega,
                IdEmpresa,
                Estatus,
                exAuxiliar,
                Descripcion,
                Direccion,
                Responsable,
                Activo
            FROM bissvet.bodegas
            ORDER BY NombreBodega
        `);

        res.json({
            ok: true,
            datos: rows
        });

    } catch (error) {

        console.error('Error listando bodegas:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error consultando las bodegas',
            error: error.message
        });

    }

});


// =====================================================
// OBTENER BODEGA
// GET /api/bodegas/:id
// =====================================================

router.get('/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const [rows] = await pool.query(`
            SELECT
                Id,
                CodigoBodega,
                NombreBodega,
                IdEmpresa,
                Estatus,
                exAuxiliar,
                Descripcion,
                Direccion,
                Responsable,
                Activo
            FROM bissvet.bodegas
            WHERE Id = ?
        `, [id]);

        if (rows.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Bodega no encontrada'
            });

        }

        res.json({
            ok: true,
            datos: rows[0]
        });

    } catch (error) {

        console.error('Error obteniendo bodega:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error consultando la bodega',
            error: error.message
        });

    }

});


// =====================================================
// CREAR BODEGA
// POST /api/bodegas
// =====================================================

router.post('/', async (req, res) => {

    try {

        const {
            CodigoBodega,
            NombreBodega,
            Estatus,
            exAuxiliar,
            Descripcion,
            Direccion,
            Responsable,
            Activo
        } = req.body;
        // La empresa proviene de la sesión, no del body.
        const IdEmpresa = req.auth ? req.auth.IdEmpresa : null;


        if (!CodigoBodega || !CodigoBodega.trim()) {

            return res.status(400).json({
                ok: false,
                mensaje: 'El código de la bodega es obligatorio'
            });

        }


        if (!NombreBodega || !NombreBodega.trim()) {

            return res.status(400).json({
                ok: false,
                mensaje: 'El nombre de la bodega es obligatorio'
            });

        }


        const [resultado] = await pool.query(`
            INSERT INTO bissvet.bodegas
            (
                CodigoBodega,
                NombreBodega,
                IdEmpresa,
                Estatus,
                exAuxiliar,
                Descripcion,
                Direccion,
                Responsable,
                Activo
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [

            CodigoBodega,
            NombreBodega,
            IdEmpresa ?? null,
            Estatus ?? null,
            exAuxiliar ?? null,
            Descripcion ?? null,
            Direccion ?? null,
            Responsable ?? null,
            Activo ?? 1

        ]);


        res.status(201).json({

            ok: true,

            mensaje: 'Bodega creada correctamente',

            Id: resultado.insertId

        });


    } catch (error) {

        console.error('Error creando bodega:', error);

        res.status(500).json({

            ok: false,

            mensaje: 'Error creando la bodega',

            error: error.message

        });

    }

});


// =====================================================
// ACTUALIZAR BODEGA
// PUT /api/bodegas/:id
// =====================================================

router.put('/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const {
            CodigoBodega,
            NombreBodega,
            Estatus,
            exAuxiliar,
            Descripcion,
            Direccion,
            Responsable,
            Activo
        } = req.body;
        // La empresa proviene de la sesión, no del body.
        const IdEmpresa = req.auth ? req.auth.IdEmpresa : null;


        if (!CodigoBodega || !CodigoBodega.trim()) {

            return res.status(400).json({
                ok: false,
                mensaje: 'El código de la bodega es obligatorio'
            });

        }


        if (!NombreBodega || !NombreBodega.trim()) {

            return res.status(400).json({
                ok: false,
                mensaje: 'El nombre de la bodega es obligatorio'
            });

        }


        const [resultado] = await pool.query(`
            UPDATE bissvet.bodegas

            SET
                CodigoBodega = ?,
                NombreBodega = ?,
                IdEmpresa = ?,
                Estatus = ?,
                exAuxiliar = ?,
                Descripcion = ?,
                Direccion = ?,
                Responsable = ?,
                Activo = ?

            WHERE Id = ?

        `, [

            CodigoBodega,
            NombreBodega,
            IdEmpresa ?? null,
            Estatus ?? null,
            exAuxiliar ?? null,
            Descripcion ?? null,
            Direccion ?? null,
            Responsable ?? null,
            Activo ?? 1,
            id

        ]);


        if (resultado.affectedRows === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Bodega no encontrada'
            });

        }


        res.json({

            ok: true,

            mensaje: 'Bodega actualizada correctamente'

        });


    } catch (error) {

        console.error('Error actualizando bodega:', error);

        res.status(500).json({

            ok: false,

            mensaje: 'Error actualizando la bodega',

            error: error.message

        });

    }

});


// =====================================================
// ELIMINAR BODEGA
// DELETE /api/bodegas/:id
// =====================================================

router.delete('/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const [resultado] = await pool.query(`
            DELETE FROM bissvet.bodegas
            WHERE Id = ?
        `, [id]);


        if (resultado.affectedRows === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Bodega no encontrada'
            });

        }


        res.json({

            ok: true,

            mensaje: 'Bodega eliminada correctamente'

        });


    } catch (error) {

        console.error('Error eliminando bodega:', error);

        res.status(500).json({

            ok: false,

            mensaje: 'Error eliminando la bodega',

            error: error.message

        });

    }

});


module.exports = router;

