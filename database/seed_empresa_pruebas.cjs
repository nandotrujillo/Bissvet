// =============================================================================
// SEED: Empresa de pruebas 2 (multitempresa)
// -----------------------------------------------------------------------------
// Crea:
//   1. Empresa "Veterinaria Pruebas SAS" (IdEmpresa 2)
//   2. Suscripción PLAN EMPRESARIAL (3) en estado ACTIVA -> acceso a todos
//      los módulos operativos + clínicos + CAJA
//   3. Usuario admin2 (mismo password que "admin": copia su hash bcrypt),
//      perfil Administrador (1) + rol ADMINISTRADOR (1)
//   4. Catálogos operativos de la empresa: bodega, sede, proveedor,
//      tipos de movimiento de caja, tipos de pago, cliente, veterinario,
//      categoría de servicio + servicio
//   5. 3 productos CON INVENTARIO inicial para ventas
//
// Los catálogos base globales (categorías de producto, marcas y unidades de
// medida con IdEmpresa NULL) se comparten entre empresas y NO se duplican.
//
// Idempotente: si la empresa con el NIT indicado ya existe, no hace nada.
// =============================================================================

const mysql = require('mysql2/promise');

const NIT_PRUEBA = '901234567-8';

(async () => {
    const conn = await mysql.createConnection({
        host: 'localhost', port: 3306, user: 'root', password: 'admin',
        database: 'BissVet'
    });

    const ID_EMPRESA_PRUEBA = 2; // IdEmpresa fija para la empresa de pruebas

    const [existe] = await conn.query(
        'SELECT IdEmpresa FROM empresas WHERE IdEmpresa = ?', [ID_EMPRESA_PRUEBA]
    );
    if (existe.length) {
        console.log('Ya existe la empresa de pruebas (IdEmpresa=' + existe[0].IdEmpresa + '). Seed omitido.');
        await conn.end();
        return;
    }
    const log = (...a) => console.log.apply(null, a);

    // -----------------------------------------------------------------------
    // 1. EMPRESA (IdEmpresa fija = 2)
    // -----------------------------------------------------------------------
    await conn.query(
        `INSERT INTO empresas (IdEmpresa, CodigoEmpresa, Nit, RazonSocial, NombreComercial, TipoDocumento,
                               Direccion, Telefono, Correo, IdCiudad, Activo, UsaControlCaja,
                               FechaCreacion, Contacto, TelefonoContacto)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, NOW(), ?, ?)`,
        [ID_EMPRESA_PRUEBA, 'EMP002', NIT_PRUEBA, 'Veterinaria Pruebas SAS', 'Vet Pruebas', 'NIT',
         'Calle Test 123', '3100000000', 'contacto@vetpruebas.com', 1,
         'CLIENTE TEST', '3110000000']
    );
    const eId = ID_EMPRESA_PRUEBA;
    log('1. Empresa creada: IdEmpresa=' + eId);

    // -----------------------------------------------------------------------
    // 2. SUSCRIPCIÓN PLAN EMPRESARIAL (3) ACTIVA
    // -----------------------------------------------------------------------
    await conn.query(
        `INSERT INTO suscripciones (IdEmpresa, IdPlan, Estado, FechaInicio, FechaFin,
                                    Periodicidad, AutoRenovacion, FechaCreacion)
         VALUES (?, 3, 'ACTIVA', NOW(), DATE_ADD(NOW(), INTERVAL 30 DAY), 'MENSUAL', 0, NOW())`,
        [eId]
    );
    log('2. Suscripción EMPRESARIAL ACTIVA creada.');

    // -----------------------------------------------------------------------
    // 3. USUARIO ADMIN2 (copia el hash bcrypt de "admin"; mismo password)
    // -----------------------------------------------------------------------
    const [[admin]] = await conn.query(
        'SELECT PasswordHash FROM usuarios WHERE Username = ?', ['admin']
    );
    const [usr] = await conn.query(
        `INSERT INTO usuarios (Username, PasswordHash, IdEmpresa, IdPerfil, TipoDocumento,
                               NumeroDocumento, PrimerNombre, PrimerApellido, Correo,
                               Activo, Bloqueado, IntentosFallidos, FechaCreacion)
         VALUES ('admin2', ?, ?, 1, 'CC', '1000000002', 'Admin', 'Pruebas',
                 'admin2@vetpruebas.com', 1, 0, 0, NOW())`,
        [admin.PasswordHash, eId]
    );
    const aId = usr.insertId;
    await conn.query(
        `INSERT INTO usuarioroles (UsuarioId, IdRol, AsignadoPor, FechaAsignacion)
         VALUES (?, 1, ?, NOW())`, [aId, aId]
    );
    log('3. Usuario admin2 creado: UsuarioId=' + aId + ' (misma clave que admin, perfil Administrador + rol ADMINISTRADOR).');

    // -----------------------------------------------------------------------
    // 4. CATÁLOGOS OPERATIVOS DE LA EMPRESA 2
    // -----------------------------------------------------------------------
    const [bodega] = await conn.query(
        `INSERT INTO bodegas (CodigoBodega, NombreBodega, IdEmpresa, Estatus, Activo)
         VALUES ('BOD-01', 'Bodega Principal', ?, 1, 1)`, [eId]
    );
    const bId = bodega.insertId;
    log('4. Catálogos:');

    await conn.query(
        `INSERT INTO sedestiendas (CodigoSede, NombreSede, IdEmpresa, Estatus, DireccionSede,
                                   ContactoSede, CorreoElectronico, IdCiudad, IdBodega, TiendaActiva)
         VALUES ('SED-01', 'Sede Principal', ?, 1, 'Calle Test 123', 'CLIENTE TEST',
                 'sede@vetpruebas.com', 1, ?, 1)`, [eId, bId]
    );
    log('    - sede principal (ref bodega ' + bId + ')');

    await conn.query(
        `INSERT INTO proveedores (TipoDocumento, NumeroDocumento, Nit, Nombre, Telefono,
                                  Email, Direccion, IdCiudad, Contacto, Activo, FechaCreacion, IdEmpresa)
         VALUES ('NIT', '900999777-0', '900999777-0', 'Proveedor Pruebas SAS', '3150000000',
                 'proveedor@pruebas.com', 'Cra 45 # 10-20', 1, 'Proveedor Test', 1, NOW(), ?)`, [eId]
    );
    log('    - proveedor');

    await conn.query(
        `INSERT INTO tipomovcaja (DescTipoMovCaja, ProvisionCaja, Gastos, Ventas, Prestamo,
                                  idEmpresa, Estatus, IdUsuario, Signo, AplicaProveedores)
         SELECT DescTipoMovCaja, ProvisionCaja, Gastos, Ventas, Prestamo,
                ?, Estatus, ?, Signo, AplicaProveedores
         FROM tipomovcaja WHERE idEmpresa = 1`, [eId, aId]
    );
    log('    - tipos de movimiento de caja (clonados de empresa 1)');

    await conn.query(
        `INSERT INTO tipospago (Nombre, Descripcion, Activo, FechaCreacion, UsuarioIdCreacion, IdEmpresa)
         SELECT Nombre, Descripcion, Activo, NOW(), ?, ?
         FROM tipospago WHERE IdEmpresa = 1`, [aId, eId]
    );
    log('    - tipos de pago (clonados de empresa 1)');

    const [imp] = await conn.query(
        `INSERT INTO tipoimpuesto (NombreImpuesto, Porcentaje, IdEmpresa, EsIva, Signo)
         VALUES ('IVA', 19, ?, 1, '+')`, [eId]
    );
    log('    - tipo de impuesto IVA 19% (EsIva=1, Id=' + imp.insertId + ')');

    const docs = [
        { cod: 'NIT', nombre: 'NIT' },
        { cod: 'CC', nombre: 'Cédula de Ciudadanía' },
        { cod: 'CE', nombre: 'Cédula de Extranjería' },
        { cod: 'PA', nombre: 'Pasaporte' },
        { cod: 'RU', nombre: 'RUT' }
    ];
    for (const d of docs) {
        const [[sig]] = await conn.query(`SELECT IFNULL(MAX(Id), 0) + 1 AS siguiente FROM tipodocumento`);
        await conn.query(
            `INSERT INTO tipodocumento (Id, Codigo, Documento, Estatus, IdEmpresa)
             VALUES (?, ?, ?, 1, ?)`, [sig.siguiente, d.cod, d.nombre, eId]
        );
    }
    log('    - tipos de documento (NIT, CC, CE, PAS, RUT)');

    const [cli] = await conn.query(
        `INSERT INTO clientes (TipoDocumento, NumeroDocumento, PrimerNombre, PrimerApellido,
                               Telefono, Correo, Activo, FechaCreacion, UsuarioIdCreacion, IdEmpresa)
         VALUES ('CC', '1000000011', 'Cliente', 'Mostrador', '3160000000',
                 'cliente@pruebas.com', 1, NOW(), ?, ?)`, [aId, eId]
    );
    log('    - cliente (ClienteId=' + cli.insertId + ')');

    await conn.query(
        `INSERT INTO veterinarios (UsuarioId, PrimerNombre, PrimerApellido, TipoDocumento,
                                   NumeroDocumento, TarjetaProfesional, Especialidad, Telefono,
                                   Correo, IdCiudad, Activo, FechaCreacion, UsuarioIdCreacion, IdEmpresa)
         VALUES (?, 'Admin', 'Pruebas', 'CC', '1000000002', 'TP-0002', 'General',
                 '3100000000', 'admin2@vetpruebas.com', 1, 1, NOW(), ?, ?)`, [aId, aId, eId]
    );
    log('    - veterinario');

    const [catServ] = await conn.query(
        `INSERT INTO categoriasservicio (IdModulo, Nombre, Descripcion, Activo, idModulos, IdEmpresa)
         VALUES (0, 'Consulta', 'Consultas generales', 1, 1, ?)`, [eId]
    );
    await conn.query(
        `INSERT INTO servicios (IdCategoriaServicio, Nombre, Descripcion, Precio, Activo,
                                FechaCreacion, IdUsuarioCreacion, IdEmpresa)
         VALUES (?, 'Consulta General', 'Consulta veterinaria general', 45000, 1, NOW(), ?, ?)`,
        [catServ.insertId, aId, eId]
    );
    log('    - categoría de servicio + servicio Consulta');

    // -----------------------------------------------------------------------
    // 5. PRODUCTOS CON INVENTARIO (catálogos base globales compartidos)
    //    categoriasproducto: 1=Alimento, 2=Farmacéutico | unidades: 1=Unidad, 2=Caja
    //    marcas: 1=Royal Canin, 3=Bayer
    // -----------------------------------------------------------------------
    const productos = [
        { cod: 'P-2001', barras: '7702001', nombre: 'Amoxicilina 500 mg', cat: 2, uni: 1, marca: 3,
          pv: 25000, costo: 12000, min: 5, max: 100, cant: 60 },
        { cod: 'P-2002', barras: '7702002', nombre: 'Alimento Royal Canin 10 kg', cat: 1, uni: 2, marca: 1,
          pv: 185000, costo: 150000, min: 3, max: 30, cant: 20 },
        { cod: 'P-2003', barras: '7702003', nombre: 'Jeringa 5 ml', cat: 2, uni: 1, marca: null,
          pv: 2500, costo: 1200, min: 20, max: 500, cant: 150 }
    ];

    for (const p of productos) {
        const [prod] = await conn.query(
            `INSERT INTO productos (CodigoProducto, CodigoBarras, NombreProducto, Descripcion,
                                    IdCategoriaProducto, IdUnidadMedida, IdMarca, PrecioVenta,
                                    CostoActual, CostoPromedio, StockMinimo, StockMaximo,
                                    ManejaInventario, PermiteVenta, Activo, FechaCreacion, IdEmpresa)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1, NOW(), ?)`,
            [p.cod, p.barras, p.nombre, p.nombre, p.cat, p.uni, p.marca,
             p.pv, p.costo, p.costo, p.min, p.max, eId]
        );
        const pId = prod.insertId;

        await conn.query(
            `INSERT INTO inventario (IdProducto, IdBodega, Cantidad, CostoPromedio, CostoTotal,
                                     FechaUltimoMovimiento, Activo, IdEmpresa)
             VALUES (?, ?, ?, ?, ?, NOW(), 1, ?)`,
            [pId, bId, p.cant, p.costo, p.costo * p.cant, eId]
        );
        log('    - producto ' + p.cod + ' "' + p.nombre + '" (IdProducto=' + pId + ', stock=' + p.cant + ')');
    }

    log('');
    log('Seed empresa de pruebas completado.');
    log('');
    log('LN:  admin2   (misma clave que admin)');
    log('    Perfil: Administrador | Rol: ADMINISTRADOR | Plan: EMPRESARIAL');
    log('    Catálogos + 3 productos con inventario + cliente + servicios.');

    await conn.end();
})();