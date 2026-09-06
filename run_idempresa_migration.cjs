const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const sqlFile = path.join(__dirname, 'database', 'alter_idempresa_transversal.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

function splitStatements(text) {
    const lines = text.split(/\r?\n/);
    const statements = [];
    let current = [];
    let delimiter = ';';
    for (const line of lines) {
        const trimmed = line.trim().toLowerCase();
        if (trimmed.startsWith('--')) continue;
        if (/^delimiter\s+\S+/.test(trimmed)) {
            if (current.join('\n').trim()) statements.push(current.join('\n'));
            current = [];
            delimiter = trimmed.split(/\s+/)[1];
            continue;
        }
        if (trimmed === '') { current.push(line); continue; }
        if (line.trimEnd().endsWith(delimiter) && delimiter !== ';') {
            current.push(line.slice(0, line.lastIndexOf(delimiter)));
            statements.push(current.join('\n'));
            current = [];
            delimiter = ';';
            continue;
        }
        if (delimiter === ';' && line.trimEnd().endsWith(';')) {
            current.push(line);
            statements.push(current.join('\n'));
            current = [];
            continue;
        }
        current.push(line);
    }
    if (current.join('\n').trim()) statements.push(current.join('\n'));
    return statements.filter(s => s.trim());
}

(async () => {
    const conn = await mysql.createConnection({ host: 'localhost', port: 3306, user: 'root', password: 'admin', database: 'BissVet', multipleStatements: false });
    const statements = splitStatements(sql);
    console.log(`Total sentencias: ${statements.length}\n`);
    let errores = false;
    for (const stmt of statements) {
        const firstLine = stmt.trim().split(/\r?\n/)[0].trim();
        process.stdout.write(`>>> ${firstLine.slice(0, 90)}... `);
        try {
            const [res] = await conn.query(stmt);
            process.stdout.write('OK');
            if (Array.isArray(res)) process.stdout.write(` (filas=${res.length})`);
            process.stdout.write('\n');
        } catch (e) {
            errores = true;
            process.stdout.write(`ERROR: ${e.message}\n`);
        }
    }
    console.log('\nResultado final (tablas base sin IdEmpresa, debe quedar vacio):');
    const [sin] = await conn.query(
        `SELECT t.TABLE_NAME AS SinIdEmpresa
           FROM information_schema.TABLES t
          WHERE t.TABLE_SCHEMA = DATABASE()
            AND t.TABLE_TYPE   = 'BASE TABLE'
            AND NOT EXISTS (
                SELECT 1 FROM information_schema.COLUMNS c
                 WHERE c.TABLE_SCHEMA = t.TABLE_SCHEMA
                   AND c.TABLE_NAME   = t.TABLE_NAME
                   AND c.COLUMN_NAME IN ('IdEmpresa','idEmpresa'))
          ORDER BY t.TABLE_NAME`);
    console.log(sin.length === 0 ? '(ninguna)' : sin.map(r => `  - ${r.SinIdEmpresa}`).join('\n'));
    await conn.end();
    process.exit(errores ? 1 : 0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });