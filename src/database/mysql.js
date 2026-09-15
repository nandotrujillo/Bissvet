const mysql = require('mysql2/promise');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// =============================================================================
// Resolución de configuración de MySQL (prioridad de mayor a menor)
// 1. DATABASE_URL / MYSQL_URL / MYSQL_PUBLIC_URL  (formato mysql://... )
// 2. Variables individuales: DB_* o MYSQL_* (MYSQLHOST, MYSQLPORT, etc.)
// 3. Defaults locales de desarrollo
// =============================================================================
function parseUrl(urlStr) {
    try {
        const url = new URL(urlStr);
        if (url.protocol === 'mysql:' || url.protocol === 'mariadb:') {
            return {
                host: url.hostname,
                port: Number(url.port) || 3306,
                user: decodeURIComponent(url.username || 'root'),
                password: decodeURIComponent(url.password || ''),
                database: url.pathname ? url.pathname.replace(/^\//, '') : null
            };
        }
    } catch (_) {}
    return null;
}

function resolverConfig() {
    // Intentar parsear una URL de conexión (DATABASE_URL > MYSQL_URL > MYSQL_PUBLIC_URL)
    const urlVars = ['DATABASE_URL', 'MYSQL_URL', 'MYSQL_PUBLIC_URL'];
    for (const v of urlVars) {
        const val = process.env[v];
        if (val && val.includes('://')) {
            const parsed = parseUrl(val);
            if (parsed) {
                console.log(`Conectando via ${v}`);
                return parsed;
            }
        }
    }

    const primero = (...nombres) => {
        for (const n of nombres) {
            if (process.env[n]) return process.env[n];
        }
        return null;
    };

    return {
        host: primero('DB_HOST', 'MYSQLHOST', 'MYSQL_HOST') || 'localhost',
        port: Number(primero('DB_PORT', 'MYSQLPORT', 'MYSQL_PORT')) || 3306,
        user: primero('DB_USER', 'MYSQLUSER', 'MYSQL_USER') || 'root',
        password: primero('DB_PASSWORD', 'MYSQLPASSWORD', 'MYSQL_PASSWORD') || 'admin',
        database: primero('DB_NAME', 'MYSQLDATABASE', 'MYSQL_DATABASE') || 'BissVet'
    };
}

const config = resolverConfig();

const pool = mysql.createPool({
    ...config,
    waitForConnections: true,
    connectionLimit: Number(process.env.DB_CONNECTION_LIMIT) || 10,
    queueLimit: 0
});

console.log('Config MySQL:', {
    host: config.host,
    port: config.port,
    user: config.user,
    database: config.database
});

module.exports = pool;
