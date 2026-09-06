const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql');

// =====================================================
// LISTAR PROVEEDORES  (GET /api/proveedores)
// Filtros: ?buscar=nombre, ?activo=1
// =====================================================
router.get('/', async (req, res) => {
    try {
        const condiciones = ['pr.IdEmpresa = ?'];
        const params = [req.auth.IdEmpresa];
        if (req.query.activo !== undefined) { condiciones.push('pr.Activo = ?'); params.push(Number(req.query.activo)); }
        if (req.query.buscar) {
            condiciones.push('(pr.Nombre LIKE ? OR pr.Nit LIKE ?)');
            const term = `%${req.query.buscar}%`; params.push(term, term);
        }
        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';

        const [rows] = await pool.query(`
            SELECT pr.IdProveedor, pr.TipoDocumento, pr.NumeroDocumento, pr.Nit,
                   pr.Nombre, pr.Telefono, pr.Email, pr.Direccion,
                   pr.IdCiudad, c.Ciudad AS NombreCiudad,
                   pr.Contacto, pr.Activo,
                   pr.FechaCreacion, pr.FechaModificacion
            FROM proveedores pr
            LEFT JOIN ciudades c ON c.Id = pr.IdCiudad
            ${where} ORDER BY pr.Nombre
        `, params);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error listando proveedores:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando proveedores', error: error.message });
    }
});

// =====================================================
// OBTENER PROVEEDOR  (GET /api/proveedores/:id)
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT pr.*, c.Ciudad AS NombreCiudad
            FROM proveedores pr
            LEFT JOIN ciudades c ON c.Id = pr.IdCiudad
            WHERE pr.IdProveedor = ? AND pr.IdEmpresa = ?
        `, [req.params.id, req.auth.IdEmpresa]);
        if (rows.length === 0)
            return res.status(404).json({ ok: false, mensaje: 'Proveedor no encontrado' });
        res.json({ ok: true, datos: rows[0] });
    } catch (error) {
        console.error('Error obteniendo proveedor:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando proveedor', error: error.message });
    }
});

// =====================================================
// CREAR PROVEEDOR  (POST /api/proveedores)
// =====================================================
router.post('/', async (req, res) => {
    try {
        const {
            TipoDocumento, NumeroDocumento, Nit, Nombre, Telefono, Email,
            Direccion, IdCiudad, Contacto, Activo, UsuarioIdCreacion
        } = req.body;

        if (!Nombre || !Nombre.trim())
            return res.status(400).json({ ok: false, mensaje: 'El nombre del proveedor es obligatorio' });

        const [resultado] = await pool.query(
            `INSERT INTO proveedores (
                TipoDocumento, NumeroDocumento, Nit, Nombre, Telefono, Email,
                Direccion, IdCiudad, Contacto, Activo, UsuarioIdCreacion, IdEmpresa
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                TipoDocumento || null, NumeroDocumento || null, Nit || null,
                Nombre.trim(), Telefono || null, Email || null,
                Direccion || null, IdCiudad || null, Contacto || null,
                Activo ?? 1, UsuarioIdCreacion || null, req.auth.IdEmpresa
            ]
        );
        res.status(201).json({ ok: true, mensaje: 'Proveedor creado', IdProveedor: resultado.insertId });
    } catch (error) {
        console.error('Error creando proveedor:', error);
        res.status(500).json({ ok: false, mensaje: 'Error creando proveedor', error: error.message });
    }
});

// =====================================================
// ACTUALIZAR PROVEEDOR  (PUT /api/proveedores/:id)
// =====================================================
router.put('/:id', async (req, res) => {
    try {
        const {
            TipoDocumento, NumeroDocumento, Nit, Nombre, Telefono, Email,
            Direccion, IdCiudad, Contacto, Activo, UsuarioIdModificacion
        } = req.body;

        if (!Nombre || !Nombre.trim())
            return res.status(400).json({ ok: false, mensaje: 'El nombre del proveedor es obligatorio' });

        const [resultado] = await pool.query(
            `UPDATE proveedores SET
                TipoDocumento=?, NumeroDocumento=?, Nit=?, Nombre=?, Telefono=?, Email=?,
                Direccion=?, IdCiudad=?, Contacto=?, Activo=?,
                FechaModificacion=NOW(), UsuarioIdModificacion=?
             WHERE IdProveedor=? AND IdEmpresa=?`,
            [
                TipoDocumento || null, NumeroDocumento || null, Nit || null,
                Nombre.trim(), Telefono || null, Email || null,
                Direccion || null, IdCiudad || null, Contacto || null,
                Activo ?? 1, UsuarioIdModificacion || null, req.params.id, req.auth.IdEmpresa
            ]
        );
        if (resultado.affectedRows === 0)
            return res.status(404).json({ ok: false, mensaje: 'Proveedor no encontrado' });
        res.json({ ok: true, mensaje: 'Proveedor actualizado' });
    } catch (error) {
        console.error('Error actualizando proveedor:', error);
        res.status(500).json({ ok: false, mensaje: 'Error actualizando proveedor', error: error.message });
    }
});

// =====================================================
// ELIMINAR PROVEEDOR  (DELETE /api/proveedores/:id)
// =====================================================
router.delete('/:id', async (req, res) => {
    try {
        const [compras] = await pool.query(
            `SELECT COUNT(*) AS total FROM compras WHERE IdProveedor = ? AND IdEmpresa = ? AND Estado != 'ANULADA'`,
            [req.params.id, req.auth.IdEmpresa]
        );
        if (compras[0].total > 0)
            return res.status(409).json({ ok: false, mensaje: 'No se puede eliminar: tiene compras activas asociadas' });

        const [resultado] = await pool.query(
            `DELETE FROM proveedores WHERE IdProveedor = ? AND IdEmpresa = ?`, [req.params.id, req.auth.IdEmpresa]
        );
        if (resultado.affectedRows === 0)
            return res.status(404).json({ ok: false, mensaje: 'Proveedor no encontrado' });
        res.json({ ok: true, mensaje: 'Proveedor eliminado' });
    } catch (error) {
        console.error('Error eliminando proveedor:', error);
        res.status(500).json({ ok: false, mensaje: 'Error eliminando proveedor', error: error.message });
    }
});

module.exports = router;