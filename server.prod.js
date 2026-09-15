// =============================================================================
// BISSVET - SERVIDOR UNIFICADO DE PRODUCCIÓN
// -----------------------------------------------------------------------------
// Sirve la API REST (/api/*) y el frontend Angular compilado (SPA) en el
// mismo puerto, tal como lo requiere un despliegue en Railway ($PORT único).
//
// Uso:
//   npm run build        -> genera dist/biss-vet-app/browser (SPA)
//   node server.prod.js  -> escucha en process.env.PORT (Railway) o 4000
// =============================================================================

const express = require('express');
const path = require('path');
const cors = require('cors');

const PORT = Number(process.env.PORT) || 4000;

// App Express de la API (src/server.js registra las rutas /api/*)
// Al hacer require, src/server.js NO ejecuta app.listen (solo si se corre directo).
const apiApp = require('./src/server');

const app = express();

app.use(cors());
app.use(express.json());

// =============================================================================
// 1. Frontend Angular (SPA compilado en dist/biss-vet-app/browser)
//    Se sirve ANTES que la API para que "/" entregue index.html
//    (la API define una ruta raíz de diagnóstico que no debe ganarle al SPA).
// =============================================================================
const distFolder = path.join(__dirname, 'dist', 'biss-vet-app', 'browser');

app.use(express.static(distFolder));

// =============================================================================
// 2. API REST -> las rutas /api/* llegan aquí (no existen como archivo estático)
// =============================================================================
app.use(apiApp);

// Cualquier otra ruta no-API responde con index.html (routing del SPA)
app.get('*', (req, res, next) => {

    if (req.originalUrl.startsWith('/api/')) {
        return next();
    }

    res.sendFile(path.join(distFolder, 'index.html'), (err) => {
        if (err) next(err);
    });
});

app.listen(PORT, () => {
    console.log('========================================');
    console.log('       BISSVET - PRODUCCIÓN');
    console.log('========================================');
    console.log(`  Frontend + API: http://localhost:${PORT}`);
    console.log('  Base de datos: MySQL');
    console.log('========================================');
    const tiene = (v) => (v ? 'SÍ' : 'NO');
    console.log('Diagnóstico de entorno:');
    console.log(`  JWT_SECRET:  ${tiene(process.env.JWT_SECRET)}`);
    console.log(`  DB_HOST:     ${tiene(process.env.DB_HOST)}`);
    console.log(`  DB_PORT:     ${process.env.DB_PORT || '(default 3306)'}`);
    console.log(`  DB_USER:     ${tiene(process.env.DB_USER)}`);
    console.log(`  DB_PASSWORD: ${tiene(process.env.DB_PASSWORD)}`);
    console.log(`  DB_NAME:     ${process.env.DB_NAME || '(default BissVet)'}`);
    console.log(`  PORT:        ${PORT}`);
    console.log(`  RAILWAY_SVC: ${process.env.RAILWAY_SERVICE_ID || '(no está)'}`);
    // Listar TODAS las variables de entorno disponibles (solo keys)
    const allKeys = Object.keys(process.env).sort();
    console.log(`  Total vars:  ${allKeys.length}`);
    console.log('  Keys:', allKeys.join(', '));
});