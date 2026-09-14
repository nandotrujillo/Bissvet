const fs = require('fs');
const path = require('path');
const mysql = require('mysql2/promise');

const sqlFile = path.join(__dirname, 'database', 'alter_perfil_vendedor_permisos.sql');
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
            else if (res?.affectedRows !== undefined) process.stdout.write(` (affected=${res.affectedRows})`);
            process.stdout.write('\n');
        } catch (e) {
            errores = true;
            process.stdout.write(`ERROR: ${e.message}\n`);
        }
    }
    console.log('\nPermisos actuales del perfil Vendedor (IdPerfil 3):');
    const [pp] = await conn.query(
        `SELECT pp.IdPerfil, p.Codigo, pp.TipoAcceso
         FROM perfilpermisos pp
         JOIN permisos p ON p.IdPermiso = pp.IdPermiso
         WHERE pp.IdPerfil = 3
         ORDER BY p.Codigo`
    );
    console.table(pp);
    await conn.end();
    process.exit(errores ? 1 : 0);
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });