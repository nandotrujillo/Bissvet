const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql.js');

// ========================================
// LISTAR ARCHIVOS DE HISTORIA CLINICA
// ========================================
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT a.*, hc.IdMascota
            FROM archivoshistoriaclinica a
            INNER JOIN historiasclinicas hc ON a.IdHistoriaClinica = hc.IdHistoriaClinica
            WHERE a.IdEmpresa = ?
            ORDER BY a.FechaCreacion DESC
        `, [req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar archivos:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar archivos', error: error.message });
    }
});

// ========================================
// LISTAR ARCHIVOS POR HISTORIA CLINICA
// ========================================
router.get('/historia/:idHistoriaClinica', async (req, res) => {
    try {
        const idHistoriaClinica = Number(req.params.idHistoriaClinica);
        const [rows] = await pool.query(`
            SELECT * FROM archivoshistoriaclinica
            WHERE IdHistoriaClinica = ? AND IdEmpresa = ?
            ORDER BY FechaCreacion DESC
        `, [idHistoriaClinica, req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar archivos:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar archivos', error: error.message });
    }
});

// ========================================
// OBTENER ARCHIVO POR ID
// ========================================
router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [rows] = await pool.query(`
            SELECT * FROM archivoshistoriaclinica WHERE IdArchivo = ? AND IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        if (rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Archivo no encontrado' });
        }
        res.json({ ok: true, datos: rows[0] });
    } catch (error) {
        console.error('Error al obtener archivo:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener archivo', error: error.message });
    }
});

// ========================================
// CREAR ARCHIVO
// ========================================
router.post('/', async (req, res) => {
    try {
        const {
            IdHistoriaClinica, TipoArchivo, NombreArchivo,
            Descripcion, RutaArchivo, TamanoBytes, TipoMIME,
            UsuarioIdCreacion
        } = req.body;

        if (!IdHistoriaClinica || !NombreArchivo || !RutaArchivo) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Los campos IdHistoriaClinica, NombreArchivo y RutaArchivo son obligatorios'
            });
        }

        const [result] = await pool.query(`
            INSERT INTO archivoshistoriaclinica (
                IdHistoriaClinica, TipoArchivo, NombreArchivo, Descripcion,
                RutaArchivo, TamanoBytes, TipoMIME,
                FechaCreacion, UsuarioIdCreacion,
                IdEmpresa
            ) VALUES (?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
        `, [
            IdHistoriaClinica,
            TipoArchivo || 'Documento',
            NombreArchivo,
            Descripcion || null,
            RutaArchivo,
            TamanoBytes || null,
            TipoMIME || null,
            UsuarioIdCreacion || null,
            req.auth.IdEmpresa
        ]);

        res.status(201).json({ ok: true, mensaje: 'Archivo registrado correctamente', IdArchivo: result.insertId });
    } catch (error) {
        console.error('Error al crear archivo:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al crear archivo', error: error.message });
    }
});

// ========================================
// ELIMINAR ARCHIVO
// ========================================
router.delete('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [result] = await pool.query(`
            DELETE FROM archivoshistoriaclinica WHERE IdArchivo = ? AND IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Archivo no encontrado' });
        }
        res.json({ ok: true, mensaje: 'Archivo eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar archivo:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al eliminar archivo', error: error.message });
    }
});

module.exports = router;
