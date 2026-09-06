// ============================================================================
// BISSVET - PARÁMETROS GLOBALES DE VENTAS
// Impuesto a las ventas: se configura una vez por empresa (tabla tipoimpuesto,
// fila marcada EsIva=1) y las ventas la LEEN automáticamente en lugar de
// capturarla manualmente en cada documento.
// Control de existencias: parámetro por empresa (columna ControlExistencias)
// que define si las ventas de producto deben validar/descontar inventario.
// ============================================================================

// Devuelve el porcentaje de impuesto a las ventas configurado para la empresa.
// Prioriza la fila marcada como IVA (EsIva=1); si no existe, usa la primera;
// si no hay ninguna, devuelve 0.
async function obtenerImpuestoVentas(conn, IdEmpresa) {
    if (!IdEmpresa) return 0;

    const [filas] = await conn.query(
        `SELECT Porcentaje FROM tipoimpuesto
         WHERE IdEmpresa = ?
         ORDER BY EsIva DESC, Id ASC
         LIMIT 1`,
        [IdEmpresa]
    );

    if (filas.length === 0) return 0;
    const pct = Number(filas[0].Porcentaje) || 0;
    return Math.min(100, Math.max(0, pct));
}

// Indica si la empresa controla existencias de inventario (default: sí).
// Cuando está inactivo, las ventas de producto NO validan ni descuentan stock
// (se comportan como líneas de servicio).
async function empresaControlaExistencias(conn, IdEmpresa) {
    if (!IdEmpresa) return true;
    const [filas] = await conn.query(
        `SELECT ControlExistencias FROM empresas WHERE IdEmpresa = ?`,
        [IdEmpresa]
    );
    return filas.length === 0 || filas[0].ControlExistencias !== 0;
}

module.exports = {
    obtenerImpuestoVentas,
    empresaControlaExistencias
};