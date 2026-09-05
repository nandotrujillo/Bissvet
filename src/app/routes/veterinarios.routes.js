const express = require('express');
const router = express.Router();

const pool = require('../../database/mysql');


// =====================================================
// LISTAR VETERINARIOS
// =====================================================

router.get('/', async (req, res) => {

    try {

        const [rows] = await pool.query(`
            
            SELECT
                IdVeterinario,
                UsuarioId,
                PrimerNombre,
                SegundoNombre,
                PrimerApellido,
                SegundoApellido,
                TipoDocumento,
                NumeroDocumento,
                TarjetaProfesional,
                Especialidad,
                Telefono,
                Telefono2,
                Correo,
                Direccion,
                IdCiudad,
                FechaNacimiento,
                Observaciones,
                Activo,
                FechaCreacion,
                UsuarioIdCreacion,
                FechaModificacion,
                UsuarioIdModificacion

            FROM veterinarios

            ORDER BY PrimerApellido, PrimerNombre

        `);

        res.json({

            ok: true,

            datos: rows

        });

    } catch (error) {

        console.error(
            'Error listando veterinarios:',
            error
        );

        res.status(500).json({

            ok: false,

            mensaje: 'Error consultando veterinarios',

            error: error.message

        });

    }

});


// =====================================================
// OBTENER VETERINARIO POR ID
// =====================================================

router.get('/:id', async (req, res) => {

    try {

        const id =
            Number(req.params.id);

        const [rows] = await pool.query(`

            SELECT *

            FROM veterinarios

            WHERE IdVeterinario = ?

        `, [id]);


        if (rows.length === 0) {

            return res.status(404).json({

                ok: false,

                mensaje: 'Veterinario no encontrado'

            });

        }


        res.json({

            ok: true,

            datos: rows[0]

        });

    } catch (error) {

        console.error(
            'Error obteniendo veterinario:',
            error
        );

        res.status(500).json({

            ok: false,

            mensaje: 'Error consultando veterinario',

            error: error.message

        });

    }

});


// =====================================================
// CREAR VETERINARIO
// =====================================================

router.post('/', async (req, res) => {

    try {

        const {

            UsuarioId,
            PrimerNombre,
            SegundoNombre,
            PrimerApellido,
            SegundoApellido,
            TipoDocumento,
            NumeroDocumento,
            TarjetaProfesional,
            Especialidad,
            Telefono,
            Telefono2,
            Correo,
            Direccion,
            IdCiudad,
            FechaNacimiento,
            Observaciones,
            Activo
        } = req.body;


        const [resultado] = await pool.query(`

            INSERT INTO veterinarios (

                UsuarioId,
                PrimerNombre,
                SegundoNombre,
                PrimerApellido,
                SegundoApellido,
                TipoDocumento,
                NumeroDocumento,
                TarjetaProfesional,
                Especialidad,
                Telefono,
                Telefono2,
                Correo,
                Direccion,
                IdCiudad,
                FechaNacimiento,
                Observaciones,
                Activo,
                UsuarioIdCreacion,
                FechaCreacion
            )

            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())

        `, [

            UsuarioId ?? null,
            PrimerNombre,
            SegundoNombre ?? null,
            PrimerApellido,
            SegundoApellido ?? null,
            TipoDocumento,
            NumeroDocumento,
            TarjetaProfesional,
            Especialidad ?? null,
            Telefono ?? null,
            Telefono2 ?? null,
            Correo ?? null,
            Direccion ?? null,
            IdCiudad ?? null,
            FechaNacimiento ?? null,
            Observaciones ?? null,
            Activo ?? true,
            UsuarioId ?? null
        ]);


        const [nuevo] = await pool.query(`

            SELECT * FROM veterinarios

            WHERE IdVeterinario = ?

        `, [resultado.insertId]);


        res.status(201).json({

            ok: true,

            mensaje: 'Veterinario creado correctamente',

            datos: nuevo[0]

        });

    } catch (error) {

        console.error(
            'Error creando veterinario:',
            error
        );

        res.status(500).json({

            ok: false,

            mensaje: 'Error creando veterinario',

            error: error.message

        });

    }

});


// =====================================================
// ACTUALIZAR VETERINARIO
// =====================================================

router.put('/:id', async (req, res) => {

    try {

        const id =
            Number(req.params.id);


        const {

            UsuarioId,
            PrimerNombre,
            SegundoNombre,
            PrimerApellido,
            SegundoApellido,
            TipoDocumento,
            NumeroDocumento,
            TarjetaProfesional,
            Especialidad,
            Telefono,
            Telefono2,
            Correo,
            Direccion,
            IdCiudad,
            FechaNacimiento,
            Observaciones,
            Activo,
            UsuarioIdCreacion

        } = req.body;


        await pool.query(`

            UPDATE veterinarios

            SET

                UsuarioId = ?,
                PrimerNombre = ?,
                SegundoNombre = ?,
                PrimerApellido = ?,
                SegundoApellido = ?,
                TipoDocumento = ?,
                NumeroDocumento = ?,
                TarjetaProfesional = ?,
                Especialidad = ?,
                Telefono = ?,
                Telefono2 = ?,
                Correo = ?,
                Direccion = ?,
                IdCiudad = ?,
                FechaNacimiento = ?,
                Observaciones = ?,
                Activo = ?,
                FechaModificacion = NOW(),
                UsuarioIdModificacion = ?

            WHERE IdVeterinario = ?

        `, [

            UsuarioId ?? null,
            PrimerNombre,
            SegundoNombre ?? null,
            PrimerApellido,
            SegundoApellido ?? null,
            TipoDocumento,
            NumeroDocumento,
            TarjetaProfesional,
            Especialidad ?? null,
            Telefono ?? null,
            Telefono2 ?? null,
            Correo ?? null,
            Direccion ?? null,
            IdCiudad ?? null,
            FechaNacimiento ?? null,
            Observaciones ?? null,
            Activo ?? true,
            UsuarioIdCreacion ?? null,
            id

        ]);


        const [actualizado] = await pool.query(`

            SELECT * FROM veterinarios

            WHERE IdVeterinario = ?

        `, [id]);


        res.json({

            ok: true,

            mensaje:
                'Veterinario actualizado correctamente',

            datos: actualizado[0]

        });

    } catch (error) {

        console.error(
            'Error actualizando veterinario:',
            error
        );

        res.status(500).json({

            ok: false,

            mensaje:
                'Error actualizando veterinario',

            error: error.message

        });

    }

});


// =====================================================
// ELIMINAR VETERINARIO
// =====================================================

router.delete('/:id', async (req, res) => {

    try {

        const id =
            Number(req.params.id);


        await pool.query(`

            DELETE FROM veterinarios

            WHERE IdVeterinario = ?

        `, [id]);


        res.json({

            ok: true,

            mensaje:
                'Veterinario eliminado correctamente'

        });

    } catch (error) {

        console.error(
            'Error eliminando veterinario:',
            error
        );

        res.status(500).json({

            ok: false,

            mensaje:
                'Error eliminando veterinario',

            error: error.message

        });

    }

});


module.exports = router;