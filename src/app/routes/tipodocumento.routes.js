const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql');

// =====================================================
// LISTAR TIPOS DE DOCUMENTO
// GET /api/tipos-documento  (?activos=1 para solo activos)
// =====================================================
router.get('/', async (req, res) => {
    try {
        const condiciones = ['IdEmpresa = ?'];
        const params = [req.auth.IdEmpresa];
        if (req.query.activos) {
            condiciones.push('Estatus = 1');
        }
        const where = condiciones.join(' AND ');
        const [rows] = await pool.query(`
            SELECT Id, Codigo, Documento, Estatus
            FROM tipodocumento
            WHERE ${where}
            ORDER BY Documento
        `, params);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error listando tipos de documento:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando tipos de documento', error: error.message });
    }
});

// =====================================================
// OBTENER TIPO DE DOCUMENTO
// GET /api/tipos-documento/:id
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(
            `SELECT * FROM tipodocumento WHERE Id = ? AND IdEmpresa = ?`,
            [req.params.id, req.auth.IdEmpresa]
        );
        if (rows.length === 0)
            return res.status(404).json({ ok: false, mensaje: 'Tipo de documento no encontrado' });
        res.json({ ok: true, datos: rows[0] });
    } catch (error) {
        console.error('Error obteniendo tipo de documento:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando tipo de documento', error: error.message });
    }
});

// =====================================================
// CREAR TIPO DE DOCUMENTO
// POST /api/tipos-documento
// =====================================================
router.post('/', async (req, res) => {
    try {
        const { Codigo, Documento, Estatus } = req.body;
        if (!Codigo || !Codigo.trim())
            return res.status(400).json({ ok: false, mensaje: 'El código es obligatorio' });
        if (!Documento || !Documento.trim())
            return res.status(400).json({ ok: false, mensaje: 'El documento es obligatorio' });

        const [duplicado] = await pool.query(
            `SELECT Id FROM tipodocumento WHERE Documento = ? AND IdEmpresa = ?`,
            [Documento.trim(), req.auth.IdEmpresa]
        );
        if (duplicado.length > 0)
            return res.status(409).json({ ok: false, mensaje: 'El tipo de documento ya existe' });

        const [[siguiente]] = await pool.query(
            `SELECT IFNULL(MAX(Id), 0) + 1 AS siguiente FROM tipodocumento`
        );

        const [resultado] = await pool.query(
            `INSERT INTO tipodocumento (Id, Codigo, Documento, Estatus, IdEmpresa)
             VALUES (?, ?, ?, ?, ?)`,
            [siguiente.siguiente, Codigo.trim(), Documento.trim(), Estatus ?? 1, req.auth.IdEmpresa]
        );
        res.status(201).json({ ok: true, mensaje: 'Tipo de documento creado', Id: resultado.insertId });
    } catch (error) {
        console.error('Error creando tipo de documento:', error);
        res.status(500).json({ ok: false, mensaje: 'Error creando tipo de documento', error: error.message });
    }
});

// =====================================================
// ACTUALIZAR TIPO DE DOCUMENTO
// PUT /api/tipos-documento/:id
// =====================================================
router.put('/:id', async (req, res) => {
    try {
        const { Codigo, Documento, Estatus } = req.body;
        if (!Codigo || !Codigo.trim())
            return res.status(400).json({ ok: false, mensaje: 'El código es obligatorio' });
        if (!Documento || !Documento.trim())
            return res.status(400).json({ ok: false, mensaje: 'El documento es obligatorio' });

        const [duplicado] = await pool.query(
            `SELECT Id FROM tipodocumento WHERE Documento = ? AND IdEmpresa = ? AND Id <> ?`,
            [Documento.trim(), req.auth.IdEmpresa, req.params.id]
        );
        if (duplicado.length > 0)
            return res.status(409).json({ ok: false, mensaje: 'El tipo de documento ya existe' });

        const [resultado] = await pool.query(
            `UPDATE tipodocumento
             SET Codigo = ?, Documento = ?, Estatus = ?
             WHERE Id = ? AND IdEmpresa = ?`,
            [Codigo.trim(), Documento.trim(), Estatus ?? 1, req.params.id, req.auth.IdEmpresa]
        );
        if (resultado.affectedRows === 0)
            return res.status(404).json({ ok: false, mensaje: 'Tipo de documento no encontrado' });
        res.json({ ok: true, mensaje: 'Tipo de documento actualizado' });
    } catch (error) {
        console.error('Error actualizando tipo de documento:', error);
        res.status(500).json({ ok: false, mensaje: 'Error actualizando tipo de documento', error: error.message });
    }
});

// =====================================================
// ELIMINAR TIPO DE DOCUMENTO
// DELETE /api/tipos-documento/:id
// =====================================================
router.delete('/:id', async (req, res) => {
    try {
        const [resultado] = await pool.query(
            `DELETE FROM tipodocumento WHERE Id = ? AND IdEmpresa = ?`,
            [req.params.id, req.auth.IdEmpresa]
        );
        if (resultado.affectedRows === 0)
            return res.status(404).json({ ok: false, mensaje: 'Tipo de documento no encontrado' });
        res.json({ ok: true, mensaje: 'Tipo de documento eliminado' });
    } catch (error) {
        console.error('Error eliminando tipo de documento:', error);
        res.status(500).json({ ok: false, mensaje: 'Error eliminando tipo de documento', error: error.message });
    }
});

module.exports = router;