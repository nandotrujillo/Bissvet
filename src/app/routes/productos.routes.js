const express = require('express');
const router = express.Router();
const pool = require('../../database/mysql');

const SELECT_CON_JOINS = `
    SELECT
        p.IdProducto, p.CodigoProducto, p.CodigoBarras, p.NombreProducto,
        p.Descripcion, p.IdCategoriaProducto, cp.Nombre AS Categoria,
        p.IdUnidadMedida, um.Unidad AS UnidadMedida,
        p.IdMarca, m.Nombre AS NombreMarca,
        p.Referencia, p.PrecioVenta, p.CostoActual, p.CostoPromedio,
        p.StockMinimo, p.StockMaximo,
        p.ManejaInventario, p.PermiteVenta, p.Activo,
        p.FechaCreacion, p.FechaModificacion
    FROM productos p
    LEFT JOIN categoriasproducto cp ON cp.IdCategoriaProducto = p.IdCategoriaProducto
    LEFT JOIN unidades_medida um     ON um.Id = p.IdUnidadMedida
    LEFT JOIN marcas m               ON m.Id = p.IdMarca
`;

// =====================================================
// LISTAR PRODUCTOS  (GET /api/productos)
// Filtros query: ?activo=1, ?categoria=1, ?buscar=nombre
// =====================================================
router.get('/', async (req, res) => {
    try {
        const condiciones = ['p.IdEmpresa = ?'];
        const params = [req.auth.IdEmpresa];

        if (req.query.activo !== undefined) {
            condiciones.push('p.Activo = ?');
            params.push(Number(req.query.activo));
        }
        if (req.query.categoria) {
            condiciones.push('p.IdCategoriaProducto = ?');
            params.push(Number(req.query.categoria));
        }
        if (req.query.buscar) {
            condiciones.push('(p.NombreProducto LIKE ? OR p.CodigoProducto LIKE ?)');
            const term = `%${req.query.buscar}%`;
            params.push(term, term);
        }

        const where = condiciones.length ? `WHERE ${condiciones.join(' AND ')}` : '';
        const [rows] = await pool.query(`${SELECT_CON_JOINS} ${where} ORDER BY p.NombreProducto`, params);
        res.json({ ok: true, datos: rows });
    } catch (error) {
        console.error('Error listando productos:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando productos', error: error.message });
    }
});

// =====================================================
// OBTENER PRODUCTO  (GET /api/productos/:id)
// =====================================================
router.get('/:id', async (req, res) => {
    try {
        const [rows] = await pool.query(`${SELECT_CON_JOINS} WHERE p.IdProducto = ? AND p.IdEmpresa = ?`, [req.params.id, req.auth.IdEmpresa]);
        if (rows.length === 0)
            return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
        res.json({ ok: true, datos: rows[0] });
    } catch (error) {
        console.error('Error obteniendo producto:', error);
        res.status(500).json({ ok: false, mensaje: 'Error consultando producto', error: error.message });
    }
});

// =====================================================
// CREAR PRODUCTO  (POST /api/productos)
// =====================================================
router.post('/', async (req, res) => {
    try {
        const {
            CodigoProducto, CodigoBarras, NombreProducto, Descripcion,
            IdCategoriaProducto, IdUnidadMedida, IdMarca, Referencia,
            PrecioVenta, CostoActual, CostoPromedio,
            StockMinimo, StockMaximo, ManejaInventario, PermiteVenta,
            Activo, UsuarioIdCreacion
        } = req.body;

        if (!NombreProducto || !NombreProducto.trim())
            return res.status(400).json({ ok: false, mensaje: 'El nombre del producto es obligatorio' });
        if (!IdCategoriaProducto)
            return res.status(400).json({ ok: false, mensaje: 'La categoría del producto es obligatoria' });
        if (!CodigoProducto || !CodigoProducto.trim())
            return res.status(400).json({ ok: false, mensaje: 'El código del producto es obligatorio' });

        const [resultado] = await pool.query(
            `INSERT INTO productos (
                CodigoProducto, CodigoBarras, NombreProducto, Descripcion,
                IdCategoriaProducto, IdUnidadMedida, IdMarca, Referencia,
                PrecioVenta, CostoActual, CostoPromedio,
                StockMinimo, StockMaximo, ManejaInventario, PermiteVenta,
                Activo, UsuarioIdCreacion, IdEmpresa
            ) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [
                CodigoProducto.trim(),
                CodigoBarras || null,
                NombreProducto.trim(),
                Descripcion || null,
                IdCategoriaProducto,
                IdUnidadMedida || null,
                IdMarca || null,
                Referencia || null,
                PrecioVenta ?? 0,
                CostoActual ?? 0,
                CostoPromedio ?? 0,
                StockMinimo ?? 0,
                StockMaximo ?? 0,
                ManejaInventario ?? 1,
                PermiteVenta ?? 1,
                Activo ?? 1,
                req.auth.UsuarioId,
                req.auth.IdEmpresa
            ]
        );

        res.status(201).json({ ok: true, mensaje: 'Producto creado', IdProducto: resultado.insertId });
    } catch (error) {
        console.error('Error creando producto:', error);
        res.status(500).json({ ok: false, mensaje: 'Error creando producto', error: error.message });
    }
});

// =====================================================
// ACTUALIZAR PRODUCTO  (PUT /api/productos/:id)
// =====================================================
router.put('/:id', async (req, res) => {
    try {
        const {
            CodigoProducto, CodigoBarras, NombreProducto, Descripcion,
            IdCategoriaProducto, IdUnidadMedida, IdMarca, Referencia,
            PrecioVenta, CostoActual, CostoPromedio,
            StockMinimo, StockMaximo, ManejaInventario, PermiteVenta,
            Activo, UsuarioIdModificacion
        } = req.body;

        if (!NombreProducto || !NombreProducto.trim())
            return res.status(400).json({ ok: false, mensaje: 'El nombre del producto es obligatorio' });
        if (!IdCategoriaProducto)
            return res.status(400).json({ ok: false, mensaje: 'La categoría del producto es obligatoria' });
        if (!CodigoProducto || !CodigoProducto.trim())
            return res.status(400).json({ ok: false, mensaje: 'El código del producto es obligatorio' });

        const [resultado] = await pool.query(
            `UPDATE productos SET
                CodigoProducto = ?, CodigoBarras = ?, NombreProducto = ?, Descripcion = ?,
                IdCategoriaProducto = ?, IdUnidadMedida = ?, IdMarca = ?, Referencia = ?,
                PrecioVenta = ?, CostoActual = ?, CostoPromedio = ?,
                StockMinimo = ?, StockMaximo = ?, ManejaInventario = ?, PermiteVenta = ?,
                Activo = ?, FechaModificacion = NOW(), UsuarioIdModificacion = ?
             WHERE IdProducto = ? AND IdEmpresa = ?`,
            [
                CodigoProducto.trim(), CodigoBarras || null, NombreProducto.trim(), Descripcion || null,
                IdCategoriaProducto, IdUnidadMedida || null, IdMarca || null, Referencia || null,
                PrecioVenta ?? 0, CostoActual ?? 0, CostoPromedio ?? 0,
                StockMinimo ?? 0, StockMaximo ?? 0, ManejaInventario ?? 1, PermiteVenta ?? 1,
                Activo ?? 1, req.auth.UsuarioId, req.params.id, req.auth.IdEmpresa
            ]
        );

        if (resultado.affectedRows === 0)
            return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
        res.json({ ok: true, mensaje: 'Producto actualizado' });
    } catch (error) {
        console.error('Error actualizando producto:', error);
        res.status(500).json({ ok: false, mensaje: 'Error actualizando producto', error: error.message });
    }
});

// =====================================================
// ELIMINAR PRODUCTO  (DELETE /api/productos/:id)
// Solo si no tiene existencia en inventario ni movimientos
// =====================================================
router.delete('/:id', async (req, res) => {
    try {
        const [inv] = await pool.query(
            `SELECT COUNT(*) AS total FROM inventario WHERE IdProducto = ? AND IdEmpresa = ? AND Cantidad > 0`,
            [req.params.id, req.auth.IdEmpresa]
        );
        if (inv[0].total > 0)
            return res.status(409).json({ ok: false, mensaje: 'No se puede eliminar: tiene existencias en inventario' });

        const [kardex] = await pool.query(
            `SELECT COUNT(*) AS total FROM kardex WHERE IdProducto = ? AND IdEmpresa = ?`,
            [req.params.id, req.auth.IdEmpresa]
        );
        if (kardex[0].total > 0)
            return res.status(409).json({ ok: false, mensaje: 'No se puede eliminar: tiene movimientos de Kardex' });

        const [resultado] = await pool.query(
            `DELETE FROM productos WHERE IdProducto = ? AND IdEmpresa = ?`, [req.params.id, req.auth.IdEmpresa]
        );
        if (resultado.affectedRows === 0)
            return res.status(404).json({ ok: false, mensaje: 'Producto no encontrado' });
        res.json({ ok: true, mensaje: 'Producto eliminado' });
    } catch (error) {
        console.error('Error eliminando producto:', error);
        res.status(500).json({ ok: false, mensaje: 'Error eliminando producto', error: error.message });
    }
});

module.exports = router;