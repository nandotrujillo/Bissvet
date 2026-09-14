const fs = require('fs');
const path = require('path');
const pool = require('./src/database/mysql.js');
const { restaurarPaquetePerfil } = require('./src/middleware/paquete-permisos.js');

const sqlFile = path.join(__dirname, 'database', 'perfil_permisos_base.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

const PERFILES_OPERATIVOS = [2, 3, 4, 5, 6, 7];

function separarSentencias(texto) {
    const sentencias = [];
    let actual = '';
    for (const lineaBruta of texto.split(/\r?\n/)) {
        if (/^\s*(--|\/\*)/.test(lineaBruta)) continue;
        // Remover comentarios en línea ("-- ..." y "/* ... */")
        let linea = lineaBruta.replace(/\s--.*$/, '').replace(/\s\/\*.*\*\/\s*$/, '').trim();
        if (!linea) continue;
        actual += (actual ? ' ' : '') + linea;
        if (actual.trimEnd().endsWith(';')) {
            sentencias.push(actual.replace(/;\s*$/, ';'));
            actual = '';
        }
    }
    if (actual.trim()) sentencias.push(actual);
    return sentencias;
}

(async () => {
    // 1) Crear la tabla y sembrar la matriz canónica
    console.log('--- 1/3 Sembrando perfil_permisos_base ---');
    const sentencias = separarSentencias(sql);
    for (const stmt of sentencias) {
        if (/^\s*USE\s/i.test(stmt)) continue;
        const [res] = await pool.query(stmt);
        if (res && res.affectedRows !== undefined && res.affectedRows > 0) {
            console.log(`  +${res.affectedRows} fila(s) insertadas`);
        } else {
            console.log(`  (sin cambios: ya existía)`);
        }
    }

    // 2) Aplicar los paquetes a los perfiles y roles existentes
    console.log('\n--- 2/3 Restaurando paquetes a perfiles/roles ---');
    for (const id of PERFILES_OPERATIVOS) {
        const r = await restaurarPaquetePerfil(id, 3); // UsuarioId 3 = admin
        const rol = r.rolActualizado ? ` + rol #${r.rolActualizado}` : ' (sin rol homónimo)';
        console.log(`  Perfil ${id}: ${r.mensaje} [${r.permisosAplicados} permisos]${rol}`);
    }

    // 3) Resumen de la matriz cargada
    console.log('\n--- 3/3 Matriz cargada en perfil_permisos_base ---');
    const [resumen] = await pool.query(
        `SELECT ppb.IdPerfil, p.Nombre AS Perfil, COUNT(*) AS Permisos
         FROM perfil_permisos_base ppb
         INNER JOIN perfiles p ON p.IdPerfil = ppb.IdPerfil
         GROUP BY ppb.IdPerfil, p.Nombre
         ORDER BY ppb.IdPerfil`
    );
    for (const f of resumen) console.log(`  Perfil ${f.IdPerfil} ${f.Perfil.padEnd(14)} -> ${f.Permisos} permisos`);

    await pool.end();
    console.log('\nListo.');
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });