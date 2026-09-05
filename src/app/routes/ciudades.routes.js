const express = require('express');
const router = express.Router();

const pool = require('../../database/mysql');


// =====================================================
// LISTAR CIUDADES
// GET /api/ciudades
// =====================================================

router.get('/', async (req, res) => {

    try {

        console.log('GET /api/ciudades');

        const [rows] = await pool.query(`
            SELECT
                Id,
                IdPais,
                Ciudad,
                CodigoCiudad,
                Departamento
            FROM bissvet.ciudades
            ORDER BY Ciudad
        `);

        res.json({
            ok: true,
            data: rows
        });

    } catch (error) {

        console.error('Error consultando ciudades:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error consultando las ciudades',
            error: error.message
        });

    }

});


// =====================================================
// OBTENER CIUDAD POR ID
// GET /api/ciudades/:id
// =====================================================

router.get('/:id', async (req, res) => {

    try {

        const id = Number(req.params.id);

        if (isNaN(id)) {

            return res.status(400).json({
                ok: false,
                mensaje: 'El ID de la ciudad no es válido'
            });

        }

        const [rows] = await pool.query(`
            SELECT
                Id,
                IdPais,
                Ciudad,
                CodigoCiudad,
                Departamento
            FROM bissvet.ciudades
            WHERE Id = ?
        `, [id]);


        if (rows.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Ciudad no encontrada'
            });

        }


        res.json({
            ok: true,
            data: rows[0]
        });

    } catch (error) {

        console.error('Error consultando ciudad:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error consultando la ciudad',
            error: error.message
        });

    }

});


module.exports = router;
