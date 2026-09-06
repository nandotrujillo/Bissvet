// ============================================================================
// BISSVET - REGLAS DE NEGOCIO DE CAJA
// Registro automático de movimientos de caja (cajeromovdet) originados en
// operaciones de negocio (ventas confirmadas/anuladas). Reciben una conexión
// (conn) para operar dentro de la transacción del caller.
// Toda operación queda aislada por empresa (idEmpresa / IdEmpresa).
// ============================================================================

// Indica si la empresa tiene activo el control de caja.
async function empresaUsaControlCaja(conn, IdEmpresa) {
    if (!IdEmpresa) return false;
    const [filas] = await conn.query(
        `SELECT UsaControlCaja FROM empresas WHERE IdEmpresa = ?`,
        [IdEmpresa]
    );
    return filas.length > 0 && filas[0].UsaControlCaja === 1;
}

// Devuelve la jornada de caja abierta de la empresa o null.
async function jornadaAbierta(conn, IdEmpresa) {
    const [filas] = await conn.query(
        `SELECT Id, diaProceso
         FROM cajeromov
         WHERE idEmpresa = ? AND Apertura = 1 AND (Cierre = 0 OR Cierre IS NULL)
         ORDER BY Id DESC LIMIT 1`,
        [IdEmpresa]
    );
    return filas.length ? filas[0] : null;
}

// Devuelve la jornada de caja ABIERTA de la empresa para el día indicado.
async function jornadaAbiertaDelDia(conn, IdEmpresa, diaProceso) {
    const [filas] = await conn.query(
        `SELECT Id, diaProceso
         FROM cajeromov
         WHERE idEmpresa = ? AND Apertura = 1 AND (Cierre = 0 OR Cierre IS NULL)
           AND diaProceso = DATE(?)
         ORDER BY Id DESC LIMIT 1`,
        [IdEmpresa, diaProceso || new Date()]
    );
    return filas.length ? filas[0] : null;
}

// ============================================================================
// verificarCajaAbiertaDelDia: garantiza que la empresa, cuando tiene activo el
// control de caja, tenga una jornada ABIERTA el día de la operación. Sin ella
// NO se permite crear ni facturar ventas de ese día.
// Lanza error { codigo: 'SIN_CAJA_ABIERTA' } (para responder 409).
// ============================================================================
async function verificarCajaAbiertaDelDia(conn, IdEmpresa, diaProceso) {
    const usaControl = await empresaUsaControlCaja(conn, IdEmpresa);
    if (!usaControl) return { permitido: true, jornada: null };

    const jornada = await jornadaAbiertaDelDia(conn, IdEmpresa, diaProceso);
    if (!jornada) {
        const error = new Error('Debe abrir la caja del día antes de realizar o facturar ventas.');
        error.codigo = 'SIN_CAJA_ABIERTA';
        throw error;
    }
    return { permitido: true, jornada };
}

// Devuelve el id del tipo de movimiento de caja marcado como VENTA.
async function tipoVenta(conn, IdEmpresa) {
    const [filas] = await conn.query(
        `SELECT id FROM tipomovcaja
         WHERE idEmpresa = ? AND Ventas = 1 AND Estatus = 1
         ORDER BY id LIMIT 1`,
        [IdEmpresa]
    );
    return filas.length ? filas[0].id : null;
}

// ============================================================================
// Registra (Accion='CONFIRMAR') o revierte (Accion='ANULAR') el movimiento de
// caja de una venta en la jornada abierta DEL DÍA de la empresa.
//   * Si la empresa NO usa control de caja: no registra nada.
//   * Si usa control de caja y no hay jornada abierta del día: lanza error para
//     garantizar que la venta siempre quede respaldada por la caja del día.
// El ValorMov se redondea a entero porque cajeromovdet.ValorMov es INT.
// En ANULAR se usa ValorMov negativo para cancelar el ingreso original.
// ============================================================================
async function registrarMovimientoVenta(conn, {
    IdEmpresa,
    UsuarioId,
    NumeroVenta,
    ValorMov,
    TipoPago,
    Cliente,
    Accion,
    Fecha
}) {
    if (!IdEmpresa) return { registrado: false };

    const usaControl = await empresaUsaControlCaja(conn, IdEmpresa);
    if (!usaControl) return { registrado: false };

    const jornada = await jornadaAbiertaDelDia(conn, IdEmpresa, Fecha || new Date());
    if (!jornada) {
        const error = new Error('Debe abrir la caja del día antes de realizar o facturar ventas.');
        error.codigo = 'SIN_CAJA_ABIERTA';
        throw error;
    }

    const TipoMov = await tipoVenta(conn, IdEmpresa);
    if (!TipoMov) {
        const error = new Error('No está configurado un tipo de movimiento de caja para VENTAS.');
        error.codigo = 'SIN_TIPO_CAJA';
        throw error;
    }

    const esAnulacion = Accion === 'ANULAR';
    const valor = Math.round(Number(ValorMov) || 0);
    const valorFinal = esAnulacion ? -valor : valor;

    const partes = [(esAnulacion ? 'Anulación de venta' : 'Venta') + ' ' + (NumeroVenta || '')];
    if (TipoPago) partes.push(`Pago: ${TipoPago}`);
    if (Cliente) partes.push(`Cliente: ${Cliente}`);
    const descripcion = partes.join(' | ').slice(0, 150);

    const [res] = await conn.query(
        `INSERT INTO cajeromovdet
           (IdCajaMov, TipoMov, ValorMov, FechaRegistro, DescMov,
            UsuarioIdCreacion, IdEmpresa)
         VALUES (?, ?, ?, NOW(), ?, ?, ?)`,
        [jornada.Id, TipoMov, valorFinal, descripcion, UsuarioId || null, IdEmpresa]
    );

    return {
        registrado: true,
        IdMov: res.insertId,
        IdJornada: jornada.Id,
        TipoMov,
        ValorMov: valorFinal,
        Descripcion: descripcion
    };
}

// ============================================================================
// Devuelve el id del tipo de movimiento de caja marcado como egreso a
// proveedores (GASTO). Si no existe, usa OTRO EGRESO (Signo = '-').
// ============================================================================
async function tipoEgresoCompra(conn, IdEmpresa) {
    const [filas] = await conn.query(
        `SELECT id FROM tipomovcaja
         WHERE idEmpresa = ? AND Estatus = 1 AND Signo = '-' AND AplicaProveedores = 1
         ORDER BY id LIMIT 1`,
        [IdEmpresa]
    );
    if (filas.length) return filas[0].id;

    const [otro] = await conn.query(
        `SELECT id FROM tipomovcaja
         WHERE idEmpresa = ? AND Estatus = 1 AND Signo = '-'
         ORDER BY id LIMIT 1`,
        [IdEmpresa]
    );
    return otro.length ? otro[0].id : null;
}

// ============================================================================
// Saldo disponible actual de una jornada de caja abierta:
//   Apertura (cm.Valor) + Ingresos (Signo '+') - Egresos (Signo '-').
// ============================================================================
async function saldoJornada(conn, IdJornada, IdEmpresa) {
    const [filas] = await conn.query(
        `SELECT
            COALESCE(cm.Valor, 0)
              + COALESCE(SUM(CASE WHEN t.Signo = '+' THEN d.ValorMov END), 0)
              - COALESCE(SUM(CASE WHEN t.Signo = '-' THEN d.ValorMov END), 0) AS Saldo
         FROM cajeromov cm
         LEFT JOIN cajeromovdet d ON d.IdCajaMov = cm.Id
         LEFT JOIN tipomovcaja t ON d.TipoMov = t.id
         WHERE cm.Id = ? AND cm.idEmpresa = ?
         GROUP BY cm.Id, cm.Valor`,
        [IdJornada, IdEmpresa]
    );
    return filas.length ? Number(filas[0].Saldo) || 0 : 0;
}

// ============================================================================
// Registra (o revierte con Accion='ANULAR') el movimiento de caja (egreso) por
// una compra a proveedor, dentro de la transacción del caller.
//   * Solo actúa si la empresa usa control de caja y hay jornada abierta del día.
//   * Si validarSaldo = true y el monto supera el saldo disponible, lanza error.
// ValorMov: siempre positivo en la petición; se guarda con el signo del tipo.
// ============================================================================
async function registrarMovimientoCompra(conn, {
    IdEmpresa,
    UsuarioId,
    NumeroCompra,
    ValorMov,
    NombreProveedor,
    IdProveedor,
    Accion,
    Fecha,
    validarSaldo = true
}) {
    if (!IdEmpresa) return { registrado: false };

    const usaControl = await empresaUsaControlCaja(conn, IdEmpresa);
    if (!usaControl) return { registrado: false };

    const jornada = await jornadaAbiertaDelDia(conn, IdEmpresa, Fecha || new Date());
    if (!jornada) {
        const error = new Error('Debe abrir la caja del día antes de registrar el pago de la compra.');
        error.codigo = 'SIN_CAJA_ABIERTA';
        throw error;
    }

    const TipoMov = await tipoEgresoCompra(conn, IdEmpresa);
    if (!TipoMov) {
        const error = new Error('No está configurado un tipo de movimiento de caja para egresos (GASTO/OTRO EGRESO).');
        error.codigo = 'SIN_TIPO_CAJA';
        throw error;
    }

    const valor = Math.round(Number(ValorMov) || 0);
    if (valor <= 0) return { registrado: false };

    if (Accion !== 'ANULAR' && validarSaldo) {
        const saldo = await saldoJornada(conn, jornada.Id, IdEmpresa);
        if (valor > saldo) {
            const error = new Error(`Saldo insuficiente en caja: disponible $${saldo.toLocaleString('es-CO')}, egreso $${valor.toLocaleString('es-CO')}.`);
            error.codigo = 'CAJA_SALDO_INSUFICIENTE';
            throw error;
        }
    }

    const esAnulacion = Accion === 'ANULAR';
    const valorFinal = esAnulacion ? -valor : valor;

    const partes = [(esAnulacion ? 'Anulación de pago compra' : 'Pago de compra') + ' ' + (NumeroCompra || '')];
    if (NombreProveedor) partes.push(`Proveedor: ${NombreProveedor}`);
    if (esAnulacion) partes.push('(reversión)');
    const descripcion = partes.join(' | ').slice(0, 150);

    const [res] = await conn.query(
        `INSERT INTO cajeromovdet
           (IdCajaMov, TipoMov, ValorMov, FechaRegistro, DescMov,
            idProveedor, NroDocumentoProveedor, UsuarioIdCreacion, IdEmpresa)
         VALUES (?, ?, ?, NOW(), ?, ?, ?, ?, ?)`,
        [jornada.Id, TipoMov, valorFinal, descripcion,
         IdProveedor != null ? Number(IdProveedor) : null,
         String(NumeroCompra || '').slice(0, 10),
         UsuarioId || null, IdEmpresa]
    );

    return {
        registrado: true,
        IdMov: res.insertId,
        IdJornada: jornada.Id,
        TipoMov,
        ValorMov: valorFinal,
        SaldoDisponible: await saldoJornada(conn, jornada.Id, IdEmpresa),
        Descripcion: descripcion
    };
}

module.exports = {
    empresaUsaControlCaja,
    jornadaAbierta,
    jornadaAbiertaDelDia,
    verificarCajaAbiertaDelDia,
    tipoVenta,
    registrarMovimientoVenta,
    tipoEgresoCompra,
    saldoJornada,
    registrarMovimientoCompra
};