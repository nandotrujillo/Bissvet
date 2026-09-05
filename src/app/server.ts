/* const express = require('express');

const router = express.Router();

const usuarioService = require('../services/usuario.service');


// ============================================
// PRUEBA DE LA RUTA
// ============================================

router.get('/prueba', (req, res) => {

    console.log('GET /api/usuarios/prueba');

    res.json({
        mensaje: 'Ruta de usuarios funcionando'
    });

});


// ==========================================
// OBTENER TODOS LOS USUARIOS
// GET /api/usuarios
// ==========================================

router.get('/', async (req, res) => {

    try {

        const usuarios =
            await usuarioService.obtenerUsuarios();

        res.json(usuarios);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error obteniendo los usuarios'
        });
    }
});


// ==========================================
// OBTENER USUARIO POR ID
// GET /api/usuarios/1
// ==========================================

router.get('/:id', async (req, res) => {

    try {

        const id = parseInt(req.params.id);

        const usuario =
            await usuarioService.obtenerUsuarioPorId(id);

        if (!usuario) {

            return res.status(404).json({
                mensaje: 'Usuario no encontrado222'
            });
        }

        res.json(usuario);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error obteniendo el usuario'
        });
    }
});


// ==========================================
// VALIDAR LOGIN
// POST /api/usuarios/login
// ==========================================

router.post('/login', async (req, res) => {

    try {
        console.log('================================');
        console.log('PETICIÓN DE LOGIN');
        console.log('BODY:', req.body);
        console.log('================================');

        ConsoleLogger.log(req.body);    
        const {Username, PasswordHash} = req.body;

        if (!Username || !PasswordHash) {

            return res.status(400).json({
                mensaje: 'Usuario y contraseña son rrrr'
            });
        }

        const usuarioEncontrado =
            await usuarioService.validarUsuario(
                Username,
                PasswordHash
            );

        if (!usuarioEncontrado) {

            return res.status(401).json({
                mensaje: 'Usuario o contraseña incorrectos_ojo'
            });
        }

        res.json({
            valido: true,
            usuario: usuarioEncontrado
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error validando el usuario'
        });
    }
});


// ==========================================
// CREAR USUARIO
// POST /api/usuarios
// ==========================================

router.post('/', async (req, res) => {

    try {

        const { Username, PasswordHash } = req.body;

        if (!Username || !PasswordHash) {

            return res.status(400).json({
                mensaje: 'Usuario y contraseña faltan'
            });
        }

        const nuevoUsuario =
            await usuarioService.crearUsuario(
                Username,
                PasswordHash
            );

        res.status(201).json(nuevoUsuario);

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error creando el usuario'
        });
    }
});


module.exports = router;
*/