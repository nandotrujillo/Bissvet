const pool = require('../database/mysql');

// =============================================================================
// registrarAuditoria: inserta en `auditoria` (RF-017) una operación crítica.
// Debería invocarse dentro de la MÍSMA transacción que la operación de negocio
// cuando exista trazabilidad transaccional (RN-011).
// =============================================================================
async function registrarAuditoria({
    IdEmpresa,
    UsuarioId,
    IdModulo = null,
    Tabla = null,
    RegistroId = null,
    Accion,
    DireccionIP = null,
    DatosAnteriores = null,
    DatosNuevos = null,
    Descripcion = null
}, conn = null) {
    const query = `
        INSERT INTO auditoria
          (IdEmpresa, UsuarioId, IdModulo, Tabla, RegistroId, Accion,
           Fecha, DireccionIP, DatosAnteriores, DatosNuevos, Descripcion)
        VALUES
          (?, ?, ?, ?, ?, ?, NOW(), ?, ?, ?, ?)
    `;

    const params = [
        IdEmpresa,
        UsuarioId,
        IdModulo || null,
        Tabla || null,
        RegistroId || null,
        Accion,
        DireccionIP || null,
        DatosAnteriores ? JSON.stringify(DatosAnteriores) : null,
        DatosNuevos ? JSON.stringify(DatosNuevos) : null,
        Descripcion || null
    ];

    if (conn) {
        await conn.query(query, params);
    } else {
        await pool.query(query, params);
    }
}

// =============================================================================
// obtenerIdModulo: resuelve el idModulos a partir del código del módulo.
// Útil para poblar IdModulo en auditoría.
// =============================================================================
async function obtenerIdModulo(codigoModulo) {
    const [rows] = await pool.query(
        `SELECT idModulos FROM modulos WHERE Codigo = ?`,
        [codigoModulo]
    );
    return rows.length ? rows[0].idModulos : null;
}

module.exports = { registrarAuditoria, obtenerIdModulo };