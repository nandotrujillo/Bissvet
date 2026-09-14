const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

const CLEANUP = process.argv.includes('--cleanup') ? process.argv[process.argv.indexOf('--cleanup') + 1] : null;

const sqlFile = path.join(__dirname, 'database', 'alter_perfil_rol_veterinario_permisos.sql');
const sql = fs.readFileSync(sqlFile, 'utf8');

// Datos del usuario a crear (empresa 1 - Veterinaria Los Amigos)
const DATA = {
    Username: 'vete1',
    Password: '12345',
    IdEmpresa: 1,
    IdPerfil: 2,           // perfil Veterinario
    IdRol: 2,              // rol VETERINARIO
    PrimerNombre: 'Vete',
    SegundoNombre: '',
    PrimerApellido: 'Uno',
    SegundoApellido: '',
    TipoDocumento: 'CC',
    NumeroDocumento: '1234567890',
    Correo: 'vete1@bissvet.local',
    Telefono: '3000000000',
    // Datos del empleado veterinario (catálogo)
    TarjetaProfesional: 'TP-000001',
    Especialidad: 'Medicina General',
    IdCiudad: 1,
    UsuarioIdCreacion: 3  // admin
};

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

    // Validar que todos los permisos existen
    const [existentes] = await conn.query(
        `SELECT Codigo FROM permisos WHERE Codigo IN (
            'CLIENTES.CONSULTAR','CLIENTES.CREAR','CLIENTES.EDITAR',
            'MASCOTAS.CONSULTAR','MASCOTAS.CREAR','MASCOTAS.EDITAR',
            'VETERINARIOS.CONSULTAR',
            'CITAS.CONSULTAR','CITAS.CREAR','CITAS.EDITAR','CITAS.APROBAR',
            'HISTORIA.CONSULTAR','HISTORIA.CREAR','HISTORIA.EDITAR','HISTORIA.CERRAR','HISTORIA.IMPRIMIR','HISTORIA.EXPORTAR',
            'SERVICIOS.CONSULTAR','FACTURACION.SERVICIOS'
        )`
    );
    const encontrados = new Set(existentes.map(r => r.Codigo));
    const requeridos = ['CLIENTES.CONSULTAR','CLIENTES.CREAR','CLIENTES.EDITAR','MASCOTAS.CONSULTAR','MASCOTAS.CREAR','MASCOTAS.EDITAR','VETERINARIOS.CONSULTAR','CITAS.CONSULTAR','CITAS.CREAR','CITAS.EDITAR','CITAS.APROBAR','HISTORIA.CONSULTAR','HISTORIA.CREAR','HISTORIA.EDITAR','HISTORIA.CERRAR','HISTORIA.IMPRIMIR','HISTORIA.EXPORTAR','SERVICIOS.CONSULTAR','FACTURACION.SERVICIOS'];
    const faltantes = requeridos.filter(c => !encontrados.has(c));
    if (faltantes.length) {
        console.error('FALTAN PERMISOS EN BD:', faltantes.join(', '));
        await conn.end();
        process.exit(1);
    }

    // Ejecutar la parte de permisos (SQL idempotente)
    console.log('1) Otorgando permisos al rol (2) y perfil (2) VETERINARIO...');
    for (const stmt of splitStatements(sql)) {
        if (/^\s*USE\s/i.test(stmt)) continue;
        const [res] = await conn.query(stmt);
        if (res?.affectedRows !== undefined) console.log(`   -> +${res.affectedRows} registro(s)`);
    }

    await conn.beginTransaction();
    try {
        // 2) Insertar el USUARIO si no existe
        const [yaExiste] = await conn.query(`SELECT UsuarioId FROM Usuarios WHERE Username = ? AND IdEmpresa = ?`, [DATA.Username, DATA.IdEmpresa]);
        let UsuarioId;
        if (yaExiste.length > 0) {
            UsuarioId = yaExiste[0].UsuarioId;
            console.log(`2) El usuario ${DATA.Username} ya existe (UsuarioId=${UsuarioId}).`);
        } else {
            const hash = await bcrypt.hash(DATA.Password, 10);
            const [ins] = await conn.query(
                `INSERT INTO Usuarios
                   (IdEmpresa, IdPerfil, Username, PasswordHash, TipoDocumento,
                    NumeroDocumento, PrimerNombre, SegundoNombre, PrimerApellido,
                    SegundoApellido, Correo, Telefono, Activo, UsuarioIdCreacion)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?)`,
                [DATA.IdEmpresa, DATA.IdPerfil, DATA.Username, hash,
                 DATA.TipoDocumento, DATA.NumeroDocumento, DATA.PrimerNombre,
                 DATA.SegundoNombre || null, DATA.PrimerApellido,
                 DATA.SegundoApellido || null, DATA.Correo, DATA.Telefono,
                 DATA.UsuarioIdCreacion]
            );
            UsuarioId = ins.insertId;
            console.log(`2) Usuario ${DATA.Username} creado (UsuarioId=${UsuarioId}).`);
        }

        // 3) Asignar rol VETERINARIO si no lo tiene
        const [yaRol] = await conn.query(`SELECT 1 FROM usuarioroles WHERE UsuarioId = ? AND IdRol = ?`, [UsuarioId, DATA.IdRol]);
        if (yaRol.length === 0) {
            await conn.query(`INSERT INTO usuarioroles (UsuarioId, IdRol, AsignadoPor, FechaAsignacion) VALUES (?, ?, ?, NOW())`, [UsuarioId, DATA.IdRol, DATA.UsuarioIdCreacion]);
            console.log(`3) Rol VETERINARIO (${DATA.IdRol}) asignado al usuario.`);
        } else {
            console.log(`3) El usuario ya tenía el rol VETERINARIO.`);
        }

        // 4) Crear el empleado en el catálogo Veterinarios si no existe
        const [yaVet] = await conn.query(`SELECT IdVeterinario FROM veterinarios WHERE UsuarioId = ? AND IdEmpresa = ?`, [UsuarioId, DATA.IdEmpresa]);
        if (yaVet.length === 0) {
            const [insV] = await conn.query(
                `INSERT INTO veterinarios
                   (UsuarioId, PrimerNombre, SegundoNombre, PrimerApellido, SegundoApellido,
                    TipoDocumento, NumeroDocumento, TarjetaProfesional, Especialidad,
                    Telefono, Correo, IdCiudad, Activo, UsuarioIdCreacion, IdEmpresa)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
                [UsuarioId, DATA.PrimerNombre, DATA.SegundoNombre || null,
                 DATA.PrimerApellido, DATA.SegundoApellido || null,
                 DATA.TipoDocumento, DATA.NumeroDocumento, DATA.TarjetaProfesional,
                 DATA.Especialidad, DATA.Telefono, DATA.Correo, DATA.IdCiudad,
                 DATA.UsuarioIdCreacion, DATA.IdEmpresa]
            );
            console.log(`4) Empleado veterinario creado (IdVeterinario=${insV.insertId}).`);
        } else {
            console.log(`4) El empleado veterinario ya existía (IdVeterinario=${yaVet[0].IdVeterinario}).`);
        }

        await conn.commit();
        console.log('\n=== RESULTADO FINAL ===');
        const [usr] = await conn.query(`SELECT UsuarioId, Username, IdEmpresa, IdPerfil FROM Usuarios WHERE UsuarioId = ?`, [UsuarioId]);
        console.log(JSON.stringify(usr[0], null, 1));
    } catch (e) {
        await conn.rollback();
        console.error('ERROR:', e.message);
        await conn.end();
        process.exit(1);
    }

    if (CLEANUP) {
        console.log(`\n[--cleanup] Eliminando usuario ${DATA.Username}, sus roles y empleado asociado...`);
        const [vets] = await conn.query(`SELECT IdVeterinario FROM veterinarios WHERE UsuarioId = (SELECT UsuarioId FROM Usuarios WHERE Username = ? AND IdEmpresa = ?)`, [DATA.Username, DATA.IdEmpresa]);
        for (const v of vets) await conn.query(`DELETE FROM veterinarios WHERE IdVeterinario = ?`, [v.IdVeterinario]);
        await conn.query(`DELETE FROM usuarioroles WHERE UsuarioId = (SELECT UsuarioId FROM Usuarios WHERE Username = ? AND IdEmpresa = ?)`, [DATA.Username, DATA.IdEmpresa]);
        await conn.query(`DELETE FROM Usuarios WHERE Username = ? AND IdEmpresa = ?`, [DATA.Username, DATA.IdEmpresa]);
        console.log(`[--cleanup] Listo.`);
    }

    await conn.end();
})().catch(e => { console.error('FATAL:', e.message); process.exit(1); });