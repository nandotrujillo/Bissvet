const express = require('express');
const cors = require('cors');

const pool = require('./database/mysql');
const { authenticate } = require('./middleware/auth');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

console.log('3. Intentando cargar usuarios.routes');

// =====================================================
// LOGIN (PÚBLICO): se monta ANTES del authenticate global
// =====================================================
const usuariosRoutes = require('./app/routes/usuarios.routes');
app.use('/api/usuarios', usuariosRoutes);

// =====================================================
// RUTAS DE SEGURIDAD (mi-menu, perfiles, roles, permisos...)
// =====================================================
const seguridadRoutes = require('./app/routes/seguridad.routes');
app.use('/api/seguridad', seguridadRoutes);

// =====================================================
// Empresas: GET / (público para el combo del login)
// =====================================================
const empresasRoutes = require('./app/routes/empresas.routes');
app.use('/api/empresas', empresasRoutes);

// =====================================================
// A PARTIR DE AQUÍ TODAS LAS RUTAS REQUIEREN JWT
// =====================================================
app.use('/api', authenticate);

const citasRoutes = require('./app/routes/citas.routes');
app.use('/api/citas', citasRoutes);

const mascotasRoutes = require('./app/routes/mascotas.routes');
app.use('/api/mascotas', mascotasRoutes);

const clientesRoutes = require('./app/routes/clientes.routes');
app.use('/api/clientes', clientesRoutes);

const serviciosRoutes = require('./app/routes/servicios.routes');
app.use('/api/servicios', serviciosRoutes);

const categoriasServicioRoutes =
    require('./app/routes/categorias-servicio.routes');

app.use(
    '/api/categorias-servicio',
    categoriasServicioRoutes
);

const modulosRoutes =
    require('./app/routes/modulos.routes');

app.use(
    '/api/modulos',
    modulosRoutes
);

const veterinariosRoutes =
    require('./app/routes/veterinarios.routes');

app.use(
    '/api/veterinarios',
    veterinariosRoutes
);

const bodegaRoutes = require('./app/routes/bodega.routes');

app.use(
    '/api/bodegas',
    bodegaRoutes
);

const ciudadesRoutes = require('./app/routes/ciudades.routes');

app.use(
    '/api/ciudades',
    ciudadesRoutes
);

// ============================================
// RUTAS MÓDULO HISTORIA CLÍNICA
// ============================================

const historiasclinicasRoutes = require('./app/routes/historiasclinicas.routes');
app.use('/api/historiasclinicas', historiasclinicasRoutes);

const antecedentesRoutes = require('./app/routes/antecedentes.routes');
app.use('/api/antecedentes', antecedentesRoutes);

const signosvitalesRoutes = require('./app/routes/signosvitales.routes');
app.use('/api/signosvitales', signosvitalesRoutes);

const examenfisicoRoutes = require('./app/routes/examenfisico.routes');
app.use('/api/examenfisico', examenfisicoRoutes);

const diagnosticosRoutes = require('./app/routes/diagnosticos.routes');
app.use('/api/diagnosticos', diagnosticosRoutes);

const tratamientosRoutes = require('./app/routes/tratamientos.routes');
app.use('/api/tratamientos', tratamientosRoutes);

const recetasRoutes = require('./app/routes/recetas.routes');
app.use('/api/recetas', recetasRoutes);

const detallerecetasRoutes = require('./app/routes/detallerecetas.routes');
app.use('/api/detallerecetas', detallerecetasRoutes);

const procedimientosRoutes = require('./app/routes/procedimientos.routes');
app.use('/api/procedimientos', procedimientosRoutes);

const cirugiasRoutes = require('./app/routes/cirugias.routes');
app.use('/api/cirugias', cirugiasRoutes);

const controlesRoutes = require('./app/routes/controles.routes');
app.use('/api/controles', controlesRoutes);

const archivosRoutes = require('./app/routes/archivoshistoriaclinica.routes');
app.use('/api/archivos', archivosRoutes);

// ============================================
// RUTAS MÓDULO INVENTARIO Y VENTAS
// ============================================

const categoriasProductoRoutes = require('./app/routes/categoriasproducto.routes');
app.use('/api/categorias-producto', categoriasProductoRoutes);

const marcasRoutes = require('./app/routes/marcas.routes');
app.use('/api/marcas', marcasRoutes);

const unidadesMedidaRoutes = require('./app/routes/unidadesmedida.routes');
app.use('/api/unidades-medida', unidadesMedidaRoutes);

const productosRoutes = require('./app/routes/productos.routes');
app.use('/api/productos', productosRoutes);

const proveedoresRoutes = require('./app/routes/proveedores.routes');
app.use('/api/proveedores', proveedoresRoutes);

const inventarioRoutes = require('./app/routes/inventario.routes');
app.use('/api/inventario', inventarioRoutes);

const kardexRoutes = require('./app/routes/kardex.routes');
app.use('/api/kardex', kardexRoutes);

const comprasRoutes = require('./app/routes/compras.routes');
app.use('/api/compras', comprasRoutes);

const ventasRoutes = require('./app/routes/ventas.routes');
app.use('/api/ventas', ventasRoutes);

const trasladosRoutes = require('./app/routes/traslados.routes');
app.use('/api/traslados', trasladosRoutes);

const ajustesRoutes = require('./app/routes/ajustes.routes');
app.use('/api/ajustes', ajustesRoutes);

console.log('5. Ruta /api/usuarios registrada');
console.log('6. Rutas módulo Historia Clínica registradas');

app.get('/', (req, res) => {
    res.json({
        ok: true,
        mensaje: 'API BissVet funcionando con MySQL 8'
    });
});

app.get('/api/test-mysql', async (req, res) => {
    try {
        const [rows] = await pool.query('SELECT 1 AS conectado');
        res.json({
            ok: true,
            mensaje: 'Conexión a MySQL funcionando',
            resultado: rows
        });
    } catch (error) {
        console.error('Error MySQL:', error);
        res.status(500).json({
            ok: false,
            mensaje: 'Error conectando a MySQL',
            error: error.message
        });
    }
});

app.listen(PORT, () => {
    console.log('================================');
    console.log('       BISSVET API');
    console.log('================================');
    console.log(`Servidor: http://localhost:${PORT}`);
    console.log('Base de datos: MySQL 8');
});