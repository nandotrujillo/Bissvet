const express = require('express');
const router = express.Router();

const pool = require('../../database/mysql');


// =====================================================
// LISTAR MODULOS
// =====================================================

router.get('/', async (req, res) => {

    console.log('GET /api/modulos');

    try {

        const [rows] = await pool.query(`
            SELECT
                idModulos,
                Codigo,
                NombreModulo,
                Descripcion,
                Ruta,
                Icono,
                Orden,
                Activo
            FROM modulos
            ORDER BY Orden, NombreModulo
        `);

        res.json({
            ok: true,
            datos: rows
        });

    } catch (error) {

        console.error(
            'Error obteniendo módulos:',
            error
        );

        res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo módulos',
            error: error.message
        });

    }

});


// =====================================================
// OBTENER MODULO POR ID
// =====================================================

router.get('/:id', async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT
                idModulos,
                NombreModulo
            FROM modulos
            WHERE idModulos = ?
        `, [req.params.id]);

        if (rows.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Módulo no encontrado'
            });

        }

        res.json({
            ok: true,
            datos: rows[0]
        });

    } catch (error) {

        console.error(
            'Error obteniendo módulo:',
            error
        );

        res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo módulo',
            error: error.message
        });

    }

});


module.exports = router;