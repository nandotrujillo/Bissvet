const express = require('express');
const router = express.Router();

const pool = require('../../database/mysql.js');
const { authenticate } = require('../../middleware/auth.js');
const { authorize } = require('../../middleware/authorize');


// =====================================================
// LISTAR EMPRESAS (para el combo del login)
// GET /api/empresas
// =====================================================

router.get('/', async (req, res) => {

    try {

        const [rows] = await pool.query(`
            SELECT
                IdEmpresa,
                CodigoEmpresa,
                Nit,
                RazonSocial,
                NombreComercial,
                TipoDocumento,
                Direccion,
                Telefono,
                Correo,
                Contacto,
                TelefonoContacto,
                IdCiudad,
                UsaControlCaja,
                ControlExistencias
            FROM empresas
            WHERE Activo = 1
            ORDER BY NombreComercial
        `);

        res.json({
            ok: true,
            datos: rows
        });

    } catch (error) {

        console.error('Error listando empresas:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo empresas',
            error: error.message
        });

    }

});


// =====================================================
// OBTENER EMPRESA POR ID
// GET /api/empresas/:id
// =====================================================

router.get('/:id', authenticate, authorize('EMPRESAS.CONSULTAR'), async (req, res) => {

    try {

        const id = Number(req.params.id);

        if (!id) {

            return res.status(400).json({
                ok: false,
                mensaje: 'IdEmpresa inválido'
            });

        }

        const [rows] = await pool.query(`
            SELECT
                IdEmpresa,
                CodigoEmpresa,
                Nit,
                RazonSocial,
                NombreComercial,
                TipoDocumento,
                Direccion,
                Telefono,
                Correo,
                Contacto,
                TelefonoContacto,
                IdCiudad,
                Activo,
                UsaControlCaja,
                ControlExistencias
            FROM empresas
            WHERE IdEmpresa = ?
        `, [id]);

        if (rows.length === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Empresa no encontrada'
            });

        }

        res.json({
            ok: true,
            datos: rows[0]
        });

    } catch (error) {

        console.error('Error obteniendo empresa:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error obteniendo empresa',
            error: error.message
        });

    }

});


// =====================================================
// ACTUALIZAR EMPRESA
// PUT /api/empresas/:id
// =====================================================

router.put('/:id', authenticate, authorize('EMPRESAS.EDITAR'), async (req, res) => {

    try {

        const id = Number(req.params.id);

        if (!id) {

            return res.status(400).json({
                ok: false,
                mensaje: 'IdEmpresa inválido'
            });

        }

        const {

            CodigoEmpresa,
            Nit,
            RazonSocial,
            NombreComercial,
            TipoDocumento,
            Direccion,
            Telefono,
            Correo,
            Contacto,
            TelefonoContacto,
            IdCiudad,
            Activo,
            UsaControlCaja,
            ControlExistencias

        } = req.body;


        if (!CodigoEmpresa || !CodigoEmpresa.trim()) {

            return res.status(400).json({
                ok: false,
                mensaje: 'CodigoEmpresa es obligatorio'
            });

        }


        if (!Nit || !Nit.trim()) {

            return res.status(400).json({
                ok: false,
                mensaje: 'Nit es obligatorio'
            });

        }


        if (!RazonSocial || !RazonSocial.trim()) {

            return res.status(400).json({
                ok: false,
                mensaje: 'RazonSocial es obligatoria'
            });

        }


        if (!NombreComercial || !NombreComercial.trim()) {

            return res.status(400).json({
                ok: false,
                mensaje: 'NombreComercial es obligatorio'
            });

        }


        const usuarioId = req.auth.UsuarioId;


        const [result] = await pool.query(`

            UPDATE empresas
            SET
                CodigoEmpresa = ?,
                Nit = ?,
                RazonSocial = ?,
                NombreComercial = ?,
                TipoDocumento = ?,
                Direccion = ?,
                Telefono = ?,
                Correo = ?,
                Contacto = ?,
                TelefonoContacto = ?,
                IdCiudad = COALESCE(?, IdCiudad),
                Activo = COALESCE(?, Activo),
                UsaControlCaja = COALESCE(?, UsaControlCaja),
                ControlExistencias = COALESCE(?, ControlExistencias),
                FechaModificacion = NOW(),
                UsuarioIdModificacion = ?
            WHERE IdEmpresa = ?

        `, [

            CodigoEmpresa,
            Nit,
            RazonSocial,
            NombreComercial,
            TipoDocumento || null,
            Direccion || null,
            Telefono || null,
            Correo || null,
            Contacto || null,
            TelefonoContacto || null,
IdCiudad !== undefined && IdCiudad !== null && IdCiudad !== '' ? IdCiudad : null,
Activo !== undefined ? (Activo ? 1 : 0) : null,
UsaControlCaja !== undefined ? (UsaControlCaja ? 1 : 0) : null,
ControlExistencias !== undefined ? (ControlExistencias ? 1 : 0) : null,
usuarioId,
            id

        ]);


        if (result.affectedRows === 0) {

            return res.status(404).json({
                ok: false,
                mensaje: 'Empresa no encontrada'
            });

        }


        res.json({
            ok: true,
            mensaje: 'Empresa actualizada correctamente'
        });


    } catch (error) {

        console.error('Error actualizando empresa:', error);

        res.status(500).json({
            ok: false,
            mensaje: 'Error actualizando empresa',
            error: error.message
        });

    }

});


module.exports = router;