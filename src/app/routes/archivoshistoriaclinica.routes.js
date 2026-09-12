const express = require('express');
const router = express.Router();
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const pool = require('../../database/mysql.js');

// ========================================
// CONFIGURACIÓN DE SUBIDA DE ARCHIVOS
// ========================================
const uploadDir = path.join(__dirname, '..', '..', 'uploads');

if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const idEmpresa = req.auth ? req.auth.IdEmpresa : 'emp';
        const unico = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path.extname(file.originalname) || '';
        cb(null, `hc_${idEmpresa}_${unico}${ext}`);
    }
});

const upload = multer({
    storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

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
// CREAR ARCHIVO (multipart/form-data con subida de archivo)
// ========================================
router.post('/', upload.single('archivo'), async (req, res) => {
    try {
        const {
            IdHistoriaClinica, TipoArchivo, Descripcion,
            UsuarioIdCreacion
        } = req.body;

        if (!IdHistoriaClinica) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El campo IdHistoriaClinica es obligatorio'
            });
        }

        // Si viene un archivo físico, se usa su información
        const NombreArchivo = req.file
            ? (req.file.originalname || req.file.filename)
            : req.body.NombreArchivo;

        const RutaArchivo = req.file
            ? req.file.filename
            : req.body.RutaArchivo;

        const TamanoBytes = req.file
            ? req.file.size
            : req.body.TamanoBytes || null;

        const TipoMIME = req.file
            ? req.file.mimetype
            : req.body.TipoMIME || null;

        if (!NombreArchivo || !RutaArchivo) {
            return res.status(400).json({
                ok: false,
                mensaje: 'El archivo es obligatorio'
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
            TamanoBytes,
            TipoMIME,
            UsuarioIdCreacion || null,
            req.auth.IdEmpresa
        ]);

        res.status(201).json({
            ok: true,
            mensaje: 'Archivo registrado correctamente',
            IdArchivo: result.insertId
        });
    } catch (error) {
        console.error('Error al crear archivo:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al crear archivo', error: error.message });
    }
});

// ========================================
// DESCARGAR/VER ARCHIVO
// ========================================
router.get('/descargar/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [rows] = await pool.query(`
            SELECT * FROM archivoshistoriaclinica WHERE IdArchivo = ? AND IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        if (rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Archivo no encontrado' });
        }

        const archivo = rows[0];
        const ruta = path.join(uploadDir, archivo.RutaArchivo);

        if (!fs.existsSync(ruta)) {
            return res.status(404).json({ ok: false, mensaje: 'El archivo físico no existe' });
        }

        res.download(ruta, archivo.NombreArchivo);
    } catch (error) {
        console.error('Error al descargar archivo:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al descargar archivo', error: error.message });
    }
});

// ========================================
// ELIMINAR ARCHIVO
// ========================================
router.delete('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        const [rows] = await pool.query(`
            SELECT * FROM archivoshistoriaclinica WHERE IdArchivo = ? AND IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        if (rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Archivo no encontrado' });
        }

        const [result] = await pool.query(`
            DELETE FROM archivoshistoriaclinica WHERE IdArchivo = ? AND IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        // Eliminar físicamente si existe
        if (rows[0].RutaArchivo) {
            const ruta = path.join(uploadDir, rows[0].RutaArchivo);
            if (fs.existsSync(ruta)) {
                try { fs.unlinkSync(ruta); } catch (e) { /* noop */ }
            }
        }

        res.json({ ok: true, mensaje: 'Archivo eliminado correctamente' });
    } catch (error) {
        console.error('Error al eliminar archivo:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al eliminar archivo', error: error.message });
    }
});

module.exports = router;
