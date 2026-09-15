const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql');

// =====================================================
// LISTAR TIPOS DE PAGO
// GET /api/tipos-pago  (?activos=1 para solo activos)
// =====================================================
router.get('/', async (req, res) => {
    try {
        const condiciones = ['IdEmpresa = ?'];
        const params = [req.auth.IdEmpresa];
        if (req.query.activos) {
            condiciones.push('Activo = 1');
        }
        const where = condiciones.join(' AND ');
        const [rows] = await pool.query(`
            SELECT Id, Nombre, Descripcion, Activo,
                   FechaCreacion, FechaModificacion
            FROM tipospago
            WHERE ${where}
            ORDER BY Nombre
        `, params);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error listando tipos de pago:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando tipos de pago', error: error.message });
    }
});

// =====================================================
// OBTENER TIPO DE PAGO
// GET /api/tipos-pago/:id
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM tipospago WHERE Id = ? AND IdEmpresa = ?`,
            [req.params.id, req.auth.IdEmpresa]
        );
        if (rows.length === 0)
            return res.status(404).json({ ok: false, mensaje: 'Tipo de pago no encontrado' });
        res.json({ ok: true, datos: rows[0] });
    } catch (error) {
        console.error('Error obteniendo tipo de pago:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando tipo de pago', error: error.message });
    }
});

// =====================================================
// CREAR TIPO DE PAGO
// POST /api/tipos-pago
// =====================================================
router.post('/', async (req, res) => {
    try {
        const { Nombre, Descripcion, Activo } = req.body;
        if (!Nombre || !Nombre.trim())
            return res.status(400).json({ ok: false, mensaje: 'El nombre es obligatorio' });

        const [duplicado] = await pool.query(
            `SELECT Id FROM tipospago WHERE Nombre = ? AND IdEmpresa = ?`,
            [Nombre.trim(), req.auth.IdEmpresa]
        );
        if (duplicado.length > 0)
            return res.status(409).json({ ok: false, mensaje: 'El tipo de pago ya existe' });

        const [resultado] = await pool.query(
            `INSERT INTO tipospago (Nombre, Descripcion, Activo, UsuarioIdCreacion, IdEmpresa)
             VALUES (?, ?, ?, ?, ?)`,
            [Nombre.trim(), Descripcion || null, Activo ?? 1, req.auth.UsuarioId, req.auth.IdEmpresa]
        );
        res.status(201).json({ ok: true, mensaje: 'Tipo de pago creado', Id: resultado.insertId });
    } catch (error) {
        console.error('Error creando tipo de pago:', error);
        res.status(500).json({ ok: false, mensaje: 'Error creando tipo de pago', error: error.message });
    }
});

// =====================================================
// ACTUALIZAR TIPO DE PAGO
// PUT /api/tipos-pago/:id
// =====================================================
router.put('/:id', async (req, res) => {
    try {
        const { Nombre, Descripcion, Activo } = req.body;
        if (!Nombre || !Nombre.trim())
            return res.status(400).json({ ok: false, mensaje: 'El nombre es obligatorio' });

        const [duplicado] = await pool.query(
            `SELECT Id FROM tipospago WHERE Nombre = ? AND IdEmpresa = ? AND Id <> ?`,
            [Nombre.trim(), req.auth.IdEmpresa, req.params.id]
        );
        if (duplicado.length > 0)
            return res.status(409).json({ ok: false, mensaje: 'El tipo de pago ya existe' });

        const [resultado] = await pool.query(
            `UPDATE tipospago
             SET Nombre = ?, Descripcion = ?, Activo = ?,
                 FechaModificacion = NOW(), UsuarioIdModificacion = ?
             WHERE Id = ? AND IdEmpresa = ?`,
            [Nombre.trim(), Descripcion || null, Activo ?? 1, req.auth.UsuarioId, req.params.id, req.auth.IdEmpresa]
        );
        if (resultado.affectedRows === 0)
            return res.status(404).json({ ok: false, mensaje: 'Tipo de pago no encontrado' });
        res.json({ ok: true, mensaje: 'Tipo de pago actualizado' });
    } catch (error) {
        console.error('Error actualizando tipo de pago:', error);
        res.status(500).json({ ok: false, mensaje: 'Error actualizando tipo de pago', error: error.message });
    }
});

// =====================================================
// ELIMINAR TIPO DE PAGO
// DELETE /api/tipos-pago/:id
// =====================================================
router.delete('/:id', async (req, res) => {
    try {
        const [resultado] = await pool.query(
            `DELETE FROM tipospago WHERE Id = ? AND IdEmpresa = ?`,
            [req.params.id, req.auth.IdEmpresa]
        );
        if (resultado.affectedRows === 0)
            return res.status(404).json({ ok: false, mensaje: 'Tipo de pago no encontrado' });
        res.json({ ok: true, mensaje: 'Tipo de pago eliminado' });
    } catch (error) {
        console.error('Error eliminando tipo de pago:', error);
        res.status(500).json({ ok: false, mensaje: 'Error eliminando tipo de pago', error: error.message });
    }
});

module.exports = router;