const pool = require('../database/mysql.js');

/**
 * Restaura los permisos predeterminados (paquete canónico) de un perfil.
 * - Reemplaza perfilpermisos del perfil con la matriz de perfil_permisos_base (PERMITIR).
 * - Sincroniza además el rol homónimo por nombre (rolpermisos) con la misma matriz,
 *   de modo que perfil y rol nunca queden inconsistentes.
 * - Se usa tanto al crear usuarios como desde el endpoint de restauración.
 *
 * @param {number} IdPerfil  Identificador del perfil.
 * @param {number} UsuarioId Usuario que realiza la acción (para AsignadoPor).
 * @returns {Promise<{ok:boolean, mensaje:string, permisosAplicados:number, perfilActualizado?:number, rolActualizado?:number}>}
 */
async function restaurarPaquetePerfil(IdPerfil, UsuarioId) {
    const [paquete] = await pool.query(
        `SELECT IdPermiso FROM perfil_permisos_base WHERE IdPerfil = ? ORDER BY IdPermiso`,
        [IdPerfil]
    );

    if (paquete.length === 0) {
        return {
            ok: false,
            mensaje: 'Este perfil no tiene paquete predeterminado definido (solo aplica a perfiles operativos).'
        };
    }

    const [perfil] = await pool.query(
        `SELECT Nombre FROM perfiles WHERE IdPerfil = ?`,
        [IdPerfil]
    );
    const nombrePerfil = perfil[0]?.Nombre;

    const conn = await pool.getConnection();
    try {
        await conn.beginTransaction();

        // 1) perfilpermisos: reemplazar por la matriz canónica
        await conn.query(`DELETE FROM perfilpermisos WHERE IdPerfil = ?`, [IdPerfil]);
        const filas = paquete.map(p => [IdPerfil, p.IdPermiso, 'PERMITIR', UsuarioId, new Date()]);
        if (filas.length) {
            await conn.query(
                `INSERT INTO perfilpermisos (IdPerfil, IdPermiso, TipoAcceso, AsignadoPor, FechaAsignacion)
                 VALUES ?`,
                [filas]
            );
        }

        // 2) rolpermisos: sincronizar el rol homónimo por nombre (si existe)
        let rolActualizado = null;
        if (nombrePerfil) {
            const [roles] = await conn.query(
                `SELECT IdRol FROM roles
                 WHERE UPPER(Nombre) = UPPER(?) AND IdEmpresa IS NOT NULL AND Activo = 1
                 ORDER BY IdRol
                 LIMIT 1`,
                [nombrePerfil]
            );
            if (roles.length > 0) {
                await conn.query(`DELETE FROM rolpermisos WHERE IdRol = ?`, [roles[0].IdRol]);
                const filasRol = paquete.map(p => [roles[0].IdRol, p.IdPermiso, 'PERMITIR', UsuarioId, new Date()]);
                if (filasRol.length) {
                    await conn.query(
                        `INSERT INTO rolpermisos (IdRol, IdPermiso, TipoAcceso, AsignadoPor, FechaAsignacion)
                         VALUES ?`,
                        [filasRol]
                    );
                }
                rolActualizado = roles[0].IdRol;
            }
        }

        await conn.commit();

        return {
            ok: true,
            mensaje: 'Permisos restaurados a los predeterminados',
            perfilActualizado: IdPerfil,
            rolActualizado,
            permisosAplicados: filas.length
        };
    } catch (error) {
        await conn.rollback();
        throw error;
    } finally {
        conn.release();
    }
}

module.exports = { restaurarPaquetePerfil };