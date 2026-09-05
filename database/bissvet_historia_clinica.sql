-- ============================================================================
-- BISSVET - SCRIPT DE BASE DE DATOS
-- Módulo de Citas e Historia Clínica Veterinaria
-- MySQL 8.0
-- Fecha: 04/09/2026
-- ============================================================================

-- Nota: Este script crea las tablas necesarias para el módulo de Citas e
-- Historia Clínica. Las tablas existentes (clientes, mascotas, veterinarios,
-- servicios, usuarios, etc.) se asumen ya creadas.

-- ============================================================================
-- FASE 1: CITAS
-- ============================================================================

-- Tabla: citas
-- Descripción: Almacena las citas veterinarias programadas
-- Una cita es el punto de partida de una atención veterinaria
CREATE TABLE IF NOT EXISTS citas (
    IdCita INT AUTO_INCREMENT PRIMARY KEY,
    IdMascota INT NOT NULL,
    IdVeterinario INT NOT NULL,
    IdServicio INT NOT NULL,
    FechaCita DATE NOT NULL,
    HoraCita TIME NOT NULL,
    Estado ENUM('Pendiente', 'Confirmada', 'En atención', 'Atendida', 'Cancelada', 'No asistió', 'Reprogramada') NOT NULL DEFAULT 'Pendiente',
    MotivoConsulta TEXT,
    Observaciones TEXT,
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UsuarioIdCreacion INT,
    FechaModificacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UsuarioIdModificacion INT,
    -- Claves foráneas
    CONSTRAINT fk_citas_mascota FOREIGN KEY (IdMascota) REFERENCES mascotas(IdMascota),
    CONSTRAINT fk_citas_veterinario FOREIGN KEY (IdVeterinario) REFERENCES veterinarios(IdVeterinario),
    CONSTRAINT fk_citas_servicio FOREIGN KEY (IdServicio) REFERENCES servicios(IdServicio),
    CONSTRAINT fk_citas_usuario_creacion FOREIGN KEY (UsuarioIdCreacion) REFERENCES Usuarios(UsuarioId),
    CONSTRAINT fk_citas_usuario_modificacion FOREIGN KEY (UsuarioIdModificacion) REFERENCES Usuarios(UsuarioId),
    -- Índices para búsquedas frecuentes
    INDEX idx_citas_mascota (IdMascota),
    INDEX idx_citas_veterinario (IdVeterinario),
    INDEX idx_citas_fecha (FechaCita),
    INDEX idx_citas_estado (Estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- FASE 2: HISTORIA CLÍNICA
-- ============================================================================

-- Tabla: historiasclinicas
-- Descripción: Registra cada atención clínica de una mascota
-- Una cita atendida puede generar una historia clínica
-- La historia clínica es acumulativa y cronológica
CREATE TABLE IF NOT EXISTS historiasclinicas (
    IdHistoriaClinica INT AUTO_INCREMENT PRIMARY KEY,
    IdCita INT,
    IdMascota INT NOT NULL,
    IdVeterinario INT NOT NULL,
    FechaAtencion DATETIME NOT NULL,
    MotivoConsulta TEXT NOT NULL,
    EnfermedadActual TEXT,
    Observaciones TEXT,
    Estado ENUM('Abierta', 'En curso', 'Cerrada', 'Alta') NOT NULL DEFAULT 'Abierta',
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UsuarioIdCreacion INT,
    FechaModificacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UsuarioIdModificacion INT,
    -- Claves foráneas
    CONSTRAINT fk_historia_cita FOREIGN KEY (IdCita) REFERENCES citas(IdCita),
    CONSTRAINT fk_historia_mascota FOREIGN KEY (IdMascota) REFERENCES mascotas(IdMascota),
    CONSTRAINT fk_historia_veterinario FOREIGN KEY (IdVeterinario) REFERENCES veterinarios(IdVeterinario),
    CONSTRAINT fk_historia_usuario_creacion FOREIGN KEY (UsuarioIdCreacion) REFERENCES Usuarios(UsuarioId),
    CONSTRAINT fk_historia_usuario_modificacion FOREIGN KEY (UsuarioIdModificacion) REFERENCES Usuarios(UsuarioId),
    -- Índices
    INDEX idx_historia_mascota (IdMascota),
    INDEX idx_historia_veterinario (IdVeterinario),
    INDEX idx_historia_fecha (FechaAtencion),
    INDEX idx_historia_estado (Estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: antecedentes
-- Descripción: Almacena el historial clínico relevante de la mascota
-- Se registra una vez por mascota y se actualiza cuando es necesario
CREATE TABLE IF NOT EXISTS antecedentes (
    IdAntecedente INT AUTO_INCREMENT PRIMARY KEY,
    IdMascota INT NOT NULL,
    EnfermedadesAnteriores TEXT,
    CirugiasAnteriores TEXT,
    Alergias TEXT,
    Vacunacion TEXT,
    Desparasitacion TEXT,
    MedicamentosActuales TEXT,
    TratamientosAnteriores TEXT,
    AntecedentesHereditarios TEXT,
    Alimentacion TEXT,
    Habitos TEXT,
    Observaciones TEXT,
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UsuarioIdCreacion INT,
    FechaModificacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UsuarioIdModificacion INT,
    -- Claves foráneas
    CONSTRAINT fk_antecedentes_mascota FOREIGN KEY (IdMascota) REFERENCES mascotas(IdMascota),
    CONSTRAINT fk_antecedentes_usuario_creacion FOREIGN KEY (UsuarioIdCreacion) REFERENCES Usuarios(UsuarioId),
    CONSTRAINT fk_antecedentes_usuario_modificacion FOREIGN KEY (UsuarioIdModificacion) REFERENCES Usuarios(UsuarioId),
    -- Índice único por mascota (un solo registro de antecedentes por mascota)
    UNIQUE INDEX idx_antecedentes_mascota (IdMascota)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: signosvitales
-- Descripción: Registra los signos vitales de cada atención
-- Permite el seguimiento del peso y otros indicadores en el tiempo
CREATE TABLE IF NOT EXISTS signosvitales (
    IdSignosVitales INT AUTO_INCREMENT PRIMARY KEY,
    IdHistoriaClinica INT NOT NULL,
    Peso DECIMAL(5,2),
    Temperatura DECIMAL(4,1),
    FrecuenciaCardiaca INT,
    FrecuenciaRespiratoria INT,
    EstadoHidratacion VARCHAR(50),
    CondicionCorporal VARCHAR(50),
    Mucosas VARCHAR(50),
    TiempoLlenadoCapilar INT,
    Observaciones TEXT,
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Claves foráneas
    CONSTRAINT fk_signos_historia FOREIGN KEY (IdHistoriaClinica) REFERENCES historiasclinicas(IdHistoriaClinica),
    -- Índice para búsquedas por historia
    INDEX idx_signos_historia (IdHistoriaClinica)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: examenfisico
-- Descripción: Registra el examen físico detallado de cada atención
CREATE TABLE IF NOT EXISTS examenfisico (
    IdExamenFisico INT AUTO_INCREMENT PRIMARY KEY,
    IdHistoriaClinica INT NOT NULL,
    EstadoGeneral TEXT,
    Cabeza TEXT,
    Ojos TEXT,
    Oidos TEXT,
    Nariz TEXT,
    Boca TEXT,
    Cuello TEXT,
    SistemaRespiratorio TEXT,
    SistemaCardiovascular TEXT,
    Abdomen TEXT,
    SistemaDigestivo TEXT,
    SistemaUrinario TEXT,
    SistemaReproductivo TEXT,
    SistemaMusculoesqueletico TEXT,
    PielYPelaje TEXT,
    SistemaNeurologico TEXT,
    Ganglios TEXT,
    OtrosHallazgos TEXT,
    ObservacionesGenerales TEXT,
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Claves foráneas
    CONSTRAINT fk_examenfisico_historia FOREIGN KEY (IdHistoriaClinica) REFERENCES historiasclinicas(IdHistoriaClinica),
    -- Índice
    INDEX idx_examenfisico_historia (IdHistoriaClinica)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- FASE 3: DIAGNÓSTICOS, TRATAMIENTOS Y RECETAS
-- ============================================================================

-- Tabla: diagnosticos
-- Descripción: Registra uno o varios diagnósticos por atención
CREATE TABLE IF NOT EXISTS diagnosticos (
    IdDiagnostico INT AUTO_INCREMENT PRIMARY KEY,
    IdHistoriaClinica INT NOT NULL,
    Diagnostico TEXT NOT NULL,
    CodigoDiagnostico VARCHAR(20),
    TipoDiagnostico ENUM('Presuntivo', 'Definitivo', 'Diferencial') NOT NULL DEFAULT 'Presuntivo',
    Observaciones TEXT,
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UsuarioIdCreacion INT,
    -- Claves foráneas
    CONSTRAINT fk_diagnosticos_historia FOREIGN KEY (IdHistoriaClinica) REFERENCES historiasclinicas(IdHistoriaClinica),
    CONSTRAINT fk_diagnosticos_usuario FOREIGN KEY (UsuarioIdCreacion) REFERENCES Usuarios(UsuarioId),
    -- Índices
    INDEX idx_diagnosticos_historia (IdHistoriaClinica),
    INDEX idx_diagnosticos_tipo (TipoDiagnostico)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: tratamientos
-- Descripción: Registra los tratamientos asociados a una historia clínica
CREATE TABLE IF NOT EXISTS tratamientos (
    IdTratamiento INT AUTO_INCREMENT PRIMARY KEY,
    IdHistoriaClinica INT NOT NULL,
    NombreTratamiento VARCHAR(200) NOT NULL,
    Descripcion TEXT,
    FechaInicio DATE,
    FechaFin DATE,
    Indicaciones TEXT,
    Observaciones TEXT,
    Estado ENUM('Activo', 'Finalizado', 'Suspendido', 'Cancelado') NOT NULL DEFAULT 'Activo',
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UsuarioIdCreacion INT,
    FechaModificacion DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UsuarioIdModificacion INT,
    -- Claves foráneas
    CONSTRAINT fk_tratamientos_historia FOREIGN KEY (IdHistoriaClinica) REFERENCES historiasclinicas(IdHistoriaClinica),
    CONSTRAINT fk_tratamientos_usuario_creacion FOREIGN KEY (UsuarioIdCreacion) REFERENCES Usuarios(UsuarioId),
    CONSTRAINT fk_tratamientos_usuario_modificacion FOREIGN KEY (UsuarioIdModificacion) REFERENCES Usuarios(UsuarioId),
    -- Índices
    INDEX idx_tratamientos_historia (IdHistoriaClinica),
    INDEX idx_tratamientos_estado (Estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: recetas
-- Descripción: Cabecera de recetas veterinarias
-- Una historia clínica puede generar una o varias recetas
CREATE TABLE IF NOT EXISTS recetas (
    IdReceta INT AUTO_INCREMENT PRIMARY KEY,
    IdHistoriaClinica INT NOT NULL,
    Fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    IdVeterinario INT NOT NULL,
    Observaciones TEXT,
    IndicacionesGenerales TEXT,
    Estado ENUM('Activa', 'Dispensada', 'Cancelada') NOT NULL DEFAULT 'Activa',
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UsuarioIdCreacion INT,
    -- Claves foráneas
    CONSTRAINT fk_recetas_historia FOREIGN KEY (IdHistoriaClinica) REFERENCES historiasclinicas(IdHistoriaClinica),
    CONSTRAINT fk_recetas_veterinario FOREIGN KEY (IdVeterinario) REFERENCES veterinarios(IdVeterinario),
    CONSTRAINT fk_recetas_usuario FOREIGN KEY (UsuarioIdCreacion) REFERENCES Usuarios(UsuarioId),
    -- Índices
    INDEX idx_recetas_historia (IdHistoriaClinica),
    INDEX idx_recetas_fecha (Fecha),
    INDEX idx_recetas_estado (Estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: detallerecetas
-- Descripción: Detalle de medicamentos en cada receta
-- Relación con productos (inventario) es opcional para futura integración
CREATE TABLE IF NOT EXISTS detallerecetas (
    IdDetalleReceta INT AUTO_INCREMENT PRIMARY KEY,
    IdReceta INT NOT NULL,
    IdProducto INT,
    Medicamento VARCHAR(200) NOT NULL,
    Concentracion VARCHAR(100),
    FormaFarmaceutica VARCHAR(100),
    Dosis VARCHAR(100),
    UnidadDosis VARCHAR(50),
    Frecuencia VARCHAR(100),
    ViaAdministracion VARCHAR(100),
    Duracion VARCHAR(100),
    Cantidad INT,
    Indicaciones TEXT,
    Observaciones TEXT,
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Claves foráneas
    CONSTRAINT fk_detallereceta_receta FOREIGN KEY (IdReceta) REFERENCES recetas(IdReceta),
    -- NOTA: La FK a productos se habilitará cuando exista la tabla productos
    -- CONSTRAINT fk_detallereceta_producto FOREIGN KEY (IdProducto) REFERENCES productos(IdProducto),
    -- Índices
    INDEX idx_detallereceta_receta (IdReceta)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- FASE 4: PROCEDIMIENTOS Y CIRUGÍAS
-- ============================================================================

-- Tabla: procedimientos
-- Descripción: Registra procedimientos realizados durante la atención
-- Ejemplos: vacunación, desparasitación, curación, toma de muestras, etc.
CREATE TABLE IF NOT EXISTS procedimientos (
    IdProcedimiento INT AUTO_INCREMENT PRIMARY KEY,
    IdHistoriaClinica INT NOT NULL,
    IdServicio INT,
    NombreProcedimiento VARCHAR(200) NOT NULL,
    Fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Descripcion TEXT,
    Resultado TEXT,
    Observaciones TEXT,
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UsuarioIdCreacion INT,
    -- Claves foráneas
    CONSTRAINT fk_procedimientos_historia FOREIGN KEY (IdHistoriaClinica) REFERENCES historiasclinicas(IdHistoriaClinica),
    CONSTRAINT fk_procedimientos_servicio FOREIGN KEY (IdServicio) REFERENCES servicios(IdServicio),
    CONSTRAINT fk_procedimientos_usuario FOREIGN KEY (UsuarioIdCreacion) REFERENCES Usuarios(UsuarioId),
    -- Índices
    INDEX idx_procedimientos_historia (IdHistoriaClinica),
    INDEX idx_procedimientos_fecha (Fecha)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: cirugias
-- Descripción: Registra información quirúrgica completa
-- Incluye pre, intra y post operatorio
CREATE TABLE IF NOT EXISTS cirugias (
    IdCirugia INT AUTO_INCREMENT PRIMARY KEY,
    IdHistoriaClinica INT NOT NULL,
    IdMascota INT NOT NULL,
    IdVeterinario INT NOT NULL,
    FechaProgramacion DATE,
    FechaCirugia DATETIME,
    TipoCirugia VARCHAR(200) NOT NULL,
    Motivo TEXT,
    DiagnosticoPreoperatorio TEXT,
    DiagnosticoPostoperatorio TEXT,
    ProcedimientoRealizado TEXT,
    TipoAnestesia VARCHAR(100),
    Observaciones TEXT,
    Estado ENUM('Programada', 'Realizada', 'Cancelada', 'Suspendida') NOT NULL DEFAULT 'Programada',
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UsuarioIdCreacion INT,
    -- Claves foráneas
    CONSTRAINT fk_cirugias_historia FOREIGN KEY (IdHistoriaClinica) REFERENCES historiasclinicas(IdHistoriaClinica),
    CONSTRAINT fk_cirugias_mascota FOREIGN KEY (IdMascota) REFERENCES mascotas(IdMascota),
    CONSTRAINT fk_cirugias_veterinario FOREIGN KEY (IdVeterinario) REFERENCES veterinarios(IdVeterinario),
    CONSTRAINT fk_cirugias_usuario FOREIGN KEY (UsuarioIdCreacion) REFERENCES Usuarios(UsuarioId),
    -- Índices
    INDEX idx_cirugias_historia (IdHistoriaClinica),
    INDEX idx_cirugias_mascota (IdMascota),
    INDEX idx_cirugias_estado (Estado),
    INDEX idx_cirugias_fecha (FechaCirugia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: registropreoperatorio
-- Descripción: Datos prequirúrgicos de la cirugía
CREATE TABLE IF NOT EXISTS registropreoperatorio (
    IdRegistroPreoperatorio INT AUTO_INCREMENT PRIMARY KEY,
    IdCirugia INT NOT NULL,
    Peso DECIMAL(5,2),
    Temperatura DECIMAL(4,1),
    FrecuenciaCardiaca INT,
    FrecuenciaRespiratoria INT,
    EstadoGeneral TEXT,
    ExamenesPrequirurgicos TEXT,
    RiesgoAnestesico VARCHAR(50),
    Ayuno TEXT,
    Observaciones TEXT,
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UsuarioIdCreacion INT,
    -- Claves foráneas
    CONSTRAINT fk_preoperatorio_cirugia FOREIGN KEY (IdCirugia) REFERENCES cirugias(IdCirugia),
    CONSTRAINT fk_preoperatorio_usuario FOREIGN KEY (UsuarioIdCreacion) REFERENCES Usuarios(UsuarioId),
    -- Índice único por cirugía
    UNIQUE INDEX idx_preoperatorio_cirugia (IdCirugia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: registroanestesico
-- Descripción: Registro del proceso anestésico durante la cirugía
CREATE TABLE IF NOT EXISTS registroanestesico (
    IdRegistroAnestesico INT AUTO_INCREMENT PRIMARY KEY,
    IdCirugia INT NOT NULL,
    MedicamentosAnestesicos TEXT,
    Dosis TEXT,
    HoraAdministracion TIME,
    ViaAdministracion VARCHAR(100),
    HoraInicio TIME,
    HoraFin TIME,
    SignosVitales TEXT,
    Observaciones TEXT,
    Complicaciones TEXT,
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UsuarioIdCreacion INT,
    -- Claves foráneas
    CONSTRAINT fk_anestesico_cirugia FOREIGN KEY (IdCirugia) REFERENCES cirugias(IdCirugia),
    CONSTRAINT fk_anestesico_usuario FOREIGN KEY (UsuarioIdCreacion) REFERENCES Usuarios(UsuarioId),
    -- Índice único por cirugía
    UNIQUE INDEX idx_anestesico_cirugia (IdCirugia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: registropostoperatorio
-- Descripción: Datos postoperatorios de la cirugía
CREATE TABLE IF NOT EXISTS registropostoperatorio (
    IdRegistroPostoperatorio INT AUTO_INCREMENT PRIMARY KEY,
    IdCirugia INT NOT NULL,
    EstadoPostoperatorio TEXT,
    Medicamentos TEXT,
    Tratamiento TEXT,
    Recomendaciones TEXT,
    Alimentacion TEXT,
    Restricciones TEXT,
    Cuidados TEXT,
    SignosDeAlarma TEXT,
    FechaControl DATE,
    Observaciones TEXT,
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UsuarioIdCreacion INT,
    -- Claves foráneas
    CONSTRAINT fk_postoperatorio_cirugia FOREIGN KEY (IdCirugia) REFERENCES cirugias(IdCirugia),
    CONSTRAINT fk_postoperatorio_usuario FOREIGN KEY (UsuarioIdCreacion) REFERENCES Usuarios(UsuarioId),
    -- Índice único por cirugía
    UNIQUE INDEX idx_postoperatorio_cirugia (IdCirugia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- FASE 5: CONTROLES
-- ============================================================================

-- Tabla: controles
-- Descripción: Registra controles posteriores a una atención o cirugía
-- Permite el seguimiento y evolución del paciente
CREATE TABLE IF NOT EXISTS controles (
    IdControl INT AUTO_INCREMENT PRIMARY KEY,
    IdHistoriaClinica INT NOT NULL,
    IdMascota INT NOT NULL,
    IdVeterinario INT NOT NULL,
    IdCirugia INT,
    FechaControl DATETIME NOT NULL,
    Motivo TEXT,
    Evolucion TEXT,
    Peso DECIMAL(5,2),
    SignosVitales TEXT,
    Observaciones TEXT,
    Recomendaciones TEXT,
    ProximoControl DATE,
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UsuarioIdCreacion INT,
    -- Claves foráneas
    CONSTRAINT fk_controles_historia FOREIGN KEY (IdHistoriaClinica) REFERENCES historiasclinicas(IdHistoriaClinica),
    CONSTRAINT fk_controles_mascota FOREIGN KEY (IdMascota) REFERENCES mascotas(IdMascota),
    CONSTRAINT fk_controles_veterinario FOREIGN KEY (IdVeterinario) REFERENCES veterinarios(IdVeterinario),
    CONSTRAINT fk_controles_cirugia FOREIGN KEY (IdCirugia) REFERENCES cirugias(IdCirugia),
    CONSTRAINT fk_controles_usuario FOREIGN KEY (UsuarioIdCreacion) REFERENCES Usuarios(UsuarioId),
    -- Índices
    INDEX idx_controles_historia (IdHistoriaClinica),
    INDEX idx_controles_mascota (IdMascota),
    INDEX idx_controles_fecha (FechaControl),
    INDEX idx_controles_proximofecha (ProximoControl)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- FASE 6: DOCUMENTOS, AUDITORÍA Y ALERTAS
-- ============================================================================

-- Tabla: archivoshistoriaclinica
-- Descripción: Almacena documentos y archivos adjuntos a la historia clínica
-- Ejemplos: radiografías, ecografías, fotos, consentimientos, informes
CREATE TABLE IF NOT EXISTS archivoshistoriaclinica (
    IdArchivo INT AUTO_INCREMENT PRIMARY KEY,
    IdHistoriaClinica INT NOT NULL,
    TipoArchivo VARCHAR(100) NOT NULL,
    NombreArchivo VARCHAR(255) NOT NULL,
    Descripcion TEXT,
    RutaArchivo VARCHAR(500) NOT NULL,
    TamanoBytes INT,
    TipoMIME VARCHAR(100),
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UsuarioIdCreacion INT,
    -- Claves foráneas
    CONSTRAINT fk_archivos_historia FOREIGN KEY (IdHistoriaClinica) REFERENCES historiasclinicas(IdHistoriaClinica),
    CONSTRAINT fk_archivos_usuario FOREIGN KEY (UsuarioIdCreacion) REFERENCES Usuarios(UsuarioId),
    -- Índices
    INDEX idx_archivos_historia (IdHistoriaClinica),
    INDEX idx_archivos_tipo (TipoArchivo)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: consentimientoinformado
-- Descripción: Registra consentimientos informados para procedimientos y cirugías
CREATE TABLE IF NOT EXISTS consentimientoinformado (
    IdConsentimiento INT AUTO_INCREMENT PRIMARY KEY,
    IdHistoriaClinica INT,
    IdCirugia INT,
    TipoConsentimiento VARCHAR(200) NOT NULL,
    Fecha DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    Responsable VARCHAR(200),
    Observaciones TEXT,
    RutaDocumento VARCHAR(500),
    UsuarioResponsable INT,
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    -- Claves foráneas
    CONSTRAINT fk_consentimiento_historia FOREIGN KEY (IdHistoriaClinica) REFERENCES historiasclinicas(IdHistoriaClinica),
    CONSTRAINT fk_consentimiento_cirugia FOREIGN KEY (IdCirugia) REFERENCES cirugias(IdCirugia),
    CONSTRAINT fk_consentimiento_usuario FOREIGN KEY (UsuarioResponsable) REFERENCES Usuarios(UsuarioId),
    -- Índices
    INDEX idx_consentimiento_historia (IdHistoriaClinica),
    INDEX idx_consentimiento_cirugia (IdCirugia)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: alertascontroles
-- Descripción: Alertas de próximos controles y seguimientos
CREATE TABLE IF NOT EXISTS alertascontroles (
    IdAlerta INT AUTO_INCREMENT PRIMARY KEY,
    IdMascota INT NOT NULL,
    IdHistoriaClinica INT,
    IdControl INT,
    TipoAlerta VARCHAR(100) NOT NULL,
    FechaAlerta DATE NOT NULL,
    Descripcion TEXT,
    Estado ENUM('Pendiente', 'Notificada', 'Completada', 'Cancelada') NOT NULL DEFAULT 'Pendiente',
    FechaCreacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    UsuarioIdCreacion INT,
    -- Claves foráneas
    CONSTRAINT fk_alertas_mascota FOREIGN KEY (IdMascota) REFERENCES mascotas(IdMascota),
    CONSTRAINT fk_alertas_historia FOREIGN KEY (IdHistoriaClinica) REFERENCES historiasclinicas(IdHistoriaClinica),
    CONSTRAINT fk_alertas_control FOREIGN KEY (IdControl) REFERENCES controles(IdControl),
    CONSTRAINT fk_alertas_usuario FOREIGN KEY (UsuarioIdCreacion) REFERENCES Usuarios(UsuarioId),
    -- Índices
    INDEX idx_alertas_mascota (IdMascota),
    INDEX idx_alertas_fecha (FechaAlerta),
    INDEX idx_alertas_estado (Estado)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla: logmodificaciones
-- Descripción: Registro de auditoría para trazabilidad de cambios
-- Permite rastrear quién, cuándo y qué cambió en la información clínica
CREATE TABLE IF NOT EXISTS logmodificaciones (
    IdLog INT AUTO_INCREMENT PRIMARY KEY,
    Tabla VARCHAR(100) NOT NULL,
    IdRegistro INT NOT NULL,
    TipoOperacion ENUM('INSERT', 'UPDATE', 'DELETE') NOT NULL,
    DatosAnteriores JSON,
    DatosNuevos JSON,
    UsuarioId INT,
    FechaOperacion DATETIME DEFAULT CURRENT_TIMESTAMP,
    DireccionIP VARCHAR(45),
    -- Claves foráneas
    CONSTRAINT fk_log_usuario FOREIGN KEY (UsuarioId) REFERENCES Usuarios(UsuarioId),
    -- Índices para consultas de auditoría
    INDEX idx_log_tabla (Tabla),
    INDEX idx_log_registro (IdRegistro),
    INDEX idx_log_fecha (FechaOperacion),
    INDEX idx_log_usuario (UsuarioId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================================
-- VISTAS ÚTILES
-- ============================================================================

-- Vista: Resumen de historia clínica por mascota
-- Muestra la información más reciente de cada mascota
CREATE OR REPLACE VIEW vw_resumen_historiaclinica AS
SELECT 
    m.IdMascota,
    m.Nombre AS NombreMascota,
    m.Especie,
    m.Raza,
    m.ClienteId,
    CONCAT(c.PrimerNombre, ' ', c.PrimerApellido) AS NombreCliente,
    hc.IdHistoriaClinica,
    hc.FechaAtencion,
    hc.MotivoConsulta,
    hc.Estado AS EstadoAtencion,
    CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario,
    (SELECT GROUP_CONCAT(d.Diagnostico SEPARATOR '; ') 
     FROM diagnosticos d 
     WHERE d.IdHistoriaClinica = hc.IdHistoriaClinica) AS Diagnosticos,
    (SELECT GROUP_CONCAT(t.NombreTratamiento SEPARATOR '; ') 
     FROM tratamientos t 
     WHERE t.IdHistoriaClinica = hc.IdHistoriaClinica) AS Tratamientos
FROM historiasclinicas hc
INNER JOIN mascotas m ON hc.IdMascota = m.IdMascota
INNER JOIN clientes c ON m.ClienteId = c.ClienteId
INNER JOIN veterinarios v ON hc.IdVeterinario = v.IdVeterinario
ORDER BY hc.FechaAtencion DESC;

-- Vista: Próximos controles pendientes
CREATE OR REPLACE VIEW vw_proximos_controles AS
SELECT 
    con.IdControl,
    m.Nombre AS NombreMascota,
    m.Especie,
    CONCAT(c.PrimerNombre, ' ', c.PrimerApellido) AS NombreCliente,
    c.Telefono,
    con.FechaControl AS FechaProximoControl,
    con.Motivo,
    CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario,
    con.Recomendaciones
FROM controles con
INNER JOIN mascotas m ON con.IdMascota = m.IdMascota
INNER JOIN clientes c ON m.ClienteId = c.ClienteId
INNER JOIN veterinarios v ON con.IdVeterinario = v.IdVeterinario
WHERE con.FechaControl >= CURDATE()
  AND con.ProximoControl IS NOT NULL
ORDER BY con.ProximoControl ASC;

-- Vista: Cirugías programadas
CREATE OR REPLACE VIEW vw_cirugias_programadas AS
SELECT 
    ci.IdCirugia,
    m.Nombre AS NombreMascota,
    m.Especie,
    CONCAT(c.PrimerNombre, ' ', c.PrimerApellido) AS NombreCliente,
    ci.TipoCirugia,
    ci.FechaProgramacion,
    ci.FechaCirugia,
    CONCAT(v.PrimerNombre, ' ', v.PrimerApellido) AS NombreVeterinario,
    ci.Estado,
    ci.Motivo
FROM cirugias ci
INNER JOIN mascotas m ON ci.IdMascota = m.IdMascota
INNER JOIN clientes c ON m.ClienteId = c.ClienteId
INNER JOIN veterinarios v ON ci.IdVeterinario = v.IdVeterinario
WHERE ci.Estado IN ('Programada', 'Realizada')
ORDER BY ci.FechaProgramacion ASC;

-- ============================================================================
-- FIN DEL SCRIPT
-- ============================================================================
