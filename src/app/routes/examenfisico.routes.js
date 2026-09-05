const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql.js');

// ========================================
// LISTAR EXAMENES FISICOS
// ========================================
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT ef.*, hc.IdMascota
            FROM examenfisico ef
            INNER JOIN historiasclinicas hc ON ef.IdHistoriaClinica = hc.IdHistoriaClinica
            ORDER BY ef.IdExamenFisico DESC
        `);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar exámenes físicos:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar exámenes físicos', error: error.message });
    }
});

// ========================================
// OBTENER EXAMEN FISICO POR HISTORIA CLINICA
// ========================================
router.get('/historia/:idHistoriaClinica', async (req, res) => {
    try {
        const idHistoriaClinica = Number(req.params.idHistoriaClinica);
        const [rows] = await pool.query(`
            SELECT * FROM examenfisico
            WHERE IdHistoriaClinica = ?
        `, [idHistoriaClinica]);

        res.json({ ok: true, datos: rows[0] || null });
    } catch (error) {
        console.error('Error al obtener examen físico:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener examen físico', error: error.message });
    }
});

// ========================================
// OBTENER EXAMEN FISICO POR ID
// ========================================
router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [rows] = await pool.query(`
            SELECT * FROM examenfisico WHERE IdExamenFisico = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Examen físico no encontrado' });
        }
        res.json({ ok: true, datos: rows[0] });
    } catch (error) {
        console.error('Error al obtener examen físico:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener examen físico', error: error.message });
    }
});

// ========================================
// CREAR EXAMEN FISICO
// ========================================
router.post('/', async (req, res) => {
    try {
        const {
            IdHistoriaClinica,
            EstadoGeneral, Cabeza, Ojos, Oidos, Nariz, Boca, Cuello,
            SistemaRespiratorio, SistemaCardiovascular, Abdomen,
            SistemaDigestivo, SistemaUrinario, SistemaReproductivo,
            SistemaMusculoesqueletico, PielYPelaje, SistemaNeurologico,
            Ganglios, OtrosHallazgos, ObservacionesGenerales
        } = req.body;

        if (!IdHistoriaClinica) {
            return res.status(400).json({ ok: false, mensaje: 'El campo IdHistoriaClinica es obligatorio' });
        }

        const [result] = await pool.query(`
            INSERT INTO examenfisico (
                IdHistoriaClinica, EstadoGeneral, Cabeza, Ojos, Oidos, Nariz, Boca, Cuello,
                SistemaRespiratorio, SistemaCardiovascular, Abdomen,
                SistemaDigestivo, SistemaUrinario, SistemaReproductivo,
                SistemaMusculoesqueletico, PielYPelaje, SistemaNeurologico,
                Ganglios, OtrosHallazgos, ObservacionesGenerales, FechaCreacion
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())
        `, [
            IdHistoriaClinica,
            EstadoGeneral || null, Cabeza || null, Ojos || null, Oidos || null,
            Nariz || null, Boca || null, Cuello || null,
            SistemaRespiratorio || null, SistemaCardiovascular || null, Abdomen || null,
            SistemaDigestivo || null, SistemaUrinario || null, SistemaReproductivo || null,
            SistemaMusculoesqueletico || null, PielYPelaje || null, SistemaNeurologico || null,
            Ganglios || null, OtrosHallazgos || null, ObservacionesGenerales || null
        ]);

        res.status(201).json({ ok: true, mensaje: 'Examen físico registrado correctamente', IdExamenFisico: result.insertId });
    } catch (error) {
        console.error('Error al crear examen físico:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al crear examen físico', error: error.message });
    }
});

// ========================================
// ACTUALIZAR EXAMEN FISICO
// ========================================
router.put('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const {
            EstadoGeneral, Cabeza, Ojos, Oidos, Nariz, Boca, Cuello,
            SistemaRespiratorio, SistemaCardiovascular, Abdomen,
            SistemaDigestivo, SistemaUrinario, SistemaReproductivo,
            SistemaMusculoesqueletico, PielYPelaje, SistemaNeurologico,
            Ganglios, OtrosHallazgos, ObservacionesGenerales
        } = req.body;

        const [result] = await pool.query(`
            UPDATE examenfisico SET
                EstadoGeneral = ?,
                Cabeza = ?,
                Ojos = ?,
                Oidos = ?,
                Nariz = ?,
                Boca = ?,
                Cuello = ?,
                SistemaRespiratorio = ?,
                SistemaCardiovascular = ?,
                Abdomen = ?,
                SistemaDigestivo = ?,
                SistemaUrinario = ?,
                SistemaReproductivo = ?,
                SistemaMusculoesqueletico = ?,
                PielYPelaje = ?,
                SistemaNeurologico = ?,
                Ganglios = ?,
                OtrosHallazgos = ?,
                ObservacionesGenerales = ?
            WHERE IdExamenFisico = ?
        `, [
            EstadoGeneral || null, Cabeza || null, Ojos || null, Oidos || null,
            Nariz || null, Boca || null, Cuello || null,
            SistemaRespiratorio || null, SistemaCardiovascular || null, Abdomen || null,
            SistemaDigestivo || null, SistemaUrinario || null, SistemaReproductivo || null,
            SistemaMusculoesqueletico || null, PielYPelaje || null, SistemaNeurologico || null,
            Ganglios || null, OtrosHallazgos || null, ObservacionesGenerales || null,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Examen físico no encontrado' });
        }
        res.json({ ok: true, mensaje: 'Examen físico actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar examen físico:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al actualizar examen físico', error: error.message });
    }
});

module.exports = router;
