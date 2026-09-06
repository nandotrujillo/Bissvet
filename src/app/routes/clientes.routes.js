const express = require('express');
const router = express.Router();

const pool = require('../../database/mysql.js');


// =====================================================
// LISTAR CLIENTES
// =====================================================

router.get('/', async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT
                ClienteId,
                TipoDocumento,
                NumeroDocumento,
                PrimerNombre,
                SegundoNombre,
                PrimerApellido,
                SegundoApellido,
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
            FROM bissvet.clientes
            WHERE Activo = 1 AND IdEmpresa = ?
            ORDER BY PrimerNombre, PrimerApellido
        `, [req.auth.IdEmpresa]);

        res.json({
            ok: true,
            datos: rows
        });

    } catch (error) {

        console.error('Error listando clientes:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo clientes',
            error: error.message
        });

    }

});


// =====================================================
// OBTENER CLIENTE POR ID
// =====================================================

router.get('/:id', async (req, res) => {

    try {

        const id = Number(req.params.id);

        if (!id) {

            return res.status(400).json({
                ok: false,
                mensaje: 'ClienteId inválido'
            });

        }

        const [rows] = await pool.query(`
            SELECT *
            FROM bissvet.clientes
            WHERE ClienteId = ? AND IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);


        if (rows.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Cliente no encontrado'
            });

        }


        res.json({
            ok: true,
            datos: rows[0]
        });

    } catch (error) {

        console.error('Error obteniendo cliente:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo cliente',
            error: error.message
        });

    }

});


// =====================================================
// CREAR CLIENTE
// =====================================================

router.post('/', async (req, res) => {

    try {

        console.log('POST /api/clientes');
        console.log('BODY:', req.body);


        const {

            TipoDocumento,
            NumeroDocumento,

            PrimerNombre,
            SegundoNombre,

            PrimerApellido,
            SegundoApellido,

            Telefono,
            Telefono2,

            Correo,
            Direccion,
            IdCiudad,

            FechaNacimiento,

            Observaciones,

            UsuarioIdCreacion

        } = req.body;


        if (!TipoDocumento) {

            return res.status(400).json({
                ok: false,
                mensaje: 'TipoDocumento es obligatorio'
            });

        }


        if (!NumeroDocumento) {

            return res.status(400).json({
                ok: false,
                mensaje: 'NumeroDocumento es obligatorio'
            });

        }


        if (!PrimerNombre) {

            return res.status(400).json({
                ok: false,
                mensaje: 'PrimerNombre es obligatorio'
            });

        }


        if (!PrimerApellido) {

            return res.status(400).json({
                ok: false,
                mensaje: 'PrimerApellido es obligatorio'
            });

        }


        const usuarioId =
            UsuarioIdCreacion
                ? Number(UsuarioIdCreacion)
                : null;


        const fechaNacimiento =
            FechaNacimiento &&
            FechaNacimiento.trim() !== ''
                ? FechaNacimiento
                : null;


        const [result] = await pool.query(`

            INSERT INTO bissvet.clientes
            (
                TipoDocumento,
                NumeroDocumento,
                PrimerNombre,
                SegundoNombre,
                PrimerApellido,
                SegundoApellido,
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
                IdEmpresa
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), ?, ?)

        `, [

            TipoDocumento,
            NumeroDocumento,
            PrimerNombre,
            SegundoNombre || null,
            PrimerApellido,
            SegundoApellido || null,
            Telefono || null,
            Telefono2 || null,
            Correo || null,
            Direccion || null,
            IdCiudad || null,
            fechaNacimiento,
            Observaciones || null,
            usuarioId,
            req.auth.IdEmpresa

        ]);


        res.status(201).json({

            ok: true,

            mensaje: 'Cliente creado correctamente',

            ClienteId: result.insertId

        });


    } catch (error) {

        console.error('Error creando cliente:', error);

        res.status(500).json({

            ok: false,

            mensaje: 'Error creando cliente',

            error: error.message

        });

    }

});


// =====================================================
// ACTUALIZAR CLIENTE
// =====================================================

router.put('/:id', async (req, res) => {

    try {

        const id =
            Number(req.params.id);


        const {

            TipoDocumento,
            NumeroDocumento,

            PrimerNombre,
            SegundoNombre,

            PrimerApellido,
            SegundoApellido,

            Telefono,
            Telefono2,

            Correo,
            Direccion,
            IdCiudad,

            FechaNacimiento,

            Observaciones,

            Activo,

            UsuarioIdModificacion

        } = req.body;


        if (!id) {

            return res.status(400).json({
                ok: false,
                mensaje: 'ClienteId inválido'
            });

        }


        const usuarioId =
            UsuarioIdModificacion
                ? Number(UsuarioIdModificacion)
                : null;


        const fechaNacimiento =
            FechaNacimiento &&
            FechaNacimiento.trim() !== ''
                ? FechaNacimiento
                : null;


        const [result] = await pool.query(`

            UPDATE bissvet.clientes
            SET

                TipoDocumento = ?,
                NumeroDocumento = ?,

                PrimerNombre = ?,
                SegundoNombre = ?,

                PrimerApellido = ?,
                SegundoApellido = ?,

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

            WHERE ClienteId = ? AND IdEmpresa = ?

        `, [

            TipoDocumento,
            NumeroDocumento,

            PrimerNombre,
            SegundoNombre || null,

            PrimerApellido,
            SegundoApellido || null,

            Telefono || null,
            Telefono2 || null,

            Correo || null,
            Direccion || null,
            IdCiudad || null,

            fechaNacimiento,

            Observaciones || null,

            Activo ? 1 : 0,

            usuarioId,

            id,
            req.auth.IdEmpresa

        ]);


        if (result.affectedRows === 0) {

            return res.status(404).json({

                ok: false,

                mensaje: 'Cliente no encontrado'

            });

        }


        res.json({

            ok: true,

            mensaje: 'Cliente actualizado correctamente'

        });


    } catch (error) {

        console.error('Error actualizando cliente:', error);

        res.status(500).json({

            ok: false,

            mensaje: 'Error actualizando cliente',

            error: error.message

        });

    }

});


// =====================================================
// ELIMINAR CLIENTE
// =====================================================

router.delete('/:id', async (req, res) => {

    try {

        const id =
            Number(req.params.id);


        if (!id) {

            return res.status(400).json({

                ok: false,

                mensaje: 'ClienteId inválido'

            });

        }


        // Eliminación lógica

        const [result] = await pool.query(`

            UPDATE bissvet.clientes

            SET Activo = 0

            WHERE ClienteId = ? AND IdEmpresa = ?

        `, [id, req.auth.IdEmpresa]);


        if (result.affectedRows === 0) {

            return res.status(404).json({

                ok: false,

                mensaje: 'Cliente no encontrado'

            });

        }


        res.json({

            ok: true,

            mensaje: 'Cliente desactivado correctamente'

        });


    } catch (error) {

        console.error('Error eliminando cliente:', error);

        res.status(500).json({

            ok: false,

            mensaje: 'Error eliminando cliente',

            error: error.message

        });

    }

});


module.exports = router;