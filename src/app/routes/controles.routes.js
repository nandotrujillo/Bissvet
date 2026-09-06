const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql.js');

// ========================================
// LISTAR CONTROLES
// ========================================
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                con.*,
                m.Nombre AS NombreMascota,
                m.Especie,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario,
                CONCAT(cl.PrimerNombre, ' ', cl.PrimerApellido) AS NombreCliente,
                cl.Telefono AS TelefonoCliente
            FROM controles con
            INNER JOIN mascotas m ON con.IdMascota = m.IdMascota
            INNER JOIN veterinarios v ON con.IdVeterinario = v.IdVeterinario
            INNER JOIN clientes cl ON m.ClienteId = cl.ClienteId
            WHERE con.IdEmpresa = ?
            ORDER BY con.FechaControl DESC
        `, [req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar controles:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar controles', error: error.message });
    }
});

// ========================================
// LISTAR CONTROLES POR MASCOTA
// ========================================
router.get('/mascota/:idMascota', async (req, res) => {
    try {
        const idMascota = Number(req.params.idMascota);
        const [rows] = await pool.query(`
            SELECT 
                con.*,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario
            FROM controles con
            INNER JOIN veterinarios v ON con.IdVeterinario = v.IdVeterinario
            WHERE con.IdMascota = ? AND con.IdEmpresa = ?
            ORDER BY con.FechaControl DESC
        `, [idMascota, req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar controles por mascota:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar controles', error: error.message });
    }
});

// ========================================
// LISTAR CONTROLES POR HISTORIA CLINICA
// ========================================
router.get('/historia/:idHistoriaClinica', async (req, res) => {
    try {
        const idHistoriaClinica = Number(req.params.idHistoriaClinica);
        const [rows] = await pool.query(`
            SELECT 
                con.*,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario
            FROM controles con
            INNER JOIN veterinarios v ON con.IdVeterinario = v.IdVeterinario
            WHERE con.IdHistoriaClinica = ? AND con.IdEmpresa = ?
            ORDER BY con.FechaControl DESC
        `, [idHistoriaClinica, req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar controles por historia:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar controles', error: error.message });
    }
});

// ========================================
// LISTAR PROXIMOS CONTROLES
// ========================================
router.get('/proximos', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                con.IdControl,
                con.IdMascota,
                m.Nombre AS NombreMascota,
                m.Especie,
                CONCAT(cl.PrimerNombre, ' ', cl.PrimerApellido) AS NombreCliente,
                cl.Telefono,
                con.ProximoControl,
                con.Motivo,
                con.Recomendaciones,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario
            FROM controles con
            INNER JOIN mascotas m ON con.IdMascota = m.IdMascota
            INNER JOIN clientes cl ON m.ClienteId = cl.ClienteId
            INNER JOIN veterinarios v ON con.IdVeterinario = v.IdVeterinario
            WHERE con.ProximoControl IS NOT NULL
              AND con.ProximoControl >= CURDATE()
              AND con.IdEmpresa = ?
            ORDER BY con.ProximoControl ASC
        `, [req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar próximos controles:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar próximos controles', error: error.message });
    }
});

// ========================================
// OBTENER CONTROL POR ID
// ========================================
router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [rows] = await pool.query(`
            SELECT 
                con.*,
                m.Nombre AS NombreMascota,
                m.Especie,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario
            FROM controles con
            INNER JOIN mascotas m ON con.IdMascota = m.IdMascota
            INNER JOIN veterinarios v ON con.IdVeterinario = v.IdVeterinario
            WHERE con.IdControl = ? AND con.IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        if (rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Control no encontrado' });
        }
        res.json({ ok: true, datos: rows[0] });
    } catch (error) {
        console.error('Error al obtener control:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener control', error: error.message });
    }
});

// ========================================
// CREAR CONTROL
// ========================================
router.post('/', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const {
            IdHistoriaClinica, IdMascota, IdVeterinario, IdCirugia,
            FechaControl, Motivo, Evolucion, Peso, SignosVitales,
            Observaciones, Recomendaciones, ProximoControl,
            UsuarioIdCreacion
        } = req.body;

        if (!IdMascota || !IdVeterinario || !FechaControl) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Los campos IdMascota, IdVeterinario y FechaControl son obligatorios'
            });
        }

        const [result] = await conn.query(`
            INSERT INTO controles (
                IdHistoriaClinica, IdMascota, IdVeterinario, IdCirugia,
                FechaControl, Motivo, Evolucion, Peso, SignosVitales,
                Observaciones, Recomendaciones, ProximoControl,
                FechaCreacion, UsuarioIdCreacion,
                IdEmpresa
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
        `, [
            IdHistoriaClinica || null,
            IdMascota,
            IdVeterinario,
            IdCirugia || null,
            FechaControl,
            Motivo || null,
            Evolucion || null,
            Peso || null,
            SignosVitales || null,
            Observaciones || null,
            Recomendaciones || null,
            ProximoControl || null,
            UsuarioIdCreacion || null,
            req.auth.IdEmpresa
        ]);

        const IdControl = result.insertId;

        if (ProximoControl) {
            await conn.query(`
                INSERT INTO alertascontroles (
                    IdMascota, IdHistoriaClinica, IdControl,
                    TipoAlerta, FechaAlerta, Descripcion, Estado,
                    FechaCreacion, UsuarioIdCreacion,
                    IdEmpresa
                ) VALUES (?, ?, ?, 'Control', ?, ?, 'Pendiente', NOW(), ?, ?)
            `, [
                IdMascota,
                IdHistoriaClinica || null,
                IdControl,
                ProximoControl,
                Motivo || 'Control programado',
                UsuarioIdCreacion || null,
                req.auth.IdEmpresa
            ]);
        }

        await conn.commit();
        res.status(201).json({ ok: true, mensaje: 'Control registrado correctamente', IdControl });
    } catch (error) {
        await conn.rollback();
        console.error('Error al crear control:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al crear control', error: error.message });
    } finally {
        conn.release();
    }
});

// ========================================
// ACTUALIZAR CONTROL
// ========================================
router.put('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const {
            FechaControl, Motivo, Evolucion, Peso, SignosVitales,
            Observaciones, Recomendaciones, ProximoControl
        } = req.body;

        const [result] = await pool.query(`
            UPDATE controles SET
                FechaControl = ?,
                Motivo = ?,
                Evolucion = ?,
                Peso = ?,
                SignosVitales = ?,
                Observaciones = ?,
                Recomendaciones = ?,
                ProximoControl = ?
            WHERE IdControl = ? AND IdEmpresa = ?
        `, [
            FechaControl,
            Motivo || null,
            Evolucion || null,
            Peso || null,
            SignosVitales || null,
            Observaciones || null,
            Recomendaciones || null,
            ProximoControl || null,
            id,
            req.auth.IdEmpresa
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Control no encontrado' });
        }
        res.json({ ok: true, mensaje: 'Control actualizado correctamente' });
    } catch (error) {
        console.error('Error al actualizar control:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al actualizar control', error: error.message });
    }
});

// ========================================
// ELIMINAR CONTROL (historico, no se permite)
// ========================================
router.delete('/:id', async (req, res) => {
    return res.status(403).json({
        ok: false,
        mensaje: 'No se permite eliminar controles. La información clínica es histórica.'
    });
});

module.exports = router;
