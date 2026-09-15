const mysql = require('mysql2/promise');
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

// =============================================================================
// Resolución de configuración de MySQL
// 1. DATABASE_URL (lo genera Railway automáticamente; formato mysql://...)
// 2. Variables MYSQL_* (Railway MySQL plugin: MYSQLHOST, MYSQLPORT, ...)
// 3. Variables DB_* (config manual /.env local)
// 4. Defaults locales de desarrollo
// =============================================================================
function resolverConfig() {
    if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('://')) {
        try {
            const url = new URL(process.env.DATABASE_URL);
            if (url.protocol === 'mysql:' || url.protocol === 'mariadb:') {
                return {
                    host: url.hostname,
                    port: Number(url.port) || 3306,
                    user: decodeURIComponent(url.username || 'root'),
                    password: decodeURIComponent(url.password || ''),
                    database: url.pathname ? url.pathname.replace(/^\//, '') : (process.env.DB_NAME || 'BissVet')
                };
            }
        } catch (e) {
            console.warn('DATABASE_URL no válida, se ignora:', e.message);
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
