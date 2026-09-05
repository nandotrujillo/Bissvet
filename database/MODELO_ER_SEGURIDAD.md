# BissVet - Modelo Entidad-Relación (Módulo de Seguridad y Administración)

**Versión:** 2.0 | **Motor:** MySQL 8.0 | **Fecha:** 05/09/2026

Este documento describe el modelo de datos del módulo de seguridad de BissVet.
El script SQL correspondiente es `database/bissvet_seguridad_maestro.sql`.
**Regla general:** conserva todas las entidades MySQL existentes; solo crea lo que falta.

---

## 1. Actor central: EMPRESA (multi-tenant)

La empresa es la propietaria de toda la información. Un usuario pertenece a
exactamente una empresa, y todos los módulos de negocio (clientes, mascotas,
citas, historias, productos, inventarios, ventas...) llevan la columna
transversal `IdEmpresa` para aislar la información (RF-013, RN-003).

---

## 2. Diagrama entidad-relación (seguridad)

```text
        ┌──────────────────────────┐
        │        EMPRESAS          │
        │  IdEmpresa (PK)          │
        │  CodigoEmpresa (UK)      │
        │  Nit (UK)                │
        └──────────┬───────────────┘
                   │ 1
                   │
         ┌─────────▼───────────────┐          ┌───────────────────────┐
         │       USUARIOS          │  N─────1 │      PERFILES         │
         │  UsuarioId (PK)         │          │  IdPerfil (PK)        │
         │  IdEmpresa (FK)  *      │          └───────────┬───────────┘
         │  IdPerfil (FK)   *      │                      │ 1
         │  Username (UK)          │                      │
         │  PasswordHash (bcrypt)  │                      │ N
         └─────────┬───────────────┘       ┌──────────────▼───────────┐
                   │                       │    PERFILPERMISOS        │
                   │ N                     │  (IdPerfil, IdPermiso)PK │
                   │                       └──────────────┬───────────┘
         ┌─────────▼───────────────┐                       │
         │      USUARIOROLES       │                       │
         │ (UsuarioId, IdRol) PK   │                       │
         └─────────┬───────────────┘                       │
                   │                                      │
                   │ N                                    │
         ┌─────────▼───────────────┐                      │
         │         ROLES           │                      │
         │  IdRol (PK)             │                      │
         │  IdEmpresa (FK) NULL    │  ← NULL = rol sistema│
         └─────────┬───────────────┘                      │
                   │                                      │
                   │ N                ┌───────────────────┘
         ┌─────────▼───────────────┐  │
         │       ROLPERMISOS       │  │ N
         │  (IdRol, IdPermiso) PK  │  │
         └─────────┬───────────────┘  │
                   │                  │
                   │ N                │
         ┌─────────▼───────────────┐  │
         │       PERMISOS          │  │
         │  IdPermiso (PK)         │  │
         │  IdModulo (FK)          │  │
         │  Codigo (UK)            │  │
         └─────────┬───────────────┘  │
                   │                  │
                   │ N                │
         ┌─────────▼───────────────┐  │
         │       MODULOS           │  │
         │  idModulos (PK)         │  │
         │  Codigo (UK)            │  │
         └─────────────────────────┘  │
                                      │
    USUARIOPERMISOS                   │
    (UsuarioId, IdPermiso) PK  ───────┘   permisos directos al usuario (RF-010)
    Sesiones    (RF-020)
    Auditoria   (RF-017)  ──────────────── registra operaciones críticas
    ParametrosSeguridad (RF-018/RF-019) ── política de contraseñas y bloqueo
```

---

## 3. Entidades de seguridad (PK / FK / índices clave)

### 3.1 `empresas` — RF-001, RF-021
| Campo | Tipo | Notas |
|-------|------|-------|
| IdEmpresa | INT PK AI | |
| CodigoEmpresa | VARCHAR(20) UK | |
| Nit | VARCHAR(20) UK | |
| RazonSocial / NombreComercial | VARCHAR(200) | |
| TipoDocumento, Direccion, Telefono, Correo | | |
| IdCiudad | INT FK → ciudades(Id) | |
| Logo | VARCHAR(500) | |
| Activo | TINYINT(1) | inactivar, no borrar |
| FechaCreacion / UsuarioIdCreacion / FechaModificacion / UsuarioIdModificacion | | trazabilidad |

**Índices:** `uk_empresa_codigo`, `uk_empresa_nit`, `idx_empresa_activo`, `idx_empresa_ciudad`

### 3.2 `perfiles` — RF-004
| Campo | Tipo | Notas |
|-------|------|-------|
| IdPerfil | INT PK AI | |
| Nombre | VARCHAR(100) UK | Administrador, Veterinario, Vendedor, ... |
| Descripcion, Activo | | |
| UsuarioIdCreacion / UsuarioIdModificacion | | trazabilidad |

### 3.3 `Usuarios` — RF-003 (sección 6 del doc)
| Campo | Tipo | Notas |
|-------|------|-------|
| UsuarioId | INT PK AI | |
| IdEmpresa | INT FK → empresas | RN-001 |
| IdPerfil | INT FK → perfiles | |
| Username | VARCHAR(50) UK | |
| PasswordHash | VARCHAR(255) | bcrypt, **nunca texto plano** |
| TipoDocumento, NumeroDocumento | | `idx_usuarios_documento` |
| Primer/Segundo Nombre, Primer/Segundo Apellido | | |
| Correo, Telefono | | |
| Activo | TINYINT(1) | RN-004 |
| Bloqueado | TINYINT(1) | RF-018 |
| IntentosFallidos | INT | RF-018 |
| FechaUltimoIngreso / UltimoAcceso | DATETIME | |
| FechaCreacion / UsuarioIdCreacion / FechaModificacion / UsuarioIdModificacion | | trazabilidad |

**Índices:** `uk_usuarios_username`, `idx_usuarios_empresa`, `idx_usuarios_perfil`, `idx_usuarios_documento`

### 3.4 `roles` — RF-005
| Campo | Tipo | Notas |
|-------|------|-------|
| IdRol | INT PK AI | |
| IdEmpresa | INT FK → empresas, **NULL = rol del sistema** | SUPERADMIN |
| Nombre | VARCHAR(100) | UK (IdEmpresa, Nombre) |
| Descripcion, Activo | | |

### 3.5 `usuarioroles` — RF-009 (N-N)
| Campo | Tipo | Notas |
|-------|------|-------|
| UsuarioId | INT FK → Usuarios | parte de PK compuesta |
| IdRol | INT FK → roles | parte de PK compuesta |
| AsignadoPor | INT FK → Usuarios | auditoría |
| FechaAsignacion | DATETIME | |

### 3.6 `modulos` — RF-006
| Campo | Tipo | Notas |
|-------|------|-------|
| idModulos | INT PK AI | columna heredada |
| Codigo | VARCHAR(50) UK | SEGURIDAD, CLIENTES, VENTAS, ... |
| NombreModulo | VARCHAR(60) | |
| Descripcion | VARCHAR(300) | |
| Ruta | VARCHAR(150) | ruta Angular |
| Icono | VARCHAR(100) | |
| Orden | INT | para menú dinámico |
| Activo | TINYINT(1) | |

### 3.7 `permisos` — RF-007
| Campo | Tipo | Notas |
|-------|------|-------|
| IdPermiso | INT PK AI | |
| IdModulo | INT FK → modulos(idModulos) | |
| Codigo | VARCHAR(60) UK | patrón `MODULO.ACCION` (ej. `VENTAS.ANULAR`) |
| Nombre / Descripcion | | |
| Activo | TINYINT(1) | |

### 3.8 `rolpermisos` — RF-008 (N-N)
PK compuesta `(IdRol, IdPermiso)`, columna `TipoAcceso` (`PERMITIR`/`DENEGAR`), `AsignadoPor`, `FechaAsignacion`.

### 3.9 `perfilpermisos` — RF-004 (N-N configuración inicial por perfil)
PK compuesta `(IdPerfil, IdPermiso)`, `TipoAcceso`, `AsignadoPor`, `FechaAsignacion`.

### 3.10 `usuariopermisos` — RF-010 (N-N permisos directos al usuario)
PK compuesta `(UsuarioId, IdPermiso)`, `TipoAcceso`, `AsignadoPor`, `FechaAsignacion`. Usado para excepciones auditadas (ej. `VENTAS.DEVOLVER` a un Vendedor).

### 3.11 `sesiones` — RF-020
| Campo | Tipo | Notas |
|-------|------|-------|
| IdSesion | BIGINT PK AI | |
| IdEmpresa | INT FK → empresas | |
| UsuarioId | INT FK → Usuarios | |
| FechaIngreso / FechaSalida / UltimoAcceso | DATETIME | |
| DireccionIP | VARCHAR(45) | |
| UserAgent | VARCHAR(300) | |
| EstadoSesion | ENUM(ACTIVA, CERRADA, EXPIRADA, BLOQUEADA) | |

### 3.12 `parametrosseguridad` — RF-018/RF-019
Clave-valor configurable: `MAX_INTENTOS_FALLIDOS`, `CLAVE_LONGITUD_MINIMA`, `CLAVE_MAYUSCULA`, `CLAVE_MINUSCULA`, `CLAVE_NUMERO`, `CLAVE_ESPECIAL`, `CLAVE_DIAS_EXPIRACION`.

### 3.13 `auditoria` — RF-017
| Campo | Tipo | Notas |
|-------|------|-------|
| IdAuditoria | BIGINT PK AI | |
| IdEmpresa | INT FK → empresas | |
| UsuarioId | INT FK → Usuarios | |
| IdModulo | INT FK → modulos | |
| Tabla / RegistroId | | entidad afectada |
| Accion | VARCHAR(30) | CONSULTAR, CREAR, EDITAR, ELIMINAR, ANULAR, LOGIN... |
| Fecha / DireccionIP | | |
| DatosAnteriores / DatosNuevos | LONGTEXT (JSON) | PRE y POST |
| Descripcion | VARCHAR(500) | |

**Índices:** `idx_auditoria_empresa_fecha`, `idx_auditoria_usuario`, `idx_auditoria_modulo`, `idx_auditoria_registro`

---

## 4. Aislamiento por empresa (RF-013)

La columna `IdEmpresa INT NULL` + índice + FK se garantiza en todas las
entidades de negocio: clientes, mascotas, veterinarios, citas, servicios,
historiasclínicas, antecedentes, signosvitales, examenfisico, diagnosticos,
tratamientos, recetas, detallerecetas, procedimientos, cirugias, registros
pre/anestésico/post, controles, archivos, consentimiento, alertas, productos,
bodegas, inventario, kardex, lotes, proveedores, compras, ventas, traslados,
ajustes, devoluciones y citas_productos.

---

## 5. Flujo de autorización (implementación en Node.js)

```text
JWT válido
   └─▶ Usuario activo (Activo = 1, Bloqueado = 0)
        └─▶ Empresa activa (Activo = 1)
             └─▶ Permiso = MODULO.ACCION
                  │  permisos de (roles del usuario) ∪ usuariopermisos
                  │  menos los DENEGAR (precedencia sobre PERMITIR)
                  │
                  ├─ NO → 403 No autorizado
                  └─ SÍ → validar IdEmpresa de la entidad == IdEmpresa del token
                            └─▶ Ejecutar → Registrar auditoría (misma transacción)
```