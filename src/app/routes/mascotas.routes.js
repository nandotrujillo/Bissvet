const express = require('express');
const router = express.Router();

const pool = require('../../database/mysql.js');


// =====================================================
// GET /api/mascotas
// Listar mascotas activas
// =====================================================

router.get('/', async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT
                m.IdMascota,
                m.ClienteId,
                m.Nombre,
                m.Especie,
                m.Raza,
                m.Sexo,
                m.FechaNacimiento,
                m.Color,
                m.Peso,
                m.Microchip,
                m.Esterilizado,
                m.Observaciones,
                m.Activo,
                m.FechaCreacion,
                m.UsuarioIdCreacion,
                m.FechaModificacion,
                m.UsuarioIdModificacion,
                CONCAT(c.PrimerNombre, ' ', c.PrimerApellido) AS NombreCliente,
                CONCAT_WS(' ', c.PrimerNombre, c.SegundoNombre, c.PrimerApellido, c.SegundoApellido) AS NombreClienteCompleto,
                c.Telefono AS TelefonoCliente,
                c.Correo AS CorreoCliente,
                c.Direccion AS DireccionCliente
            FROM mascotas m
            INNER JOIN clientes c ON m.ClienteId = c.ClienteId
            WHERE m.Activo = 1 AND m.IdEmpresa = ?
            ORDER BY m.Nombre
        `, [req.auth.IdEmpresa]);

        res.json({
            ok: true,
            datos: rows
        });

    } catch (error) {

        console.error('Error GET mascotas:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al consultar mascotas',
            error: error.message
        });

    }

});


// =====================================================
// GET /api/mascotas/:id
// Obtener mascota
// =====================================================

router.get('/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const [rows] = await pool.query(`
            SELECT
                m.IdMascota,
                m.ClienteId,
                m.Nombre,
                m.Especie,
                m.Raza,
                m.Sexo,
                m.FechaNacimiento,
                m.Color,
                m.Peso,
                m.Microchip,
                m.Esterilizado,
                m.Observaciones,
                m.Activo,
                m.FechaCreacion,
                m.UsuarioIdCreacion,
                m.FechaModificacion,
                m.UsuarioIdModificacion,
                CONCAT(c.PrimerNombre, ' ', c.PrimerApellido) AS NombreCliente,
                c.Telefono AS TelefonoCliente,
                c.Correo AS CorreoCliente,
                c.Direccion AS DireccionCliente
            FROM mascotas m
            INNER JOIN clientes c ON m.ClienteId = c.ClienteId
            WHERE m.IdMascota = ? AND m.IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        if (rows.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Mascota no encontrada'
            });

        }

        res.json({
            ok: true,
            datos: rows[0]
        });

    } catch (error) {

        console.error('Error GET mascota:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al consultar la mascota',
            error: error.message
        });

    }

});


// =====================================================
// POST /api/mascotas
// Crear mascota
// =====================================================

router.post('/', async (req, res) => {

    try {

        console.log('POST /api/mascotas');
        console.log('BODY:', req.body);
        
        const {
            ClienteId,
            Nombre,
            Especie,
            Raza,
            Sexo,
            FechaNacimiento,
            Color,
            Peso,
            Microchip,
            Esterilizado,
            Observaciones,
            UsuarioIdCreacion
        } = req.body;
        const usuarioIdNumero =
            UsuarioIdCreacion !== '' &&
            UsuarioIdCreacion !== null &&
            UsuarioIdCreacion !== undefined
                ? Number(UsuarioIdCreacion)
                : 3;

        if (!ClienteId) {

            return res.status(400).json({
                ok: false,
                mensaje: 'ClienteId es obligatorio'
            });

        }

        if (!Nombre) {

            return res.status(400).json({
                ok: false,
                mensaje: 'Nombre es obligatorio'
            });

        }

        if (!Especie) {

            return res.status(400).json({
                ok: false,
                mensaje: 'Especie es obligatoria'
            });

        }


        // Insertar
        //const UsuarioId = parseInt(localStorage.getItem('UsuarioId'));
        const [result] = await pool.query(`

            INSERT INTO mascotas
            (
                ClienteId,
                Nombre,
                Especie,
                Raza,
                Sexo,
                FechaNacimiento,
                Color,
                Peso,
                Microchip,
                Esterilizado,
                Observaciones,
                Activo,
                FechaCreacion,
                UsuarioIdCreacion,
                IdEmpresa
            )
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, NOW(), ?, ?)

        `, [
            ClienteId,
            Nombre,
            Especie,
            Raza || null,
            Sexo || null,
            FechaNacimiento || null,
            Color || null,
            Peso || null,
            Microchip || null,
            Esterilizado ? 1 : 0,
            Observaciones || null,
            UsuarioIdCreacion ? null:usuarioIdNumero,
            req.auth.IdEmpresa
        ]);


        res.status(201).json({
            ok: true,
            mensaje: 'Mascota creada correctamente',
            IdMascota: result.insertId
        });

    } catch (error) {

        console.error('Error POST mascotas:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al crear mascota',
            error: error.message
        });

    }

});


// =====================================================
// PUT /api/mascotas/:id
// Actualizar mascota
// =====================================================

router.put('/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const {
            ClienteId,
            Nombre,
            Especie,
            Raza,
            Sexo,
            FechaNacimiento,
            Color,
            Peso,
            Microchip,
            Esterilizado,
            Observaciones,
            UsuarioIdModificacion
        } = req.body;


        if (!ClienteId || !Nombre || !Especie) {

            return res.status(400).json({
                ok: false,
                mensaje: 'ClienteId, Nombre y Especie son obligatorios'
            });

        }


        const [result] = await pool.query(`

            UPDATE mascotas

            SET
                ClienteId = ?,
                Nombre = ?,
                Especie = ?,
                Raza = ?,
                Sexo = ?,
                FechaNacimiento = ?,
                Color = ?,
                Peso = ?,
                Microchip = ?,
                Esterilizado = ?,
                Observaciones = ?,
                FechaModificacion = NOW(),
                UsuarioIdModificacion = ?

            WHERE IdMascota = ? AND IdEmpresa = ?

        `, [
            ClienteId,
            Nombre,
            Especie,
            Raza || null,
            Sexo || null,
            FechaNacimiento || null,
            Color || null,
            Peso || null,
            Microchip || null,
            Esterilizado ? 1 : 0,
            Observaciones || null,
            UsuarioIdModificacion || null,
            id,
            req.auth.IdEmpresa
        ]);


        if (result.affectedRows === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Mascota no encontrada'
            });

        }


        res.json({
            ok: true,
            mensaje: 'Mascota actualizada correctamente'
        });

    } catch (error) {

        console.error('Error PUT mascotas:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al actualizar mascota',
            error: error.message
        });

    }

});


// =====================================================
// DELETE /api/mascotas/:id
// Eliminación lógica
// =====================================================

router.delete('/:id', async (req, res) => {

    try {

        const { id } = req.params;

        const [result] = await pool.query(`

            UPDATE mascotas

            SET
                Activo = 0,
                FechaModificacion = NOW()

            WHERE IdMascota = ? AND IdEmpresa = ?

        `, [id, req.auth.IdEmpresa]);


        if (result.affectedRows === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Mascota no encontrada'
            });

        }


        res.json({
            ok: true,
            mensaje: 'Mascota eliminada correctamente'
        });

    } catch (error) {

        console.error('Error DELETE mascotas:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error al eliminar mascota',
            error: error.message
        });

    }

});


module.exports = router;