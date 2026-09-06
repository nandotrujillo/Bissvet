// ============================================================================
// BISSVET - REGLAS DE NEGOCIO DE INVENTARIO
// Costo Promedio Ponderado (CPP) por Producto + Bodega.
// El Kardex es la fuente de verdad: toda modificación de existencias debe
// originarse en un documento/movimiento y registrarse aquí.
// Todas las funciones reciben una conexión (conn) para operar dentro de una
// transacción manejada por el caller.
// ============================================================================

// Valor por defecto cuando no llega la empresa: se completa con el IdEmpresa
// que remite la operación (ventas, compras, traslados, ajustes, inventario).
function conEmpresa(IdEmpresa) {
    return IdEmpresa ?? null;
}

// Obtiene/crea el registro de inventario (existencias) de un producto+bodega
// dentro de la empresa. Devuelve { id, cantidad, costoPromedio } o null si el
// producto o bodega no existen.
async function obtenerInventario(conn, IdProducto, IdBodega, IdEmpresa) {
    const [filas] = await conn.query(
        `SELECT IdInventario, Cantidad, CostoPromedio, CostoTotal
         FROM inventario
         WHERE IdProducto = ? AND IdBodega = ? AND IdEmpresa = ?`,
        [IdProducto, IdBodega, conEmpresa(IdEmpresa)]
    );
    if (filas.length === 0) return null;

    const r = filas[0];
    return {
        IdInventario: r.IdInventario,
        Cantidad: parseFloat(r.Cantidad),
        CostoPromedio: parseFloat(r.CostoPromedio),
        CostoTotal: parseFloat(r.CostoTotal)
    };
}

// Crea un registro de inventario con cantidad cero (para poder registrarlo en
// kardex aunque todavía no exista existencia previa) en la empresa indicada.
async function crearInventario(conn, IdProducto, IdBodega, IdEmpresa) {
    await conn.query(
        `INSERT INTO inventario (IdProducto, IdBodega, Cantidad, CostoPromedio, CostoTotal, Activo, IdEmpresa)
         VALUES (?, ?, 0, 0, 0, 1, ?)`,
        [IdProducto, IdBodega, conEmpresa(IdEmpresa)]
    );
    return obtenerInventario(conn, IdProducto, IdBodega, IdEmpresa);
}

// Consulta el kardex de un producto+bodega para obtener el saldo previo real
// (independiente del registro de inventario) filtrando por bodega y empresa.
async function saldoKardexActual(conn, IdProducto, IdBodega, IdEmpresa) {
    const [filas] = await conn.query(
        `SELECT COALESCE(SUM(EntradaCantidad - SalidaCantidad), 0) AS SaldoCantidad
         FROM kardex
         WHERE IdProducto = ? AND IdBodega = ? AND IdEmpresa = ?`,
        [IdProducto, IdBodega, conEmpresa(IdEmpresa)]
    );
    return parseFloat(filas[0].SaldoCantidad);
}

// Recalcula el Costo Promedio Ponderado sumando una entrada al inventario de
// un producto+bodega (dentro de la empresa). Devuelve el nuevo estado
// { cantidad, costoPromedio, costoTotal }.
async function calcularCPP(conn, IdProducto, IdBodega, entradaCantidad, entradaCostoUnitario, IdEmpresa) {
    const inventario = await obtenerInventario(conn, IdProducto, IdBodega, IdEmpresa);
    const inv = inventario || await crearInventario(conn, IdProducto, IdBodega, IdEmpresa);

    const cantidadPrevia = Number(inv.Cantidad);
    const costoPromedioPrevio = Number(inv.CostoPromedio);
    const entradaCantidadNum = Number(entradaCantidad);
    const entradaCostoNum = Number(entradaCostoUnitario);
    const valorPrevio = cantidadPrevia * costoPromedioPrevio;

    const nuevaCantidad = cantidadPrevia + entradaCantidadNum;
    const valorNuevo = valorPrevio + (entradaCantidadNum * entradaCostoNum);

    let nuevoCostoPromedio = costoPromedioPrevio;
    if (nuevaCantidad > 0) {
        nuevoCostoPromedio = valorNuevo / nuevaCantidad;
    }

    const costoTotalNuevo = nuevaCantidad * nuevoCostoPromedio;

    await conn.query(
        `UPDATE inventario
         SET Cantidad = ?, CostoPromedio = ?, CostoTotal = ?, FechaUltimoMovimiento = NOW()
         WHERE IdProducto = ? AND IdBodega = ? AND IdEmpresa = ?`,
        [nuevaCantidad, nuevoCostoPromedio, costoTotalNuevo, IdProducto, IdBodega, conEmpresa(IdEmpresa)]
    );

    return {
        IdProducto,
        IdBodega,
        Cantidad: nuevaCantidad,
        CostoPromedio: nuevoCostoPromedio,
        CostoTotal: costoTotalNuevo
    };
}

// Reduce la existencia de un producto+bodega (salida) dentro de la empresa.
// Verifica que no quede negativo. Devuelve el nuevo estado.
async function reducirInventario(conn, IdProducto, IdBodega, salidaCantidad, IdEmpresa) {
    const inventario = await obtenerInventario(conn, IdProducto, IdBodega, IdEmpresa);
    const inv = inventario || await crearInventario(conn, IdProducto, IdBodega, IdEmpresa);

    if (inv.Cantidad < salidaCantidad) {
        const error = new Error('No existe inventario suficiente para realizar la operación.');
        error.codigo = 'INSUFICIENTE';
        throw error;
    }

    const salidaCantidadNum = Number(salidaCantidad);
    const nuevaCantidad = Number(inv.Cantidad) - salidaCantidadNum;
    const costoTotalNuevo = nuevaCantidad * Number(inv.CostoPromedio);

    await conn.query(
        `UPDATE inventario
         SET Cantidad = ?, CostoTotal = ?, FechaUltimoMovimiento = NOW()
         WHERE IdProducto = ? AND IdBodega = ? AND IdEmpresa = ?`,
        [nuevaCantidad, costoTotalNuevo, IdProducto, IdBodega, conEmpresa(IdEmpresa)]
    );

    return {
        IdProducto,
        IdBodega,
        Cantidad: nuevaCantidad,
        CostoPromedio: inv.CostoPromedio,
        CostoTotal: costoTotalNuevo
    };
}

// Registra un movimiento de entrada en el Kardex y recalcula el CPP del
// inventario. Un solo registro de kardex puede tener Entrada o Salida, no
// ambas. Devuelve el detalle registrado.
async function registrarEntrada(
    conn,
    {
        IdProducto,
        IdBodega,
        TipoMovimiento,
        DocumentoTipo,
        IdDocumento,
        cantidad,
        costoUnitario,
        costoTotal,
        UsuarioId,
        IdEmpresa,
        Observaciones
    }
) {
    const saldoPrevio = parseFloat(await saldoKardexActual(conn, IdProducto, IdBodega, IdEmpresa));
    const cantidadNum = Number(cantidad);
    const saldoNuevo = saldoPrevio + cantidadNum;

    const estado = await calcularCPP(conn, IdProducto, IdBodega, cantidad, costoUnitario, IdEmpresa);
    const saldoValor = saldoNuevo * estado.CostoPromedio;

    const [res] = await conn.query(
        `INSERT INTO kardex
         (Fecha, IdProducto, IdBodega, TipoMovimiento, DocumentoTipo, IdDocumento,
          EntradaCantidad, EntradaCostoUnitario, EntradaCostoTotal,
          SalidaCantidad, SalidaCostoUnitario, SalidaCostoTotal,
          SaldoCantidad, CostoPromedio, SaldoValor, UsuarioId, IdEmpresa, Observaciones)
         VALUES (NOW(), ?, ?, ?, ?, ?,
                 ?, ?, ?,
                 0, 0, 0,
                 ?, ?, ?, ?, ?, ?)`,
        [
            IdProducto, IdBodega, TipoMovimiento, DocumentoTipo, IdDocumento,
            Number(cantidad), Number(costoUnitario), Number(costoTotal),
            saldoNuevo, estado.CostoPromedio, saldoValor,
            UsuarioId || null, conEmpresa(IdEmpresa), Observaciones || null
        ]
    );

    return {
        IdKardex: res.insertId,
        IdProducto,
        IdBodega,
        TipoMovimiento,
        SaldoCantidad: saldoNuevo,
        CostoPromedio: estado.CostoPromedio,
        SaldoValor: saldoValor
    };
}

// Registra un movimiento de salida en el Kardex usando el costo promedio
// vigente (NO el precio de venta). Devuelve el detalle registrado.
async function registrarSalida(
    conn,
    {
        IdProducto,
        IdBodega,
        TipoMovimiento,
        DocumentoTipo,
        IdDocumento,
        cantidad,
        UsuarioId,
        IdEmpresa,
        Observaciones
    }
) {
    const inventario = await obtenerInventario(conn, IdProducto, IdBodega, IdEmpresa);
    const inv = inventario || await crearInventario(conn, IdProducto, IdBodega, IdEmpresa);

    if (inv.Cantidad < cantidad) {
        const error = new Error('No existe inventario suficiente para realizar la operación.');
        error.codigo = 'INSUFICIENTE';
        throw error;
    }

    const costoUnitario = Number(inv.CostoPromedio);
    const cantidadNum = Number(cantidad);
    const costoTotal = cantidadNum * costoUnitario;

    const saldoPrevio = parseFloat(await saldoKardexActual(conn, IdProducto, IdBodega, IdEmpresa));
    const saldoNuevo = saldoPrevio - cantidadNum;

    await reducirInventario(conn, IdProducto, IdBodega, cantidadNum, IdEmpresa);

    const saldoValor = saldoNuevo * costoUnitario;

    const [res] = await conn.query(
        `INSERT INTO kardex
         (Fecha, IdProducto, IdBodega, TipoMovimiento, DocumentoTipo, IdDocumento,
          EntradaCantidad, EntradaCostoUnitario, EntradaCostoTotal,
          SalidaCantidad, SalidaCostoUnitario, SalidaCostoTotal,
          SaldoCantidad, CostoPromedio, SaldoValor, UsuarioId, IdEmpresa, Observaciones)
         VALUES (NOW(), ?, ?, ?, ?, ?,
                 0, 0, 0,
                 ?, ?, ?,
                 ?, ?, ?, ?, ?, ?)`,
        [
            IdProducto, IdBodega, TipoMovimiento, DocumentoTipo, IdDocumento,
            cantidadNum, costoUnitario, costoTotal,
            saldoNuevo, costoUnitario, saldoValor,
            UsuarioId || null, conEmpresa(IdEmpresa), Observaciones || null
        ]
    );

    return {
        IdKardex: res.insertId,
        IdProducto,
        IdBodega,
        TipoMovimiento,
        cantidad,
        costoUnitario,
        costoTotal,
        SaldoCantidad: saldoNuevo,
        CostoPromedio: costoUnitario,
        SaldoValor: saldoValor
    };
}

// Reversión de una entrada ya registrada (anulación de compra/devoluciones).
// Disminuye existencias y recalcula el CPP quitando el valor que aportó la
// entrada original (cantidad a su costo de entrada). Queda registrada en el
// Kardex como salida a costo del documento original.
async function revertirEntrada(
    conn,
    {
        IdProducto,
        IdBodega,
        TipoMovimiento,
        DocumentoTipo,
        IdDocumento,
        cantidad,
        costoUnitario,
        UsuarioId,
        IdEmpresa,
        Observaciones
    }
) {
    const inventario = await obtenerInventario(conn, IdProducto, IdBodega, IdEmpresa);
    const inv = inventario || await crearInventario(conn, IdProducto, IdBodega, IdEmpresa);

    if (inv.Cantidad < cantidad) {
        const error = new Error('No existe inventario suficiente para revertir la operación.');
        error.codigo = 'INSUFICIENTE';
        throw error;
    }

    const saldoPrevio = parseFloat(await saldoKardexActual(conn, IdProducto, IdBodega, IdEmpresa));

    // Quitar el valor que aportó la entrada original
    const nuevaCantidad = Number(inv.Cantidad) - Number(cantidad);
    const valorPrevio = Number(inv.Cantidad) * Number(inv.CostoPromedio);
    const valorReversa = Number(cantidad) * Number(costoUnitario);
    let nuevoCostoPromedio = Number(inv.CostoPromedio);
    if (nuevaCantidad > 0) {
        nuevoCostoPromedio = (valorPrevio - valorReversa) / nuevaCantidad;
    } else {
        nuevoCostoPromedio = 0;
    }
    const nuevoCostoTotal = nuevaCantidad * nuevoCostoPromedio;

    await conn.query(
        `UPDATE inventario
         SET Cantidad = ?, CostoPromedio = ?, CostoTotal = ?, FechaUltimoMovimiento = NOW()
         WHERE IdProducto = ? AND IdBodega = ? AND IdEmpresa = ?`,
        [nuevaCantidad, nuevoCostoPromedio, nuevoCostoTotal, IdProducto, IdBodega, conEmpresa(IdEmpresa)]
    );

    const saldoNuevo = saldoPrevio - Number(cantidad);
    const saldoValor = saldoNuevo * nuevoCostoPromedio;

    const costoTotalSalida = Number(cantidad) * Number(costoUnitario);

    const [res] = await conn.query(
        `INSERT INTO kardex
         (Fecha, IdProducto, IdBodega, TipoMovimiento, DocumentoTipo, IdDocumento,
          EntradaCantidad, EntradaCostoUnitario, EntradaCostoTotal,
          SalidaCantidad, SalidaCostoUnitario, SalidaCostoTotal,
          SaldoCantidad, CostoPromedio, SaldoValor, UsuarioId, IdEmpresa, Observaciones)
         VALUES (NOW(), ?, ?, ?, ?, ?,
                 0, 0, 0,
                 ?, ?, ?,
                 ?, ?, ?, ?, ?, ?)`,
        [
            IdProducto, IdBodega, TipoMovimiento, DocumentoTipo, IdDocumento,
            Number(cantidad), Number(costoUnitario), costoTotalSalida,
            saldoNuevo, nuevoCostoPromedio, saldoValor,
            UsuarioId || null, conEmpresa(IdEmpresa), Observaciones || null
        ]
    );

    return {
        IdKardex: res.insertId,
        IdProducto,
        IdBodega,
        TipoMovimiento,
        cantidad,
        costoUnitario,
        costoTotal: costoTotalSalida,
        SaldoCantidad: saldoNuevo,
        CostoPromedio: nuevoCostoPromedio,
        SaldoValor: saldoValor
    };
}

module.exports = {
    obtenerInventario,
    crearInventario,
    saldoKardexActual,
    calcularCPP,
    reducirInventario,
    registrarEntrada,
    registrarSalida,
    revertirEntrada
};