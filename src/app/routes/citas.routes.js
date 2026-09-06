const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql.js');

// ========================================
// LISTAR CITAS
// ========================================
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                c.*,
                m.Nombre AS NombreMascota,
                m.Especie,
                m.Raza,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario,
                s.Nombre AS NombreServicio,
                s.Precio,
                s.IdCategoriaServicio
            FROM citas c
            INNER JOIN mascotas m ON c.IdMascota = m.IdMascota
            INNER JOIN veterinarios v ON c.IdVeterinario = v.IdVeterinario
            INNER JOIN servicios s ON c.IdServicio = s.IdServicio
            WHERE c.IdEmpresa = ?
            ORDER BY c.FechaCita DESC, c.HoraCita DESC
        `, [req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar citas:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar citas', error: error.message });
    }
});

// ========================================
// OBTENER CITA POR ID
// ========================================
router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [rows] = await pool.query(`
            SELECT 
                c.*,
                m.Nombre AS NombreMascota,
                m.Especie,
                m.Raza,
                m.Sexo,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario,
                v.TarjetaProfesional,
                v.Especialidad,
                s.Nombre AS NombreServicio,
                s.Precio,
                CONCAT(cl.PrimerNombre, ' ', cl.PrimerApellido) AS NombreCliente,
                cl.Telefono AS TelefonoCliente
            FROM citas c
            INNER JOIN mascotas m ON c.IdMascota = m.IdMascota
            INNER JOIN veterinarios v ON c.IdVeterinario = v.IdVeterinario
            INNER JOIN servicios s ON c.IdServicio = s.IdServicio
            INNER JOIN clientes cl ON m.ClienteId = cl.ClienteId
            WHERE c.IdCita = ? AND c.IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        if (rows.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada' });
        }
        res.json({ ok: true, datos: rows[0] });
    } catch (error) {
        console.error('Error al obtener cita:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener cita', error: error.message });
    }
});

// ========================================
// CREAR CITA
// ========================================
router.post('/', async (req, res) => {
    try {
        const {
            IdMascota,
            IdVeterinario,
            IdServicio,
            FechaCita,
            HoraCita,
            Estado,
            MotivoConsulta,
            Observaciones,
            Precio,
            UsuarioIdVeterinario,
            UsuarioIdCreacion
        } = req.body;

        if (!IdMascota || !IdVeterinario || !IdServicio || !FechaCita || !HoraCita) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Los campos IdMascota, IdVeterinario, IdServicio, FechaCita y HoraCita son obligatorios'
            });
        }

        const [result] = await pool.query(`
            INSERT INTO citas (
                IdMascota, IdVeterinario, IdServicio, FechaCita, HoraCita,
                Estado, MotivoConsulta, Observaciones, Precio,
                UsuarioIdVeterinario, FechaCreacion, UsuarioIdCreacion,
                IdEmpresa
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?, ?)
        `, [
            IdMascota,
            IdVeterinario,
            IdServicio,
            FechaCita,
            HoraCita,
            Estado || 'Pendiente',
            MotivoConsulta || null,
            Observaciones || null,
            Precio ?? 0,
            UsuarioIdVeterinario || null,
            UsuarioIdCreacion || null,
            req.auth.IdEmpresa
        ]);

        res.status(201).json({
            ok: true,
            mensaje: 'Cita creada correctamente',
            IdCita: result.insertId
        });
    } catch (error) {
        console.error('Error al crear cita:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al crear cita', error: error.message });
    }
});

// ========================================
// ACTUALIZAR CITA
// ========================================
router.put('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const {
            IdMascota,
            IdVeterinario,
            IdServicio,
            FechaCita,
            HoraCita,
            Estado,
            MotivoConsulta,
            Observaciones,
            Precio,
            UsuarioIdModificacion
        } = req.body;

        const [result] = await pool.query(`
            UPDATE citas SET
                IdMascota = ?,
                IdVeterinario = ?,
                IdServicio = ?,
                FechaCita = ?,
                HoraCita = ?,
                Estado = ?,
                MotivoConsulta = ?,
                Observaciones = ?,
                Precio = ?,
                FechaModificacion = NOW(),
                UsuarioIdModificacion = ?
            WHERE IdCita = ? AND IdEmpresa = ?
        `, [
            IdMascota,
            IdVeterinario,
            IdServicio,
            FechaCita,
            HoraCita,
            Estado,
            MotivoConsulta || null,
            Observaciones || null,
            Precio ?? 0,
            UsuarioIdModificacion || null,
            id,
            req.auth.IdEmpresa
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada' });
        }
        res.json({ ok: true, mensaje: 'Cita actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar cita:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al actualizar cita', error: error.message });
    }
});

// ========================================
// ELIMINAR CITA (soft delete)
// ========================================
router.delete('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [result] = await pool.query(`
            UPDATE citas SET
                Estado = 'Cancelada',
                FechaModificacion = NOW()
            WHERE IdCita = ? AND IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Cita no encontrada' });
        }
        res.json({ ok: true, mensaje: 'Cita cancelada correctamente' });
    } catch (error) {
        console.error('Error al cancelar cita:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al cancelar cita', error: error.message });
    }
});

// ========================================
// LISTAR CITAS POR MASCOTA
// ========================================
router.get('/mascota/:idMascota', async (req, res) => {
    try {
        const idMascota = Number(req.params.idMascota);
        const [rows] = await pool.query(`
            SELECT 
                c.*,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario,
                s.Nombre AS NombreServicio
            FROM citas c
            INNER JOIN veterinarios v ON c.IdVeterinario = v.IdVeterinario
            INNER JOIN servicios s ON c.IdServicio = s.IdServicio
            WHERE c.IdMascota = ? AND c.IdEmpresa = ?
            ORDER BY c.FechaCita DESC, c.HoraCita DESC
        `, [idMascota, req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar citas por mascota:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar citas', error: error.message });
    }
});

// ========================================
// LISTAR CITAS POR FECHA
// ========================================
router.get('/fecha/:fecha', async (req, res) => {
    try {
        const fecha = req.params.fecha;
        const [rows] = await pool.query(`
            SELECT 
                c.*,
                m.Nombre AS NombreMascota,
                m.Especie,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario,
                s.Nombre AS NombreServicio
            FROM citas c
            INNER JOIN mascotas m ON c.IdMascota = m.IdMascota
            INNER JOIN veterinarios v ON c.IdVeterinario = v.IdVeterinario
            INNER JOIN servicios s ON c.IdServicio = s.IdServicio
            WHERE c.FechaCita = ? AND c.IdEmpresa = ?
            ORDER BY c.HoraCita ASC
        `, [fecha, req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar citas por fecha:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar citas', error: error.message });
    }
});

// ========================================
// LISTAR CITAS POR VETERINARIO
// ========================================
router.get('/veterinario/:idVeterinario', async (req, res) => {
    try {
        const idVeterinario = Number(req.params.idVeterinario);
        const [rows] = await pool.query(`
            SELECT 
                c.*,
                m.Nombre AS NombreMascota,
                m.Especie,
                s.Nombre AS NombreServicio
            FROM citas c
            INNER JOIN mascotas m ON c.IdMascota = m.IdMascota
            INNER JOIN servicios s ON c.IdServicio = s.IdServicio
            WHERE c.IdVeterinario = ? AND c.IdEmpresa = ?
            ORDER BY c.FechaCita DESC, c.HoraCita DESC
        `, [idVeterinario, req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar citas por veterinario:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar citas', error: error.message });
    }
});

module.exports = router;
