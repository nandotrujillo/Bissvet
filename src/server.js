const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

const pool = require('./database/mysql');
const { authenticate } = require('./middleware/auth');
const { autorizarModulo } = require('./middleware/authorize');

dotenv.config({ path: path.join(__dirname, '.env') });

const app = express();
const PORT = Number(process.env.PORT) || 3000;

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
app.use('/api/citas', autorizarModulo('CITAS'), citasRoutes);

const mascotasRoutes = require('./app/routes/mascotas.routes');
app.use('/api/mascotas', autorizarModulo('MASCOTAS'), mascotasRoutes);

const clientesRoutes = require('./app/routes/clientes.routes');
app.use('/api/clientes', autorizarModulo('CLIENTES'), clientesRoutes);

const serviciosRoutes = require('./app/routes/servicios.routes');
app.use('/api/servicios', autorizarModulo('SERVICIOS'), serviciosRoutes);

const categoriasServicioRoutes =
    require('./app/routes/categorias-servicio.routes');

app.use(
    '/api/categorias-servicio',
    autorizarModulo('SERVICIOS'),
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
    autorizarModulo('VETERINARIOS'),
    veterinariosRoutes
);

const bodegaRoutes = require('./app/routes/bodega.routes');

app.use(
    '/api/bodegas',
    autorizarModulo('BODEGAS'),
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
app.use('/api/historiasclinicas', autorizarModulo('HISTORIA_CLINICA'), historiasclinicasRoutes);

const antecedentesRoutes = require('./app/routes/antecedentes.routes');
app.use('/api/antecedentes', autorizarModulo('HISTORIA_CLINICA'), antecedentesRoutes);

const signosvitalesRoutes = require('./app/routes/signosvitales.routes');
app.use('/api/signosvitales', autorizarModulo('HISTORIA_CLINICA'), signosvitalesRoutes);

const examenfisicoRoutes = require('./app/routes/examenfisico.routes');
app.use('/api/examenfisico', autorizarModulo('HISTORIA_CLINICA'), examenfisicoRoutes);

const diagnosticosRoutes = require('./app/routes/diagnosticos.routes');
app.use('/api/diagnosticos', autorizarModulo('HISTORIA_CLINICA'), diagnosticosRoutes);

const tratamientosRoutes = require('./app/routes/tratamientos.routes');
app.use('/api/tratamientos', autorizarModulo('HISTORIA_CLINICA'), tratamientosRoutes);

const recetasRoutes = require('./app/routes/recetas.routes');
app.use('/api/recetas', autorizarModulo('HISTORIA_CLINICA'), recetasRoutes);

const detallerecetasRoutes = require('./app/routes/detallerecetas.routes');
app.use('/api/detallerecetas', autorizarModulo('HISTORIA_CLINICA'), detallerecetasRoutes);

const procedimientosRoutes = require('./app/routes/procedimientos.routes');
app.use('/api/procedimientos', autorizarModulo('HISTORIA_CLINICA'), procedimientosRoutes);

const cirugiasRoutes = require('./app/routes/cirugias.routes');
app.use('/api/cirugias', autorizarModulo('HISTORIA_CLINICA'), cirugiasRoutes);

const controlesRoutes = require('./app/routes/controles.routes');
app.use('/api/controles', autorizarModulo('HISTORIA_CLINICA'), controlesRoutes);

const archivosRoutes = require('./app/routes/archivoshistoriaclinica.routes');
app.use('/api/archivos', autorizarModulo('HISTORIA_CLINICA'), archivosRoutes);

// ============================================
// RUTAS MÓDULO INVENTARIO Y VENTAS
// ============================================

const categoriasProductoRoutes = require('./app/routes/categoriasproducto.routes');
app.use('/api/categorias-producto', autorizarModulo('PRODUCTOS'), categoriasProductoRoutes);

const marcasRoutes = require('./app/routes/marcas.routes');
app.use('/api/marcas', autorizarModulo('PRODUCTOS'), marcasRoutes);

const unidadesMedidaRoutes = require('./app/routes/unidadesmedida.routes');
app.use('/api/unidades-medida', autorizarModulo('PRODUCTOS'), unidadesMedidaRoutes);

const productosRoutes = require('./app/routes/productos.routes');
app.use('/api/productos', autorizarModulo('PRODUCTOS'), productosRoutes);

const proveedoresRoutes = require('./app/routes/proveedores.routes');
app.use('/api/proveedores', autorizarModulo('COMPRAS'), proveedoresRoutes);

const inventarioRoutes = require('./app/routes/inventario.routes');
app.use('/api/inventario', autorizarModulo('INVENTARIOS'), inventarioRoutes);

const kardexRoutes = require('./app/routes/kardex.routes');
app.use('/api/kardex', autorizarModulo('INVENTARIOS'), kardexRoutes);

const comprasRoutes = require('./app/routes/compras.routes');
app.use('/api/compras', autorizarModulo('COMPRAS'), comprasRoutes);

const ventasRoutes = require('./app/routes/ventas.routes');
app.use('/api/ventas', autorizarModulo('VENTAS'), ventasRoutes);
const tiposPagoRoutes = require('./app/routes/tipospago.routes');

app.use('/api/tipos-pago', autorizarModulo('VENTAS'), tiposPagoRoutes);

const tipoDocumentoRoutes = require('./app/routes/tipodocumento.routes');

app.use('/api/tipos-documento', autorizarModulo('EMPRESAS'), tipoDocumentoRoutes);

const tipoImpuestoRoutes = require('./app/routes/tipoimpuesto.routes');

app.use('/api/tipos-impuesto', autorizarModulo('VENTAS'), tipoImpuestoRoutes);

const trasladosRoutes = require('./app/routes/traslados.routes');
app.use('/api/traslados', autorizarModulo('INVENTARIOS'), trasladosRoutes);

const ajustesRoutes = require('./app/routes/ajustes.routes');
app.use('/api/ajustes', autorizarModulo('INVENTARIOS'), ajustesRoutes);

const cajaRoutes = require('./app/routes/caja.routes');
app.use('/api/caja', autorizarModulo('CAJA'), cajaRoutes);

const reportesRoutes = require('./app/routes/reportes.routes');
app.use('/api/reportes', autorizarModulo('REPORTES'), reportesRoutes);

const dashboardRoutes = require('./app/routes/dashboard.routes');
app.use('/api/dashboard', autorizarModulo('REPORTES'), dashboardRoutes);

// ============================================
// RUTAS MÓDULO MONETIZACIÓN (PLANES / SUSCRIPCIONES)
// ============================================

const planesRoutes = require('./app/routes/planes.routes');
app.use('/api/planes', planesRoutes);

const suscripcionesRoutes = require('./app/routes/suscripciones.routes');
app.use('/api/suscripciones', suscripcionesRoutes);

console.log('5. Ruta /api/usuarios registrada');
console.log('6. Rutas módulo Historia Clínica registradas');

app.get('/', (req, res) => {
    res.json({
        ok: true,
        mensaje: 'API BissVet funcionando con MySQL 8'
    });
});

module.exports = app;

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

if (require.main === module) {
  app.listen(PORT, () => {
      console.log('================================');
      console.log('       BISSVET API');
      console.log('================================');
      console.log(`Servidor: http://localhost:${PORT}`);
      console.log('Base de datos: MySQL 8');
  });
}