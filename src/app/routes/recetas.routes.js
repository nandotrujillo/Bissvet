const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql.js');

// ========================================
// LISTAR RECETAS
// ========================================
router.get('/', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                r.*,
                hc.IdMascota,
                m.Nombre AS NombreMascota,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario,
                v.TarjetaProfesional,
                (SELECT COUNT(*) FROM detallerecetas dr WHERE dr.IdReceta = r.IdReceta AND dr.IdEmpresa = r.IdEmpresa) AS TotalMedicamentos
            FROM recetas r
            INNER JOIN historiasclinicas hc ON r.IdHistoriaClinica = hc.IdHistoriaClinica
            INNER JOIN mascotas m ON hc.IdMascota = m.IdMascota
            INNER JOIN veterinarios v ON r.IdVeterinario = v.IdVeterinario
            WHERE r.IdEmpresa = ?
            ORDER BY r.Fecha DESC
        `, [req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar recetas:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar recetas', error: error.message });
    }
});

// ========================================
// LISTAR RECETAS POR HISTORIA CLINICA
// ========================================
router.get('/historia/:idHistoriaClinica', async (req, res) => {
    try {
        const idHistoriaClinica = Number(req.params.idHistoriaClinica);
        const [rows] = await pool.query(`
            SELECT 
                r.*,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario,
                v.TarjetaProfesional
            FROM recetas r
            INNER JOIN veterinarios v ON r.IdVeterinario = v.IdVeterinario
            WHERE r.IdHistoriaClinica = ? AND r.IdEmpresa = ?
            ORDER BY r.Fecha DESC
        `, [idHistoriaClinica, req.auth.IdEmpresa]);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error al listar recetas:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al listar recetas', error: error.message });
    }
});

// ========================================
// OBTENER RECETA POR ID CON DETALLE
// ========================================
router.get('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);

        const [receta] = await pool.query(`
            SELECT 
                r.*,
                hc.IdMascota,
                hc.FechaAtencion,
                m.Nombre AS NombreMascota,
                m.Especie,
                m.Raza,
                m.Sexo,
                m.Edad,
                CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario,
                v.TarjetaProfesional,
                v.Especialidad,
                CONCAT(cl.PrimerNombre, ' ', cl.PrimerApellido) AS NombreCliente,
                cl.Telefono AS TelefonoCliente,
                cl.Direccion AS DireccionCliente
            FROM recetas r
            INNER JOIN historiasclinicas hc ON r.IdHistoriaClinica = hc.IdHistoriaClinica
            INNER JOIN mascotas m ON hc.IdMascota = m.IdMascota
            INNER JOIN veterinarios v ON r.IdVeterinario = v.IdVeterinario
            INNER JOIN clientes cl ON m.ClienteId = cl.ClienteId
            WHERE r.IdReceta = ? AND r.IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        if (receta.length === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Receta no encontrada' });
        }

        const [detalle] = await pool.query(`
            SELECT * FROM detallerecetas
            WHERE IdReceta = ? AND IdEmpresa = ?
            ORDER BY IdDetalleReceta ASC
        `, [id, req.auth.IdEmpresa]);

        res.json({
            ok: true,
            datos: {
                ...receta[0],
                detalle
            }
        });
    } catch (error) {
        console.error('Error al obtener receta:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al obtener receta', error: error.message });
    }
});

// ========================================
// CREAR RECETA CON DETALLE (TRANSACCIONAL)
// ========================================
router.post('/', async (req, res) => {
    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        const {
            IdHistoriaClinica,
            IdVeterinario,
            Observaciones,
            IndicacionesGenerales,
            Estado,
            UsuarioIdCreacion,
            detalle
        } = req.body;

        if (!IdHistoriaClinica || !IdVeterinario) {
            return res.status(400).json({
                ok: false,
                mensaje: 'Los campos IdHistoriaClinica y IdVeterinario son obligatorios'
            });
        }

        const [result] = await conn.query(`
            INSERT INTO recetas (
                IdHistoriaClinica, Fecha, IdVeterinario,
                Observaciones, IndicacionesGenerales, Estado,
                FechaCreacion, UsuarioIdCreacion,
                IdEmpresa
            ) VALUES (?, NOW(), ?, ?, ?, ?, NOW(), ?, ?)
        `, [
            IdHistoriaClinica,
            IdVeterinario,
            Observaciones || null,
            IndicacionesGenerales || null,
            Estado || 'Activa',
            req.auth.UsuarioId,
            req.auth.IdEmpresa
        ]);

        const IdReceta = result.insertId;

        if (detalle && detalle.length > 0) {
            for (const item of detalle) {
                await conn.query(`
                    INSERT INTO detallerecetas (
                        IdReceta, IdProducto, Medicamento, Concentracion,
                        FormaFarmaceutica, Dosis, UnidadDosis, Frecuencia,
                        ViaAdministracion, Duracion, Cantidad,
                        Indicaciones, Observaciones, FechaCreacion,
                        IdEmpresa
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), ?)
                `, [
                    IdReceta,
                    item.IdProducto || null,
                    item.Medicamento,
                    item.Concentracion || null,
                    item.FormaFarmaceutica || null,
                    item.Dosis || null,
                    item.UnidadDosis || null,
                    item.Frecuencia || null,
                    item.ViaAdministracion || null,
                    item.Duracion || null,
                    item.Cantidad || null,
                    item.Indicaciones || null,
                    item.Observaciones || null,
                    req.auth.IdEmpresa
                ]);
            }
        }

        await conn.commit();
        res.status(201).json({ ok: true, mensaje: 'Receta creada correctamente', IdReceta });
    } catch (error) {
        await conn.rollback();
        console.error('Error al crear receta:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al crear receta', error: error.message });
    } finally {
        conn.release();
    }
});

// ========================================
// ACTUALIZAR RECETA
// ========================================
router.put('/:id', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const {
            Observaciones,
            IndicacionesGenerales,
            Estado
        } = req.body;

        const [result] = await pool.query(`
            UPDATE recetas SET
                Observaciones = ?,
                IndicacionesGenerales = ?,
                Estado = ?
            WHERE IdReceta = ? AND IdEmpresa = ?
        `, [
            Observaciones || null,
            IndicacionesGenerales || null,
            Estado,
            id,
            req.auth.IdEmpresa
        ]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Receta no encontrada' });
        }
        res.json({ ok: true, mensaje: 'Receta actualizada correctamente' });
    } catch (error) {
        console.error('Error al actualizar receta:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al actualizar receta', error: error.message });
    }
});

// ========================================
// CANCELAR RECETA
// ========================================
router.put('/:id/cancelar', async (req, res) => {
    try {
        const id = Number(req.params.id);
        const [result] = await pool.query(`
            UPDATE recetas SET Estado = 'Cancelada' WHERE IdReceta = ? AND IdEmpresa = ?
        `, [id, req.auth.IdEmpresa]);

        if (result.affectedRows === 0) {
            return res.status(404).json({ ok: false, mensaje: 'Receta no encontrada' });
        }
        res.json({ ok: true, mensaje: 'Receta cancelada correctamente' });
    } catch (error) {
        console.error('Error al cancelar receta:', error);
        res.status(500).json({ ok: false, mensaje: 'Error al cancelar receta', error: error.message });
    }
});

// ========================================
// ELIMINAR RECETA (historico, no se permite)
// ========================================
router.delete('/:id', async (req, res) => {
    return res.status(403).json({
        ok: false,
        mensaje: 'No se permite eliminar recetas. La información clínica es histórica.'
    });
});

module.exports = router;
