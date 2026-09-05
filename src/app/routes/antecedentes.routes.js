const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql.js');

// ========================================
// OBTENER ANTECEDENTES POR MASCOTA
// ========================================
router.get('/mascota/:idMascota', async (req, res) => {
    try {
        const idMascota = Number(req.params.idMascota);
        const [rows] = await pool.query(`
            SELECT * FROM antecedentes
            WHERE IdMascota = ?
        `, [idMascota]);

        res.json({ ok: true, datos: rows[0] || null });
    } catch (error) {
        console.error('Error al obtener antecedentes:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener antecedentes', error: error.message });
    }
});

// ========================================
// LISTAR TODOS LOS ANTECEDENTES
// ========================================
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                a.*,
                m.Nombre AS NombreMascota
            FROM antecedentes a
            INNER JOIN mascotas m ON a.IdMascota = m.IdMascota
            ORDER BY a.FechaModificacion DESC
        `);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar antecedentes:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar antecedentes', error: error.message });
    }
});

// ========================================
// OBTENER ANTECEDENTES POR ID
// ========================================
router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [rows] = await pool.query(`
            SELECT * FROM antecedentes WHERE IdAntecedente = ?
        `, [id]);

        if (rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Antecedentes no encontrados' });
        }
        res.json({ ok: true, datos: rows[0] });
    } catch (error) {
        console.error('Error al obtener antecedentes:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener antecedentes', error: error.message });
    }
});

// ========================================
// CREAR ANTECEDENTES
// ========================================
router.post('/', async (req, res) => {
    try {
        const {
            IdMascota,
            EnfermedadesAnteriores,
            CirugiasAnteriores,
            Alergias,
            Vacunacion,
            Desparasitacion,
            MedicamentosActuales,
            TratamientosAnteriores,
            AntecedentesHereditarios,
            Alimentacion,
            Habitos,
            Observaciones,
            UsuarioIdCreacion
        } = req.body;

        if (!IdMascota) {
            return res.status(400).json({ ok: false, mensaje: 'El campo IdMascota es obligatorio' });
        }

        const [existing] = await pool.query(
            `SELECT IdAntecedente FROM antecedentes WHERE IdMascota = ?`,
            [IdMascota]
        );

        if (existing.length > 0) {
            const [result] = await pool.query(`
                UPDATE antecedentes SET
                    EnfermedadesAnteriores = ?,
                    CirugiasAnteriores = ?,
                    Alergias = ?,
                    Vacunacion = ?,
                    Desparasitacion = ?,
                    MedicamentosActuales = ?,
                    TratamientosAnteriores = ?,
                    AntecedentesHereditarios = ?,
                    Alimentacion = ?,
                    Habitos = ?,
                    Observaciones = ?,
                    FechaModificacion = NOW(),
                    UsuarioIdModificacion = ?
                WHERE IdMascota = ?
            `, [
                EnfermedadesAnteriores || null,
                CirugiasAnteriores || null,
                Alergias || null,
                Vacunacion || null,
                Desparasitacion || null,
                MedicamentosActuales || null,
                TratamientosAnteriores || null,
                AntecedentesHereditarios || null,
                Alimentacion || null,
                Habitos || null,
                Observaciones || null,
                UsuarioIdCreacion || null,
                IdMascota
            ]);
            res.json({ ok: true, mensaje: 'Antecedentes actualizados correctamente', IdAntecedente: existing[0].IdAntecedente });
        } else {
            const [result] = await pool.query(`
                INSERT INTO antecedentes (
                    IdMascota, EnfermedadesAnteriores, CirugiasAnteriores, Alergias,
                    Vacunacion, Desparasitacion, MedicamentosActuales,
                    TratamientosAnteriores, AntecedentesHereditarios,
                    Alimentacion, Habitos, Observaciones,
                    FechaCreacion, UsuarioIdCreacion
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
            `, [
                IdMascota,
                EnfermedadesAnteriores || null,
                CirugiasAnteriores || null,
                Alergias || null,
                Vacunacion || null,
                Desparasitacion || null,
                MedicamentosActuales || null,
                TratamientosAnteriores || null,
                AntecedentesHereditarios || null,
                Alimentacion || null,
                Habitos || null,
                Observaciones || null,
                UsuarioIdCreacion || null
            ]);
            res.status(201).json({ ok: true, mensaje: 'Antecedentes creados correctamente', IdAntecedente: result.insertId });
        }
    } catch (error) {
        console.error('Error al crear antecedentes:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al crear antecedentes', error: error.message });
    }
});

// ========================================
// ACTUALIZAR ANTECEDENTES
// ========================================
router.put('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const {
            EnfermedadesAnteriores,
            CirugiasAnteriores,
            Alergias,
            Vacunacion,
            Desparasitacion,
            MedicamentosActuales,
            TratamientosAnteriores,
            AntecedentesHereditarios,
            Alimentacion,
            Habitos,
            Observaciones,
            UsuarioIdModificacion
        } = req.body;

        const [result] = await pool.query(`
            UPDATE antecedentes SET
                EnfermedadesAnteriores = ?,
                CirugiasAnteriores = ?,
                Alergias = ?,
                Vacunacion = ?,
                Desparasitacion = ?,
                MedicamentosActuales = ?,
                TratamientosAnteriores = ?,
                AntecedentesHereditarios = ?,
                Alimentacion = ?,
                Habitos = ?,
                Observaciones = ?,
                FechaModificacion = NOW(),
                UsuarioIdModificacion = ?
            WHERE IdAntecedente = ?
        `, [
            EnfermedadesAnteriores || null,
            CirugiasAnteriores || null,
            Alergias || null,
            Vacunacion || null,
            Desparasitacion || null,
            MedicamentosActuales || null,
            TratamientosAnteriores || null,
            AntecedentesHereditarios || null,
            Alimentacion || null,
            Habitos || null,
            Observaciones || null,
            UsuarioIdModificacion || null,
            id
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Antecedentes no encontrados' });
        }
        res.json({ ok: true, mensaje: 'Antecedentes actualizados correctamente' });
    } catch (error) {
        console.error('Error al actualizar antecedentes:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al actualizar antecedentes', error: error.message });
    }
});

module.exports = router;
