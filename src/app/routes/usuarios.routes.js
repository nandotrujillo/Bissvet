const express = require('express');
const router = express.Router();

const pool = require('../../database/mysql.js');



router.get('/login', (req, res) => {

    console.log('GET /api/usuarios/login');

    res.json({
        ok: true,
        mensaje: 'La ruta usuarios/login existe'
    });

});

router.post('/login', async (req, res) => {

    try {
        console.log('BODY RECIBIDO:', req.body);
        
        const {
            Username,
            PasswordHash,
            IdEmpresa
        } = req.body;


        console.log('Username:', Username);
        console.log('IdEmpresa:', IdEmpresa);


        // =====================================
        // VALIDAR DATOS
        // =====================================

        if (!Username || !PasswordHash) {

            console.log('NO LLEGO USUARIO Y PASS');
            return res.status(400).json({
                mensaje: 'Usuario y contraseña son obligatorios'
            });

        }

        if (!IdEmpresa) {

            console.log('NO LLEGO IdEmpresa');
            return res.status(400).json({
                mensaje: 'Debe seleccionar la empresa'
            });

        }

        // =====================================
        // VALIDAR EMPRESA ACTIVA
        // =====================================

        const [empresas] = await pool.query(
            `SELECT IdEmpresa, NombreComercial
             FROM BissVet.empresas
             WHERE IdEmpresa = ? AND Activo = 1`,
            [IdEmpresa]
        );

        if (empresas.length === 0) {

            return res.status(401).json({
                mensaje: 'La empresa seleccionada no está vigente'
            });

        }

        const empresa = empresas[0];

        // =====================================
        // VALIDAR USUARIO PERTENECIENTE A LA EMPRESA
        // =====================================

        const [rows] = await pool.query(
            `SELECT UsuarioId, Username, PasswordHash, IdEmpresa
             FROM Usuarios
             WHERE Username = ? AND IdEmpresa = ?`,
            [Username, IdEmpresa]
        );

        if (rows.length === 0) {

            return res.status(401).json({
                mensaje: 'Usuario o contraseña incorrectos'
            });

        }

        const user = rows[0];

        if (PasswordHash !== user.PasswordHash) {

            return res.status(401).json({
                mensaje: 'Usuario o contraseña incorrectos'
            });

        }

        res.json({
            ok: true,
            mensaje: 'Login correcto',
            usuario: {
                UsuarioId: user.UsuarioId,
                Username: user.Username,
                IdEmpresa: user.IdEmpresa
            },
            empresa: {
                IdEmpresa: empresa.IdEmpresa,
                NombreComercial: empresa.NombreComercial
            }
        });

    } catch (error) {

        console.error('Error login:', error);

        res.status(500).json({
            mensaje: 'Error interno del servidor',
            error: error.message
        });

    }

});


module.exports = router;