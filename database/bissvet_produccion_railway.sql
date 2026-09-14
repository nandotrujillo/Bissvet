-- =============================================================
-- BISSVET - DUMP BASE DE DATOS (MySQL 8.0)
-- Generado el: 2026-09-14 09:43
-- Uso en Railway:
--   1. Crea el servicio MySQL en Railway.
--   2. Copia este archivo y ejecútalo en la consola de Railway
--      (o imórtalo con: mysql -h <host> -P <port> -u <user> -p<pass> < db.sql)
--   3. Configura las variables de entorno del Backend:
--      DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME
--      (usar DB_NAME=railway que crea Railway, o el que corresponda)
-- Notas:
--   - Incluye esquema + datos de prueba + vistas + procedimientos.
--   - Los DEFINER fueron normalizados a CURRENT_USER.
--   - Las claves foráneas se validan al final (no despues de cada tabla).
-- =============================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;
SET SQL_MODE = 'NO_AUTO_VALUE_ON_ZERO';
SET time_zone = '+00:00';
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ajustes_inventario` (
  `IdAjuste` bigint NOT NULL AUTO_INCREMENT,
  `Numero` varchar(50) NOT NULL,
  `IdBodega` int NOT NULL,
  `Fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `TipoAjuste` enum('POSITIVO','NEGATIVO') NOT NULL,
  `Estado` enum('BORRADOR','CONFIRMADA','ANULADA') NOT NULL DEFAULT 'BORRADOR',
  `Motivo` varchar(300) NOT NULL,
  `Observaciones` varchar(500) DEFAULT NULL,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdConfirmacion` int DEFAULT NULL,
  `FechaConfirmacion` datetime DEFAULT NULL,
  `UsuarioIdAnulacion` int DEFAULT NULL,
  `FechaAnulacion` datetime DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdAjuste`),
  UNIQUE KEY `uk_ajuste_numero` (`Numero`),
  KEY `ix_ajuste_bodega` (`IdBodega`),
  KEY `idx_ajustes_inventario_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_ajuste_bodega` FOREIGN KEY (`IdBodega`) REFERENCES `bodegas` (`Id`),
  CONSTRAINT `fk_ajustes_inventario_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ajustes_inventario_detalle` (
  `IdAjusteDetalle` bigint NOT NULL AUTO_INCREMENT,
  `IdAjuste` bigint NOT NULL,
  `IdProducto` int NOT NULL,
  `Cantidad` decimal(18,4) NOT NULL,
  `CostoUnitario` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdAjusteDetalle`),
  KEY `ix_ajustedetalle_ajuste` (`IdAjuste`),
  KEY `ix_ajustedetalle_producto` (`IdProducto`),
  KEY `idx_ajustes_inventario_detalle_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_ajustedetalle_ajuste` FOREIGN KEY (`IdAjuste`) REFERENCES `ajustes_inventario` (`IdAjuste`),
  CONSTRAINT `fk_ajustedetalle_producto` FOREIGN KEY (`IdProducto`) REFERENCES `productos` (`IdProducto`),
  CONSTRAINT `fk_ajustes_inventario_detalle_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `alertascontroles` (
  `IdAlerta` int NOT NULL AUTO_INCREMENT,
  `IdMascota` int NOT NULL,
  `IdHistoriaClinica` int DEFAULT NULL,
  `IdControl` int DEFAULT NULL,
  `TipoAlerta` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `FechaAlerta` date NOT NULL,
  `Descripcion` text COLLATE utf8mb4_unicode_ci,
  `Estado` enum('Pendiente','Notificada','Completada','Cancelada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendiente',
  `FechaCreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdAlerta`),
  KEY `fk_alertas_historia` (`IdHistoriaClinica`),
  KEY `fk_alertas_control` (`IdControl`),
  KEY `fk_alertas_usuario` (`UsuarioIdCreacion`),
  KEY `idx_alertas_mascota` (`IdMascota`),
  KEY `idx_alertas_fecha` (`FechaAlerta`),
  KEY `idx_alertas_estado` (`Estado`),
  KEY `idx_alertascontroles_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_alertas_control` FOREIGN KEY (`IdControl`) REFERENCES `controles` (`IdControl`),
  CONSTRAINT `fk_alertas_historia` FOREIGN KEY (`IdHistoriaClinica`) REFERENCES `historiasclinicas` (`IdHistoriaClinica`),
  CONSTRAINT `fk_alertas_mascota` FOREIGN KEY (`IdMascota`) REFERENCES `mascotas` (`IdMascota`),
  CONSTRAINT `fk_alertas_usuario` FOREIGN KEY (`UsuarioIdCreacion`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `fk_alertascontroles_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `alertascontroles` VALUES (1,3,3,1,'Control','2026-09-17','zxczxc','Pendiente','2026-09-04 13:14:45',3,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `antecedentes` (
  `IdAntecedente` int NOT NULL AUTO_INCREMENT,
  `IdMascota` int NOT NULL,
  `EnfermedadesAnteriores` text COLLATE utf8mb4_unicode_ci,
  `CirugiasAnteriores` text COLLATE utf8mb4_unicode_ci,
  `Alergias` text COLLATE utf8mb4_unicode_ci,
  `Vacunacion` text COLLATE utf8mb4_unicode_ci,
  `Desparasitacion` text COLLATE utf8mb4_unicode_ci,
  `MedicamentosActuales` text COLLATE utf8mb4_unicode_ci,
  `TratamientosAnteriores` text COLLATE utf8mb4_unicode_ci,
  `AntecedentesHereditarios` text COLLATE utf8mb4_unicode_ci,
  `Alimentacion` text COLLATE utf8mb4_unicode_ci,
  `Habitos` text COLLATE utf8mb4_unicode_ci,
  `Observaciones` text COLLATE utf8mb4_unicode_ci,
  `FechaCreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaModificacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `UsuarioIdModificacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdAntecedente`),
  UNIQUE KEY `idx_antecedentes_mascota` (`IdMascota`),
  KEY `fk_antecedentes_usuario_creacion` (`UsuarioIdCreacion`),
  KEY `fk_antecedentes_usuario_modificacion` (`UsuarioIdModificacion`),
  KEY `idx_antecedentes_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_antecedentes_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`),
  CONSTRAINT `fk_antecedentes_mascota` FOREIGN KEY (`IdMascota`) REFERENCES `mascotas` (`IdMascota`),
  CONSTRAINT `fk_antecedentes_usuario_creacion` FOREIGN KEY (`UsuarioIdCreacion`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `fk_antecedentes_usuario_modificacion` FOREIGN KEY (`UsuarioIdModificacion`) REFERENCES `usuarios` (`UsuarioId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `archivoshistoriaclinica` (
  `IdArchivo` int NOT NULL AUTO_INCREMENT,
  `IdHistoriaClinica` int NOT NULL,
  `TipoArchivo` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NombreArchivo` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Descripcion` text COLLATE utf8mb4_unicode_ci,
  `RutaArchivo` varchar(500) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TamanoBytes` int DEFAULT NULL,
  `TipoMIME` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FechaCreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdArchivo`),
  KEY `fk_archivos_usuario` (`UsuarioIdCreacion`),
  KEY `idx_archivos_historia` (`IdHistoriaClinica`),
  KEY `idx_archivos_tipo` (`TipoArchivo`),
  KEY `idx_archivoshistoriaclinica_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_archivos_historia` FOREIGN KEY (`IdHistoriaClinica`) REFERENCES `historiasclinicas` (`IdHistoriaClinica`),
  CONSTRAINT `fk_archivos_usuario` FOREIGN KEY (`UsuarioIdCreacion`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `fk_archivoshistoriaclinica_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditoria` (
  `IdAuditoria` bigint NOT NULL AUTO_INCREMENT,
  `IdEmpresa` int NOT NULL,
  `UsuarioId` int NOT NULL,
  `IdModulo` int DEFAULT NULL,
  `Tabla` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `RegistroId` bigint DEFAULT NULL,
  `Accion` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL COMMENT 'CONSULTAR, CREAR, EDITAR, ELIMINAR, ANULAR, APROBAR, IMPRIMIR, EXPORTAR, ENTRADA, SALIDA, AJUSTAR, TRASLADO, DEVOLUCION, LOGIN, LOGOUT',
  `Fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `DireccionIP` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `DatosAnteriores` longtext COLLATE utf8mb4_unicode_ci COMMENT 'JSON del estado anterior',
  `DatosNuevos` longtext COLLATE utf8mb4_unicode_ci COMMENT 'JSON del estado nuevo',
  `Descripcion` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`IdAuditoria`),
  KEY `idx_auditoria_empresa_fecha` (`IdEmpresa`,`Fecha`),
  KEY `idx_auditoria_usuario` (`UsuarioId`),
  KEY `idx_auditoria_modulo` (`IdModulo`),
  KEY `idx_auditoria_registro` (`Tabla`,`RegistroId`),
  CONSTRAINT `fk_auditoria_empresas` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`),
  CONSTRAINT `fk_auditoria_modulos` FOREIGN KEY (`IdModulo`) REFERENCES `modulos` (`idModulos`),
  CONSTRAINT `fk_auditoria_usuarios` FOREIGN KEY (`UsuarioId`) REFERENCES `usuarios` (`UsuarioId`)
) ENGINE=InnoDB AUTO_INCREMENT=284 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `auditoria` VALUES (1,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 08:21:29','::1',NULL,NULL,'Login correcto de admin'),(2,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 08:21:33','::1',NULL,NULL,'Login correcto de admin'),(3,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 08:22:39','::1',NULL,NULL,'Login correcto de admin'),(4,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 08:22:45','::1',NULL,NULL,'Login correcto de admin'),(5,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 08:23:14','::1',NULL,NULL,'Login correcto de admin'),(6,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 08:23:26','::1',NULL,NULL,'Intento de login fallido (1/5)'),(7,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 08:23:32','::1',NULL,NULL,'Login correcto de admin'),(8,1,3,NULL,'Usuarios',4,'CREAR','2026-09-05 08:23:32','::1',NULL,'{\"Username\":\"test.vet\",\"IdPerfil\":2,\"PrimerNombre\":\"Juan\",\"PrimerApellido\":\"Perez\"}','Creaci├│n del usuario test.vet'),(16,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 08:26:37','::1',NULL,NULL,'Login correcto de admin'),(17,1,3,NULL,'Usuarios',4,'EDITAR','2026-09-05 08:26:37','::1','{\"UsuarioId\":4,\"Username\":\"test.vet\",\"PasswordHash\":\"$2b$10$byqlh5bK5aMlW19.eTb3oeKDE1YC5YVP5hgPbijwmLbKnt4/yIA0C\",\"IdEmpresa\":1,\"IdPerfil\":2,\"TipoDocumento\":null,\"NumeroDocumento\":null,\"PrimerNombre\":\"Juan\",\"SegundoNombre\":null,\"PrimerApellido\":\"Perez\",\"SegundoApellido\":null,\"Correo\":\"juan@test.com\",\"Telefono\":null,\"Activo\":1,\"Bloqueado\":1,\"IntentosFallidos\":5,\"FechaUltimoIngreso\":\"2026-09-05T13:23:38.000Z\",\"UltimoAcceso\":\"2026-09-05T13:23:38.000Z\",\"FechaCreacion\":\"2026-09-05T13:23:32.000Z\",\"UsuarioIdCreacion\":3,\"FechaModificacion\":null,\"UsuarioIdModificacion\":null}','{\"Bloqueado\":false}','Modificaci├│n del usuario test.vet'),(18,1,3,NULL,'Usuarios',4,'CAMBIAR_CLAVE','2026-09-05 08:26:37','::1','{\"Username\":\"test.vet\"}',NULL,'Cambio de contrase├▒a del usuario test.vet'),(19,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 08:46:27','::1',NULL,NULL,'Login correcto de admin'),(20,1,3,NULL,'perfiles',17,'CREAR','2026-09-05 08:46:27','::1',NULL,'{\"Nombre\":\"Facturador\",\"Descripcion\":\"Perfil demo\"}','Creaci├│n del perfil Facturador'),(21,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 08:46:36','::1',NULL,NULL,'Login correcto de admin'),(22,1,3,NULL,'perfilpermisos',17,'EDITAR','2026-09-05 08:46:36','::1','{\"permisos\":[]}','{\"permisos\":3}','Actualizaci├│n de permisos del perfil #17'),(23,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 08:46:42','::1',NULL,NULL,'Login correcto de admin'),(24,1,3,NULL,'roles',4,'EDITAR','2026-09-05 08:46:42','::1','{\"IdRol\":4,\"IdEmpresa\":1,\"Nombre\":\"AUXILIAR\",\"Descripcion\":\"Apoyo administrativo\",\"Activo\":1,\"FechaCreacion\":\"2026-09-04T23:20:10.000Z\",\"UsuarioIdCreacion\":null,\"FechaModificacion\":null,\"UsuarioIdModificacion\":null}','{\"Descripcion\":\"Rol auxiliar editado\"}','Modificaci├│n del rol AUXILIAR'),(25,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 08:53:05','::1',NULL,NULL,'Login correcto de admin'),(26,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 08:53:11','::1',NULL,NULL,'Login correcto de admin'),(27,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 08:53:30','::1',NULL,NULL,'Login correcto de admin'),(28,1,3,NULL,'perfiles',18,'CREAR','2026-09-05 08:53:30','::1',NULL,'{\"Nombre\":\"PERFIL_PRUEBA\",\"Descripcion\":\"Perfil temporal sin permisos\"}','Creaci├│n del perfil PERFIL_PRUEBA'),(29,1,3,NULL,'Usuarios',5,'CREAR','2026-09-05 08:53:31','::1',NULL,'{\"Username\":\"test.negocio\",\"IdPerfil\":18,\"PrimerNombre\":\"Test\",\"PrimerApellido\":\"Negocio\"}','Creaci├│n del usuario test.negocio'),(32,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 08:54:13','::1',NULL,NULL,'Login correcto de admin'),(35,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 08:56:16','::1',NULL,NULL,'Login correcto de admin'),(36,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 08:56:22','::1',NULL,NULL,'Login correcto de admin'),(37,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 08:56:27','::1',NULL,NULL,'Login correcto de admin'),(38,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 09:13:21','::1',NULL,NULL,'Login correcto de admin'),(40,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 09:13:28','::1',NULL,NULL,'Login correcto de admin'),(41,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 09:13:48','::1',NULL,NULL,'Login correcto de admin'),(44,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 09:13:58','::1',NULL,NULL,'Login correcto de admin'),(48,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 09:14:21','::1',NULL,NULL,'Login correcto de admin'),(49,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 09:14:31','::1',NULL,NULL,'Login correcto de admin'),(50,1,3,NULL,'perfiles',19,'CREAR','2026-09-05 09:14:31','::1',NULL,'{\"Nombre\":\"PERFIL_CAJA_TMP\",\"Descripcion\":\"Temporal\"}','Creaci├│n del perfil PERFIL_CAJA_TMP'),(51,1,3,NULL,'Usuarios',6,'CREAR','2026-09-05 09:14:32','::1',NULL,'{\"Username\":\"test.caja\",\"IdPerfil\":19}','Creaci├│n del usuario test.caja'),(58,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 09:31:26','::1',NULL,NULL,'Login correcto de admin'),(59,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 09:31:34','::1',NULL,NULL,'Login correcto de admin'),(60,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 09:33:25','::1',NULL,NULL,'Login correcto de admin'),(61,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 09:34:17','::1',NULL,NULL,'Login correcto de admin'),(62,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 09:35:17','::1',NULL,NULL,'Login correcto de admin'),(63,1,3,NULL,'reportes',NULL,'EXPORTAR','2026-09-05 09:35:17','::1',NULL,'{\"reporte\":\"clientes\",\"formato\":\"csv\",\"filtros\":{}}','Exportaci├│n CSV del reporte clientes'),(64,1,3,NULL,'reportes',NULL,'EXPORTAR','2026-09-05 09:35:17','::1',NULL,'{\"reporte\":\"citas\",\"formato\":\"csv\",\"filtros\":{}}','Exportaci├│n CSV del reporte citas'),(65,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 09:35:23','::1',NULL,NULL,'Login correcto de admin'),(66,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-05 09:35:24','::1',NULL,'{\"reporte\":\"citas\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte citas'),(72,1,8,NULL,NULL,NULL,'LOGIN','2026-09-05 15:42:32','::1',NULL,NULL,'Login correcto de superadmin_test'),(73,1,8,NULL,'suscripciones',1,'CAMBIAR_PLAN','2026-09-05 15:42:32','::1','{\"IdPlan\":2,\"NombrePlan\":\"Profesional\",\"Precio\":\"399000.00\"}','{\"IdPlan\":3,\"NombrePlan\":\"Empresarial\",\"Precio\":\"799000.00\"}','Cambio de plan de Profesional a Empresarial'),(74,1,8,NULL,'suscripciones',1,'CAMBIAR_PLAN','2026-09-05 15:42:32','::1','{\"IdPlan\":3,\"NombrePlan\":\"Empresarial\",\"Precio\":\"799000.00\"}','{\"IdPlan\":2,\"NombrePlan\":\"Profesional\",\"Precio\":\"399000.00\"}','Cambio de plan de Empresarial a Profesional'),(75,1,8,NULL,'Usuarios',9,'CREAR','2026-09-05 15:42:32','::1',NULL,'{\"Username\":\"limite_e2e_1\",\"IdPerfil\":1,\"NumeroDocumento\":\"1112593\",\"PrimerNombre\":\"Limite\",\"PrimerApellido\":\"Test\"}','Creaci├│n del usuario limite_e2e_1'),(76,1,8,NULL,'Usuarios',10,'CREAR','2026-09-05 15:42:32','::1',NULL,'{\"Username\":\"limite_e2e_2\",\"IdPerfil\":1,\"NumeroDocumento\":\"1113440\",\"PrimerNombre\":\"Limite\",\"PrimerApellido\":\"Test\"}','Creaci├│n del usuario limite_e2e_2'),(77,1,8,NULL,'Usuarios',11,'CREAR','2026-09-05 15:42:32','::1',NULL,'{\"Username\":\"limite_e2e_3\",\"IdPerfil\":1,\"NumeroDocumento\":\"1117098\",\"PrimerNombre\":\"Limite\",\"PrimerApellido\":\"Test\"}','Creaci├│n del usuario limite_e2e_3'),(78,1,8,NULL,'suscripcion_modulos',1,'EDITAR','2026-09-05 15:42:33','::1','{\"modulos\":[]}','[{\"IdModulo\":56,\"PrecioAdicional\":50000}]','Configuraci├│n de m├│dulos ADD-ON de la suscripci├│n'),(79,1,8,NULL,'suscripcion_modulos',1,'EDITAR','2026-09-05 15:42:33','::1','{\"modulos\":[\"SUSCRIPCIONES\"]}','[]','Configuraci├│n de m├│dulos ADD-ON de la suscripci├│n'),(80,1,8,NULL,NULL,NULL,'LOGIN','2026-09-05 15:42:57','::1',NULL,NULL,'Login correcto de superadmin_test'),(81,1,8,NULL,'suscripciones',1,'CAMBIAR_PLAN','2026-09-05 15:42:57','::1','{\"IdPlan\":2,\"NombrePlan\":\"Profesional\",\"Precio\":\"399000.00\"}','{\"IdPlan\":3,\"NombrePlan\":\"Empresarial\",\"Precio\":\"799000.00\"}','Cambio de plan de Profesional a Empresarial'),(82,1,8,NULL,'suscripciones',1,'CAMBIAR_PLAN','2026-09-05 15:42:57','::1','{\"IdPlan\":3,\"NombrePlan\":\"Empresarial\",\"Precio\":\"799000.00\"}','{\"IdPlan\":2,\"NombrePlan\":\"Profesional\",\"Precio\":\"399000.00\"}','Cambio de plan de Empresarial a Profesional'),(83,1,8,NULL,'Usuarios',12,'CREAR','2026-09-05 15:42:57','::1',NULL,'{\"Username\":\"limite_e2e_1\",\"IdPerfil\":1,\"NumeroDocumento\":\"111923\",\"PrimerNombre\":\"Limite\",\"PrimerApellido\":\"Test\"}','Creaci├│n del usuario limite_e2e_1'),(84,1,8,NULL,'Usuarios',13,'CREAR','2026-09-05 15:42:58','::1',NULL,'{\"Username\":\"limite_e2e_2\",\"IdPerfil\":1,\"NumeroDocumento\":\"1117620\",\"PrimerNombre\":\"Limite\",\"PrimerApellido\":\"Test\"}','Creaci├│n del usuario limite_e2e_2'),(85,1,8,NULL,'Usuarios',14,'CREAR','2026-09-05 15:42:58','::1',NULL,'{\"Username\":\"limite_e2e_3\",\"IdPerfil\":1,\"NumeroDocumento\":\"1116825\",\"PrimerNombre\":\"Limite\",\"PrimerApellido\":\"Test\"}','Creaci├│n del usuario limite_e2e_3'),(86,1,8,NULL,'suscripcion_modulos',1,'EDITAR','2026-09-05 15:42:58','::1','{\"modulos\":[]}','[{\"IdModulo\":56,\"PrecioAdicional\":50000}]','Configuraci├│n de m├│dulos ADD-ON de la suscripci├│n'),(87,1,8,NULL,'suscripcion_modulos',1,'EDITAR','2026-09-05 15:42:58','::1','{\"modulos\":[\"SUSCRIPCIONES\"]}','[]','Configuraci├│n de m├│dulos ADD-ON de la suscripci├│n'),(88,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 16:11:44','::1',NULL,NULL,'Intento de login fallido (1/5)'),(89,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 16:12:18','::1',NULL,NULL,'Login correcto de admin'),(90,1,3,NULL,'perfiles',8,'EDITAR','2026-09-05 16:14:45','::1','{\"IdPerfil\":8,\"Nombre\":\"SUPERADMIN\",\"Descripcion\":\"Administra todo el sistema y las empresas\",\"Activo\":1,\"FechaCreacion\":\"2026-09-04T23:20:09.000Z\",\"UsuarioIdCreacion\":null,\"FechaModificacion\":null,\"UsuarioIdModificacion\":null}','{\"Nombre\":\"SUPERADMINcbbnchnfvfj\",\"Descripcion\":\"Administra todo el sistema y las empresas\",\"Activo\":true}','Modificaci├│n del perfil SUPERADMIN'),(91,1,3,NULL,'perfiles',8,'EDITAR','2026-09-05 16:14:54','::1','{\"IdPerfil\":8,\"Nombre\":\"SUPERADMINcbbnchnfvfj\",\"Descripcion\":\"Administra todo el sistema y las empresas\",\"Activo\":1,\"FechaCreacion\":\"2026-09-04T23:20:09.000Z\",\"UsuarioIdCreacion\":null,\"FechaModificacion\":\"2026-09-05T21:14:45.000Z\",\"UsuarioIdModificacion\":3}','{\"Nombre\":\"SUPERADMIN\",\"Descripcion\":\"Administra todo el sistema y las empresas\",\"Activo\":true}','Modificaci├│n del perfil SUPERADMINcbbnchnfvfj'),(92,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-05 16:20:29','::1',NULL,'{\"reporte\":\"kardex\",\"formato\":\"pdf\",\"filtros\":{\"desde\":\"2026-09-01\",\"hasta\":\"2026-09-19\",\"producto\":\"1\"}}','Impresi├│n PDF del reporte kardex'),(93,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 16:47:20','::1',NULL,NULL,'Login correcto de admin'),(94,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 16:53:52','::1',NULL,NULL,'Login correcto de admin'),(95,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 16:55:23','::1',NULL,NULL,'Login correcto de admin'),(96,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 16:58:39','::1',NULL,NULL,'Login correcto de admin'),(97,1,3,NULL,'cajeromov',4,'APERTURA','2026-09-05 16:58:57','::1',NULL,'{\"cajaMesa\":1,\"diaProceso\":\"2026-09-05\",\"ValorApertura\":500000,\"IdBodega\":4}','Apertura de caja 1 el 2026-09-05'),(98,1,3,NULL,NULL,NULL,'LOGIN','2026-09-05 17:32:49','::1',NULL,NULL,'Login correcto de admin'),(99,1,3,NULL,NULL,NULL,'LOGIN','2026-09-06 08:43:26','::1',NULL,NULL,'Login correcto de admin'),(100,1,3,NULL,'cajeromov',4,'CIERRE','2026-09-06 08:44:35','::1',NULL,'{\"valorEntregado\":500000,\"valorEsperado\":500000,\"Descuadre\":0}','Cierre de caja del 2026-09-05'),(101,2,16,NULL,'cajeromov',5,'APERTURA','2026-09-06 08:58:56','::1',NULL,'{\"cajaMesa\":1,\"diaProceso\":\"2026-09-06\",\"ValorApertura\":0,\"IdBodega\":null}','Apertura de caja 1 el 2026-09-06'),(102,2,16,NULL,'cajeromov',5,'CIERRE','2026-09-06 08:59:58','::1',NULL,'{\"valorEntregado\":0,\"valorEsperado\":0,\"Descuadre\":0}','Cierre de caja del 2026-09-06'),(103,1,3,NULL,NULL,NULL,'LOGIN','2026-09-06 09:02:54','::1',NULL,NULL,'Login correcto de admin'),(104,1,3,NULL,'Usuarios',17,'CREAR','2026-09-06 09:03:38','::1',NULL,'{\"Username\":\"vend1\",\"IdPerfil\":3,\"NumeroDocumento\":\"652665\",\"PrimerNombre\":\"vende1\",\"PrimerApellido\":\"otro ven\"}','Creaci├│n del usuario vend1'),(105,1,3,NULL,NULL,NULL,'LOGIN','2026-09-06 09:09:47','::1',NULL,NULL,'Login correcto de admin'),(106,2,16,NULL,'cajeromov',6,'APERTURA','2026-09-06 09:12:01','::1',NULL,'{\"cajaMesa\":1,\"diaProceso\":\"2026-09-06\",\"ValorApertura\":0,\"IdBodega\":null}','Apertura de caja 1 el 2026-09-06'),(107,2,16,NULL,'cajeromov',6,'CIERRE','2026-09-06 09:12:02','::1',NULL,'{\"valorEntregado\":20000,\"valorEsperado\":0,\"Descuadre\":20000}','Cierre de caja del 2026-09-06'),(108,2,16,NULL,'cajeromov',7,'APERTURA','2026-09-06 09:18:22','::1',NULL,'{\"cajaMesa\":1,\"diaProceso\":\"2026-09-06\",\"ValorApertura\":0,\"IdBodega\":null}','Apertura de caja 1 el 2026-09-06'),(109,2,16,NULL,'cajeromov',7,'CIERRE','2026-09-06 09:22:10','::1',NULL,'{\"valorEntregado\":100000,\"valorEsperado\":0,\"Descuadre\":100000}','Cierre de caja del 2026-09-06'),(110,2,16,NULL,'cajeromov',8,'APERTURA','2026-09-06 09:26:33','::1',NULL,'{\"cajaMesa\":1,\"diaProceso\":\"2026-09-06\",\"ValorApertura\":0,\"IdBodega\":null}','Apertura de caja 1 el 2026-09-06'),(111,1,3,NULL,NULL,NULL,'LOGIN','2026-09-06 09:26:50','::1',NULL,NULL,'Login correcto de admin'),(112,1,3,NULL,'cajeromov',9,'APERTURA','2026-09-06 09:29:25','::1',NULL,'{\"cajaMesa\":1,\"diaProceso\":\"2026-09-06\",\"ValorApertura\":50000,\"IdBodega\":4}','Apertura de caja 1 el 2026-09-06'),(113,2,16,NULL,'cajeromov',8,'CIERRE','2026-09-06 09:30:15','::1',NULL,'{\"valorEntregado\":100000,\"valorEsperado\":0,\"Descuadre\":100000}','Cierre de caja del 2026-09-06'),(114,2,16,NULL,'cajeromov',10,'APERTURA','2026-09-06 09:42:34','::1',NULL,'{\"cajaMesa\":1,\"diaProceso\":\"2026-09-06\",\"ValorApertura\":0,\"IdBodega\":null}','Apertura de caja 1 el 2026-09-06'),(115,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 09:50:51','::1',NULL,NULL,'Login correcto de admin'),(116,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 09:51:29','::1',NULL,NULL,'Login correcto de admin'),(117,1,3,NULL,'cajeromov',9,'CIERRE','2026-09-07 09:52:04','::1',NULL,'{\"valorEntregado\":0,\"valorEsperado\":76250,\"Descuadre\":-76250}','Cierre de caja del 2026-09-06'),(118,1,3,NULL,'cajeromov',11,'APERTURA','2026-09-07 09:52:16','::1',NULL,'{\"cajaMesa\":1,\"diaProceso\":\"2026-09-07\",\"ValorApertura\":200000,\"IdBodega\":4}','Apertura de caja 1 el 2026-09-07'),(119,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 09:55:39','::1',NULL,NULL,'Intento de login fallido (1/5)'),(120,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 09:55:49','::1',NULL,NULL,'Login correcto de admin'),(121,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 09:59:43','::1',NULL,NULL,'Login correcto de admin'),(122,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 09:59:43','::1',NULL,NULL,'Intento de login fallido (1/5)'),(123,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 09:59:44','::1',NULL,NULL,'Intento de login fallido (2/5)'),(124,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 09:59:44','::1',NULL,NULL,'Intento de login fallido (3/5)'),(125,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 09:59:44','::1',NULL,NULL,'Intento de login fallido (4/5)'),(126,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 09:59:44','::1',NULL,NULL,'Intento de login fallido (5/5)'),(127,1,8,NULL,NULL,NULL,'LOGIN','2026-09-07 09:59:45','::1',NULL,NULL,'Intento de login fallido (1/5)'),(128,1,8,NULL,NULL,NULL,'LOGIN','2026-09-07 09:59:45','::1',NULL,NULL,'Intento de login fallido (2/5)'),(129,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 10:00:10','::1',NULL,NULL,'Login correcto de admin'),(130,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 10:00:55','::1',NULL,NULL,'Login correcto de admin'),(131,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 10:01:13','::1',NULL,NULL,'Login correcto de admin'),(132,1,17,NULL,NULL,NULL,'LOGIN','2026-09-07 10:02:18','::1',NULL,NULL,'Intento de login fallido (1/5)'),(133,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 10:02:18','::1',NULL,NULL,'Login correcto de admin'),(134,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 10:23:14','::1',NULL,NULL,'Login correcto de admin'),(135,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 10:40:43','::1',NULL,NULL,'Login correcto de admin'),(136,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 10:45:59','::1',NULL,NULL,'Login correcto de admin'),(137,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 11:37:14','::1',NULL,NULL,'Login correcto de admin'),(138,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 11:37:23','::1',NULL,NULL,'Login correcto de admin'),(139,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 11:37:51','::1',NULL,NULL,'Login correcto de admin'),(140,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 12:15:27','::1',NULL,NULL,'Login correcto de admin'),(141,1,3,NULL,'ventas',24,'IMPRIMIR','2026-09-07 12:15:39','::1',NULL,'{\"NumeroVenta\":\"V-11\",\"formato\":\"pdf\"}','Impresi├│n de factura V-11'),(142,1,3,NULL,'ventas',24,'IMPRIMIR','2026-09-07 12:17:49','::1',NULL,'{\"NumeroVenta\":\"V-11\",\"formato\":\"pdf\"}','Impresi├│n de factura V-11'),(143,1,3,NULL,'ventas',24,'IMPRIMIR','2026-09-07 12:18:32','::1',NULL,'{\"NumeroVenta\":\"V-11\",\"formato\":\"pdf\"}','Impresi├│n de factura V-11'),(144,1,3,NULL,'ventas',24,'IMPRIMIR','2026-09-07 12:19:14','::1',NULL,'{\"NumeroVenta\":\"V-11\",\"formato\":\"pdf\"}','Impresi├│n de factura V-11'),(145,1,3,NULL,'ventas',24,'IMPRIMIR','2026-09-07 12:20:03','::1',NULL,'{\"NumeroVenta\":\"V-11\",\"formato\":\"pdf\"}','Impresi├│n de factura V-11'),(146,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 12:25:14','::1',NULL,NULL,'Login correcto de admin'),(147,1,3,NULL,'ventas',15,'IMPRIMIR','2026-09-07 12:25:14','::1',NULL,'{\"NumeroVenta\":\"V-5\",\"formato\":\"pdf\"}','Impresi├│n de factura V-5'),(148,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 12:27:52','::1',NULL,NULL,'Login correcto de admin'),(149,1,3,NULL,'ventas',28,'IMPRIMIR','2026-09-07 12:27:52','::1',NULL,'{\"NumeroVenta\":\"V-13\",\"formato\":\"pdf\"}','Impresi├│n de factura V-13'),(150,1,3,NULL,'ventas',30,'IMPRIMIR','2026-09-07 12:27:52','::1',NULL,'{\"NumeroVenta\":\"V-15\",\"formato\":\"pdf\"}','Impresi├│n de factura V-15'),(151,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 12:43:39','::1',NULL,NULL,'Login correcto de admin'),(152,1,3,NULL,'ventas',28,'IMPRIMIR','2026-09-07 12:43:39','::1',NULL,'{\"NumeroVenta\":\"V-13\",\"formato\":\"pdf\"}','Impresi├│n de factura V-13'),(153,1,3,NULL,'ventas',30,'IMPRIMIR','2026-09-07 12:43:39','::1',NULL,'{\"NumeroVenta\":\"V-15\",\"formato\":\"pdf\"}','Impresi├│n de factura V-15'),(154,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 12:44:35','::1',NULL,NULL,'Login correcto de admin'),(155,1,3,NULL,'ventas',28,'IMPRIMIR','2026-09-07 12:44:35','::1',NULL,'{\"NumeroVenta\":\"V-13\",\"formato\":\"pdf\"}','Impresi├│n de factura V-13'),(156,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 12:44:51','::1',NULL,NULL,'Login correcto de admin'),(157,1,3,NULL,'ventas',28,'IMPRIMIR','2026-09-07 12:44:51','::1',NULL,'{\"NumeroVenta\":\"V-13\",\"formato\":\"pdf\"}','Impresi├│n de factura V-13'),(158,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 12:45:02','::1',NULL,NULL,'Login correcto de admin'),(159,1,3,NULL,'ventas',28,'IMPRIMIR','2026-09-07 12:45:02','::1',NULL,'{\"NumeroVenta\":\"V-13\",\"formato\":\"pdf\"}','Impresi├│n de factura V-13'),(160,1,3,NULL,'ventas',30,'IMPRIMIR','2026-09-07 12:45:02','::1',NULL,'{\"NumeroVenta\":\"V-15\",\"formato\":\"pdf\"}','Impresi├│n de factura V-15'),(161,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 12:45:18','::1',NULL,NULL,'Login correcto de admin'),(162,1,3,NULL,'ventas',28,'IMPRIMIR','2026-09-07 12:45:18','::1',NULL,'{\"NumeroVenta\":\"V-13\",\"formato\":\"pdf\"}','Impresi├│n de factura V-13'),(163,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 12:45:23','::1',NULL,NULL,'Login correcto de admin'),(164,1,3,NULL,'ventas',28,'IMPRIMIR','2026-09-07 12:45:23','::1',NULL,'{\"NumeroVenta\":\"V-13\",\"formato\":\"pdf\"}','Impresi├│n de factura V-13'),(165,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 12:45:30','::1',NULL,NULL,'Login correcto de admin'),(166,1,3,NULL,'ventas',28,'IMPRIMIR','2026-09-07 12:45:30','::1',NULL,'{\"NumeroVenta\":\"V-13\",\"formato\":\"pdf\"}','Impresi├│n de factura V-13'),(167,1,3,NULL,'ventas',28,'IMPRIMIR','2026-09-07 12:45:30','::1',NULL,'{\"NumeroVenta\":\"V-13\",\"formato\":\"pdf\"}','Impresi├│n de factura V-13'),(168,1,3,NULL,'ventas',30,'IMPRIMIR','2026-09-07 12:45:30','::1',NULL,'{\"NumeroVenta\":\"V-15\",\"formato\":\"pdf\"}','Impresi├│n de factura V-15'),(169,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 12:45:38','::1',NULL,NULL,'Login correcto de admin'),(170,1,3,NULL,'ventas',28,'IMPRIMIR','2026-09-07 12:45:38','::1',NULL,'{\"NumeroVenta\":\"V-13\",\"formato\":\"pdf\"}','Impresi├│n de factura V-13'),(171,1,3,NULL,'ventas',30,'IMPRIMIR','2026-09-07 12:45:38','::1',NULL,'{\"NumeroVenta\":\"V-15\",\"formato\":\"pdf\"}','Impresi├│n de factura V-15'),(172,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 12:45:49','::1',NULL,NULL,'Login correcto de admin'),(173,1,3,NULL,'ventas',28,'IMPRIMIR','2026-09-07 12:45:49','::1',NULL,'{\"NumeroVenta\":\"V-13\",\"formato\":\"pdf\"}','Impresi├│n de factura V-13'),(174,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 12:45:55','::1',NULL,NULL,'Login correcto de admin'),(175,1,3,NULL,'ventas',28,'IMPRIMIR','2026-09-07 12:45:55','::1',NULL,'{\"NumeroVenta\":\"V-13\",\"formato\":\"pdf\"}','Impresi├│n de factura V-13'),(176,1,3,NULL,'ventas',30,'IMPRIMIR','2026-09-07 12:45:55','::1',NULL,'{\"NumeroVenta\":\"V-15\",\"formato\":\"pdf\"}','Impresi├│n de factura V-15'),(177,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 12:46:41','::1',NULL,NULL,'Login correcto de admin'),(178,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 12:47:42','::1',NULL,NULL,'Login correcto de admin'),(179,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 12:54:04','::1',NULL,NULL,'Login correcto de admin'),(180,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 12:54:58','::1',NULL,NULL,'Login correcto de admin'),(181,1,3,NULL,'ventas',24,'IMPRIMIR','2026-09-07 12:55:41','::1',NULL,'{\"NumeroVenta\":\"V-11\",\"formato\":\"pdf\"}','Impresi├│n de factura V-11'),(182,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 13:01:39','::1',NULL,NULL,'Login correcto de admin'),(183,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 13:02:55','::1',NULL,NULL,'Login correcto de admin'),(184,1,3,NULL,'ventas',31,'IMPRIMIR','2026-09-07 13:35:36','::1',NULL,'{\"NumeroVenta\":\"V-16\",\"formato\":\"pdf\"}','Impresi├│n de factura V-16'),(185,1,3,NULL,'ventas',31,'IMPRIMIR','2026-09-07 13:42:03','::1',NULL,'{\"NumeroVenta\":\"V-16\",\"formato\":\"pdf\"}','Impresi├│n de factura V-16'),(186,1,3,NULL,'ventas',31,'IMPRIMIR','2026-09-07 13:44:36','::1',NULL,'{\"NumeroVenta\":\"V-16\",\"formato\":\"pdf\"}','Impresi├│n de factura V-16'),(187,1,3,NULL,'ventas',31,'IMPRIMIR','2026-09-07 13:51:53','::1',NULL,'{\"NumeroVenta\":\"V-16\",\"formato\":\"pdf\"}','Impresi├│n de factura V-16'),(188,1,3,NULL,NULL,NULL,'LOGIN','2026-09-07 14:01:27','::1',NULL,NULL,'Login correcto de admin'),(189,1,3,NULL,'ventas',31,'IMPRIMIR','2026-09-07 14:01:54','::1',NULL,'{\"NumeroVenta\":\"V-16\",\"formato\":\"pdf\"}','Impresi├│n de factura V-16'),(190,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-07 14:06:18','::1',NULL,'{\"reporte\":\"kardex\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte kardex'),(191,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-07 14:06:31','::1',NULL,'{\"reporte\":\"ventas\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte ventas'),(192,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-07 15:22:38','::1',NULL,'{\"reporte\":\"ventas\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte ventas'),(193,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-07 15:23:00','::1',NULL,'{\"reporte\":\"cartera\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte cartera'),(194,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-07 15:23:11','::1',NULL,'{\"reporte\":\"kardex\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte kardex'),(195,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-07 15:23:21','::1',NULL,'{\"reporte\":\"compras\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte compras'),(196,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-07 15:23:36','::1',NULL,'{\"reporte\":\"citas\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte citas'),(197,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-07 15:43:33','::1',NULL,'{\"reporte\":\"ventas\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte ventas'),(198,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-07 15:44:06','::1',NULL,'{\"reporte\":\"cartera\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte cartera'),(199,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-07 15:45:08','::1',NULL,'{\"reporte\":\"cartera\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte cartera'),(200,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-07 15:46:27','::1',NULL,'{\"reporte\":\"kardex\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte kardex'),(201,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-07 15:48:02','::1',NULL,'{\"reporte\":\"cartera\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte cartera'),(202,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-07 15:48:19','::1',NULL,'{\"reporte\":\"compras\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte compras'),(203,1,3,NULL,NULL,NULL,'LOGIN','2026-09-08 11:22:35','::1',NULL,NULL,'Login correcto de admin'),(204,1,3,NULL,'cajeromov',11,'CIERRE','2026-09-08 11:23:04','::1',NULL,'{\"valorEntregado\":0,\"valorEsperado\":576750,\"Descuadre\":-576750}','Cierre de caja del 2026-09-07'),(205,1,3,NULL,'cajeromov',12,'APERTURA','2026-09-08 11:23:14','::1',NULL,'{\"cajaMesa\":1,\"diaProceso\":\"2026-09-08\",\"ValorApertura\":500000,\"IdBodega\":4}','Apertura de caja 1 el 2026-09-08'),(206,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-08 11:25:48','::1',NULL,'{\"reporte\":\"cuentaspagar\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte cuentaspagar'),(207,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-08 11:26:41','::1',NULL,'{\"reporte\":\"compras\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte compras'),(208,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 11:58:23','::1',NULL,NULL,'Login correcto de admin'),(209,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 12:00:54','::1',NULL,NULL,'Login correcto de admin'),(210,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 12:03:49','::1',NULL,NULL,'Login correcto de admin'),(211,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-10 12:04:00','::1',NULL,'{\"reporte\":\"cuentaspagar\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte cuentaspagar'),(212,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 12:04:09','::1',NULL,NULL,'Intento de login fallido (1/5)'),(213,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 12:04:09','::1',NULL,NULL,'Intento de login fallido (2/5)'),(214,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 12:05:25','::1',NULL,NULL,'Login correcto de admin'),(215,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 12:10:10','::1',NULL,NULL,'Intento de login fallido (1/5)'),(216,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 12:10:19','::1',NULL,NULL,'Intento de login fallido (2/5)'),(217,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 12:15:34','::1',NULL,NULL,'Intento de login fallido (3/5)'),(218,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 12:20:31','::1',NULL,NULL,'Intento de login fallido (4/5)'),(219,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 12:28:18','::1',NULL,NULL,'Login correcto de admin'),(220,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 12:29:18','::1',NULL,NULL,'Login correcto de admin'),(221,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 12:38:06','::1',NULL,NULL,'Intento de login fallido (1/5)'),(222,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 12:38:18','::1',NULL,NULL,'Intento de login fallido (2/5)'),(223,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 12:41:14','::1',NULL,NULL,'Intento de login fallido (3/5)'),(224,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 12:43:32','::1',NULL,NULL,'Intento de login fallido (1/5)'),(225,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 12:51:00','::1',NULL,NULL,'Intento de login fallido (2/5)'),(226,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 12:51:12','::1',NULL,NULL,'Intento de login fallido (3/5)'),(227,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 13:07:56','::1',NULL,NULL,'Intento de login fallido (4/5)'),(228,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 13:08:04','::1',NULL,NULL,'Login correcto de admin'),(229,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-10 13:08:37','::1',NULL,'{\"reporte\":\"cuentaspagar\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte cuentaspagar'),(230,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-10 13:08:55','::1',NULL,'{\"reporte\":\"ventas\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte ventas'),(231,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-10 13:14:55','::1',NULL,'{\"reporte\":\"ventas\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte ventas'),(232,1,3,NULL,'reportes',NULL,'EXPORTAR','2026-09-10 13:15:38','::1',NULL,'{\"reporte\":\"ventas\",\"formato\":\"csv\",\"filtros\":{}}','Exportaci├│n CSV del reporte ventas'),(233,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 13:21:36','::1',NULL,NULL,'Login correcto de admin'),(234,1,3,NULL,'reportes',NULL,'EXPORTAR','2026-09-10 13:21:37','::1',NULL,'{\"reporte\":\"ventas\",\"formato\":\"csv\",\"filtros\":{\"desde\":\"2026-01-01\",\"hasta\":\"2026-12-31\"}}','Exportaci├│n CSV del reporte ventas'),(235,1,3,NULL,'reportes',NULL,'EXPORTAR','2026-09-10 13:24:48','::1',NULL,'{\"reporte\":\"ventas\",\"formato\":\"csv\",\"filtros\":{}}','Exportaci├│n CSV del reporte ventas'),(236,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-10 13:25:16','::1',NULL,'{\"reporte\":\"ventas\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte ventas'),(237,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-10 13:25:41','::1',NULL,'{\"reporte\":\"ventas\",\"formato\":\"pdf\",\"filtros\":{\"agrupar\":\"1\"}}','Impresi├│n PDF del reporte ventas'),(238,1,3,NULL,'reportes',NULL,'EXPORTAR','2026-09-10 13:33:55','::1',NULL,'{\"reporte\":\"kardex\",\"formato\":\"csv\",\"filtros\":{\"agrupar\":\"1\"}}','Exportaci├│n CSV del reporte kardex'),(239,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-10 13:34:11','::1',NULL,'{\"reporte\":\"kardex\",\"formato\":\"pdf\",\"filtros\":{\"agrupar\":\"1\"}}','Impresi├│n PDF del reporte kardex'),(240,1,3,NULL,NULL,NULL,'LOGIN','2026-09-10 13:36:20','::1',NULL,NULL,'Login correcto de admin'),(241,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-10 13:36:34','::1',NULL,'{\"reporte\":\"ventas\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte ventas'),(242,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-10 13:37:22','::1',NULL,'{\"reporte\":\"ventas\",\"formato\":\"pdf\",\"filtros\":{\"desde\":\"2026-09-10\",\"hasta\":\"2026-09-10\"}}','Impresi├│n PDF del reporte ventas'),(243,1,3,NULL,'reportes',NULL,'EXPORTAR','2026-09-10 13:37:31','::1',NULL,'{\"reporte\":\"ventas\",\"formato\":\"csv\",\"filtros\":{\"desde\":\"2026-09-10\",\"hasta\":\"2026-09-10\"}}','Exportaci├│n CSV del reporte ventas'),(244,1,3,NULL,'reportes',NULL,'EXPORTAR','2026-09-10 13:37:34','::1',NULL,'{\"reporte\":\"ventas\",\"formato\":\"csv\",\"filtros\":{\"desde\":\"2026-09-10\",\"hasta\":\"2026-09-10\"}}','Exportaci├│n CSV del reporte ventas'),(245,1,3,NULL,'reportes',NULL,'IMPRIMIR','2026-09-10 14:06:45','::1',NULL,'{\"reporte\":\"ventas\",\"formato\":\"pdf\",\"filtros\":{}}','Impresi├│n PDF del reporte ventas'),(246,1,3,NULL,NULL,NULL,'LOGIN','2026-09-12 09:50:43','::1',NULL,NULL,'Login correcto de admin'),(247,1,3,NULL,NULL,NULL,'LOGIN','2026-09-12 10:15:08','::1',NULL,NULL,'Login correcto de admin'),(248,1,3,NULL,'historiasclinicas',3,'EXPORTAR','2026-09-12 10:15:48','::1',NULL,'{\"formato\":\"pdf\"}','Generaci├│n de PDF de historia cl├¡nica 3'),(249,1,3,NULL,'historiasclinicas',4,'EXPORTAR','2026-09-12 10:16:44','::1',NULL,'{\"formato\":\"pdf\"}','Generaci├│n de PDF de historia cl├¡nica 4'),(250,1,3,NULL,NULL,NULL,'EXPORTAR','2026-09-12 11:01:39','::1',NULL,NULL,'PDF de cita #5'),(251,1,3,NULL,NULL,NULL,'EXPORTAR','2026-09-12 11:02:20','::1',NULL,NULL,'PDF de cita #5'),(252,1,3,NULL,NULL,NULL,'EXPORTAR','2026-09-12 11:03:55','::1',NULL,NULL,'PDF de cita #1'),(253,1,3,NULL,NULL,NULL,'LOGIN','2026-09-12 11:05:26','::1',NULL,NULL,'Login correcto de admin'),(254,1,3,NULL,'cajeromov',12,'CIERRE','2026-09-12 11:21:48','::1',NULL,'{\"valorEntregado\":0,\"valorEsperado\":500000,\"Descuadre\":-500000}','Cierre de caja del 2026-09-08'),(255,1,3,NULL,'Usuarios',19,'CREAR','2026-09-12 11:35:04','::1',NULL,'{\"Username\":\"roven1\",\"IdPerfil\":3,\"NumeroDocumento\":\"234234234234\",\"PrimerNombre\":\"rosa\",\"PrimerApellido\":\"vendedora\"}','Creaci├│n del usuario roven1'),(256,1,19,NULL,NULL,NULL,'LOGIN','2026-09-12 11:35:34','::1',NULL,NULL,'Login correcto de roven1'),(257,1,3,NULL,NULL,NULL,'LOGIN','2026-09-12 11:37:00','::1',NULL,NULL,'Login correcto de admin'),(258,1,3,NULL,'perfilpermisos',3,'EDITAR','2026-09-12 11:51:22','::1','{\"permisos\":[{\"IdPermiso\":170,\"TipoAcceso\":\"PERMITIR\"}]}','{\"permisos\":21}','Actualizaci├│n de permisos del perfil #3'),(259,1,19,NULL,NULL,NULL,'LOGIN','2026-09-12 11:51:38','::1',NULL,NULL,'Login correcto de roven1'),(260,1,3,NULL,NULL,NULL,'LOGIN','2026-09-12 11:58:29','::1',NULL,NULL,'Login correcto de admin'),(261,1,3,NULL,'rolpermisos',3,'EDITAR','2026-09-12 11:58:57','::1','{\"permisos\":[{\"IdPermiso\":170,\"TipoAcceso\":\"PERMITIR\"}]}','{\"permisos\":2}','Actualizaci├│n de permisos del rol #3'),(262,1,19,NULL,NULL,NULL,'LOGIN','2026-09-12 11:59:10','::1',NULL,NULL,'Login correcto de roven1'),(263,1,3,NULL,NULL,NULL,'LOGIN','2026-09-12 11:59:47','::1',NULL,NULL,'Login correcto de admin'),(264,1,3,NULL,'rolpermisos',3,'EDITAR','2026-09-12 12:01:18','::1','{\"permisos\":[{\"IdPermiso\":48,\"TipoAcceso\":\"PERMITIR\"},{\"IdPermiso\":170,\"TipoAcceso\":\"PERMITIR\"}]}','{\"permisos\":24}','Actualizaci├│n de permisos del rol #3'),(265,1,19,NULL,NULL,NULL,'LOGIN','2026-09-12 12:01:58','::1',NULL,NULL,'Login correcto de roven1'),(266,1,19,NULL,NULL,NULL,'LOGIN','2026-09-13 09:43:43','::1',NULL,NULL,'Login correcto de roven1'),(267,1,19,NULL,'cajeromov',13,'APERTURA','2026-09-13 10:57:31','::1',NULL,'{\"cajaMesa\":1,\"diaProceso\":\"2026-09-13\",\"ValorApertura\":150000,\"IdBodega\":4}','Apertura de caja 1 el 2026-09-13'),(268,1,19,NULL,'ventas',33,'IMPRIMIR','2026-09-13 10:58:18','::1',NULL,'{\"NumeroVenta\":\"V-18\",\"formato\":\"pdf\"}','Impresi├│n de factura V-18'),(269,1,19,NULL,'reportes',NULL,'IMPRIMIR','2026-09-13 10:59:19','::1',NULL,'{\"reporte\":\"ventas\",\"formato\":\"pdf\",\"filtros\":{\"desde\":\"2026-09-13\",\"hasta\":\"2026-09-13\"}}','Impresi├│n PDF del reporte ventas'),(270,1,3,NULL,NULL,NULL,'LOGIN','2026-09-13 11:05:22','::1',NULL,NULL,'Login correcto de admin'),(271,1,3,NULL,'Usuarios',20,'CREAR','2026-09-13 11:06:35','::1',NULL,'{\"Username\":\"Inve1\",\"IdPerfil\":5,\"NumeroDocumento\":\"64646\",\"PrimerNombre\":\"inve1\",\"PrimerApellido\":\"\"}','Creaci├│n del usuario Inve1'),(272,1,3,NULL,'perfilpermisos',5,'EDITAR','2026-09-13 11:08:20','::1','{\"permisos\":[]}','{\"permisos\":31}','Actualizaci├│n de permisos del perfil #5'),(273,1,3,NULL,'perfiles',5,'EDITAR','2026-09-13 11:08:34','::1','{\"IdPerfil\":5,\"Nombre\":\"Bodeguero\",\"Descripcion\":\"Gesti├│n de inventarios\",\"Activo\":1,\"FechaCreacion\":\"2026-09-04T23:20:09.000Z\",\"UsuarioIdCreacion\":null,\"FechaModificacion\":null,\"UsuarioIdModificacion\":null}','{\"Nombre\":\"Bodeguero\",\"Descripcion\":\"Gesti├│n de inventarios\",\"Activo\":true}','Modificaci├│n del perfil Bodeguero'),(274,1,20,NULL,NULL,NULL,'LOGIN','2026-09-13 11:08:57','::1',NULL,NULL,'Login correcto de Inve1'),(275,1,21,NULL,NULL,NULL,'LOGIN','2026-09-13 11:11:45','::1',NULL,NULL,'Login correcto de vete1'),(276,1,21,NULL,NULL,NULL,'LOGIN','2026-09-13 11:11:52','::1',NULL,NULL,'Login correcto de vete1'),(277,1,3,NULL,NULL,NULL,'LOGIN','2026-09-13 11:47:48','::1',NULL,NULL,'Intento de login fallido (1/5)'),(278,1,3,NULL,NULL,NULL,'LOGIN','2026-09-13 14:09:46','::1',NULL,NULL,'Login correcto de admin'),(279,1,3,NULL,NULL,NULL,'LOGIN','2026-09-13 14:30:01','::1',NULL,NULL,'Login correcto de admin'),(280,1,3,NULL,'Usuarios',22,'CREAR','2026-09-13 14:31:31','::1',NULL,'{\"Username\":\"vend2\",\"IdPerfil\":3,\"NumeroDocumento\":\"3353534\",\"PrimerNombre\":\"vende 2\",\"PrimerApellido\":\"pruebas\"}','Creaci├│n del usuario vend2'),(281,1,22,NULL,NULL,NULL,'LOGIN','2026-09-13 14:31:49','::1',NULL,NULL,'Login correcto de vend2'),(282,1,3,NULL,NULL,NULL,'LOGIN','2026-09-14 08:41:22','::1',NULL,NULL,'Login correcto de admin'),(283,1,3,NULL,NULL,NULL,'LOGIN','2026-09-14 09:25:21','::1',NULL,NULL,'Login correcto de admin');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `auditoriausuarios` (
  `AuditoriaId` bigint NOT NULL AUTO_INCREMENT,
  `UsuarioId` int DEFAULT NULL,
  `Accion` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `DireccionIP` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Descripcion` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL COMMENT 'Empresa propietaria',
  PRIMARY KEY (`AuditoriaId`),
  KEY `FK_Auditoria_Usuario` (`UsuarioId`),
  KEY `ix_auditoriausuarios_idempresa` (`IdEmpresa`),
  CONSTRAINT `FK_Auditoria_Usuario` FOREIGN KEY (`UsuarioId`) REFERENCES `usuarios` (`UsuarioId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `bodegas` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `CodigoBodega` varchar(15) DEFAULT NULL,
  `NombreBodega` varchar(100) NOT NULL,
  `IdEmpresa` int DEFAULT NULL,
  `Estatus` tinyint(1) DEFAULT NULL,
  `exAuxiliar` tinyint(1) DEFAULT NULL,
  `Descripcion` varchar(250) DEFAULT NULL,
  `Direccion` varchar(250) DEFAULT NULL,
  `Responsable` varchar(150) DEFAULT NULL,
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`Id`),
  KEY `IX_Bodegas_IdEmpresa` (`IdEmpresa`),
  KEY `idx_bodegas_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_bodegas_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `bodegas` VALUES (4,'B001','Bodega Central',1,1,0,'Bodega principal','Calle 10 rretrt','Admin',1),(5,'BOD-01','Bodega Principal',2,1,NULL,NULL,NULL,NULL,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cajeromov` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `cajaMesa` int NOT NULL,
  `diaProceso` date NOT NULL,
  `Apertura` tinyint(1) DEFAULT NULL,
  `Cierre` tinyint(1) DEFAULT NULL,
  `Valor` int DEFAULT NULL,
  `Descuadre` int DEFAULT NULL,
  `idUsuario` int NOT NULL,
  `idEmpresa` int NOT NULL,
  `FechaCreacion` datetime NOT NULL,
  `valorEntregado` int DEFAULT NULL,
  `FechaCierre` datetime DEFAULT NULL,
  `IdBodega` int DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `cajeromov` VALUES (4,1,'2026-09-05',1,1,500000,0,3,1,'2026-09-05 16:58:57',500000,'2026-09-06 08:44:35',4),(5,1,'2026-09-06',1,1,0,0,16,2,'2026-09-06 08:58:56',0,'2026-09-06 08:59:58',NULL),(6,1,'2026-09-06',1,1,0,20000,16,2,'2026-09-06 09:12:01',20000,'2026-09-06 09:12:02',NULL),(7,1,'2026-09-06',1,1,0,100000,16,2,'2026-09-06 09:18:22',100000,'2026-09-06 09:22:10',NULL),(8,1,'2026-09-06',1,1,0,100000,16,2,'2026-09-06 09:26:33',100000,'2026-09-06 09:30:15',NULL),(9,1,'2026-09-06',1,1,50000,-76250,3,1,'2026-09-06 09:29:25',0,'2026-09-07 09:52:04',4),(10,1,'2026-09-06',1,0,0,NULL,16,2,'2026-09-06 09:42:34',NULL,NULL,NULL),(11,1,'2026-09-07',1,1,200000,-576750,3,1,'2026-09-07 09:52:16',0,'2026-09-08 11:23:04',4),(12,1,'2026-09-08',1,1,500000,-500000,3,1,'2026-09-08 11:23:14',0,'2026-09-12 11:21:48',4),(13,1,'2026-09-13',1,0,150000,NULL,19,1,'2026-09-13 10:57:31',NULL,NULL,4);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cajeromovdet` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `IdCajaMov` int NOT NULL,
  `TipoMov` int NOT NULL,
  `ValorMov` int NOT NULL,
  `FechaRegistro` datetime NOT NULL,
  `DescMov` varchar(150) NOT NULL,
  `idProveedor` int DEFAULT NULL,
  `NroDocumentoProveedor` varchar(10) DEFAULT NULL,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_CajeroMovDet_IdCajaMov` (`IdCajaMov`),
  KEY `IX_CajeroMovDet_TipoMov` (`TipoMov`),
  CONSTRAINT `FK_CajeroMovDet_CajeroMov` FOREIGN KEY (`IdCajaMov`) REFERENCES `cajeromov` (`Id`),
  CONSTRAINT `FK_CajeroMovDetTipo` FOREIGN KEY (`TipoMov`) REFERENCES `tipomovcaja` (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `cajeromovdet` VALUES (11,5,8,59500,'2026-09-06 08:58:56','Venta V-1 | Pago: EFECTIVO | Cliente: Cliente Mostrador',NULL,NULL,16,2),(12,5,8,-59500,'2026-09-06 08:58:57','Anulaci├│n de venta V-1 | Pago: EFECTIVO | Cliente: Cliente Mostrador',NULL,NULL,16,2),(13,6,8,29750,'2026-09-06 09:12:02','Venta V-2 | Pago: EFECTIVO | Cliente: Cliente Mostrador',NULL,NULL,16,2),(14,6,8,-29750,'2026-09-06 09:12:02','Anulaci├│n de venta V-2 | Pago: EFECTIVO | Cliente: Cliente Mostrador',NULL,NULL,16,2),(15,7,8,53550,'2026-09-06 09:18:31','Venta V-3 | Pago: EFECTIVO | Cliente: Cliente Mostrador',NULL,NULL,16,2),(16,7,8,-53550,'2026-09-06 09:18:32','Anulaci├│n de venta V-3 | Pago: EFECTIVO | Cliente: Cliente Mostrador',NULL,NULL,16,2),(17,8,8,53550,'2026-09-06 09:26:53','Venta V-4 | Pago: EFECTIVO | Cliente: Cliente Mostrador',NULL,NULL,16,2),(18,8,8,-53550,'2026-09-06 09:26:53','Anulaci├│n de venta V-4 | Pago: EFECTIVO | Cliente: Cliente Mostrador',NULL,NULL,16,2),(19,10,8,29750,'2026-09-06 09:42:53','Venta V-5 | Pago: EFECTIVO | Cliente: Cliente Mostrador',NULL,NULL,16,2),(20,10,8,-29750,'2026-09-06 09:42:54','Anulaci├│n de venta V-5 | Pago: EFECTIVO | Cliente: Cliente Mostrador',NULL,NULL,16,2),(21,10,8,29720250,'2026-09-06 09:43:13','Venta V-6 | Pago: EFECTIVO | Cliente: Cliente Mostrador',NULL,NULL,16,2),(22,10,8,-29720250,'2026-09-06 09:43:13','Anulaci├│n de venta V-6 | Pago: EFECTIVO | Cliente: Cliente Mostrador',NULL,NULL,16,2),(47,9,1,26250,'2026-09-06 10:32:58','Venta V-5 | Pago: EFECTIVO | Cliente: NANDO DETRU',NULL,NULL,3,1),(48,11,1,57750,'2026-09-07 09:55:58','Venta V-6 | Pago: EFECTIVO | Cliente: NANDO DETRU',NULL,NULL,3,1),(49,11,1,57750,'2026-09-07 09:56:10','Venta V-7 | Pago: EFECTIVO | Cliente: NANDO DETRU',NULL,NULL,3,1),(50,11,1,57750,'2026-09-07 10:23:03','Venta V-8 | Pago: EFECTIVO | Cliente: NANDO DETRU',NULL,NULL,3,1),(51,11,1,57750,'2026-09-07 10:23:06','Venta V-9 | Pago: EFECTIVO | Cliente: NANDO DETRU',NULL,NULL,3,1),(52,11,1,57750,'2026-09-07 10:24:59','Venta V-10 | Pago: EFECTIVO | Cliente: NANDO DETRU',NULL,NULL,3,1),(53,11,1,57750,'2026-09-07 10:25:02','Venta V-11 | Pago: EFECTIVO | Cliente: NANDO DETRU',NULL,NULL,3,1),(54,11,1,29750,'2026-09-07 11:37:52','Venta V-13 | Pago: EFECTIVO | Cliente: NANDO DETRU',NULL,NULL,3,1),(55,11,1,57750,'2026-09-07 12:23:11','Venta V-15 | Pago: EFECTIVO | Cliente: NANDO DETRU',NULL,NULL,3,1),(56,11,4,27500,'2026-09-07 13:33:47','Pago de compra C-2 | Proveedor: Proveedor Pruebas SAS',1,'C-2',3,1),(57,11,4,56000,'2026-09-07 13:34:52','Pago de compra C-3 | Proveedor: Proveedor Pruebas SAS',1,'C-3',3,1),(58,11,1,26250,'2026-09-07 13:35:32','Venta V-16 | Pago: EFECTIVO | Cliente: NANDO DETRU',NULL,NULL,3,1),(59,13,1,95,'2026-09-13 10:58:10','Venta V-18 | Pago: EFECTIVO | Cliente: Clie1 Geneico fgh',NULL,NULL,19,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categoriasproducto` (
  `IdCategoriaProducto` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(100) NOT NULL,
  `Descripcion` varchar(300) DEFAULT NULL,
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaModificacion` datetime DEFAULT NULL,
  `UsuarioIdModificacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL COMMENT 'Empresa propietaria',
  PRIMARY KEY (`IdCategoriaProducto`),
  UNIQUE KEY `uk_categoria_nombre` (`Nombre`),
  KEY `ix_categoriasproducto_idempresa` (`IdEmpresa`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `categoriasproducto` VALUES (1,'Alimento','Alimentos y dietas para mascotas',1,'2026-09-04 17:26:47',NULL,NULL,NULL,1),(2,'Farmac├®utico','Medicamentos veterinarios',1,'2026-09-04 17:26:47',NULL,NULL,NULL,1),(3,'Suplementos','Vitaminas, probi├│ticos y suplementos',1,'2026-09-04 17:26:47',NULL,NULL,NULL,1),(4,'Higiene','Productos de limpieza y cuidado',1,'2026-09-04 17:26:47',NULL,NULL,NULL,1),(5,'Accesorios','Accesorios para mascotas',1,'2026-09-04 17:26:47',NULL,NULL,NULL,1),(6,'Equipos','Equipos e insumos cl├¡nicos',1,'2026-09-04 17:26:47',NULL,NULL,NULL,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `categoriasservicio` (
  `IdCategoriaServicio` int NOT NULL AUTO_INCREMENT,
  `IdModulo` int NOT NULL,
  `Nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Descripcion` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  `idModulos` int NOT NULL,
  `IdEmpresa` int DEFAULT NULL COMMENT 'Empresa propietaria',
  PRIMARY KEY (`IdCategoriaServicio`),
  KEY `ix_categoriasservicio_idempresa` (`IdEmpresa`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `categoriasservicio` VALUES (1,0,'Citas','Citas generales',1,1,1),(2,0,'Consulta','Consultas generales',1,1,2);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `cirugias` (
  `IdCirugia` int NOT NULL AUTO_INCREMENT,
  `IdHistoriaClinica` int NOT NULL,
  `IdMascota` int NOT NULL,
  `IdVeterinario` int NOT NULL,
  `FechaProgramacion` date DEFAULT NULL,
  `FechaCirugia` datetime DEFAULT NULL,
  `TipoCirugia` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Motivo` text COLLATE utf8mb4_unicode_ci,
  `DiagnosticoPreoperatorio` text COLLATE utf8mb4_unicode_ci,
  `DiagnosticoPostoperatorio` text COLLATE utf8mb4_unicode_ci,
  `ProcedimientoRealizado` text COLLATE utf8mb4_unicode_ci,
  `TipoAnestesia` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Observaciones` text COLLATE utf8mb4_unicode_ci,
  `Estado` enum('Programada','Realizada','Cancelada','Suspendida') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Programada',
  `FechaCreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdCirugia`),
  KEY `fk_cirugias_veterinario` (`IdVeterinario`),
  KEY `fk_cirugias_usuario` (`UsuarioIdCreacion`),
  KEY `idx_cirugias_historia` (`IdHistoriaClinica`),
  KEY `idx_cirugias_mascota` (`IdMascota`),
  KEY `idx_cirugias_estado` (`Estado`),
  KEY `idx_cirugias_fecha` (`FechaCirugia`),
  KEY `idx_cirugias_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_cirugias_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`),
  CONSTRAINT `fk_cirugias_historia` FOREIGN KEY (`IdHistoriaClinica`) REFERENCES `historiasclinicas` (`IdHistoriaClinica`),
  CONSTRAINT `fk_cirugias_mascota` FOREIGN KEY (`IdMascota`) REFERENCES `mascotas` (`IdMascota`),
  CONSTRAINT `fk_cirugias_usuario` FOREIGN KEY (`UsuarioIdCreacion`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `fk_cirugias_veterinario` FOREIGN KEY (`IdVeterinario`) REFERENCES `veterinarios` (`IdVeterinario`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `citas` (
  `IdCita` int NOT NULL AUTO_INCREMENT,
  `IdMascota` int NOT NULL,
  `IdServicio` int NOT NULL,
  `UsuarioIdVeterinario` int DEFAULT NULL,
  `FechaCita` date NOT NULL,
  `HoraCita` time NOT NULL,
  `Precio` decimal(18,2) NOT NULL DEFAULT '0.00',
  `Estado` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Pendiente',
  `MotivoConsulta` text COLLATE utf8mb4_unicode_ci,
  `Observaciones` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int NOT NULL,
  `FechaModificacion` datetime DEFAULT NULL,
  `UsuarioIdModificacion` int DEFAULT NULL,
  `IdVeterinario` int NOT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdCita`),
  KEY `FK_Citas_Mascotas` (`IdMascota`),
  KEY `FK_Citas_Servicios` (`IdServicio`),
  KEY `FK_Citas_UsuarioCreacion` (`UsuarioIdCreacion`),
  KEY `FK_Citas_UsuarioModificacion` (`UsuarioIdModificacion`),
  KEY `FK_Citas_Veterinario` (`UsuarioIdVeterinario`),
  KEY `idx_citas_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_citas_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`),
  CONSTRAINT `FK_Citas_Mascotas` FOREIGN KEY (`IdMascota`) REFERENCES `mascotas` (`IdMascota`),
  CONSTRAINT `FK_Citas_Servicios` FOREIGN KEY (`IdServicio`) REFERENCES `servicios` (`IdServicio`),
  CONSTRAINT `FK_Citas_UsuarioCreacion` FOREIGN KEY (`UsuarioIdCreacion`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `FK_Citas_UsuarioModificacion` FOREIGN KEY (`UsuarioIdModificacion`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `FK_Citas_Veterinario` FOREIGN KEY (`UsuarioIdVeterinario`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `CK_Citas_Precio` CHECK ((`Precio` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `citas` VALUES (1,1,2,NULL,'2026-09-09','16:20:00',55000.00,'Cancelada',NULL,'etertert','2026-09-04 12:20:40',3,'2026-09-04 12:22:44',NULL,6,1),(2,1,2,NULL,'2026-09-10','10:00:00',55000.00,'Cancelada',NULL,'Prueba creaci´┐¢n cita','2026-09-04 12:21:16',3,'2026-09-04 12:22:46',NULL,6,1),(3,2,2,NULL,'2026-08-14','18:28:00',55000.00,'Cancelada',NULL,'tytrrtyrt','2026-09-04 12:22:31',3,'2026-09-04 12:22:41',NULL,7,1),(4,3,2,NULL,'2026-09-04','15:07:00',55000.00,'Atendida','dfgdfgdfg','dsfgdsfgdsfg','2026-09-04 13:05:21',3,NULL,NULL,7,1),(5,3,2,NULL,'2026-09-17','12:13:00',55000.00,'Atendida','con cancha','hay que vacunas','2026-09-06 09:10:50',3,NULL,NULL,6,1),(6,3,2,NULL,'2026-09-16','14:33:00',55000.00,'Atendida','dgdf','dfsgdsfgdsfg','2026-09-06 09:28:10',3,NULL,NULL,7,1),(7,2,9,NULL,'2026-09-15','13:45:00',300000.00,'Pendiente','La gata tiene melicococo','sdcscsdc','2026-09-12 10:42:39',3,NULL,NULL,7,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `citas_productos` (
  `IdCitaProducto` bigint NOT NULL AUTO_INCREMENT,
  `IdCita` int NOT NULL,
  `IdProducto` int NOT NULL,
  `Cantidad` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `PrecioUnitario` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `Observaciones` varchar(500) DEFAULT NULL,
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdCitaProducto`),
  KEY `ix_citaprod_cita` (`IdCita`),
  KEY `ix_citaprod_producto` (`IdProducto`),
  KEY `idx_citas_productos_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_citaprod_cita` FOREIGN KEY (`IdCita`) REFERENCES `citas` (`IdCita`),
  CONSTRAINT `fk_citaprod_producto` FOREIGN KEY (`IdProducto`) REFERENCES `productos` (`IdProducto`),
  CONSTRAINT `fk_citas_productos_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ciudades` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `IdPais` int DEFAULT NULL,
  `Ciudad` varchar(100) DEFAULT NULL,
  `CodigoCiudad` varchar(10) DEFAULT NULL,
  `Departamento` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=1121 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `ciudades` VALUES (1,1,'Bogot├í D.C.','11001','Cundinamarca'),(2,1,'Medellin','05001','Antioquia'),(3,1,'Abejorral','05002','Antioquia'),(4,1,'Abriaqui','05004','Antioquia'),(5,1,'Alejandria','05021','Antioquia'),(6,1,'Amaga','05030','Antioquia'),(7,1,'Amalfi','05031','Antioquia'),(8,1,'Andes','05034','Antioquia'),(9,1,'Angelopolis','05036','Antioquia'),(10,1,'Angostura','05038','Antioquia'),(11,1,'Anori','05040','Antioquia'),(12,1,'Santafe De Antioquia','05042','Antioquia'),(13,1,'Anza','05044','Antioquia'),(14,1,'Apartado','05045','Antioquia'),(15,1,'Arboletes','05051','Antioquia'),(16,1,'Argelia','05055','Antioquia'),(17,1,'Armenia','05059','Antioquia'),(18,1,'Barbosa','05079','Antioquia'),(19,1,'Belmira','05086','Antioquia'),(20,1,'Bello','05088','Antioquia'),(21,1,'Betania','05091','Antioquia'),(22,1,'Betulia','05093','Antioquia'),(23,1,'Ciudad Bolivar','05101','Antioquia'),(24,1,'Brice├ú┬æO','05107','Antioquia'),(25,1,'Buritica','05113','Antioquia'),(26,1,'Caceres','05120','Antioquia'),(27,1,'Caicedo','05125','Antioquia'),(28,1,'Caldas','05129','Antioquia'),(29,1,'Campamento','05134','Antioquia'),(30,1,'Ca├ú┬æAsgordas','05138','Antioquia'),(31,1,'Caracoli','05142','Antioquia'),(32,1,'Caramanta','05145','Antioquia'),(33,1,'Carepa','05147','Antioquia'),(34,1,'El Carmen De Viboral','05148','Antioquia'),(35,1,'Carolina','05150','Antioquia'),(36,1,'Caucasia','05154','Antioquia'),(37,1,'Chigorodo','05172','Antioquia'),(38,1,'Cisneros','05190','Antioquia'),(39,1,'Cocorna','05197','Antioquia'),(40,1,'Concepcion','05206','Antioquia'),(41,1,'Concordia','05209','Antioquia'),(42,1,'Copacabana','05212','Antioquia'),(43,1,'Dabeiba','05234','Antioquia'),(44,1,'Don Matias','05237','Antioquia'),(45,1,'Ebejico','05240','Antioquia'),(46,1,'El Bagre','05250','Antioquia'),(47,1,'Entrerrios','05264','Antioquia'),(48,1,'Envigado','05266','Antioquia'),(49,1,'Fredonia','05282','Antioquia'),(50,1,'Frontino','05284','Antioquia'),(51,1,'Giraldo','05306','Antioquia'),(52,1,'Girardota','05308','Antioquia'),(53,1,'Gomez Plata','05310','Antioquia'),(54,1,'Granada','05313','Antioquia'),(55,1,'Guadalupe','05315','Antioquia'),(56,1,'Guarne','05318','Antioquia'),(57,1,'Guatape','05321','Antioquia'),(58,1,'Heliconia','05347','Antioquia'),(59,1,'Hispania','05353','Antioquia'),(60,1,'Itagui','05360','Antioquia'),(61,1,'Ituango','05361','Antioquia'),(62,1,'Jardin','05364','Antioquia'),(63,1,'Jerico','05368','Antioquia'),(64,1,'La Ceja','05376','Antioquia'),(65,1,'La Estrella','05380','Antioquia'),(66,1,'La Pintada','05390','Antioquia'),(67,1,'La Union','05400','Antioquia'),(68,1,'Liborina','05411','Antioquia'),(69,1,'Maceo','05425','Antioquia'),(70,1,'Marinilla','05440','Antioquia'),(71,1,'Montebello','05467','Antioquia'),(72,1,'Murindo','05475','Antioquia'),(73,1,'Mutata','05480','Antioquia'),(74,1,'Nari├ú┬æO','05483','Antioquia'),(75,1,'Necocli','05490','Antioquia'),(76,1,'Nechi','05495','Antioquia'),(77,1,'Olaya','05501','Antioquia'),(78,1,'Pe├ú┬ÉOl','05541','Antioquia'),(79,1,'Peque','05543','Antioquia'),(80,1,'Pueblorrico','05576','Antioquia'),(81,1,'Puerto Berrio','05579','Antioquia'),(82,1,'Puerto Nare','05585','Antioquia'),(83,1,'Puerto Triunfo','05591','Antioquia'),(84,1,'Remedios','05604','Antioquia'),(85,1,'Retiro','05607','Antioquia'),(86,1,'Rionegro','05615','Antioquia'),(87,1,'Sabanalarga','05628','Antioquia'),(88,1,'Sabaneta','05631','Antioquia'),(89,1,'Salgar','05642','Antioquia'),(90,1,'San Andres De Cuerquia','05647','Antioquia'),(91,1,'San Carlos','05649','Antioquia'),(92,1,'San Francisco','05652','Antioquia'),(93,1,'San Jeronimo','05656','Antioquia'),(94,1,'San Jose De La Monta├ú┬æA','05658','Antioquia'),(95,1,'San Juan De Uraba','05659','Antioquia'),(96,1,'San Luis','05660','Antioquia'),(97,1,'San Pedro','05664','Antioquia'),(98,1,'San Pedro De Uraba','05665','Antioquia'),(99,1,'San Rafael','05667','Antioquia'),(100,1,'San Roque','05670','Antioquia'),(101,1,'San Vicente','05674','Antioquia'),(102,1,'Santa Barbara','05679','Antioquia'),(103,1,'Santa Rosa De Osos','05686','Antioquia'),(104,1,'Santo Domingo','05690','Antioquia'),(105,1,'El Santuario','05697','Antioquia'),(106,1,'Segovia','05736','Antioquia'),(107,1,'Sonson','05756','Antioquia'),(108,1,'Sopetran','05761','Antioquia'),(109,1,'Tamesis','05789','Antioquia'),(110,1,'Taraza','05790','Antioquia'),(111,1,'Tarso','05792','Antioquia'),(112,1,'Titiribi','05809','Antioquia'),(113,1,'Toledo','05819','Antioquia'),(114,1,'Turbo','05837','Antioquia'),(115,1,'Uramita','05842','Antioquia'),(116,1,'Urrao','05847','Antioquia'),(117,1,'Valdivia','05854','Antioquia'),(118,1,'Valparaiso','05856','Antioquia'),(119,1,'Vegachi','05858','Antioquia'),(120,1,'Venecia','05861','Antioquia'),(121,1,'Vigia Del Fuerte','05873','Antioquia'),(122,1,'Yali','05885','Antioquia'),(123,1,'Yarumal','05887','Antioquia'),(124,1,'Yolombo','05890','Antioquia'),(125,1,'Yondo','05893','Antioquia'),(126,1,'Zaragoza','05895','Antioquia'),(127,1,'Barranquilla','08001','Atlantico'),(128,1,'Baranoa','08078','Atlantico'),(129,1,'Campo De La Cruz','08137','Atlantico'),(130,1,'Candelaria','08141','Atlantico'),(131,1,'Galapa','08296','Atlantico'),(132,1,'Juan De Acosta','08372','Atlantico'),(133,1,'Luruaco','08421','Atlantico'),(134,1,'Malambo','08433','Atlantico'),(135,1,'Manati','08436','Atlantico'),(136,1,'Palmar De Varela','08520','Atlantico'),(137,1,'Piojo','08549','Atlantico'),(138,1,'Polonuevo','08558','Atlantico'),(139,1,'Ponedera','08560','Atlantico'),(140,1,'Puerto Colombia','08573','Atlantico'),(141,1,'Repelon','08606','Atlantico'),(142,1,'Sabanagrande','08634','Atlantico'),(143,1,'Sabanalarga','08638','Atlantico'),(144,1,'Santa Lucia','08675','Atlantico'),(145,1,'Santo Tomas','08685','Atlantico'),(146,1,'Soledad','08758','Atlantico'),(147,1,'Suan','08770','Atlantico'),(148,1,'Tubara','08832','Atlantico'),(149,1,'Usiacuri','08849','Atlantico'),(150,1,'Cartagena','13001','Bolivar'),(151,1,'Achi','13006','Bolivar'),(152,1,'Altos Del Rosario','13030','Bolivar'),(153,1,'Arenal','13042','Bolivar'),(154,1,'Arjona','13052','Bolivar'),(155,1,'Arroyohondo','13062','Bolivar'),(156,1,'Barranco De Loba','13074','Bolivar'),(157,1,'Calamar','13140','Bolivar'),(158,1,'Cantagallo','13160','Bolivar'),(159,1,'Cicuco','13188','Bolivar'),(160,1,'Cordoba','13212','Bolivar'),(161,1,'Clemencia','13222','Bolivar'),(162,1,'El Carmen De Bolivar','13244','Bolivar'),(163,1,'El Guamo','13248','Bolivar'),(164,1,'El Pe├ú┬æOn','13268','Bolivar'),(165,1,'Hatillo De Loba','13300','Bolivar'),(166,1,'Magangue','13430','Bolivar'),(167,1,'Mahates','13433','Bolivar'),(168,1,'Margarita','13440','Bolivar'),(169,1,'Maria La Baja','13442','Bolivar'),(170,1,'Montecristo','13458','Bolivar'),(171,1,'Mompos','13468','Bolivar'),(172,1,'Norosi','13490','Bolivar'),(173,1,'Morales','13473','Bolivar'),(174,1,'Pinillos','13549','Bolivar'),(175,1,'Regidor','13580','Bolivar'),(176,1,'Rio Viejo','13600','Bolivar'),(177,1,'San Cristobal','13620','Bolivar'),(178,1,'San Estanislao','13647','Bolivar'),(179,1,'San Fernando','13650','Bolivar'),(180,1,'San Jacinto','13654','Bolivar'),(181,1,'San Jacinto Del Cauca','13655','Bolivar'),(182,1,'San Juan Nepomuceno','13657','Bolivar'),(183,1,'San Martin De Loba','13667','Bolivar'),(184,1,'San Pablo','13670','Bolivar'),(185,1,'Santa Catalina','13673','Bolivar'),(186,1,'Santa Rosa','13683','Bolivar'),(187,1,'Santa Rosa Del Sur','13688','Bolivar'),(188,1,'Simiti','13744','Bolivar'),(189,1,'Soplaviento','13760','Bolivar'),(190,1,'Talaigua Nuevo','13780','Bolivar'),(191,1,'Tiquisio','13810','Bolivar'),(192,1,'Turbaco','13836','Bolivar'),(193,1,'Turbana','13838','Bolivar'),(194,1,'Villanueva','13873','Bolivar'),(195,1,'Zambrano','13894','Bolivar'),(196,1,'Tunja','15001','Boyaca'),(197,1,'Almeida','15022','Boyaca'),(198,1,'Aquitania','15047','Boyaca'),(199,1,'Arcabuco','15051','Boyaca'),(200,1,'Belen','15087','Boyaca'),(201,1,'Berbeo','15090','Boyaca'),(202,1,'Beteitiva','15092','Boyaca'),(203,1,'Boavita','15097','Boyaca'),(204,1,'Boyaca','15104','Boyaca'),(205,1,'Brice├ú┬æO','15106','Boyaca'),(206,1,'Buenavista','15109','Boyaca'),(207,1,'Busbanza','15114','Boyaca'),(208,1,'Caldas','15131','Boyaca'),(209,1,'Campohermoso','15135','Boyaca'),(210,1,'Cerinza','15162','Boyaca'),(211,1,'Chinavita','15172','Boyaca'),(212,1,'Chiquinquira','15176','Boyaca'),(213,1,'Chiscas','15180','Boyaca'),(214,1,'Chita','15183','Boyaca'),(215,1,'Chitaraque','15185','Boyaca'),(216,1,'Chivata','15187','Boyaca'),(217,1,'Cienega','15189','Boyaca'),(218,1,'Combita','15204','Boyaca'),(219,1,'Coper','15212','Boyaca'),(220,1,'Corrales','15215','Boyaca'),(221,1,'Covarachia','15218','Boyaca'),(222,1,'Cubara','15223','Boyaca'),(223,1,'Cucaita','15224','Boyaca'),(224,1,'Cuitiva','15226','Boyaca'),(225,1,'Chiquiza','15232','Boyaca'),(226,1,'Chivor','15236','Boyaca'),(227,1,'Duitama','15238','Boyaca'),(228,1,'El Cocuy','15244','Boyaca'),(229,1,'El Espino','15248','Boyaca'),(230,1,'Firavitoba','15272','Boyaca'),(231,1,'Floresta','15276','Boyaca'),(232,1,'Gachantiva','15293','Boyaca'),(233,1,'Gameza','15296','Boyaca'),(234,1,'Garagoa','15299','Boyaca'),(235,1,'Guacamayas','15317','Boyaca'),(236,1,'Guateque','15322','Boyaca'),(237,1,'Guayata','15325','Boyaca'),(238,1,'Gsican','15332','Boyaca'),(239,1,'Iza','15362','Boyaca'),(240,1,'Jenesano','15367','Boyaca'),(241,1,'Jerico','15368','Boyaca'),(242,1,'Labranzagrande','15377','Boyaca'),(243,1,'La Capilla','15380','Boyaca'),(244,1,'La Victoria','15401','Boyaca'),(245,1,'La Uvita','15403','Boyaca'),(246,1,'Villa De Leyva','15407','Boyaca'),(247,1,'Macanal','15425','Boyaca'),(248,1,'Maripi','15442','Boyaca'),(249,1,'Miraflores','15455','Boyaca'),(250,1,'Mongua','15464','Boyaca'),(251,1,'Mongui','15466','Boyaca'),(252,1,'Moniquira','15469','Boyaca'),(253,1,'Motavita','15476','Boyaca'),(254,1,'Muzo','15480','Boyaca'),(255,1,'Nobsa','15491','Boyaca'),(256,1,'Nuevo Colon','15494','Boyaca'),(257,1,'Oicata','15500','Boyaca'),(258,1,'Otanche','15507','Boyaca'),(259,1,'Pachavita','15511','Boyaca'),(260,1,'Paez','15514','Boyaca'),(261,1,'Paipa','15516','Boyaca'),(262,1,'Pajarito','15518','Boyaca'),(263,1,'Panqueba','15522','Boyaca'),(264,1,'Pauna','15531','Boyaca'),(265,1,'Paya','15533','Boyaca'),(266,1,'Paz De Rio','15537','Boyaca'),(267,1,'Pesca','15542','Boyaca'),(268,1,'Pisba','15550','Boyaca'),(269,1,'Puerto Boyaca','15572','Boyaca'),(270,1,'Quipama','15580','Boyaca'),(271,1,'Ramiriqui','15599','Boyaca'),(272,1,'Raquira','15600','Boyaca'),(273,1,'Rondon','15621','Boyaca'),(274,1,'Saboya','15632','Boyaca'),(275,1,'Sachica','15638','Boyaca'),(276,1,'Samaca','15646','Boyaca'),(277,1,'San Eduardo','15660','Boyaca'),(278,1,'San Jose De Pare','15664','Boyaca'),(279,1,'San Luis De Gaceno','15667','Boyaca'),(280,1,'San Mateo','15673','Boyaca'),(281,1,'San Miguel De Sema','15676','Boyaca'),(282,1,'San Pablo De Borbur','15681','Boyaca'),(283,1,'Santana','15686','Boyaca'),(284,1,'Santa Maria','15690','Boyaca'),(285,1,'Santa Rosa De Viterbo','15693','Boyaca'),(286,1,'Santa Sofia','15696','Boyaca'),(287,1,'Sativanorte','15720','Boyaca'),(288,1,'Sativasur','15723','Boyaca'),(289,1,'Siachoque','15740','Boyaca'),(290,1,'Soata','15753','Boyaca'),(291,1,'Socota','15755','Boyaca'),(292,1,'Socha','15757','Boyaca'),(293,1,'Sogamoso','15759','Boyaca'),(294,1,'Somondoco','15761','Boyaca'),(295,1,'Sora','15762','Boyaca'),(296,1,'Sotaquira','15763','Boyaca'),(297,1,'Soraca','15764','Boyaca'),(298,1,'Susacon','15774','Boyaca'),(299,1,'Sutamarchan','15776','Boyaca'),(300,1,'Sutatenza','15778','Boyaca'),(301,1,'Tasco','15790','Boyaca'),(302,1,'Tenza','15798','Boyaca'),(303,1,'Tibana','15804','Boyaca'),(304,1,'Tibasosa','15806','Boyaca'),(305,1,'Tinjaca','15808','Boyaca'),(306,1,'Tipacoque','15810','Boyaca'),(307,1,'Toca','15814','Boyaca'),(308,1,'Togsi','15816','Boyaca'),(309,1,'Topaga','15820','Boyaca'),(310,1,'Tota','15822','Boyaca'),(311,1,'Tunungua','15832','Boyaca'),(312,1,'Turmeque','15835','Boyaca'),(313,1,'Tuta','15837','Boyaca'),(314,1,'Tutaza','15839','Boyaca'),(315,1,'Umbita','15842','Boyaca'),(316,1,'Ventaquemada','15861','Boyaca'),(317,1,'Viracacha','15879','Boyaca'),(318,1,'Zetaquira','15897','Boyaca'),(319,1,'Manizales','17001','Caldas'),(320,1,'Aguadas','17013','Caldas'),(321,1,'Anserma','17042','Caldas'),(322,1,'Aranzazu','17050','Caldas'),(323,1,'Belalcazar','17088','Caldas'),(324,1,'Chinchina','17174','Caldas'),(325,1,'Filadelfia','17272','Caldas'),(326,1,'La Dorada','17380','Caldas'),(327,1,'La Merced','17388','Caldas'),(328,1,'Manzanares','17433','Caldas'),(329,1,'Marmato','17442','Caldas'),(330,1,'Marquetalia','17444','Caldas'),(331,1,'Marulanda','17446','Caldas'),(332,1,'Neira','17486','Caldas'),(333,1,'Norcasia','17495','Caldas'),(334,1,'Pacora','17513','Caldas'),(335,1,'Palestina','17524','Caldas'),(336,1,'Pensilvania','17541','Caldas'),(337,1,'Riosucio','17614','Caldas'),(338,1,'Risaralda','17616','Caldas'),(339,1,'Salamina','17653','Caldas'),(340,1,'Samana','17662','Caldas'),(341,1,'San Jose','17665','Caldas'),(342,1,'Supia','17777','Caldas'),(343,1,'Victoria','17867','Caldas'),(344,1,'Villamaria','17873','Caldas'),(345,1,'Viterbo','17877','Caldas'),(346,1,'Florencia','18001','Caqueta'),(347,1,'Albania','18029','Caqueta'),(348,1,'Belen De Los Andaquies','18094','Caqueta'),(349,1,'Cartagena Del Chaira','18150','Caqueta'),(350,1,'Curillo','18205','Caqueta'),(351,1,'El Doncello','18247','Caqueta'),(352,1,'El Paujil','18256','Caqueta'),(353,1,'La Monta├ú┬æIta','18410','Caqueta'),(354,1,'Milan','18460','Caqueta'),(355,1,'Morelia','18479','Caqueta'),(356,1,'Puerto Rico','18592','Caqueta'),(357,1,'San Jose Del Fragua','18610','Caqueta'),(358,1,'San Vicente Del Caguan','18753','Caqueta'),(359,1,'Solano','18756','Caqueta'),(360,1,'Solita','18785','Caqueta'),(361,1,'Valparaiso','18860','Caqueta'),(362,1,'Popayan','19001','Cauca'),(363,1,'Almaguer','19022','Cauca'),(364,1,'Argelia','19050','Cauca'),(365,1,'Balboa','19075','Cauca'),(366,1,'Bolivar','19100','Cauca'),(367,1,'Buenos Aires','19110','Cauca'),(368,1,'Cajibio','19130','Cauca'),(369,1,'Caldono','19137','Cauca'),(370,1,'Caloto','19142','Cauca'),(371,1,'Corinto','19212','Cauca'),(372,1,'El Tambo','19256','Cauca'),(373,1,'Florencia','19290','Cauca'),(374,1,'Guachene','19300','Cauca'),(375,1,'Guapi','19318','Cauca'),(376,1,'Inza','19355','Cauca'),(377,1,'Jambalo','19364','Cauca'),(378,1,'La Sierra','19392','Cauca'),(379,1,'La Vega','19397','Cauca'),(380,1,'Lopez','19418','Cauca'),(381,1,'Mercaderes','19450','Cauca'),(382,1,'Miranda','19455','Cauca'),(383,1,'Morales','19473','Cauca'),(384,1,'Padilla','19513','Cauca'),(385,1,'Paez','19517','Cauca'),(386,1,'Patia','19532','Cauca'),(387,1,'Piamonte','19533','Cauca'),(388,1,'Piendamo','19548','Cauca'),(389,1,'Puerto Tejada','19573','Cauca'),(390,1,'Purace','19585','Cauca'),(391,1,'Rosas','19622','Cauca'),(392,1,'San Sebastian','19693','Cauca'),(393,1,'Santander De Quilichao','19698','Cauca'),(394,1,'Santa Rosa','19701','Cauca'),(395,1,'Silvia','19743','Cauca'),(396,1,'Sotara','19760','Cauca'),(397,1,'Suarez','19780','Cauca'),(398,1,'Sucre','19785','Cauca'),(399,1,'Timbio','19807','Cauca'),(400,1,'Timbiqui','19809','Cauca'),(401,1,'Toribio','19821','Cauca'),(402,1,'Totoro','19824','Cauca'),(403,1,'Villa Rica','19845','Cauca'),(404,1,'Valledupar','20001','Cesar'),(405,1,'Aguachica','20011','Cesar'),(406,1,'Agustin Codazzi','20013','Cesar'),(407,1,'Astrea','20032','Cesar'),(408,1,'Becerril','20045','Cesar'),(409,1,'Bosconia','20060','Cesar'),(410,1,'Chimichagua','20175','Cesar'),(411,1,'Chiriguana','20178','Cesar'),(412,1,'Curumani','20228','Cesar'),(413,1,'El Copey','20238','Cesar'),(414,1,'El Paso','20250','Cesar'),(415,1,'Gamarra','20295','Cesar'),(416,1,'Gonzalez','20310','Cesar'),(417,1,'La Gloria','20383','Cesar'),(418,1,'La Jagua De Ibirico','20400','Cesar'),(419,1,'Manaure','20443','Cesar'),(420,1,'Pailitas','20517','Cesar'),(421,1,'Pelaya','20550','Cesar'),(422,1,'Pueblo Bello','20570','Cesar'),(423,1,'Rio De Oro','20614','Cesar'),(424,1,'La Paz','20621','Cesar'),(425,1,'San Alberto','20710','Cesar'),(426,1,'San Diego','20750','Cesar'),(427,1,'San Martin','20770','Cesar'),(428,1,'Tamalameque','20787','Cesar'),(429,1,'Monteria','23001','Cordoba'),(430,1,'Ayapel','23068','Cordoba'),(431,1,'Buenavista','23079','Cordoba'),(432,1,'Canalete','23090','Cordoba'),(433,1,'Cerete','23162','Cordoba'),(434,1,'Chima','23168','Cordoba'),(435,1,'Chinu','23182','Cordoba'),(436,1,'Cienaga De Oro','23189','Cordoba'),(437,1,'Cotorra','23300','Cordoba'),(438,1,'La Apartada','23350','Cordoba'),(439,1,'Lorica','23417','Cordoba'),(440,1,'Los Cordobas','23419','Cordoba'),(441,1,'Momil','23464','Cordoba'),(442,1,'Montelibano','23466','Cordoba'),(443,1,'Mo├ú┬æItos','23500','Cordoba'),(444,1,'Planeta Rica','23555','Cordoba'),(445,1,'Pueblo Nuevo','23570','Cordoba'),(446,1,'Puerto Escondido','23574','Cordoba'),(447,1,'Puerto Libertador','23580','Cordoba'),(448,1,'Purisima','23586','Cordoba'),(449,1,'Sahagun','23660','Cordoba'),(450,1,'San Andres Sotavento','23670','Cordoba'),(451,1,'San Antero','23672','Cordoba'),(452,1,'San Bernardo Del Viento','23675','Cordoba'),(453,1,'San Carlos','23678','Cordoba'),(454,1,'San Pelayo','23686','Cordoba'),(455,1,'Tierralta','23807','Cordoba'),(456,1,'Valencia','23855','Cordoba'),(457,1,'Agua De Dios','25001','Cundinamarca'),(458,1,'Alban','25019','Cundinamarca'),(459,1,'Anapoima','25035','Cundinamarca'),(460,1,'Anolaima','25040','Cundinamarca'),(461,1,'Arbelaez','25053','Cundinamarca'),(462,1,'Beltran','25086','Cundinamarca'),(463,1,'Bituima','25095','Cundinamarca'),(464,1,'Bojaca','25099','Cundinamarca'),(465,1,'Cabrera','25120','Cundinamarca'),(466,1,'Cachipay','25123','Cundinamarca'),(467,1,'Cajica','25126','Cundinamarca'),(468,1,'Caparrapi','25148','Cundinamarca'),(469,1,'Caqueza','25151','Cundinamarca'),(470,1,'Carmen De Carupa','25154','Cundinamarca'),(471,1,'Chaguani','25168','Cundinamarca'),(472,1,'Chia','25175','Cundinamarca'),(473,1,'Chipaque','25178','Cundinamarca'),(474,1,'Choachi','25181','Cundinamarca'),(475,1,'Choconta','25183','Cundinamarca'),(476,1,'Cogua','25200','Cundinamarca'),(477,1,'Cota','25214','Cundinamarca'),(478,1,'Cucunuba','25224','Cundinamarca'),(479,1,'El Colegio','25245','Cundinamarca'),(480,1,'El Pe├ú┬æOn','25258','Cundinamarca'),(481,1,'El Rosal','25260','Cundinamarca'),(482,1,'Facatativa','25269','Cundinamarca'),(483,1,'Fomeque','25279','Cundinamarca'),(484,1,'Fosca','25281','Cundinamarca'),(485,1,'Funza','25286','Cundinamarca'),(486,1,'Fuquene','25288','Cundinamarca'),(487,1,'Fusagasuga','25290','Cundinamarca'),(488,1,'Gachala','25293','Cundinamarca'),(489,1,'Gachancipa','25295','Cundinamarca'),(490,1,'Gacheta','25297','Cundinamarca'),(491,1,'Gama','25299','Cundinamarca'),(492,1,'Girardot','25307','Cundinamarca'),(493,1,'Granada','25312','Cundinamarca'),(494,1,'Guacheta','25317','Cundinamarca'),(495,1,'Guaduas','25320','Cundinamarca'),(496,1,'Guasca','25322','Cundinamarca'),(497,1,'Guataqui','25324','Cundinamarca'),(498,1,'Guatavita','25326','Cundinamarca'),(499,1,'Guayabal De Siquima','25328','Cundinamarca'),(500,1,'Guayabetal','25335','Cundinamarca'),(501,1,'Gutierrez','25339','Cundinamarca'),(502,1,'Jerusalen','25368','Cundinamarca'),(503,1,'Junin','25372','Cundinamarca'),(504,1,'La Calera','25377','Cundinamarca'),(505,1,'La Mesa','25386','Cundinamarca'),(506,1,'La Palma','25394','Cundinamarca'),(507,1,'La Pe├ú┬æA','25398','Cundinamarca'),(508,1,'La Vega','25402','Cundinamarca'),(509,1,'Lenguazaque','25407','Cundinamarca'),(510,1,'Macheta','25426','Cundinamarca'),(511,1,'Madrid','25430','Cundinamarca'),(512,1,'Manta','25436','Cundinamarca'),(513,1,'Medina','25438','Cundinamarca'),(514,1,'Mosquera','25473','Cundinamarca'),(515,1,'Nari├ú┬æO','25483','Cundinamarca'),(516,1,'Nemocon','25486','Cundinamarca'),(517,1,'Nilo','25488','Cundinamarca'),(518,1,'Nimaima','25489','Cundinamarca'),(519,1,'Nocaima','25491','Cundinamarca'),(520,1,'Venecia','25506','Cundinamarca'),(521,1,'Pacho','25513','Cundinamarca'),(522,1,'Paime','25518','Cundinamarca'),(523,1,'Pandi','25524','Cundinamarca'),(524,1,'Paratebueno','25530','Cundinamarca'),(525,1,'Pasca','25535','Cundinamarca'),(526,1,'Puerto Salgar','25572','Cundinamarca'),(527,1,'Puli','25580','Cundinamarca'),(528,1,'Quebradanegra','25592','Cundinamarca'),(529,1,'Quetame','25594','Cundinamarca'),(530,1,'Quipile','25596','Cundinamarca'),(531,1,'Apulo','25599','Cundinamarca'),(532,1,'Ricaurte','25612','Cundinamarca'),(533,1,'San Antonio Del Tequendama','25645','Cundinamarca'),(534,1,'San Bernardo','25649','Cundinamarca'),(535,1,'San Cayetano','25653','Cundinamarca'),(536,1,'San Francisco','25658','Cundinamarca'),(537,1,'San Juan De Rio Seco','25662','Cundinamarca'),(538,1,'Sasaima','25718','Cundinamarca'),(539,1,'Sesquile','25736','Cundinamarca'),(540,1,'Sibate','25740','Cundinamarca'),(541,1,'Silvania','25743','Cundinamarca'),(542,1,'Simijaca','25745','Cundinamarca'),(543,1,'Soacha','25754','Cundinamarca'),(544,1,'Sopo','25758','Cundinamarca'),(545,1,'Subachoque','25769','Cundinamarca'),(546,1,'Suesca','25772','Cundinamarca'),(547,1,'Supata','25777','Cundinamarca'),(548,1,'Susa','25779','Cundinamarca'),(549,1,'Sutatausa','25781','Cundinamarca'),(550,1,'Tabio','25785','Cundinamarca'),(551,1,'Tausa','25793','Cundinamarca'),(552,1,'Tena','25797','Cundinamarca'),(553,1,'Tenjo','25799','Cundinamarca'),(554,1,'Tibacuy','25805','Cundinamarca'),(555,1,'Tibirita','25807','Cundinamarca'),(556,1,'Tocaima','25815','Cundinamarca'),(557,1,'Tocancipa','25817','Cundinamarca'),(558,1,'Topaipi','25823','Cundinamarca'),(559,1,'Ubala','25839','Cundinamarca'),(560,1,'Ubaque','25841','Cundinamarca'),(561,1,'Villa De San Diego De Ubate','25843','Cundinamarca'),(562,1,'Une','25845','Cundinamarca'),(563,1,'Utica','25851','Cundinamarca'),(564,1,'Vergara','25862','Cundinamarca'),(565,1,'Viani','25867','Cundinamarca'),(566,1,'Villagomez','25871','Cundinamarca'),(567,1,'Villapinzon','25873','Cundinamarca'),(568,1,'Villeta','25875','Cundinamarca'),(569,1,'Viota','25878','Cundinamarca'),(570,1,'Yacopi','25885','Cundinamarca'),(571,1,'Zipacon','25898','Cundinamarca'),(572,1,'Zipaquira','25899','Cundinamarca'),(573,1,'Quibdo','27001','Choco'),(574,1,'Acandi','27006','Choco'),(575,1,'Alto Baudo','27025','Choco'),(576,1,'Atrato','27050','Choco'),(577,1,'Bagado','27073','Choco'),(578,1,'Bahia Solano','27075','Choco'),(579,1,'Bajo Baudo','27077','Choco'),(580,1,'Bojaya','27099','Choco'),(581,1,'El Canton Del San Pablo','27135','Choco'),(582,1,'Carmen Del Darien','27150','Choco'),(583,1,'Certegui','27160','Choco'),(584,1,'Condoto','27205','Choco'),(585,1,'El Carmen De Atrato','27245','Choco'),(586,1,'El Litoral Del San Juan','27250','Choco'),(587,1,'Istmina','27361','Choco'),(588,1,'Jurado','27372','Choco'),(589,1,'Lloro','27413','Choco'),(590,1,'Medio Atrato','27425','Choco'),(591,1,'Medio Baudo','27430','Choco'),(592,1,'Medio San Juan','27450','Choco'),(593,1,'Novita','27491','Choco'),(594,1,'Nuqui','27495','Choco'),(595,1,'Rio Iro','27580','Choco'),(596,1,'Rio Quito','27600','Choco'),(597,1,'Riosucio','27615','Choco'),(598,1,'San Jose Del Palmar','27660','Choco'),(599,1,'Sipi','27745','Choco'),(600,1,'Tado','27787','Choco'),(601,1,'Unguia','27800','Choco'),(602,1,'Union Panamericana','27810','Choco'),(603,1,'Neiva','41001','Huila'),(604,1,'Acevedo','41006','Huila'),(605,1,'Agrado','41013','Huila'),(606,1,'Aipe','41016','Huila'),(607,1,'Algeciras','41020','Huila'),(608,1,'Altamira','41026','Huila'),(609,1,'Baraya','41078','Huila'),(610,1,'Campoalegre','41132','Huila'),(611,1,'Colombia','41206','Huila'),(612,1,'Elias','41244','Huila'),(613,1,'Garzon','41298','Huila'),(614,1,'Gigante','41306','Huila'),(615,1,'Guadalupe','41319','Huila'),(616,1,'Hobo','41349','Huila'),(617,1,'Iquira','41357','Huila'),(618,1,'Isnos','41359','Huila'),(619,1,'La Argentina','41378','Huila'),(620,1,'La Plata','41396','Huila'),(621,1,'Nataga','41483','Huila'),(622,1,'Oporapa','41503','Huila'),(623,1,'Paicol','41518','Huila'),(624,1,'Palermo','41524','Huila'),(625,1,'Palestina','41530','Huila'),(626,1,'Pital','41548','Huila'),(627,1,'Pitalito','41551','Huila'),(628,1,'Rivera','41615','Huila'),(629,1,'Saladoblanco','41660','Huila'),(630,1,'San Agustin','41668','Huila'),(631,1,'Santa Maria','41676','Huila'),(632,1,'Suaza','41770','Huila'),(633,1,'Tarqui','41791','Huila'),(634,1,'Tesalia','41797','Huila'),(635,1,'Tello','41799','Huila'),(636,1,'Teruel','41801','Huila'),(637,1,'Timana','41807','Huila'),(638,1,'Villavieja','41872','Huila'),(639,1,'Yaguara','41885','Huila'),(640,1,'Riohacha','44001','La Guajira'),(641,1,'Albania','44035','La Guajira'),(642,1,'Barrancas','44078','La Guajira'),(643,1,'Dibulla','44090','La Guajira'),(644,1,'Distraccion','44098','La Guajira'),(645,1,'El Molino','44110','La Guajira'),(646,1,'Fonseca','44279','La Guajira'),(647,1,'Hatonuevo','44378','La Guajira'),(648,1,'La Jagua Del Pilar','44420','La Guajira'),(649,1,'Maicao','44430','La Guajira'),(650,1,'Manaure','44560','La Guajira'),(651,1,'San Juan Del Cesar','44650','La Guajira'),(652,1,'Uribia','44847','La Guajira'),(653,1,'Urumita','44855','La Guajira'),(654,1,'Villanueva','44874','La Guajira'),(655,1,'Santa Marta','47001','Magdalena'),(656,1,'Algarrobo','47030','Magdalena'),(657,1,'Aracataca','47053','Magdalena'),(658,1,'Ariguani','47058','Magdalena'),(659,1,'Cerro San Antonio','47161','Magdalena'),(660,1,'Chibolo','47170','Magdalena'),(661,1,'Cienaga','47189','Magdalena'),(662,1,'Concordia','47205','Magdalena'),(663,1,'El Banco','47245','Magdalena'),(664,1,'El Pi├ú┬æOn','47258','Magdalena'),(665,1,'El Reten','47268','Magdalena'),(666,1,'Fundacion','47288','Magdalena'),(667,1,'Guamal','47318','Magdalena'),(668,1,'Nueva Granada','47460','Magdalena'),(669,1,'Pedraza','47541','Magdalena'),(670,1,'Piji├ú┬æO Del Carmen','47545','Magdalena'),(671,1,'Pivijay','47551','Magdalena'),(672,1,'Plato','47555','Magdalena'),(673,1,'Puebloviejo','47570','Magdalena'),(674,1,'Remolino','47605','Magdalena'),(675,1,'Sabanas De San Angel','47660','Magdalena'),(676,1,'Salamina','47675','Magdalena'),(677,1,'San Sebastian De Buenavista','47692','Magdalena'),(678,1,'San Zenon','47703','Magdalena'),(679,1,'Santa Ana','47707','Magdalena'),(680,1,'Santa Barbara De Pinto','47720','Magdalena'),(681,1,'Sitionuevo','47745','Magdalena'),(682,1,'Tenerife','47798','Magdalena'),(683,1,'Zapayan','47960','Magdalena'),(684,1,'Zona Bananera','47980','Magdalena'),(685,1,'Villavicencio','50001','Meta'),(686,1,'Acacias','50006','Meta'),(687,1,'Barranca De Upia','50110','Meta'),(688,1,'Cabuyaro','50124','Meta'),(689,1,'Castilla La Nueva','50150','Meta'),(690,1,'Cubarral','50223','Meta'),(691,1,'Cumaral','50226','Meta'),(692,1,'El Calvario','50245','Meta'),(693,1,'El Castillo','50251','Meta'),(694,1,'El Dorado','50270','Meta'),(695,1,'Fuente De Oro','50287','Meta'),(696,1,'Granada','50313','Meta'),(697,1,'Guamal','50318','Meta'),(698,1,'Mapiripan','50325','Meta'),(699,1,'Mesetas','50330','Meta'),(700,1,'La Macarena','50350','Meta'),(701,1,'Uribe','50370','Meta'),(702,1,'Lejanias','50400','Meta'),(703,1,'Puerto Concordia','50450','Meta'),(704,1,'Puerto Gaitan','50568','Meta'),(705,1,'Puerto Lopez','50573','Meta'),(706,1,'Puerto Lleras','50577','Meta'),(707,1,'Puerto Rico','50590','Meta'),(708,1,'Restrepo','50606','Meta'),(709,1,'San Carlos De Guaroa','50680','Meta'),(710,1,'San Juan De Arama','50683','Meta'),(711,1,'San Juanito','50686','Meta'),(712,1,'San Martin','50689','Meta'),(713,1,'Vistahermosa','50711','Meta'),(714,1,'Pasto','52001','Nari├ú┬æO'),(715,1,'Alban','52019','Nari├ú┬æO'),(716,1,'Aldana','52022','Nari├ú┬æO'),(717,1,'Ancuya','52036','Nari├ú┬æO'),(718,1,'Arboleda','52051','Nari├ú┬æO'),(719,1,'Barbacoas','52079','Nari├ú┬æO'),(720,1,'Belen','52083','Nari├ú┬æO'),(721,1,'Buesaco','52110','Nari├ú┬æO'),(722,1,'Colon','52203','Nari├ú┬æO'),(723,1,'Consaca','52207','Nari├ú┬æO'),(724,1,'Contadero','52210','Nari├ú┬æO'),(725,1,'Cordoba','52215','Nari├ú┬æO'),(726,1,'Cuaspud','52224','Nari├ú┬æO'),(727,1,'Cumbal','52227','Nari├ú┬æO'),(728,1,'Cumbitara','52233','Nari├ú┬æO'),(729,1,'Chachagsi','52240','Nari├ú┬æO'),(730,1,'El Charco','52250','Nari├ú┬æO'),(731,1,'El Pe├ú┬æOl','52254','Nari├ú┬æO'),(732,1,'El Rosario','52256','Nari├ú┬æO'),(733,1,'El Tablon De Gomez','52258','Nari├ú┬æO'),(734,1,'El Tambo','52260','Nari├ú┬æO'),(735,1,'Funes','52287','Nari├ú┬æO'),(736,1,'Guachucal','52317','Nari├ú┬æO'),(737,1,'Guaitarilla','52320','Nari├ú┬æO'),(738,1,'Gualmatan','52323','Nari├ú┬æO'),(739,1,'Iles','52352','Nari├ú┬æO'),(740,1,'Imues','52354','Nari├ú┬æO'),(741,1,'Ipiales','52356','Nari├ú┬æO'),(742,1,'La Cruz','52378','Nari├ú┬æO'),(743,1,'La Florida','52381','Nari├ú┬æO'),(744,1,'La Llanada','52385','Nari├ú┬æO'),(745,1,'La Tola','52390','Nari├ú┬æO'),(746,1,'La Union','52399','Nari├ú┬æO'),(747,1,'Leiva','52405','Nari├ú┬æO'),(748,1,'Linares','52411','Nari├ú┬æO'),(749,1,'Los Andes','52418','Nari├ú┬æO'),(750,1,'Magsi','52427','Nari├ú┬æO'),(751,1,'Mallama','52435','Nari├ú┬æO'),(752,1,'Mosquera','52473','Nari├ú┬æO'),(753,1,'Nari├ú┬æO','52480','Nari├ú┬æO'),(754,1,'Olaya Herrera','52490','Nari├ú┬æO'),(755,1,'Ospina','52506','Nari├ú┬æO'),(756,1,'Francisco Pizarro','52520','Nari├ú┬æO'),(757,1,'Policarpa','52540','Nari├ú┬æO'),(758,1,'Potosi','52560','Nari├ú┬æO'),(759,1,'Providencia','52565','Nari├ú┬æO'),(760,1,'Puerres','52573','Nari├ú┬æO'),(761,1,'Pupiales','52585','Nari├ú┬æO'),(762,1,'Ricaurte','52612','Nari├ú┬æO'),(763,1,'Roberto Payan','52621','Nari├ú┬æO'),(764,1,'Samaniego','52678','Nari├ú┬æO'),(765,1,'Sandona','52683','Nari├ú┬æO'),(766,1,'San Bernardo','52685','Nari├ú┬æO'),(767,1,'San Lorenzo','52687','Nari├ú┬æO'),(768,1,'San Pablo','52693','Nari├ú┬æO'),(769,1,'San Pedro De Cartago','52694','Nari├ú┬æO'),(770,1,'Santa Barbara','52696','Nari├ú┬æO'),(771,1,'Santacruz','52699','Nari├ú┬æO'),(772,1,'Sapuyes','52720','Nari├ú┬æO'),(773,1,'Taminango','52786','Nari├ú┬æO'),(774,1,'Tangua','52788','Nari├ú┬æO'),(775,1,'San Andres De Tumaco','52835','Nari├ú┬æO'),(776,1,'Tuquerres','52838','Nari├ú┬æO'),(777,1,'Yacuanquer','52885','Nari├ú┬æO'),(778,1,'Cucuta','54001','Norte De Santander'),(779,1,'Abrego','54003','Norte De Santander'),(780,1,'Arboledas','54051','Norte De Santander'),(781,1,'Bochalema','54099','Norte De Santander'),(782,1,'Bucarasica','54109','Norte De Santander'),(783,1,'Cacota','54125','Norte De Santander'),(784,1,'Cachira','54128','Norte De Santander'),(785,1,'Chinacota','54172','Norte De Santander'),(786,1,'Chitaga','54174','Norte De Santander'),(787,1,'Convencion','54206','Norte De Santander'),(788,1,'Cucutilla','54223','Norte De Santander'),(789,1,'Durania','54239','Norte De Santander'),(790,1,'El Carmen','54245','Norte De Santander'),(791,1,'El Tarra','54250','Norte De Santander'),(792,1,'El Zulia','54261','Norte De Santander'),(793,1,'Gramalote','54313','Norte De Santander'),(794,1,'Hacari','54344','Norte De Santander'),(795,1,'Herran','54347','Norte De Santander'),(796,1,'Labateca','54377','Norte De Santander'),(797,1,'La Esperanza','54385','Norte De Santander'),(798,1,'La Playa','54398','Norte De Santander'),(799,1,'Los Patios','54405','Norte De Santander'),(800,1,'Lourdes','54418','Norte De Santander'),(801,1,'Mutiscua','54480','Norte De Santander'),(802,1,'Oca├ú┬æA','54498','Norte De Santander'),(803,1,'Pamplona','54518','Norte De Santander'),(804,1,'Pamplonita','54520','Norte De Santander'),(805,1,'Puerto Santander','54553','Norte De Santander'),(806,1,'Ragonvalia','54599','Norte De Santander'),(807,1,'Salazar','54660','Norte De Santander'),(808,1,'San Calixto','54670','Norte De Santander'),(809,1,'San Cayetano','54673','Norte De Santander'),(810,1,'Santiago','54680','Norte De Santander'),(811,1,'Sardinata','54720','Norte De Santander'),(812,1,'Silos','54743','Norte De Santander'),(813,1,'Teorama','54800','Norte De Santander'),(814,1,'Tibu','54810','Norte De Santander'),(815,1,'Toledo','54820','Norte De Santander'),(816,1,'Villa Caro','54871','Norte De Santander'),(817,1,'Villa Del Rosario','54874','Norte De Santander'),(818,1,'Armenia','63001','Quindio'),(819,1,'Buenavista','63111','Quindio'),(820,1,'Calarca','63130','Quindio'),(821,1,'Circasia','63190','Quindio'),(822,1,'Cordoba','63212','Quindio'),(823,1,'Filandia','63272','Quindio'),(824,1,'Genova','63302','Quindio'),(825,1,'La Tebaida','63401','Quindio'),(826,1,'Montenegro','63470','Quindio'),(827,1,'Pijao','63548','Quindio'),(828,1,'Quimbaya','63594','Quindio'),(829,1,'Salento','63690','Quindio'),(830,1,'Pereira','66001','Risaralda'),(831,1,'Apia','66045','Risaralda'),(832,1,'Balboa','66075','Risaralda'),(833,1,'Belen De Umbria','66088','Risaralda'),(834,1,'Dosquebradas','66170','Risaralda'),(835,1,'Guatica','66318','Risaralda'),(836,1,'La Celia','66383','Risaralda'),(837,1,'La Virginia','66400','Risaralda'),(838,1,'Marsella','66440','Risaralda'),(839,1,'Mistrato','66456','Risaralda'),(840,1,'Pueblo Rico','66572','Risaralda'),(841,1,'Quinchia','66594','Risaralda'),(842,1,'Santa Rosa De Cabal','66682','Risaralda'),(843,1,'Santuario','66687','Risaralda'),(844,1,'Bucaramanga','68001','Santander'),(845,1,'Aguada','68013','Santander'),(846,1,'Albania','68020','Santander'),(847,1,'Aratoca','68051','Santander'),(848,1,'Barbosa','68077','Santander'),(849,1,'Barichara','68079','Santander'),(850,1,'Barrancabermeja','68081','Santander'),(851,1,'Betulia','68092','Santander'),(852,1,'Bolivar','68101','Santander'),(853,1,'Cabrera','68121','Santander'),(854,1,'California','68132','Santander'),(855,1,'Capitanejo','68147','Santander'),(856,1,'Carcasi','68152','Santander'),(857,1,'Cepita','68160','Santander'),(858,1,'Cerrito','68162','Santander'),(859,1,'Charala','68167','Santander'),(860,1,'Charta','68169','Santander'),(861,1,'Chima','68176','Santander'),(862,1,'Chipata','68179','Santander'),(863,1,'Cimitarra','68190','Santander'),(864,1,'Concepcion','68207','Santander'),(865,1,'Confines','68209','Santander'),(866,1,'Contratacion','68211','Santander'),(867,1,'Coromoro','68217','Santander'),(868,1,'Curiti','68229','Santander'),(869,1,'El Carmen De Chucuri','68235','Santander'),(870,1,'El Guacamayo','68245','Santander'),(871,1,'El Pe├ú┬æOn','68250','Santander'),(872,1,'El Playon','68255','Santander'),(873,1,'Encino','68264','Santander'),(874,1,'Enciso','68266','Santander'),(875,1,'Florian','68271','Santander'),(876,1,'Floridablanca','68276','Santander'),(877,1,'Galan','68296','Santander'),(878,1,'Gambita','68298','Santander'),(879,1,'Giron','68307','Santander'),(880,1,'Guaca','68318','Santander'),(881,1,'Guadalupe','68320','Santander'),(882,1,'Guapota','68322','Santander'),(883,1,'Guavata','68324','Santander'),(884,1,'Gsepsa','68327','Santander'),(885,1,'Hato','68344','Santander'),(886,1,'Jesus Maria','68368','Santander'),(887,1,'Jordan','68370','Santander'),(888,1,'La Belleza','68377','Santander'),(889,1,'Landazuri','68385','Santander'),(890,1,'La Paz','68397','Santander'),(891,1,'Lebrija','68406','Santander'),(892,1,'Los Santos','68418','Santander'),(893,1,'Macaravita','68425','Santander'),(894,1,'Malaga','68432','Santander'),(895,1,'Matanza','68444','Santander'),(896,1,'Mogotes','68464','Santander'),(897,1,'Molagavita','68468','Santander'),(898,1,'Ocamonte','68498','Santander'),(899,1,'Oiba','68500','Santander'),(900,1,'Onzaga','68502','Santander'),(901,1,'Palmar','68522','Santander'),(902,1,'Palmas Del Socorro','68524','Santander'),(903,1,'Paramo','68533','Santander'),(904,1,'Piedecuesta','68547','Santander'),(905,1,'Pinchote','68549','Santander'),(906,1,'Puente Nacional','68572','Santander'),(907,1,'Puerto Parra','68573','Santander'),(908,1,'Puerto Wilches','68575','Santander'),(909,1,'Rionegro','68615','Santander'),(910,1,'Sabana De Torres','68655','Santander'),(911,1,'San Andres','68669','Santander'),(912,1,'San Benito','68673','Santander'),(913,1,'San Gil','68679','Santander'),(914,1,'San Joaquin','68682','Santander'),(915,1,'San Jose De Miranda','68684','Santander'),(916,1,'San Miguel','68686','Santander'),(917,1,'San Vicente De Chucuri','68689','Santander'),(918,1,'Santa Barbara','68705','Santander'),(919,1,'Santa Helena Del Opon','68720','Santander'),(920,1,'Simacota','68745','Santander'),(921,1,'Socorro','68755','Santander'),(922,1,'Suaita','68770','Santander'),(923,1,'Sucre','68773','Santander'),(924,1,'Surata','68780','Santander'),(925,1,'Tona','68820','Santander'),(926,1,'Valle De San Jose','68855','Santander'),(927,1,'Velez','68861','Santander'),(928,1,'Vetas','68867','Santander'),(929,1,'Villanueva','68872','Santander'),(930,1,'Zapatoca','68895','Santander'),(931,1,'Sincelejo','70001','Sucre'),(932,1,'Buenavista','70110','Sucre'),(933,1,'Caimito','70124','Sucre'),(934,1,'Coloso','70204','Sucre'),(935,1,'Corozal','70215','Sucre'),(936,1,'Cove├ú┬æAs','70221','Sucre'),(937,1,'Chalan','70230','Sucre'),(938,1,'El Roble','70233','Sucre'),(939,1,'Galeras','70235','Sucre'),(940,1,'Guaranda','70265','Sucre'),(941,1,'La Union','70400','Sucre'),(942,1,'Los Palmitos','70418','Sucre'),(943,1,'Majagual','70429','Sucre'),(944,1,'Morroa','70473','Sucre'),(945,1,'Ovejas','70508','Sucre'),(946,1,'Palmito','70523','Sucre'),(947,1,'Sampues','70670','Sucre'),(948,1,'San Benito Abad','70678','Sucre'),(949,1,'San Juan De Betulia','70702','Sucre'),(950,1,'San Marcos','70708','Sucre'),(951,1,'San Onofre','70713','Sucre'),(952,1,'San Pedro','70717','Sucre'),(953,1,'San Luis De Since','70742','Sucre'),(954,1,'Sucre','70771','Sucre'),(955,1,'Santiago De Tolu','70820','Sucre'),(956,1,'Tolu Viejo','70823','Sucre'),(957,1,'Ibague','73001','Tolima'),(958,1,'Alpujarra','73024','Tolima'),(959,1,'Alvarado','73026','Tolima'),(960,1,'Ambalema','73030','Tolima'),(961,1,'Anzoategui','73043','Tolima'),(962,1,'Armero','73055','Tolima'),(963,1,'Ataco','73067','Tolima'),(964,1,'Cajamarca','73124','Tolima'),(965,1,'Carmen De Apicala','73148','Tolima'),(966,1,'Casabianca','73152','Tolima'),(967,1,'Chaparral','73168','Tolima'),(968,1,'Coello','73200','Tolima'),(969,1,'Coyaima','73217','Tolima'),(970,1,'Cunday','73226','Tolima'),(971,1,'Dolores','73236','Tolima'),(972,1,'Espinal','73268','Tolima'),(973,1,'Falan','73270','Tolima'),(974,1,'Flandes','73275','Tolima'),(975,1,'Fresno','73283','Tolima'),(976,1,'Guamo','73319','Tolima'),(977,1,'Herveo','73347','Tolima'),(978,1,'Honda','73349','Tolima'),(979,1,'Icononzo','73352','Tolima'),(980,1,'Lerida','73408','Tolima'),(981,1,'Libano','73411','Tolima'),(982,1,'Mariquita','73443','Tolima'),(983,1,'Melgar','73449','Tolima'),(984,1,'Murillo','73461','Tolima'),(985,1,'Natagaima','73483','Tolima'),(986,1,'Ortega','73504','Tolima'),(987,1,'Palocabildo','73520','Tolima'),(988,1,'Piedras','73547','Tolima'),(989,1,'Planadas','73555','Tolima'),(990,1,'Prado','73563','Tolima'),(991,1,'Purificacion','73585','Tolima'),(992,1,'Rioblanco','73616','Tolima'),(993,1,'Roncesvalles','73622','Tolima'),(994,1,'Rovira','73624','Tolima'),(995,1,'Salda├ú┬æA','73671','Tolima'),(996,1,'San Antonio','73675','Tolima'),(997,1,'San Luis','73678','Tolima'),(998,1,'Santa Isabel','73686','Tolima'),(999,1,'Suarez','73770','Tolima'),(1000,1,'Valle De San Juan','73854','Tolima'),(1001,1,'Venadillo','73861','Tolima'),(1002,1,'Villahermosa','73870','Tolima'),(1003,1,'Villarrica','73873','Tolima'),(1004,1,'Cali','76001','Valle Del Cauca'),(1005,1,'Alcala','76020','Valle Del Cauca'),(1006,1,'Andalucia','76036','Valle Del Cauca'),(1007,1,'Ansermanuevo','76041','Valle Del Cauca'),(1008,1,'Argelia','76054','Valle Del Cauca'),(1009,1,'Bolivar','76100','Valle Del Cauca'),(1010,1,'Buenaventura','76109','Valle Del Cauca'),(1011,1,'Guadalajara De Buga','76111','Valle Del Cauca'),(1012,1,'Bugalagrande','76113','Valle Del Cauca'),(1013,1,'Caicedonia','76122','Valle Del Cauca'),(1014,1,'Calima','76126','Valle Del Cauca'),(1015,1,'Candelaria','76130','Valle Del Cauca'),(1016,1,'Cartago','76147','Valle Del Cauca'),(1017,1,'Dagua','76233','Valle Del Cauca'),(1018,1,'El Aguila','76243','Valle Del Cauca'),(1019,1,'El Cairo','76246','Valle Del Cauca'),(1020,1,'El Cerrito','76248','Valle Del Cauca'),(1021,1,'El Dovio','76250','Valle Del Cauca'),(1022,1,'Florida','76275','Valle Del Cauca'),(1023,1,'Ginebra','76306','Valle Del Cauca'),(1024,1,'Guacari','76318','Valle Del Cauca'),(1025,1,'Jamundi','76364','Valle Del Cauca'),(1026,1,'La Cumbre','76377','Valle Del Cauca'),(1027,1,'La Union','76400','Valle Del Cauca'),(1028,1,'La Victoria','76403','Valle Del Cauca'),(1029,1,'Obando','76497','Valle Del Cauca'),(1030,1,'Palmira','76520','Valle Del Cauca'),(1031,1,'Pradera','76563','Valle Del Cauca'),(1032,1,'Restrepo','76606','Valle Del Cauca'),(1033,1,'Riofrio','76616','Valle Del Cauca'),(1034,1,'Roldanillo','76622','Valle Del Cauca'),(1035,1,'San Pedro','76670','Valle Del Cauca'),(1036,1,'Sevilla','76736','Valle Del Cauca'),(1037,1,'Toro','76823','Valle Del Cauca'),(1038,1,'Trujillo','76828','Valle Del Cauca'),(1039,1,'Tulua','76834','Valle Del Cauca'),(1040,1,'Ulloa','76845','Valle Del Cauca'),(1041,1,'Versalles','76863','Valle Del Cauca'),(1042,1,'Vijes','76869','Valle Del Cauca'),(1043,1,'Yotoco','76890','Valle Del Cauca'),(1044,1,'Yumbo','76892','Valle Del Cauca'),(1045,1,'Zarzal','76895','Valle Del Cauca'),(1046,1,'Arauca','81001','Arauca'),(1047,1,'Arauquita','81065','Arauca'),(1048,1,'Cravo Norte','81220','Arauca'),(1049,1,'Fortul','81300','Arauca'),(1050,1,'Puerto Rondon','81591','Arauca'),(1051,1,'Saravena','81736','Arauca'),(1052,1,'Tame','81794','Arauca'),(1053,1,'Yopal','85001','Casanare'),(1054,1,'Aguazul','85010','Casanare'),(1055,1,'Chameza','85015','Casanare'),(1056,1,'Hato Corozal','85125','Casanare'),(1057,1,'La Salina','85136','Casanare'),(1058,1,'Mani','85139','Casanare'),(1059,1,'Monterrey','85162','Casanare'),(1060,1,'Nunchia','85225','Casanare'),(1061,1,'Orocue','85230','Casanare'),(1062,1,'Paz De Ariporo','85250','Casanare'),(1063,1,'Pore','85263','Casanare'),(1064,1,'Recetor','85279','Casanare'),(1065,1,'Sabanalarga','85300','Casanare'),(1066,1,'Sacama','85315','Casanare'),(1067,1,'San Luis De Palenque','85325','Casanare'),(1068,1,'Tamara','85400','Casanare'),(1069,1,'Tauramena','85410','Casanare'),(1070,1,'Trinidad','85430','Casanare'),(1071,1,'Villanueva','85440','Casanare'),(1072,1,'Mocoa','86001','Putumayo'),(1073,1,'Colon','86219','Putumayo'),(1074,1,'Orito','86320','Putumayo'),(1075,1,'Puerto Asis','86568','Putumayo'),(1076,1,'Puerto Caicedo','86569','Putumayo'),(1077,1,'Puerto Guzman','86571','Putumayo'),(1078,1,'Leguizamo','86573','Putumayo'),(1079,1,'Sibundoy','86749','Putumayo'),(1080,1,'San Francisco','86755','Putumayo'),(1081,1,'San Miguel','86757','Putumayo'),(1082,1,'Santiago','86760','Putumayo'),(1083,1,'Valle Del Guamuez','86865','Putumayo'),(1084,1,'Villagarzon','86885','Putumayo'),(1085,1,'San Andres','88001','San Andres'),(1086,1,'Providencia','88564','San Andres'),(1087,1,'Leticia','91001','Amazonas'),(1088,1,'El Encanto','91263','Amazonas'),(1089,1,'La Chorrera','91405','Amazonas'),(1090,1,'La Pedrera','91407','Amazonas'),(1091,1,'La Victoria','91430','Amazonas'),(1092,1,'Miriti - Parana','91460','Amazonas'),(1093,1,'Puerto Alegria','91530','Amazonas'),(1094,1,'Puerto Arica','91536','Amazonas'),(1095,1,'Puerto Nari├ú┬æO','91540','Amazonas'),(1096,1,'Puerto Santander','91669','Amazonas'),(1097,1,'Tarapaca','91798','Amazonas'),(1098,1,'Inirida','94001','Guainia'),(1099,1,'Barranco Minas','94343','Guainia'),(1100,1,'Mapiripana','94663','Guainia'),(1101,1,'San Felipe','94883','Guainia'),(1102,1,'Puerto Colombia','94884','Guainia'),(1103,1,'La Guadalupe','94885','Guainia'),(1104,1,'Cacahual','94886','Guainia'),(1105,1,'Pana Pana','94887','Guainia'),(1106,1,'Morichal','94888','Guainia'),(1107,1,'San Jose Del Guaviare','95001','Guaviare'),(1108,1,'Calamar','95015','Guaviare'),(1109,1,'El Retorno','95025','Guaviare'),(1110,1,'Miraflores','95200','Guaviare'),(1111,1,'Mitu','97001','Vaupes'),(1112,1,'Caruru','97161','Vaupes'),(1113,1,'Pacoa','97511','Vaupes'),(1114,1,'Taraira','97666','Vaupes'),(1115,1,'Papunaua','97777','Vaupes'),(1116,1,'Yavarate','97889','Vaupes'),(1117,1,'Puerto Carre├ú┬æO','99001','Vichada'),(1118,1,'La Primavera','99524','Vichada'),(1119,1,'Santa Rosalia','99624','Vichada'),(1120,1,'Cumaribo','99773','Vichada');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `clientes` (
  `ClienteId` int NOT NULL AUTO_INCREMENT,
  `TipoDocumento` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NumeroDocumento` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `PrimerNombre` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SegundoNombre` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PrimerApellido` varchar(80) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SegundoApellido` varchar(80) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Telefono2` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Correo` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Direccion` varchar(250) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `IdCiudad` int DEFAULT NULL,
  `FechaNacimiento` date DEFAULT NULL,
  `Observaciones` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int NOT NULL,
  `FechaModificacion` datetime DEFAULT NULL,
  `UsuarioIdModificacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`ClienteId`),
  UNIQUE KEY `UQ_Clientes_Documento` (`TipoDocumento`,`NumeroDocumento`),
  KEY `FK_Clientes_UsuarioCreacion` (`UsuarioIdCreacion`),
  KEY `FK_Clientes_UsuarioModificacion` (`UsuarioIdModificacion`),
  KEY `idx_clientes_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_clientes_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`),
  CONSTRAINT `FK_Clientes_UsuarioCreacion` FOREIGN KEY (`UsuarioIdCreacion`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `FK_Clientes_UsuarioModificacion` FOREIGN KEY (`UsuarioIdModificacion`) REFERENCES `usuarios` (`UsuarioId`)
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `clientes` VALUES (1,'CC','7307549','NANDO',NULL,'DETRU',NULL,'32322',NULL,'jhaghagdaj@gmail.com',NULL,NULL,NULL,NULL,1,'2026-08-21 11:30:00',3,'2026-09-01 10:43:51',3,1),(2,'CC','1000000011','Cliente',NULL,'Mostrador',NULL,'3160000000',NULL,'cliente@pruebas.com',NULL,NULL,NULL,NULL,1,'2026-09-06 08:49:49',16,NULL,NULL,2),(3,'CC','464564564','Clie1',NULL,'Geneico','fgh','46456456','4564564',NULL,NULL,NULL,NULL,NULL,1,'2026-09-13 10:32:56',19,'2026-09-13 10:33:12',19,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compras` (
  `IdCompra` bigint NOT NULL AUTO_INCREMENT,
  `Numero` varchar(50) NOT NULL,
  `IdProveedor` int NOT NULL,
  `IdBodega` int NOT NULL,
  `Fecha` date NOT NULL,
  `Subtotal` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `Descuento` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `Impuesto` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `Total` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `Estado` enum('BORRADOR','CONFIRMADA','ANULADA') NOT NULL DEFAULT 'BORRADOR',
  `Observaciones` varchar(500) DEFAULT NULL,
  `MetodoPago` enum('CONTADO','CREDITO') NOT NULL DEFAULT 'CONTADO' COMMENT 'M├®todo de pago de la compra',
  `TipoDocumento` varchar(30) DEFAULT NULL COMMENT 'Tipo de documento del proveedor (opcional, ej. Factura)',
  `NumeroDocumentoProveedor` varchar(50) DEFAULT NULL COMMENT 'N├║mero del documento del proveedor (opcional)',
  `SaldoPendiente` decimal(18,4) NOT NULL DEFAULT '0.0000' COMMENT 'Saldo pendiente por pagar (solo CREDITO)',
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdConfirmacion` int DEFAULT NULL,
  `FechaConfirmacion` datetime DEFAULT NULL,
  `UsuarioIdAnulacion` int DEFAULT NULL,
  `FechaAnulacion` datetime DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdCompra`),
  UNIQUE KEY `uk_compra_numero` (`Numero`),
  KEY `ix_compra_proveedor` (`IdProveedor`),
  KEY `ix_compra_bodega` (`IdBodega`),
  KEY `ix_compra_fecha` (`Fecha`),
  KEY `ix_compra_estado` (`Estado`),
  KEY `idx_compras_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_compra_bodega` FOREIGN KEY (`IdBodega`) REFERENCES `bodegas` (`Id`),
  CONSTRAINT `fk_compra_proveedor` FOREIGN KEY (`IdProveedor`) REFERENCES `proveedores` (`IdProveedor`),
  CONSTRAINT `fk_compras_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB AUTO_INCREMENT=27 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `compras` VALUES (3,'TSTA-1788708051284',1,4,'2026-09-06',40000.0000,0.0000,0.0000,40000.0000,'ANULADA',NULL,'CONTADO',NULL,NULL,0.0000,3,'2026-09-06 10:20:51',3,'2026-09-06 10:20:51',3,'2026-09-06 10:20:51',1),(5,'SMK-CONT-1788708404652',1,4,'2026-09-06',40000.0000,0.0000,0.0000,40000.0000,'ANULADA',NULL,'CONTADO',NULL,NULL,0.0000,3,'2026-09-06 10:26:44',3,'2026-09-06 10:26:44',3,'2026-09-06 10:26:45',1),(6,'SMK-CONT2-1788708405236',1,4,'2026-09-06',40000.0000,0.0000,0.0000,40000.0000,'CONFIRMADA',NULL,'CONTADO',NULL,NULL,5000.0000,3,'2026-09-06 10:26:45',3,'2026-09-06 10:26:45',NULL,NULL,1),(15,'FINAL-A',1,4,'2026-09-06',10000.0000,0.0000,0.0000,10000.0000,'ANULADA',NULL,'CONTADO',NULL,NULL,0.0000,3,'2026-09-06 10:28:51',3,'2026-09-06 10:28:51',3,'2026-09-06 10:28:51',1),(16,'FINAL-B',1,4,'2026-09-06',15000.0000,0.0000,0.0000,15000.0000,'ANULADA',NULL,'CONTADO',NULL,NULL,0.0000,3,'2026-09-06 10:28:51',3,'2026-09-06 10:28:51',3,'2026-09-06 10:28:51',1),(17,'FINAL-C',1,4,'2026-09-06',30000.0000,0.0000,0.0000,30000.0000,'ANULADA',NULL,'CREDITO',NULL,NULL,0.0000,3,'2026-09-06 10:28:51',3,'2026-09-06 10:28:51',3,'2026-09-06 10:28:51',1),(19,'C-1',1,4,'2026-09-07',0.0000,0.0000,0.0000,0.0000,'BORRADOR','dcfbg','CONTADO',NULL,NULL,0.0000,3,'2026-09-07 13:08:36',NULL,NULL,NULL,NULL,1),(20,'C-2',1,4,'2026-09-07',27500.0000,0.0000,0.0000,27500.0000,'CONFIRMADA','dgchbfghfgh','CONTADO',NULL,NULL,0.0000,3,'2026-09-07 13:23:01',3,'2026-09-07 13:33:47',NULL,NULL,1),(21,'C-3',1,4,'2026-09-07',56000.0000,0.0000,0.0000,56000.0000,'CONFIRMADA','dbdbgb','CONTADO',NULL,NULL,0.0000,3,'2026-09-07 13:34:46',3,'2026-09-07 13:34:52',NULL,NULL,1),(22,'C-4',1,4,'2026-09-07',44800.0000,0.0000,0.0000,448000.0000,'BORRADOR','sfgsffsds','CREDITO',NULL,NULL,448000.0000,3,'2026-09-07 14:04:48',NULL,NULL,NULL,NULL,1),(23,'C-5',1,4,'2026-09-08',110000.0000,0.0000,0.0000,1100000.0000,'CONFIRMADA','fgdfgdfg','CREDITO',NULL,NULL,1080000.0000,3,'2026-09-08 11:23:40',3,'2026-09-08 11:25:32',NULL,NULL,1),(24,'C-6',1,4,'2026-09-10',2700.0000,0.0000,0.0000,2700.0000,'BORRADOR',NULL,'CREDITO',NULL,NULL,2700.0000,3,'2026-09-10 15:42:33',NULL,NULL,NULL,NULL,1),(25,'C-7',1,4,'2026-09-10',0.0000,0.0000,0.0000,0.0000,'CONFIRMADA','fgfgdfg','CONTADO','Factura Electr├│nica','4152652',0.0000,3,'2026-09-10 16:02:15',3,'2026-09-10 16:02:53',NULL,NULL,1),(26,'C-8',1,4,'2026-09-12',290000.0000,0.0000,0.0000,290000.0000,'CONFIRMADA','ff gdf gdsgdsg','CREDITO','Factura','8458558',270000.0000,3,'2026-09-12 09:54:22',3,'2026-09-12 09:55:04',NULL,NULL,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `compras_detalle` (
  `IdDetalleCompra` bigint NOT NULL AUTO_INCREMENT,
  `IdCompra` bigint NOT NULL,
  `IdProducto` int NOT NULL,
  `IdLote` int DEFAULT NULL,
  `Cantidad` decimal(18,4) NOT NULL,
  `CostoUnitario` decimal(18,4) NOT NULL,
  `Descuento` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `Impuesto` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `Total` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdDetalleCompra`),
  KEY `ix_compradetalle_compra` (`IdCompra`),
  KEY `ix_compradetalle_producto` (`IdProducto`),
  KEY `ix_compradetalle_lote` (`IdLote`),
  KEY `idx_compras_detalle_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_compradetalle_compra` FOREIGN KEY (`IdCompra`) REFERENCES `compras` (`IdCompra`),
  CONSTRAINT `fk_compradetalle_lote` FOREIGN KEY (`IdLote`) REFERENCES `lotes` (`IdLote`),
  CONSTRAINT `fk_compradetalle_producto` FOREIGN KEY (`IdProducto`) REFERENCES `productos` (`IdProducto`),
  CONSTRAINT `fk_compras_detalle_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `compras_detalle` VALUES (3,3,1,NULL,2.0000,20000.0000,0.0000,0.0000,40000.0000,1),(5,5,1,NULL,2.0000,20000.0000,0.0000,0.0000,40000.0000,1),(6,6,1,NULL,2.0000,20000.0000,0.0000,0.0000,40000.0000,1),(15,15,1,NULL,1.0000,10000.0000,0.0000,0.0000,10000.0000,1),(16,16,1,NULL,3.0000,5000.0000,0.0000,0.0000,15000.0000,1),(17,17,1,NULL,6.0000,5000.0000,0.0000,0.0000,30000.0000,1),(19,19,1,NULL,1.0000,0.0000,0.0000,0.0000,0.0000,1),(20,20,1,NULL,5.0000,5500.0000,0.0000,0.0000,27500.0000,1),(21,21,1,NULL,10.0000,5600.0000,0.0000,0.0000,56000.0000,1),(24,22,1,NULL,8.0000,5600.0000,0.0000,0.0000,448000.0000,NULL),(26,23,1,NULL,20.0000,5500.0000,0.0000,0.0000,1100000.0000,NULL),(27,24,1,NULL,1.0000,2700.0000,0.0000,0.0000,2700.0000,1),(28,25,1,NULL,1.0000,0.0000,0.0000,0.0000,0.0000,1),(29,26,1,NULL,50.0000,5800.0000,0.0000,0.0000,290000.0000,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `consentimientoinformado` (
  `IdConsentimiento` int NOT NULL AUTO_INCREMENT,
  `IdHistoriaClinica` int DEFAULT NULL,
  `IdCirugia` int DEFAULT NULL,
  `TipoConsentimiento` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Responsable` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Observaciones` text COLLATE utf8mb4_unicode_ci,
  `RutaDocumento` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `UsuarioResponsable` int DEFAULT NULL,
  `FechaCreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdConsentimiento`),
  KEY `fk_consentimiento_usuario` (`UsuarioResponsable`),
  KEY `idx_consentimiento_historia` (`IdHistoriaClinica`),
  KEY `idx_consentimiento_cirugia` (`IdCirugia`),
  KEY `idx_consentimientoinformado_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_consentimiento_cirugia` FOREIGN KEY (`IdCirugia`) REFERENCES `cirugias` (`IdCirugia`),
  CONSTRAINT `fk_consentimiento_historia` FOREIGN KEY (`IdHistoriaClinica`) REFERENCES `historiasclinicas` (`IdHistoriaClinica`),
  CONSTRAINT `fk_consentimiento_usuario` FOREIGN KEY (`UsuarioResponsable`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `fk_consentimientoinformado_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `controles` (
  `IdControl` int NOT NULL AUTO_INCREMENT,
  `IdHistoriaClinica` int NOT NULL,
  `IdMascota` int NOT NULL,
  `IdVeterinario` int NOT NULL,
  `IdCirugia` int DEFAULT NULL,
  `FechaControl` datetime NOT NULL,
  `Motivo` text COLLATE utf8mb4_unicode_ci,
  `Evolucion` text COLLATE utf8mb4_unicode_ci,
  `Peso` decimal(5,2) DEFAULT NULL,
  `SignosVitales` text COLLATE utf8mb4_unicode_ci,
  `Observaciones` text COLLATE utf8mb4_unicode_ci,
  `Recomendaciones` text COLLATE utf8mb4_unicode_ci,
  `ProximoControl` date DEFAULT NULL,
  `FechaCreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdControl`),
  KEY `fk_controles_veterinario` (`IdVeterinario`),
  KEY `fk_controles_cirugia` (`IdCirugia`),
  KEY `fk_controles_usuario` (`UsuarioIdCreacion`),
  KEY `idx_controles_historia` (`IdHistoriaClinica`),
  KEY `idx_controles_mascota` (`IdMascota`),
  KEY `idx_controles_fecha` (`FechaControl`),
  KEY `idx_controles_proximofecha` (`ProximoControl`),
  KEY `idx_controles_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_controles_cirugia` FOREIGN KEY (`IdCirugia`) REFERENCES `cirugias` (`IdCirugia`),
  CONSTRAINT `fk_controles_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`),
  CONSTRAINT `fk_controles_historia` FOREIGN KEY (`IdHistoriaClinica`) REFERENCES `historiasclinicas` (`IdHistoriaClinica`),
  CONSTRAINT `fk_controles_mascota` FOREIGN KEY (`IdMascota`) REFERENCES `mascotas` (`IdMascota`),
  CONSTRAINT `fk_controles_usuario` FOREIGN KEY (`UsuarioIdCreacion`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `fk_controles_veterinario` FOREIGN KEY (`IdVeterinario`) REFERENCES `veterinarios` (`IdVeterinario`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `controles` VALUES (1,3,3,7,NULL,'2026-09-04 18:14:00','zxczxc','sdcscsd',2.00,NULL,'scsdc','scsdc','2026-09-17','2026-09-04 13:14:45',3,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `detallerecetas` (
  `IdDetalleReceta` int NOT NULL AUTO_INCREMENT,
  `IdReceta` int NOT NULL,
  `IdProducto` int DEFAULT NULL,
  `Medicamento` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Concentracion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FormaFarmaceutica` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Dosis` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `UnidadDosis` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Frecuencia` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `ViaAdministracion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Duracion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Cantidad` int DEFAULT NULL,
  `Indicaciones` text COLLATE utf8mb4_unicode_ci,
  `Observaciones` text COLLATE utf8mb4_unicode_ci,
  `FechaCreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdDetalleReceta`),
  KEY `idx_detallereceta_receta` (`IdReceta`),
  KEY `idx_detallerecetas_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_detallereceta_receta` FOREIGN KEY (`IdReceta`) REFERENCES `recetas` (`IdReceta`),
  CONSTRAINT `fk_detallerecetas_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `detallerecetas` VALUES (1,1,NULL,'sdfsdf','sdfsdf','sfdsdf','3',NULL,'3','3','3',NULL,'sdfsdfsdf',NULL,'2026-09-04 13:13:32',1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devoluciones_compra` (
  `IdDevolucionCompra` bigint NOT NULL AUTO_INCREMENT,
  `Numero` varchar(50) NOT NULL,
  `IdCompra` bigint NOT NULL,
  `IdProveedor` int DEFAULT NULL,
  `IdBodega` int NOT NULL,
  `Fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Estado` enum('BORRADOR','CONFIRMADA','ANULADA') NOT NULL DEFAULT 'BORRADOR',
  `Observaciones` varchar(500) DEFAULT NULL,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdConfirmacion` int DEFAULT NULL,
  `FechaConfirmacion` datetime DEFAULT NULL,
  `UsuarioIdAnulacion` int DEFAULT NULL,
  `FechaAnulacion` datetime DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdDevolucionCompra`),
  UNIQUE KEY `uk_devcompra_numero` (`Numero`),
  KEY `ix_devcompra_compra` (`IdCompra`),
  KEY `ix_devcompra_proveedor` (`IdProveedor`),
  KEY `ix_devcompra_bodega` (`IdBodega`),
  KEY `idx_devoluciones_compra_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_devcompra_bodega` FOREIGN KEY (`IdBodega`) REFERENCES `bodegas` (`Id`),
  CONSTRAINT `fk_devcompra_compra` FOREIGN KEY (`IdCompra`) REFERENCES `compras` (`IdCompra`),
  CONSTRAINT `fk_devcompra_proveedor` FOREIGN KEY (`IdProveedor`) REFERENCES `proveedores` (`IdProveedor`),
  CONSTRAINT `fk_devoluciones_compra_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devoluciones_compra_detalle` (
  `IdDevolucionCompraDetalle` bigint NOT NULL AUTO_INCREMENT,
  `IdDevolucionCompra` bigint NOT NULL,
  `IdProducto` int NOT NULL,
  `Cantidad` decimal(18,4) NOT NULL,
  `CostoUnitario` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `Total` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdDevolucionCompraDetalle`),
  KEY `ix_devcompradetalle_dev` (`IdDevolucionCompra`),
  KEY `ix_devcompradetalle_producto` (`IdProducto`),
  KEY `idx_devoluciones_compra_detalle_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_devcompradetalle_dev` FOREIGN KEY (`IdDevolucionCompra`) REFERENCES `devoluciones_compra` (`IdDevolucionCompra`),
  CONSTRAINT `fk_devcompradetalle_producto` FOREIGN KEY (`IdProducto`) REFERENCES `productos` (`IdProducto`),
  CONSTRAINT `fk_devoluciones_compra_detalle_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devoluciones_venta` (
  `IdDevolucionVenta` bigint NOT NULL AUTO_INCREMENT,
  `Numero` varchar(50) NOT NULL,
  `IdVenta` bigint NOT NULL,
  `IdCliente` int DEFAULT NULL,
  `IdBodega` int NOT NULL,
  `Fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Estado` enum('BORRADOR','CONFIRMADA','ANULADA') NOT NULL DEFAULT 'BORRADOR',
  `Observaciones` varchar(500) DEFAULT NULL,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdConfirmacion` int DEFAULT NULL,
  `FechaConfirmacion` datetime DEFAULT NULL,
  `UsuarioIdAnulacion` int DEFAULT NULL,
  `FechaAnulacion` datetime DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdDevolucionVenta`),
  UNIQUE KEY `uk_devventa_numero` (`Numero`),
  KEY `ix_devventa_venta` (`IdVenta`),
  KEY `ix_devventa_bodega` (`IdBodega`),
  KEY `idx_devoluciones_venta_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_devoluciones_venta_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`),
  CONSTRAINT `fk_devventa_bodega` FOREIGN KEY (`IdBodega`) REFERENCES `bodegas` (`Id`),
  CONSTRAINT `fk_devventa_venta` FOREIGN KEY (`IdVenta`) REFERENCES `ventas` (`IdVenta`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `devoluciones_venta_detalle` (
  `IdDevolucionVentaDetalle` bigint NOT NULL AUTO_INCREMENT,
  `IdDevolucionVenta` bigint NOT NULL,
  `IdProducto` int NOT NULL,
  `Cantidad` decimal(18,4) NOT NULL,
  `CostoUnitario` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `PrecioUnitario` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `Total` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdDevolucionVentaDetalle`),
  KEY `ix_devventadetalle_dev` (`IdDevolucionVenta`),
  KEY `ix_devventadetalle_producto` (`IdProducto`),
  KEY `idx_devoluciones_venta_detalle_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_devoluciones_venta_detalle_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`),
  CONSTRAINT `fk_devventadetalle_dev` FOREIGN KEY (`IdDevolucionVenta`) REFERENCES `devoluciones_venta` (`IdDevolucionVenta`),
  CONSTRAINT `fk_devventadetalle_producto` FOREIGN KEY (`IdProducto`) REFERENCES `productos` (`IdProducto`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `diagnosticos` (
  `IdDiagnostico` int NOT NULL AUTO_INCREMENT,
  `IdHistoriaClinica` int NOT NULL,
  `Diagnostico` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `CodigoDiagnostico` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TipoDiagnostico` enum('Presuntivo','Definitivo','Diferencial') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Presuntivo',
  `Observaciones` text COLLATE utf8mb4_unicode_ci,
  `FechaCreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdDiagnostico`),
  KEY `fk_diagnosticos_usuario` (`UsuarioIdCreacion`),
  KEY `idx_diagnosticos_historia` (`IdHistoriaClinica`),
  KEY `idx_diagnosticos_tipo` (`TipoDiagnostico`),
  KEY `idx_diagnosticos_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_diagnosticos_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`),
  CONSTRAINT `fk_diagnosticos_historia` FOREIGN KEY (`IdHistoriaClinica`) REFERENCES `historiasclinicas` (`IdHistoriaClinica`),
  CONSTRAINT `fk_diagnosticos_usuario` FOREIGN KEY (`UsuarioIdCreacion`) REFERENCES `usuarios` (`UsuarioId`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `diagnosticos` VALUES (1,3,'fdasfasdf','1212','Definitivo','sdfsdfsdf','2026-09-04 13:11:22',3,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `empresas` (
  `IdEmpresa` int NOT NULL AUTO_INCREMENT,
  `CodigoEmpresa` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Nit` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `RazonSocial` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NombreComercial` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TipoDocumento` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Direccion` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Correo` varchar(120) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `IdCiudad` int DEFAULT NULL,
  `Logo` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL COMMENT 'Ruta/URL del logo',
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  `UsaControlCaja` tinyint(1) NOT NULL DEFAULT '0' COMMENT 'Apertura y control de caja',
  `ControlExistencias` tinyint(1) NOT NULL DEFAULT '1',
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaModificacion` datetime DEFAULT NULL,
  `UsuarioIdModificacion` int DEFAULT NULL,
  `Contacto` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TelefonoContacto` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  PRIMARY KEY (`IdEmpresa`),
  UNIQUE KEY `uk_empresa_codigo` (`CodigoEmpresa`),
  UNIQUE KEY `uk_empresa_nit` (`Nit`),
  KEY `idx_empresa_activo` (`Activo`),
  KEY `idx_empresa_ciudad` (`IdCiudad`),
  KEY `fk_empresa_usuario_creacion` (`UsuarioIdCreacion`),
  KEY `fk_empresa_usuario_modificacion` (`UsuarioIdModificacion`),
  CONSTRAINT `fk_empresa_ciudad` FOREIGN KEY (`IdCiudad`) REFERENCES `ciudades` (`Id`),
  CONSTRAINT `fk_empresa_usuario_creacion` FOREIGN KEY (`UsuarioIdCreacion`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `fk_empresa_usuario_modificacion` FOREIGN KEY (`UsuarioIdModificacion`) REFERENCES `usuarios` (`UsuarioId`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `empresas` VALUES (1,'EMP001','900123456-7','Veterinaria Los Amigos SAS','Veterinaria Los Amigos','NIT','Calle 1 # 2-3','3001234567','contacto@losamigos.com',1,NULL,1,1,1,'2026-09-04 18:20:09',NULL,'2026-09-05 16:54:09',NULL,'PEPE PAEZ','99889898787788'),(2,'EMP002','901234567-8','Veterinaria Pruebas SAS','Vet Pruebas','NIT','Calle Test 123','3100000000','contacto@vetpruebas.com',1,NULL,1,1,1,'2026-09-06 08:49:49',NULL,NULL,NULL,'CLIENTE TEST','3110000000');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `examenfisico` (
  `IdExamenFisico` int NOT NULL AUTO_INCREMENT,
  `IdHistoriaClinica` int NOT NULL,
  `EstadoGeneral` text COLLATE utf8mb4_unicode_ci,
  `Cabeza` text COLLATE utf8mb4_unicode_ci,
  `Ojos` text COLLATE utf8mb4_unicode_ci,
  `Oidos` text COLLATE utf8mb4_unicode_ci,
  `Nariz` text COLLATE utf8mb4_unicode_ci,
  `Boca` text COLLATE utf8mb4_unicode_ci,
  `Cuello` text COLLATE utf8mb4_unicode_ci,
  `SistemaRespiratorio` text COLLATE utf8mb4_unicode_ci,
  `SistemaCardiovascular` text COLLATE utf8mb4_unicode_ci,
  `Abdomen` text COLLATE utf8mb4_unicode_ci,
  `SistemaDigestivo` text COLLATE utf8mb4_unicode_ci,
  `SistemaUrinario` text COLLATE utf8mb4_unicode_ci,
  `SistemaReproductivo` text COLLATE utf8mb4_unicode_ci,
  `SistemaMusculoesqueletico` text COLLATE utf8mb4_unicode_ci,
  `PielYPelaje` text COLLATE utf8mb4_unicode_ci,
  `SistemaNeurologico` text COLLATE utf8mb4_unicode_ci,
  `Ganglios` text COLLATE utf8mb4_unicode_ci,
  `OtrosHallazgos` text COLLATE utf8mb4_unicode_ci,
  `ObservacionesGenerales` text COLLATE utf8mb4_unicode_ci,
  `FechaCreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdExamenFisico`),
  KEY `idx_examenfisico_historia` (`IdHistoriaClinica`),
  KEY `idx_examenfisico_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_examenfisico_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`),
  CONSTRAINT `fk_examenfisico_historia` FOREIGN KEY (`IdHistoriaClinica`) REFERENCES `historiasclinicas` (`IdHistoriaClinica`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historial_suscripciones` (
  `IdHistorial` bigint NOT NULL AUTO_INCREMENT,
  `IdSuscripcion` int NOT NULL,
  `IdEmpresa` int NOT NULL,
  `PlanAnterior` int DEFAULT NULL,
  `PlanNuevo` int NOT NULL,
  `EstadoAnterior` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `EstadoNuevo` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `PrecioAnterior` decimal(18,2) DEFAULT NULL,
  `PrecioNuevo` decimal(18,2) DEFAULT NULL,
  `Motivo` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `UsuarioId` int DEFAULT NULL,
  `FechaCambio` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdHistorial`),
  KEY `idx_hs_suscripcion` (`IdSuscripcion`),
  KEY `idx_hs_empresa` (`IdEmpresa`),
  KEY `idx_hs_fecha` (`FechaCambio`),
  KEY `fk_histsus_plan_anterior` (`PlanAnterior`),
  KEY `fk_histsus_plan_nuevo` (`PlanNuevo`),
  KEY `fk_histsus_usuario` (`UsuarioId`),
  CONSTRAINT `fk_histsus_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`),
  CONSTRAINT `fk_histsus_plan_anterior` FOREIGN KEY (`PlanAnterior`) REFERENCES `planes` (`IdPlan`),
  CONSTRAINT `fk_histsus_plan_nuevo` FOREIGN KEY (`PlanNuevo`) REFERENCES `planes` (`IdPlan`),
  CONSTRAINT `fk_histsus_suscripcion` FOREIGN KEY (`IdSuscripcion`) REFERENCES `suscripciones` (`IdSuscripcion`),
  CONSTRAINT `fk_histsus_usuario` FOREIGN KEY (`UsuarioId`) REFERENCES `usuarios` (`UsuarioId`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RF-MON-012: historial de cambios de suscripci├│n';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `historial_suscripciones` VALUES (1,1,1,2,3,'PRUEBA','PRUEBA',399000.00,799000.00,'E2E upgrade',8,'2026-09-05 15:42:32'),(2,1,1,3,2,'PRUEBA','PRUEBA',799000.00,399000.00,'E2E downgrade',8,'2026-09-05 15:42:32'),(3,1,1,2,3,'PRUEBA','PRUEBA',399000.00,799000.00,'E2E upgrade',8,'2026-09-05 15:42:57'),(4,1,1,3,2,'PRUEBA','PRUEBA',799000.00,399000.00,'E2E downgrade',8,'2026-09-05 15:42:57');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `historiasclinicas` (
  `IdHistoriaClinica` int NOT NULL AUTO_INCREMENT,
  `IdCita` int DEFAULT NULL,
  `IdMascota` int NOT NULL,
  `IdVeterinario` int NOT NULL,
  `FechaAtencion` datetime NOT NULL,
  `MotivoConsulta` text COLLATE utf8mb4_unicode_ci NOT NULL,
  `EnfermedadActual` text COLLATE utf8mb4_unicode_ci,
  `Observaciones` text COLLATE utf8mb4_unicode_ci,
  `Estado` enum('Abierta','En curso','Cerrada','Alta') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Abierta',
  `FechaCreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaModificacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `UsuarioIdModificacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdHistoriaClinica`),
  KEY `fk_historia_cita` (`IdCita`),
  KEY `fk_historia_usuario_creacion` (`UsuarioIdCreacion`),
  KEY `fk_historia_usuario_modificacion` (`UsuarioIdModificacion`),
  KEY `idx_historia_mascota` (`IdMascota`),
  KEY `idx_historia_veterinario` (`IdVeterinario`),
  KEY `idx_historia_fecha` (`FechaAtencion`),
  KEY `idx_historia_estado` (`Estado`),
  KEY `idx_historiasclinicas_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_historia_cita` FOREIGN KEY (`IdCita`) REFERENCES `citas` (`IdCita`),
  CONSTRAINT `fk_historia_mascota` FOREIGN KEY (`IdMascota`) REFERENCES `mascotas` (`IdMascota`),
  CONSTRAINT `fk_historia_usuario_creacion` FOREIGN KEY (`UsuarioIdCreacion`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `fk_historia_usuario_modificacion` FOREIGN KEY (`UsuarioIdModificacion`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `fk_historia_veterinario` FOREIGN KEY (`IdVeterinario`) REFERENCES `veterinarios` (`IdVeterinario`),
  CONSTRAINT `fk_historiasclinicas_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `historiasclinicas` VALUES (3,4,3,7,'2026-09-04 15:07:00','dfgdfgdfg',NULL,'dsfgdsfgdsfg','Abierta','2026-09-04 13:10:58',3,'2026-09-05 17:23:01',NULL,1),(4,5,3,6,'2026-09-17 12:13:00','con cancha',NULL,'hay que vacunas','Abierta','2026-09-07 09:56:20',3,'2026-09-07 09:56:20',NULL,1),(5,6,3,7,'2026-09-16 14:33:00','dgdf',NULL,'dfsgdsfgdsfg','Abierta','2026-09-07 12:25:20',3,'2026-09-07 12:25:20',NULL,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `inventario` (
  `IdInventario` bigint NOT NULL AUTO_INCREMENT,
  `IdProducto` int NOT NULL,
  `IdBodega` int NOT NULL,
  `IdLote` int DEFAULT NULL,
  `Cantidad` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `CostoPromedio` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `CostoTotal` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `FechaUltimoMovimiento` datetime DEFAULT NULL,
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdInventario`),
  UNIQUE KEY `uk_inventario_prod_bod` (`IdProducto`,`IdBodega`),
  KEY `ix_inventario_bodega` (`IdBodega`),
  KEY `ix_inventario_lote` (`IdLote`),
  KEY `idx_inventario_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_inventario_bodega` FOREIGN KEY (`IdBodega`) REFERENCES `bodegas` (`Id`),
  CONSTRAINT `fk_inventario_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`),
  CONSTRAINT `fk_inventario_lote` FOREIGN KEY (`IdLote`) REFERENCES `lotes` (`IdLote`),
  CONSTRAINT `fk_inventario_producto` FOREIGN KEY (`IdProducto`) REFERENCES `productos` (`IdProducto`)
) ENGINE=InnoDB AUTO_INCREMENT=61 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `inventario` VALUES (5,7,5,NULL,60.0000,12000.0000,720000.0000,'2026-09-06 09:42:54',1,2),(6,8,5,NULL,20.0000,150000.0000,3000000.0000,'2026-09-06 08:49:50',1,2),(7,9,5,NULL,150.0000,1200.0000,180000.0000,'2026-09-06 08:49:50',1,2),(10,1,4,NULL,85.0000,5622.7451,477933.3330,'2026-09-12 09:55:04',1,1),(11,10,4,NULL,97.0000,77.3814,7506.0000,'2026-09-12 11:30:53',1,1),(12,11,4,NULL,125.0000,49.4400,6180.0000,'2026-09-12 11:30:53',1,1),(13,12,4,NULL,76.0000,42.6842,3244.0000,'2026-09-12 11:30:53',1,1),(14,13,4,NULL,39.0000,27.0000,1053.0000,'2026-09-12 11:10:53',1,1),(15,14,4,NULL,52.0000,62.0000,3224.0000,'2026-09-12 11:10:53',1,1),(16,15,4,NULL,65.0000,57.0000,3705.0000,'2026-09-12 11:10:53',1,1),(17,16,4,NULL,78.0000,72.0000,5616.0000,'2026-09-12 11:10:53',1,1),(18,17,4,NULL,91.0000,2.7000,245.7000,'2026-09-12 11:10:54',1,1),(19,18,4,NULL,27.0000,2.5000,67.5000,'2026-09-12 11:10:54',1,1),(20,19,4,NULL,40.0000,13.0000,520.0000,'2026-09-12 11:10:54',1,1),(21,20,4,NULL,53.0000,16.0000,848.0000,'2026-09-12 11:10:54',1,1),(22,21,4,NULL,66.0000,18.0000,1188.0000,'2026-09-12 11:10:54',1,1),(23,22,4,NULL,79.0000,10.5000,829.5000,'2026-09-12 11:10:54',1,1),(24,23,4,NULL,92.0000,20.0000,1840.0000,'2026-09-12 11:10:55',1,1),(25,24,4,NULL,28.0000,33.0000,924.0000,'2026-09-12 11:10:55',1,1),(26,25,4,NULL,41.0000,22.0000,902.0000,'2026-09-12 11:10:55',1,1),(27,26,4,NULL,54.0000,11.5000,621.0000,'2026-09-12 11:10:55',1,1),(28,27,4,NULL,67.0000,8.5000,569.5000,'2026-09-12 11:10:55',1,1),(29,28,4,NULL,80.0000,14.0000,1120.0000,'2026-09-12 11:10:55',1,1),(30,29,4,NULL,93.0000,17.0000,1581.0000,'2026-09-12 11:10:55',1,1),(31,30,4,NULL,29.0000,25.0000,725.0000,'2026-09-12 11:10:55',1,1),(32,31,4,NULL,42.0000,20.0000,840.0000,'2026-09-12 11:10:56',1,1),(33,32,4,NULL,55.0000,13.0000,715.0000,'2026-09-12 11:10:56',1,1),(34,33,4,NULL,68.0000,10.0000,680.0000,'2026-09-12 11:10:56',1,1),(35,34,4,NULL,81.0000,16.0000,1296.0000,'2026-09-12 11:10:56',1,1),(36,35,4,NULL,94.0000,19.0000,1786.0000,'2026-09-12 11:10:56',1,1),(37,36,4,NULL,30.0000,12.0000,360.0000,'2026-09-12 11:10:56',1,1),(38,37,4,NULL,43.0000,16.0000,688.0000,'2026-09-12 11:10:57',1,1),(39,38,4,NULL,56.0000,8.5000,476.0000,'2026-09-12 11:10:57',1,1),(40,39,4,NULL,69.0000,11.0000,759.0000,'2026-09-12 11:10:57',1,1),(41,40,4,NULL,82.0000,9.5000,779.0000,'2026-09-12 11:10:57',1,1),(42,41,4,NULL,95.0000,10.5000,997.5000,'2026-09-12 11:10:57',1,1),(43,42,4,NULL,31.0000,9.0000,279.0000,'2026-09-12 11:10:57',1,1),(44,43,4,NULL,44.0000,17.0000,748.0000,'2026-09-12 11:10:58',1,1),(45,44,4,NULL,57.0000,20.0000,1140.0000,'2026-09-12 11:10:58',1,1),(46,45,4,NULL,70.0000,16.0000,1120.0000,'2026-09-12 11:10:58',1,1),(47,46,4,NULL,83.0000,7.0000,581.0000,'2026-09-12 11:10:58',1,1),(48,47,4,NULL,96.0000,5.5000,528.0000,'2026-09-12 11:10:58',1,1),(49,48,4,NULL,30.0000,33.0000,990.0000,'2026-09-13 10:58:10',1,1),(50,49,4,NULL,45.0000,13.0000,585.0000,'2026-09-12 11:10:58',1,1),(51,50,4,NULL,58.0000,22.0000,1276.0000,'2026-09-12 11:10:58',1,1),(52,51,4,NULL,71.0000,18.0000,1278.0000,'2026-09-12 11:10:58',1,1),(53,52,4,NULL,84.0000,15.0000,1260.0000,'2026-09-12 11:10:58',1,1),(54,53,4,NULL,147.0000,10.8299,1592.0000,'2026-09-12 11:33:11',1,1),(55,54,4,NULL,33.0000,4.3000,141.9000,'2026-09-12 11:10:59',1,1),(56,55,4,NULL,46.0000,6.5000,299.0000,'2026-09-12 11:10:59',1,1),(57,56,4,NULL,59.0000,16.0000,944.0000,'2026-09-12 11:10:59',1,1),(58,57,4,NULL,172.0000,5.7093,982.0000,'2026-09-12 11:33:11',1,1),(59,58,4,NULL,85.0000,8.5000,722.5000,'2026-09-12 11:10:59',1,1),(60,59,4,NULL,98.0000,30.0000,2940.0000,'2026-09-12 11:10:59',1,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `kardex` (
  `IdKardex` bigint NOT NULL AUTO_INCREMENT,
  `Fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `IdProducto` int NOT NULL,
  `IdBodega` int NOT NULL,
  `IdLote` int DEFAULT NULL,
  `TipoMovimiento` enum('INVENTARIO_INICIAL','COMPRA','ENTRADA','VENTA','SALIDA','AJUSTE_POSITIVO','AJUSTE_NEGATIVO','DEVOLUCION_COMPRA','DEVOLUCION_VENTA','TRASLADO_ENTRADA','TRASLADO_SALIDA','CONSUMO_INTERNO','OTRO') NOT NULL,
  `DocumentoTipo` varchar(30) NOT NULL,
  `IdDocumento` bigint DEFAULT NULL,
  `EntradaCantidad` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `EntradaCostoUnitario` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `EntradaCostoTotal` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `SalidaCantidad` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `SalidaCostoUnitario` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `SalidaCostoTotal` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `SaldoCantidad` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `CostoPromedio` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `SaldoValor` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `UsuarioId` int DEFAULT NULL,
  `Observaciones` varchar(500) DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdKardex`),
  KEY `ix_kardex_prod_bod_fecha` (`IdProducto`,`IdBodega`,`Fecha`),
  KEY `ix_kardex_documento` (`DocumentoTipo`,`IdDocumento`),
  KEY `ix_kardex_tipo` (`TipoMovimiento`),
  KEY `ix_kardex_lote` (`IdLote`),
  KEY `fk_kardex_bodega` (`IdBodega`),
  KEY `idx_kardex_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_kardex_bodega` FOREIGN KEY (`IdBodega`) REFERENCES `bodegas` (`Id`),
  CONSTRAINT `fk_kardex_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`),
  CONSTRAINT `fk_kardex_lote` FOREIGN KEY (`IdLote`) REFERENCES `lotes` (`IdLote`),
  CONSTRAINT `fk_kardex_producto` FOREIGN KEY (`IdProducto`) REFERENCES `productos` (`IdProducto`)
) ENGINE=InnoDB AUTO_INCREMENT=55 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `kardex` VALUES (6,'2026-09-06 08:58:56',7,5,NULL,'VENTA','VENTA',10,0.0000,0.0000,0.0000,2.0000,12000.0000,24000.0000,-2.0000,12000.0000,-24000.0000,16,'Salida por venta confirmada',2),(7,'2026-09-06 08:58:57',7,5,NULL,'OTRO','VENTA',10,2.0000,12000.0000,24000.0000,0.0000,0.0000,0.0000,0.0000,12000.0000,0.0000,16,'prueba multitempresa',2),(8,'2026-09-06 09:12:02',7,5,NULL,'VENTA','VENTA',12,0.0000,0.0000,0.0000,1.0000,12000.0000,12000.0000,-1.0000,12000.0000,-12000.0000,16,'Salida por venta confirmada',2),(9,'2026-09-06 09:12:02',7,5,NULL,'OTRO','VENTA',12,1.0000,12000.0000,12000.0000,0.0000,0.0000,0.0000,0.0000,12000.0000,0.0000,16,'probar control dia',2),(10,'2026-09-06 09:42:53',7,5,NULL,'VENTA','VENTA',16,0.0000,0.0000,0.0000,1.0000,12000.0000,12000.0000,-1.0000,12000.0000,-12000.0000,16,'Salida por venta confirmada',2),(11,'2026-09-06 09:42:54',7,5,NULL,'OTRO','VENTA',16,1.0000,12000.0000,12000.0000,0.0000,0.0000,0.0000,0.0000,12000.0000,0.0000,16,'limpia',2),(16,'2026-09-06 10:20:51',1,4,NULL,'COMPRA','COMPRA',3,2.0000,20000.0000,40000.0000,0.0000,0.0000,0.0000,2.0000,20000.0000,40000.0000,3,'Entrada por compra confirmada',1),(17,'2026-09-06 10:20:51',1,4,NULL,'OTRO','COMPRA',3,0.0000,0.0000,0.0000,2.0000,20000.0000,40000.0000,0.0000,0.0000,0.0000,3,'test',1),(20,'2026-09-06 10:26:44',1,4,NULL,'COMPRA','COMPRA',5,2.0000,20000.0000,40000.0000,0.0000,0.0000,0.0000,2.0000,20000.0000,40000.0000,3,'Entrada por compra confirmada',1),(21,'2026-09-06 10:26:45',1,4,NULL,'OTRO','COMPRA',5,0.0000,0.0000,0.0000,2.0000,20000.0000,40000.0000,0.0000,0.0000,0.0000,3,'smoke',1),(22,'2026-09-06 10:26:45',1,4,NULL,'COMPRA','COMPRA',6,2.0000,20000.0000,40000.0000,0.0000,0.0000,0.0000,2.0000,20000.0000,40000.0000,3,'Entrada por compra confirmada',1),(34,'2026-09-06 10:28:51',1,4,NULL,'COMPRA','COMPRA',15,1.0000,10000.0000,10000.0000,0.0000,0.0000,0.0000,3.0000,16666.6667,50000.0000,3,'Entrada por compra confirmada',1),(35,'2026-09-06 10:28:51',1,4,NULL,'OTRO','COMPRA',15,0.0000,0.0000,0.0000,1.0000,10000.0000,10000.0000,2.0000,20000.0001,40000.0001,3,'fin',1),(36,'2026-09-06 10:28:51',1,4,NULL,'COMPRA','COMPRA',16,3.0000,5000.0000,15000.0000,0.0000,0.0000,0.0000,5.0000,11000.0000,55000.0002,3,'Entrada por compra confirmada',1),(37,'2026-09-06 10:28:51',1,4,NULL,'OTRO','COMPRA',16,0.0000,0.0000,0.0000,3.0000,5000.0000,15000.0000,2.0000,20000.0000,40000.0000,3,'fin',1),(38,'2026-09-06 10:28:51',1,4,NULL,'COMPRA','COMPRA',17,6.0000,5000.0000,30000.0000,0.0000,0.0000,0.0000,8.0000,8750.0000,70000.0000,3,'Entrada por compra confirmada',1),(39,'2026-09-06 10:28:51',1,4,NULL,'OTRO','COMPRA',17,0.0000,0.0000,0.0000,6.0000,5000.0000,30000.0000,2.0000,20000.0000,40000.0000,3,'fin',1),(41,'2026-09-06 10:32:58',1,4,NULL,'VENTA','VENTA',15,0.0000,0.0000,0.0000,1.0000,20000.0000,20000.0000,1.0000,20000.0000,20000.0000,3,'Salida por venta confirmada',1),(42,'2026-09-07 11:37:52',1,4,NULL,'VENTA','VENTA',28,0.0000,0.0000,0.0000,1.0000,20000.0000,20000.0000,0.0000,20000.0000,0.0000,3,'Salida por venta confirmada',1),(43,'2026-09-07 13:33:47',1,4,NULL,'COMPRA','COMPRA',20,5.0000,5500.0000,27500.0000,0.0000,0.0000,0.0000,5.0000,5500.0000,27500.0000,3,'Entrada por compra confirmada',1),(44,'2026-09-07 13:34:52',1,4,NULL,'COMPRA','COMPRA',21,10.0000,5600.0000,56000.0000,0.0000,0.0000,0.0000,15.0000,5566.6667,83500.0000,3,'Entrada por compra confirmada',1),(45,'2026-09-07 13:35:32',1,4,NULL,'VENTA','VENTA',31,0.0000,0.0000,0.0000,1.0000,5566.6667,5566.6667,14.0000,5566.6667,77933.3338,3,'Salida por venta confirmada',1),(46,'2026-09-08 11:25:32',1,4,NULL,'COMPRA','COMPRA',23,20.0000,5500.0000,110000.0000,0.0000,0.0000,0.0000,34.0000,5527.4510,187933.3338,3,'Entrada por compra confirmada',1),(47,'2026-09-10 16:02:53',1,4,NULL,'COMPRA','COMPRA',25,1.0000,0.0000,0.0000,0.0000,0.0000,0.0000,35.0000,5369.5238,187933.3340,3,'Entrada por compra confirmada',1),(48,'2026-09-12 09:55:04',1,4,NULL,'COMPRA','COMPRA',26,50.0000,5800.0000,290000.0000,0.0000,0.0000,0.0000,85.0000,5622.7451,477933.3330,3,'Entrada por compra confirmada',1),(49,'2026-09-12 11:30:53',10,4,NULL,'INVENTARIO_INICIAL','INVENTARIO_INICIAL',NULL,20.0000,75.0000,1500.0000,0.0000,0.0000,0.0000,20.0000,77.3814,1547.6289,3,'Inventario inicial del sistema',1),(50,'2026-09-12 11:30:53',11,4,NULL,'INVENTARIO_INICIAL','INVENTARIO_INICIAL',NULL,35.0000,48.0000,1680.0000,0.0000,0.0000,0.0000,35.0000,49.4400,1730.4000,3,'Inventario inicial del sistema',1),(51,'2026-09-12 11:30:53',12,4,NULL,'INVENTARIO_INICIAL','INVENTARIO_INICIAL',NULL,50.0000,42.0000,2100.0000,0.0000,0.0000,0.0000,50.0000,42.6842,2134.2105,3,'Inventario inicial del sistema',1),(52,'2026-09-12 11:33:11',53,4,NULL,'INVENTARIO_INICIAL','INVENTARIO_INICIAL',NULL,50.0000,10.5000,525.0000,0.0000,0.0000,0.0000,50.0000,10.8299,541.4966,3,'Inventario inicial del sistema',1),(53,'2026-09-12 11:33:11',57,4,NULL,'INVENTARIO_INICIAL','INVENTARIO_INICIAL',NULL,100.0000,5.5000,550.0000,0.0000,0.0000,0.0000,100.0000,5.7093,570.9302,3,'Inventario inicial del sistema',1),(54,'2026-09-13 10:58:10',48,4,NULL,'VENTA','VENTA',33,0.0000,0.0000,0.0000,2.0000,33.0000,66.0000,-2.0000,33.0000,-66.0000,19,'Salida por venta confirmada',1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `logmodificaciones` (
  `IdLog` int NOT NULL AUTO_INCREMENT,
  `Tabla` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `IdRegistro` int NOT NULL,
  `TipoOperacion` enum('INSERT','UPDATE','DELETE') COLLATE utf8mb4_unicode_ci NOT NULL,
  `DatosAnteriores` json DEFAULT NULL,
  `DatosNuevos` json DEFAULT NULL,
  `UsuarioId` int DEFAULT NULL,
  `FechaOperacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `DireccionIP` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL COMMENT 'Empresa propietaria',
  PRIMARY KEY (`IdLog`),
  KEY `idx_log_tabla` (`Tabla`),
  KEY `idx_log_registro` (`IdRegistro`),
  KEY `idx_log_fecha` (`FechaOperacion`),
  KEY `idx_log_usuario` (`UsuarioId`),
  KEY `ix_logmodificaciones_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_log_usuario` FOREIGN KEY (`UsuarioId`) REFERENCES `usuarios` (`UsuarioId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `lotes` (
  `IdLote` int NOT NULL AUTO_INCREMENT,
  `IdProducto` int NOT NULL,
  `NumeroLote` varchar(100) NOT NULL,
  `FechaFabricacion` date DEFAULT NULL,
  `FechaVencimiento` date DEFAULT NULL,
  `CantidadInicial` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `CantidadActual` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `CostoUnitario` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdLote`),
  KEY `ix_lote_producto` (`IdProducto`),
  KEY `ix_lote_vencimiento` (`FechaVencimiento`),
  KEY `idx_lotes_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_lote_producto` FOREIGN KEY (`IdProducto`) REFERENCES `productos` (`IdProducto`),
  CONSTRAINT `fk_lotes_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `marcas` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(100) NOT NULL,
  `Descripcion` varchar(300) DEFAULT NULL,
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaModificacion` datetime DEFAULT NULL,
  `UsuarioIdModificacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL COMMENT 'Empresa propietaria',
  PRIMARY KEY (`Id`),
  UNIQUE KEY `uk_marca_nombre` (`Nombre`),
  KEY `ix_marcas_idempresa` (`IdEmpresa`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `marcas` VALUES (1,'Royal Canin','Alimentos y nutrici├│n veterinaria',1,'2026-09-04 16:32:58',NULL,NULL,NULL,1),(2,'Hill\'s','Nutrici├│n cl├¡nica veterinaria',1,'2026-09-04 16:32:58',NULL,NULL,NULL,1),(3,'Bayer','Productos farmac├®uticos veterinarios',1,'2026-09-04 16:32:58',NULL,NULL,NULL,1),(4,'Virbac','Productos farmac├®uticos y dermatolog├¡a',1,'2026-09-04 16:32:58',NULL,NULL,NULL,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `mascotas` (
  `IdMascota` int NOT NULL AUTO_INCREMENT,
  `ClienteId` int NOT NULL,
  `Nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Especie` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Raza` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Sexo` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `FechaNacimiento` date DEFAULT NULL,
  `Color` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Peso` decimal(8,2) DEFAULT NULL,
  `Microchip` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Esterilizado` tinyint(1) NOT NULL DEFAULT '0',
  `Observaciones` varchar(1000) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int NOT NULL,
  `FechaModificacion` datetime DEFAULT NULL,
  `UsuarioIdModificacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdMascota`),
  KEY `FK_Mascotas_Clientes` (`ClienteId`),
  KEY `FK_Mascotas_UsuarioCreacion` (`UsuarioIdCreacion`),
  KEY `FK_Mascotas_UsuarioModificacion` (`UsuarioIdModificacion`),
  KEY `idx_mascotas_idempresa` (`IdEmpresa`),
  CONSTRAINT `FK_Mascotas_Clientes` FOREIGN KEY (`ClienteId`) REFERENCES `clientes` (`ClienteId`),
  CONSTRAINT `fk_mascotas_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`),
  CONSTRAINT `FK_Mascotas_UsuarioCreacion` FOREIGN KEY (`UsuarioIdCreacion`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `FK_Mascotas_UsuarioModificacion` FOREIGN KEY (`UsuarioIdModificacion`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `CK_Mascotas_Peso` CHECK (((`Peso` is null) or (`Peso` > 0)))
) ENGINE=InnoDB AUTO_INCREMENT=4 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `mascotas` VALUES (1,1,'Mailo','Perro','sdfsdf','Macho','2026-04-16','sdfs',3.00,'24234',1,'dfgdfg',1,'2026-08-21 12:51:03',3,NULL,NULL,1),(2,1,'luna','Gato','wfwfwef','Hembra',NULL,'nnnn',2.00,'3333',1,'fdsvdv dgdfgdfg',1,'2026-08-31 17:26:08',3,'2026-09-04 11:43:38',NULL,1),(3,1,'elfiru','Perro','de la calle','Macho','2026-09-02','negro',6.00,'323434',1,'sdfsdf',1,'2026-09-04 12:23:33',3,NULL,NULL,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `modulos` (
  `idModulos` int NOT NULL AUTO_INCREMENT,
  `Codigo` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NombreModulo` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Descripcion` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Ruta` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Icono` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Orden` int DEFAULT NULL,
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`idModulos`),
  UNIQUE KEY `uk_modulos_codigo` (`Codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=59 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `modulos` VALUES (1,'MOD_1','Citas',NULL,NULL,NULL,NULL,1),(2,'MOD_2','Inventario',NULL,NULL,NULL,NULL,1),(3,'MOD_3','Ventas',NULL,NULL,NULL,NULL,1),(4,'SEGURIDAD','Seguridad','Usuarios, roles y permisos','/dashboard/seguridad','­ƒöÉ',1,1),(5,'EMPRESAS','Empresas','Mantenimiento de empresas','/dashboard/empresas','­ƒÅó',2,1),(6,'USUARIOS','Usuarios','Gesti├│n de usuarios','/dashboard/usuarios','­ƒæñ',3,1),(7,'CLIENTES','Clientes','Gesti├│n de clientes','/dashboard/clientes','­ƒæÑ',4,1),(8,'MASCOTAS','Mascotas','Gesti├│n de mascotas','/dashboard/mascotas','­ƒÉ¥',5,1),(9,'VETERINARIOS','Veterinarios','Gesti├│n de veterinarios','/dashboard/veterinarios','­ƒæ¿ÔÇìÔÜò´©Å',6,1),(10,'CITAS','Citas','Agenda de citas','/dashboard/citas','­ƒôà',7,1),(11,'HISTORIA_CLINICA','Historia Cl├¡nica','Historias cl├¡nicas','/dashboard/historiaclinica','­ƒôï',8,1),(12,'SERVICIOS','Servicios','Cat├ílogo de servicios','/dashboard/servicios','­ƒ®║',9,1),(13,'PRODUCTOS','Productos','Cat├ílogo de productos','/dashboard/productos','­ƒôª',10,1),(14,'BODEGAS','Bodegas','Gesti├│n de bodegas','/dashboard/bodegas','­ƒÅ¼',11,1),(15,'INVENTARIOS','Inventarios','Existencias y movimientos','/dashboard/inventario','­ƒôè',12,1),(16,'COMPRAS','Compras','├ôrdenes de compra','/dashboard/compras','­ƒøÆ',13,1),(17,'VENTAS','Ventas','Ventas, estados y anulaciones','/dashboard/ventas','­ƒº¥',14,1),(18,'CAJA','Caja','Arqueo y caja','/dashboard/caja','­ƒÆ░',15,1),(19,'REPORTES','Reportes','Reportes e indicadores','/dashboard/reportes','­ƒôê',16,1),(20,'AUDITORIA','Auditor├¡a','Trazabilidad de operaciones','/dashboard/auditoria','­ƒòÁ´©Å',17,1),(21,'TIPOS_PAGO','Tipos de Pago','Medios de pago de ventas','/dashboard/tipos-pago','­ƒÆ│',16,1),(22,'FACTURACION','Facturaci├│n de Servicios','Permite facturar el servicio de una cita/consulta',NULL,'­ƒº¥',16,1),(55,'PLANES','Planes','Administraci├│n comercial de planes','/dashboard/planes','pricing',18,1),(56,'SUSCRIPCIONES','Suscripciones','Suscripciones de las empresas','/dashboard/suscripciones','subscriptions',19,1),(57,'MI_PLAN','Mi Plan','Plan y consumo de la empresa','/dashboard/mi-plan','business',20,1),(58,'PROVEEDORES','Proveedores','Administraci├│n de proveedores','/dashboard/proveedores','­ƒÜÜ',14,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagos_compras` (
  `IdPagoCompra` bigint NOT NULL AUTO_INCREMENT,
  `IdCompra` bigint NOT NULL,
  `IdEmpresa` int NOT NULL,
  `NumeroCuota` int NOT NULL DEFAULT '1',
  `ValorCuota` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `SaldoPendiente` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `FechaVencimiento` date DEFAULT NULL,
  `Estado` enum('PENDIENTE','PAGADA','CANCELADA') NOT NULL DEFAULT 'PENDIENTE',
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaCreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `FechaPagoCompleto` datetime DEFAULT NULL,
  PRIMARY KEY (`IdPagoCompra`),
  KEY `idx_pc_compra` (`IdCompra`),
  KEY `idx_pc_empresa` (`IdEmpresa`),
  CONSTRAINT `fk_pc_compra` FOREIGN KEY (`IdCompra`) REFERENCES `compras` (`IdCompra`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `pagos_compras` VALUES (5,6,1,1,15000.0000,5000.0000,NULL,'PENDIENTE',3,'2026-09-06 10:26:45',NULL),(9,16,1,1,5000.0000,0.0000,NULL,'PAGADA',3,'2026-09-06 10:28:51','2026-09-06 10:28:52'),(10,17,1,1,10000.0000,0.0000,NULL,'PAGADA',3,'2026-09-06 10:28:51','2026-09-06 10:28:52'),(11,17,1,2,15000.0000,15000.0000,NULL,'CANCELADA',3,'2026-09-06 10:28:51',NULL),(12,23,1,1,1080000.0000,1080000.0000,'2026-09-15','PENDIENTE',3,'2026-09-08 11:25:32',NULL),(13,26,1,1,135000.0000,135000.0000,'2026-09-23','PENDIENTE',3,'2026-09-12 09:55:04',NULL),(14,26,1,2,135000.0000,135000.0000,'2026-09-30','PENDIENTE',3,'2026-09-12 09:55:04',NULL);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `pagos_compras_abonos` (
  `IdAbono` bigint NOT NULL AUTO_INCREMENT,
  `IdPagoCompra` bigint NOT NULL,
  `IdCompra` bigint NOT NULL,
  `IdEmpresa` int NOT NULL,
  `ValorAbono` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `FechaAbono` datetime DEFAULT CURRENT_TIMESTAMP,
  `IdCajaMov` int DEFAULT NULL,
  `MetodoCaja` tinyint(1) NOT NULL DEFAULT '0',
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaCreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdAbono`),
  KEY `idx_pca_pagocompra` (`IdPagoCompra`),
  KEY `idx_pca_compra` (`IdCompra`),
  KEY `idx_pca_empresa` (`IdEmpresa`),
  CONSTRAINT `fk_pca_pagocompra` FOREIGN KEY (`IdPagoCompra`) REFERENCES `pagos_compras` (`IdPagoCompra`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `pagos_compras_abonos` VALUES (3,5,6,1,10000.0000,'2026-09-06 10:26:45',31,1,3,'2026-09-06 10:26:45'),(6,9,16,1,5000.0000,'2026-09-06 10:28:51',42,1,3,'2026-09-06 10:28:51'),(7,10,17,1,8000.0000,'2026-09-06 10:28:51',45,1,3,'2026-09-06 10:28:51'),(8,10,17,1,2000.0000,'2026-09-06 10:28:51',NULL,0,3,'2026-09-06 10:28:51');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `parametrosseguridad` (
  `IdParametro` int NOT NULL AUTO_INCREMENT,
  `Codigo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Valor` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Descripcion` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`IdParametro`),
  UNIQUE KEY `uk_parametro_codigo` (`Codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pol├¡tica de contrase├▒as y bloqueo (RF-018/RF-019)';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `parametrosseguridad` VALUES (1,'MAX_INTENTOS_FALLIDOS','M├íximo de intentos fallidos','5','Intentos antes de bloquear el usuario',1),(2,'CLAVE_LONGITUD_MINIMA','Longitud m├¡nima de contrase├▒a','8','Cantidad m├¡nima de caracteres',1),(3,'CLAVE_MAYUSCULA','Requiere may├║scula','1','La contrase├▒a exige al menos una may├║scula',1),(4,'CLAVE_MINUSCULA','Requiere min├║scula','1','La contrase├▒a exige al menos una min├║scula',1),(5,'CLAVE_NUMERO','Requiere n├║mero','1','La contrase├▒a exige al menos un n├║mero',1),(6,'CLAVE_ESPECIAL','Requiere car├ícter especial','0','La contrase├▒a exige un car├ícter especial',1),(7,'CLAVE_DIAS_EXPIRACION','D├¡as de expiraci├│n de contrase├▒a','90','D├¡as para forzar cambio de contrase├▒a',1),(22,'TRIAL_DAYS','D├¡as de prueba gratuita','15','Periodo de prueba gratis al crear una empresa',1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `perfil_permisos_base` (
  `IdPerfil` int NOT NULL,
  `IdPermiso` int NOT NULL,
  PRIMARY KEY (`IdPerfil`,`IdPermiso`),
  KEY `fk_ppb_permiso` (`IdPermiso`),
  CONSTRAINT `fk_ppb_perfil` FOREIGN KEY (`IdPerfil`) REFERENCES `perfiles` (`IdPerfil`) ON DELETE CASCADE,
  CONSTRAINT `fk_ppb_permiso` FOREIGN KEY (`IdPermiso`) REFERENCES `permisos` (`IdPermiso`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci COMMENT='Paquete predeterminado de permisos por perfil';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `perfil_permisos_base` VALUES (3,7),(4,7),(5,7),(6,7),(7,7),(2,16),(3,16),(4,16),(6,16),(7,16),(2,17),(3,17),(4,17),(6,17),(2,18),(3,18),(4,18),(6,18),(2,20),(3,20),(4,20),(6,20),(7,20),(2,21),(3,21),(4,21),(6,21),(2,22),(3,22),(4,22),(6,22),(2,24),(3,24),(4,24),(6,24),(7,24),(2,28),(3,28),(4,28),(6,28),(7,28),(2,29),(4,29),(6,29),(2,30),(4,30),(6,30),(2,32),(2,33),(7,33),(2,34),(2,35),(2,36),(2,38),(2,39),(2,40),(3,40),(4,40),(6,40),(7,40),(3,44),(4,44),(5,44),(6,44),(7,44),(5,45),(5,46),(3,48),(4,48),(5,48),(6,48),(7,48),(5,49),(5,50),(4,52),(5,52),(7,52),(5,53),(5,54),(5,55),(5,56),(5,57),(3,58),(4,58),(5,58),(7,58),(4,59),(3,63),(4,63),(5,63),(6,63),(7,63),(3,64),(4,64),(3,65),(3,66),(3,67),(3,68),(3,69),(3,70),(5,71),(7,71),(7,72),(7,73),(7,74),(3,77),(4,77),(7,77),(3,78),(3,79),(3,166),(4,166),(6,166),(7,166),(2,170),(4,170),(6,170),(7,170),(3,171),(4,171),(5,171),(7,171);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `perfiles` (
  `IdPerfil` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Descripcion` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaModificacion` datetime DEFAULT NULL,
  `UsuarioIdModificacion` int DEFAULT NULL,
  PRIMARY KEY (`IdPerfil`),
  UNIQUE KEY `uk_perfil_nombre` (`Nombre`)
) ENGINE=InnoDB AUTO_INCREMENT=21 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `perfiles` VALUES (1,'Administrador','Administraci├│n total de la empresa',1,'2026-09-04 18:20:09',NULL,NULL,NULL),(2,'Veterinario','Atenci├│n cl├¡nica y historias cl├¡nicas',1,'2026-09-04 18:20:09',NULL,NULL,NULL),(3,'Vendedor','Ventas y atenci├│n al cliente',1,'2026-09-04 18:20:09',NULL,NULL,NULL),(4,'Auxiliar','Apoyo administrativo y operativo',1,'2026-09-04 18:20:09',NULL,NULL,NULL),(5,'Bodeguero','Gesti├│n de inventarios',1,'2026-09-04 18:20:09',NULL,'2026-09-13 11:08:34',3),(6,'Recepcionista','Citas y recepci├│n',1,'2026-09-04 18:20:09',NULL,NULL,NULL),(7,'Gerente','Direcci├│n y reportes',1,'2026-09-04 18:20:09',NULL,NULL,NULL),(8,'SUPERADMIN','Administra todo el sistema y las empresas',1,'2026-09-04 18:20:09',NULL,'2026-09-05 16:14:54',3),(20,'ADMIN_EMPRESA3','Administrador Empresa 3',1,'2026-09-10 12:01:58',NULL,NULL,NULL);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `perfilpermisos` (
  `IdPerfil` int NOT NULL,
  `IdPermiso` int NOT NULL,
  `TipoAcceso` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PERMITIR' COMMENT 'PERMITIR / DENEGAR',
  `AsignadoPor` int DEFAULT NULL,
  `FechaAsignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdPerfil`,`IdPermiso`),
  KEY `idx_pp_permiso` (`IdPermiso`),
  KEY `fk_pp_asignado_por` (`AsignadoPor`),
  CONSTRAINT `fk_pp_asignado_por` FOREIGN KEY (`AsignadoPor`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `fk_pp_perfil` FOREIGN KEY (`IdPerfil`) REFERENCES `perfiles` (`IdPerfil`),
  CONSTRAINT `fk_pp_permiso` FOREIGN KEY (`IdPermiso`) REFERENCES `permisos` (`IdPermiso`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `perfilpermisos` VALUES (1,170,'PERMITIR',NULL,'2026-09-06 09:25:15'),(1,171,'PERMITIR',NULL,'2026-09-07 13:58:58'),(1,172,'PERMITIR',NULL,'2026-09-07 13:58:58'),(1,173,'PERMITIR',NULL,'2026-09-07 13:58:58'),(1,174,'PERMITIR',NULL,'2026-09-07 13:58:58'),(1,175,'PERMITIR',NULL,'2026-09-07 13:58:58'),(2,16,'PERMITIR',3,'2026-09-13 11:46:59'),(2,17,'PERMITIR',3,'2026-09-13 11:46:59'),(2,18,'PERMITIR',3,'2026-09-13 11:46:59'),(2,20,'PERMITIR',3,'2026-09-13 11:46:59'),(2,21,'PERMITIR',3,'2026-09-13 11:46:59'),(2,22,'PERMITIR',3,'2026-09-13 11:46:59'),(2,24,'PERMITIR',3,'2026-09-13 11:46:59'),(2,28,'PERMITIR',3,'2026-09-13 11:46:59'),(2,29,'PERMITIR',3,'2026-09-13 11:46:59'),(2,30,'PERMITIR',3,'2026-09-13 11:46:59'),(2,32,'PERMITIR',3,'2026-09-13 11:46:59'),(2,33,'PERMITIR',3,'2026-09-13 11:46:59'),(2,34,'PERMITIR',3,'2026-09-13 11:46:59'),(2,35,'PERMITIR',3,'2026-09-13 11:46:59'),(2,36,'PERMITIR',3,'2026-09-13 11:46:59'),(2,38,'PERMITIR',3,'2026-09-13 11:46:59'),(2,39,'PERMITIR',3,'2026-09-13 11:46:59'),(2,40,'PERMITIR',3,'2026-09-13 11:46:59'),(2,170,'PERMITIR',3,'2026-09-13 11:46:59'),(3,7,'PERMITIR',3,'2026-09-13 14:31:31'),(3,16,'PERMITIR',3,'2026-09-13 14:31:31'),(3,17,'PERMITIR',3,'2026-09-13 14:31:31'),(3,18,'PERMITIR',3,'2026-09-13 14:31:31'),(3,20,'PERMITIR',3,'2026-09-13 14:31:31'),(3,21,'PERMITIR',3,'2026-09-13 14:31:31'),(3,22,'PERMITIR',3,'2026-09-13 14:31:31'),(3,24,'PERMITIR',3,'2026-09-13 14:31:31'),(3,28,'PERMITIR',3,'2026-09-13 14:31:31'),(3,40,'PERMITIR',3,'2026-09-13 14:31:31'),(3,44,'PERMITIR',3,'2026-09-13 14:31:31'),(3,48,'PERMITIR',3,'2026-09-13 14:31:31'),(3,58,'PERMITIR',3,'2026-09-13 14:31:31'),(3,63,'PERMITIR',3,'2026-09-13 14:31:31'),(3,64,'PERMITIR',3,'2026-09-13 14:31:31'),(3,65,'PERMITIR',3,'2026-09-13 14:31:31'),(3,66,'PERMITIR',3,'2026-09-13 14:31:31'),(3,67,'PERMITIR',3,'2026-09-13 14:31:31'),(3,68,'PERMITIR',3,'2026-09-13 14:31:31'),(3,69,'PERMITIR',3,'2026-09-13 14:31:31'),(3,70,'PERMITIR',3,'2026-09-13 14:31:31'),(3,77,'PERMITIR',3,'2026-09-13 14:31:31'),(3,78,'PERMITIR',3,'2026-09-13 14:31:31'),(3,79,'PERMITIR',3,'2026-09-13 14:31:31'),(3,166,'PERMITIR',3,'2026-09-13 14:31:31'),(3,171,'PERMITIR',3,'2026-09-13 14:31:31'),(4,7,'PERMITIR',3,'2026-09-13 11:46:59'),(4,16,'PERMITIR',3,'2026-09-13 11:46:59'),(4,17,'PERMITIR',3,'2026-09-13 11:46:59'),(4,18,'PERMITIR',3,'2026-09-13 11:46:59'),(4,20,'PERMITIR',3,'2026-09-13 11:46:59'),(4,21,'PERMITIR',3,'2026-09-13 11:46:59'),(4,22,'PERMITIR',3,'2026-09-13 11:46:59'),(4,24,'PERMITIR',3,'2026-09-13 11:46:59'),(4,28,'PERMITIR',3,'2026-09-13 11:46:59'),(4,29,'PERMITIR',3,'2026-09-13 11:46:59'),(4,30,'PERMITIR',3,'2026-09-13 11:46:59'),(4,40,'PERMITIR',3,'2026-09-13 11:46:59'),(4,44,'PERMITIR',3,'2026-09-13 11:46:59'),(4,48,'PERMITIR',3,'2026-09-13 11:46:59'),(4,52,'PERMITIR',3,'2026-09-13 11:46:59'),(4,58,'PERMITIR',3,'2026-09-13 11:46:59'),(4,59,'PERMITIR',3,'2026-09-13 11:46:59'),(4,63,'PERMITIR',3,'2026-09-13 11:46:59'),(4,64,'PERMITIR',3,'2026-09-13 11:46:59'),(4,77,'PERMITIR',3,'2026-09-13 11:46:59'),(4,166,'PERMITIR',3,'2026-09-13 11:46:59'),(4,170,'PERMITIR',3,'2026-09-13 11:46:59'),(4,171,'PERMITIR',3,'2026-09-13 11:46:59'),(5,7,'PERMITIR',3,'2026-09-13 11:46:59'),(5,44,'PERMITIR',3,'2026-09-13 11:46:59'),(5,45,'PERMITIR',3,'2026-09-13 11:46:59'),(5,46,'PERMITIR',3,'2026-09-13 11:46:59'),(5,48,'PERMITIR',3,'2026-09-13 11:46:59'),(5,49,'PERMITIR',3,'2026-09-13 11:46:59'),(5,50,'PERMITIR',3,'2026-09-13 11:46:59'),(5,52,'PERMITIR',3,'2026-09-13 11:46:59'),(5,53,'PERMITIR',3,'2026-09-13 11:46:59'),(5,54,'PERMITIR',3,'2026-09-13 11:46:59'),(5,55,'PERMITIR',3,'2026-09-13 11:46:59'),(5,56,'PERMITIR',3,'2026-09-13 11:46:59'),(5,57,'PERMITIR',3,'2026-09-13 11:46:59'),(5,58,'PERMITIR',3,'2026-09-13 11:46:59'),(5,63,'PERMITIR',3,'2026-09-13 11:46:59'),(5,71,'PERMITIR',3,'2026-09-13 11:46:59'),(5,171,'PERMITIR',3,'2026-09-13 11:46:59'),(6,7,'PERMITIR',3,'2026-09-13 11:46:59'),(6,16,'PERMITIR',3,'2026-09-13 11:46:59'),(6,17,'PERMITIR',3,'2026-09-13 11:46:59'),(6,18,'PERMITIR',3,'2026-09-13 11:46:59'),(6,20,'PERMITIR',3,'2026-09-13 11:46:59'),(6,21,'PERMITIR',3,'2026-09-13 11:46:59'),(6,22,'PERMITIR',3,'2026-09-13 11:46:59'),(6,24,'PERMITIR',3,'2026-09-13 11:46:59'),(6,28,'PERMITIR',3,'2026-09-13 11:46:59'),(6,29,'PERMITIR',3,'2026-09-13 11:46:59'),(6,30,'PERMITIR',3,'2026-09-13 11:46:59'),(6,40,'PERMITIR',3,'2026-09-13 11:46:59'),(6,44,'PERMITIR',3,'2026-09-13 11:46:59'),(6,48,'PERMITIR',3,'2026-09-13 11:46:59'),(6,63,'PERMITIR',3,'2026-09-13 11:46:59'),(6,166,'PERMITIR',3,'2026-09-13 11:46:59'),(6,170,'PERMITIR',3,'2026-09-13 11:46:59'),(7,7,'PERMITIR',3,'2026-09-13 11:47:00'),(7,16,'PERMITIR',3,'2026-09-13 11:47:00'),(7,20,'PERMITIR',3,'2026-09-13 11:47:00'),(7,24,'PERMITIR',3,'2026-09-13 11:47:00'),(7,28,'PERMITIR',3,'2026-09-13 11:47:00'),(7,33,'PERMITIR',3,'2026-09-13 11:47:00'),(7,40,'PERMITIR',3,'2026-09-13 11:47:00'),(7,44,'PERMITIR',3,'2026-09-13 11:47:00'),(7,48,'PERMITIR',3,'2026-09-13 11:47:00'),(7,52,'PERMITIR',3,'2026-09-13 11:47:00'),(7,58,'PERMITIR',3,'2026-09-13 11:47:00'),(7,63,'PERMITIR',3,'2026-09-13 11:47:00'),(7,71,'PERMITIR',3,'2026-09-13 11:47:00'),(7,72,'PERMITIR',3,'2026-09-13 11:47:00'),(7,73,'PERMITIR',3,'2026-09-13 11:47:00'),(7,74,'PERMITIR',3,'2026-09-13 11:47:00'),(7,77,'PERMITIR',3,'2026-09-13 11:47:00'),(7,166,'PERMITIR',3,'2026-09-13 11:47:00'),(7,170,'PERMITIR',3,'2026-09-13 11:47:00'),(7,171,'PERMITIR',3,'2026-09-13 11:47:00'),(20,1,'PERMITIR',NULL,'2026-09-10 12:01:58'),(20,2,'PERMITIR',NULL,'2026-09-10 12:01:58'),(20,3,'PERMITIR',NULL,'2026-09-10 12:01:58'),(20,4,'PERMITIR',NULL,'2026-09-10 12:01:58'),(20,5,'PERMITIR',NULL,'2026-09-10 12:01:59'),(20,6,'PERMITIR',NULL,'2026-09-10 12:01:59'),(20,7,'PERMITIR',NULL,'2026-09-10 12:01:59'),(20,8,'PERMITIR',NULL,'2026-09-10 12:01:59'),(20,9,'PERMITIR',NULL,'2026-09-10 12:01:59'),(20,10,'PERMITIR',NULL,'2026-09-10 12:01:59'),(20,11,'PERMITIR',NULL,'2026-09-10 12:01:59'),(20,12,'PERMITIR',NULL,'2026-09-10 12:01:59'),(20,13,'PERMITIR',NULL,'2026-09-10 12:01:59'),(20,14,'PERMITIR',NULL,'2026-09-10 12:01:59'),(20,15,'PERMITIR',NULL,'2026-09-10 12:01:59'),(20,16,'PERMITIR',NULL,'2026-09-10 12:01:59'),(20,17,'PERMITIR',NULL,'2026-09-10 12:01:59'),(20,18,'PERMITIR',NULL,'2026-09-10 12:01:59'),(20,19,'PERMITIR',NULL,'2026-09-10 12:01:59'),(20,20,'PERMITIR',NULL,'2026-09-10 12:01:59'),(20,21,'PERMITIR',NULL,'2026-09-10 12:01:59'),(20,22,'PERMITIR',NULL,'2026-09-10 12:01:59'),(20,23,'PERMITIR',NULL,'2026-09-10 12:01:59'),(20,24,'PERMITIR',NULL,'2026-09-10 12:01:59'),(20,25,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,26,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,27,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,28,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,29,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,30,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,31,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,32,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,33,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,34,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,35,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,36,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,37,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,38,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,39,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,40,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,41,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,42,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,43,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,44,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,45,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,46,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,47,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,48,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,49,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,50,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,51,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,52,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,53,'PERMITIR',NULL,'2026-09-10 12:02:00'),(20,54,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,55,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,56,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,57,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,58,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,59,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,60,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,61,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,62,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,63,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,64,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,65,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,66,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,67,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,68,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,69,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,70,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,71,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,72,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,73,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,74,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,75,'PERMITIR',NULL,'2026-09-10 12:02:01'),(20,76,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,77,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,78,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,79,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,155,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,156,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,157,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,158,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,159,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,160,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,161,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,162,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,163,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,164,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,165,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,166,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,167,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,168,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,169,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,170,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,171,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,172,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,173,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,174,'PERMITIR',NULL,'2026-09-10 12:02:02'),(20,175,'PERMITIR',NULL,'2026-09-10 12:02:03');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `permisos` (
  `IdPermiso` int NOT NULL AUTO_INCREMENT,
  `IdModulo` int NOT NULL,
  `Codigo` varchar(60) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Descripcion` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaModificacion` datetime DEFAULT NULL,
  `UsuarioIdModificacion` int DEFAULT NULL,
  PRIMARY KEY (`IdPermiso`),
  UNIQUE KEY `uk_permiso_codigo` (`Codigo`),
  KEY `idx_permiso_modulo` (`IdModulo`),
  CONSTRAINT `fk_permisos_modulo` FOREIGN KEY (`IdModulo`) REFERENCES `modulos` (`idModulos`)
) ENGINE=InnoDB AUTO_INCREMENT=176 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `permisos` VALUES (1,4,'SEGURIDAD.CONSULTAR','Consultar seguridad','Ver usuarios, roles y permisos',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(2,4,'SEGURIDAD.CREAR','Crear seguridad','Crear elementos de seguridad',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(3,4,'SEGURIDAD.EDITAR','Editar seguridad','Editar elementos de seguridad',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(4,4,'SEGURIDAD.ELIMINAR','Eliminar seguridad','Inactivar elementos de seguridad',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(5,4,'SEGURIDAD.ASIGNAR_ROLES','Asignar roles a usuarios','Administrar usuarioroles',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(6,4,'SEGURIDAD.ASIGNAR_PERMISOS','Asignar permisos a roles','Administrar rolpermisos',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(7,5,'EMPRESAS.CONSULTAR','Consultar empresas','Ver empresas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(8,5,'EMPRESAS.CREAR','Crear empresa','Registrar empresas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(9,5,'EMPRESAS.EDITAR','Editar empresa','Modificar empresas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(10,5,'EMPRESAS.ELIMINAR','Inactivar empresa','Activar/Inactivar empresas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(11,6,'USUARIOS.CONSULTAR','Consultar usuarios','Ver usuarios',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(12,6,'USUARIOS.CREAR','Crear usuario','Registrar usuarios',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(13,6,'USUARIOS.EDITAR','Editar usuario','Modificar usuarios',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(14,6,'USUARIOS.CAMBIAR_CLAVE','Cambiar contrase├▒a','Cambiar contrase├▒as',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(15,6,'USUARIOS.ASIGNAR_EMPRESA','Asignar empresa a usuario','Definir empresa del usuario',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(16,7,'CLIENTES.CONSULTAR','Consultar clientes','Ver listado y detalle de clientes',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(17,7,'CLIENTES.CREAR','Crear cliente','Registrar clientes',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(18,7,'CLIENTES.EDITAR','Editar cliente','Modificar clientes',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(19,7,'CLIENTES.ELIMINAR','Inactivar cliente','Activar/Inactivar clientes',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(20,8,'MASCOTAS.CONSULTAR','Consultar mascotas','Ver listado y detalle de mascotas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(21,8,'MASCOTAS.CREAR','Crear mascota','Registrar mascotas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(22,8,'MASCOTAS.EDITAR','Editar mascota','Modificar mascotas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(23,8,'MASCOTAS.ELIMINAR','Inactivar mascota','Activar/Inactivar mascotas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(24,9,'VETERINARIOS.CONSULTAR','Consultar veterinarios','Ver veterinarios',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(25,9,'VETERINARIOS.CREAR','Crear veterinario','Registrar veterinarios',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(26,9,'VETERINARIOS.EDITAR','Editar veterinario','Modificar veterinarios',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(27,9,'VETERINARIOS.ELIMINAR','Inactivar veterinario','Activar/Inactivar veterinarios',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(28,10,'CITAS.CONSULTAR','Consultar citas','Ver citas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(29,10,'CITAS.CREAR','Crear cita','Programar citas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(30,10,'CITAS.EDITAR','Editar cita','Reagendar citas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(31,10,'CITAS.ANULAR','Anular cita','Cancelar citas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(32,10,'CITAS.APROBAR','Aprobar cita','Confirmar citas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(33,11,'HISTORIA.CONSULTAR','Consultar historias','Ver historias cl├¡nicas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(34,11,'HISTORIA.CREAR','Crear historia','Abrir historias cl├¡nicas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(35,11,'HISTORIA.EDITAR','Editar historia','Modificar historias cl├¡nicas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(36,11,'HISTORIA.CERRAR','Cerrar historia','Cerrar historias cl├¡nicas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(37,11,'HISTORIA.ANULAR','Anular historia','Anular historias cl├¡nicas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(38,11,'HISTORIA.IMPRIMIR','Imprimir historia','Imprimir historias cl├¡nicas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(39,11,'HISTORIA.EXPORTAR','Exportar historias','Exportar historias cl├¡nicas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(40,12,'SERVICIOS.CONSULTAR','Consultar servicios','Ver servicios',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(41,12,'SERVICIOS.CREAR','Crear servicio','Registrar servicios',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(42,12,'SERVICIOS.EDITAR','Editar servicio','Modificar servicios',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(43,12,'SERVICIOS.ELIMINAR','Inactivar servicio','Activar/Inactivar servicios',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(44,13,'PRODUCTOS.CONSULTAR','Consultar productos','Ver productos',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(45,13,'PRODUCTOS.CREAR','Crear producto','Registrar productos',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(46,13,'PRODUCTOS.EDITAR','Editar producto','Modificar productos',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(47,13,'PRODUCTOS.ELIMINAR','Inactivar producto','Activar/Inactivar productos',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(48,14,'BODEGAS.CONSULTAR','Consultar bodegas','Ver bodegas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(49,14,'BODEGAS.CREAR','Crear bodega','Registrar bodegas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(50,14,'BODEGAS.EDITAR','Editar bodega','Modificar bodegas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(51,14,'BODEGAS.ELIMINAR','Inactivar bodega','Activar/Inactivar bodegas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(52,15,'INVENTARIO.CONSULTAR','Consultar inventario','Ver existencias y kardex',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(53,15,'INVENTARIO.ENTRADA','Entrada de inventario','Registrar entradas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(54,15,'INVENTARIO.SALIDA','Salida de inventario','Registrar salidas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(55,15,'INVENTARIO.AJUSTAR','Ajustar inventario','Ajustes de existencias',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(56,15,'INVENTARIO.TRASLADAR','Trasladar inventario','Traslados entre bodegas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(57,15,'INVENTARIO.COSTO','Costos de inventario','Ver y editar costos',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(58,16,'COMPRAS.CONSULTAR','Consultar compras','Ver compras',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(59,16,'COMPRAS.CREAR','Crear compra','Registrar compras',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(60,16,'COMPRAS.APROBAR','Aprobar compra','Aprobar compras',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(61,16,'COMPRAS.ANULAR','Anular compra','Anular compras',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(62,16,'COMPRAS.IMPRIMIR','Imprimir compra','Imprimir compras',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(63,17,'VENTAS.CONSULTAR','Consultar ventas','Ver ventas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(64,17,'VENTAS.CREAR','Crear venta','Registrar ventas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(65,17,'VENTAS.EDITAR','Editar venta','Modificar ventas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(66,17,'VENTAS.CONFIRMAR','Confirmar venta','Confirmar ventas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(67,17,'VENTAS.ANULAR','Anular venta','Anular ventas (conservando trazabilidad)',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(68,17,'VENTAS.DEVOLVER','Devolver venta','Procesar devoluciones',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(69,17,'VENTAS.IMPRIMIR','Imprimir venta','Imprimir facturas/tickets',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(70,17,'VENTAS.EXPORTAR','Exportar ventas','Exportar ventas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(71,19,'REPORTES.CONSULTAR','Consultar reportes','Ver reportes',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(72,19,'REPORTES.EXPORTAR','Exportar reportes','Exportar reportes',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(73,19,'REPORTES.IMPRIMIR','Imprimir reportes','Imprimir reportes',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(74,20,'AUDITORIA.CONSULTAR','Consultar auditor├¡a','Ver bit├ícora de operaciones',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(75,20,'AUDITORIA.EXPORTAR','Exportar auditor├¡a','Exportar bit├ícora',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(76,6,'USUARIOS.BLOQUEAR','Bloquear/Desbloquear','Bloquear y desbloquear usuarios',1,'2026-09-05 08:11:35',NULL,NULL,NULL),(77,18,'CAJA.CONSULTAR','Consultar caja','Ver arqueos y caja',1,'2026-09-05 08:11:35',NULL,NULL,NULL),(78,18,'CAJA.ABRIR','Abrir caja','Apertura de caja',1,'2026-09-05 08:11:35',NULL,NULL,NULL),(79,18,'CAJA.CERRAR','Cerrar caja','Cierre y arqueo',1,'2026-09-05 08:11:35',NULL,NULL,NULL),(155,55,'PLANES.CONSULTAR','Consultar planes','Ver cat├ílogo de planes',1,'2026-09-05 15:39:30',NULL,NULL,NULL),(156,55,'PLANES.CREAR','Crear plan','Crear planes comerciales',1,'2026-09-05 15:39:30',NULL,NULL,NULL),(157,55,'PLANES.EDITAR','Editar plan','Modificar planes y precios',1,'2026-09-05 15:39:30',NULL,NULL,NULL),(158,55,'PLANES.ELIMINAR','Inactivar plan','Activar/Inactivar planes',1,'2026-09-05 15:39:30',NULL,NULL,NULL),(159,55,'PLANES.CONFIGURAR','Configurar plan','Asignar m├│dulos y l├¡mites del plan',1,'2026-09-05 15:39:30',NULL,NULL,NULL),(160,56,'SUSCRIPCIONES.CONSULTAR','Consultar suscripciones','Ver suscripciones de empresas',1,'2026-09-05 15:39:30',NULL,NULL,NULL),(161,56,'SUSCRIPCIONES.ASIGNAR','Asignar suscripci├│n','Crear suscripci├│n a una empresa',1,'2026-09-05 15:39:30',NULL,NULL,NULL),(162,56,'SUSCRIPCIONES.CAMBIAR_PLAN','Cambiar plan','Cambiar el plan de una empresa',1,'2026-09-05 15:39:30',NULL,NULL,NULL),(163,56,'SUSCRIPCIONES.SUSPENDER','Suspender/Reactivar','Suspender o reactivar suscripci├│n',1,'2026-09-05 15:39:30',NULL,NULL,NULL),(164,56,'SUSCRIPCIONES.ADDONS','M├│dulos adiciones','Administrar m├│dulos ADD-ON',1,'2026-09-05 15:39:30',NULL,NULL,NULL),(165,56,'SUSCRIPCIONES.CANCELAR','Cancelar suscripci├│n','Cancelar la suscripci├│n de una empresa',1,'2026-09-05 15:39:30',NULL,NULL,NULL),(166,21,'TIPOS_PAGO.CONSULTAR','Consultar tipos de pago','Ver tipos de pago',1,'2026-09-06 08:27:20',NULL,NULL,NULL),(167,21,'TIPOS_PAGO.CREAR','Crear tipo de pago','Registrar tipos de pago',1,'2026-09-06 08:27:20',NULL,NULL,NULL),(168,21,'TIPOS_PAGO.EDITAR','Editar tipo de pago','Modificar tipos de pago',1,'2026-09-06 08:27:20',NULL,NULL,NULL),(169,21,'TIPOS_PAGO.ELIMINAR','Eliminar tipo de pago','Eliminar tipos de pago',1,'2026-09-06 08:27:20',NULL,NULL,NULL),(170,22,'FACTURACION.SERVICIOS','Facturar servicios','Crea y confirma la venta de un servicio desde citas',1,'2026-09-06 09:25:15',NULL,NULL,NULL),(171,58,'PROVEEDORES.CONSULTAR','Consultar proveedores','Ver proveedores',1,'2026-09-07 13:58:58',NULL,NULL,NULL),(172,58,'PROVEEDORES.CREAR','Crear proveedor','Registrar proveedores',1,'2026-09-07 13:58:58',NULL,NULL,NULL),(173,58,'PROVEEDORES.EDITAR','Editar proveedor','Actualizar proveedores',1,'2026-09-07 13:58:58',NULL,NULL,NULL),(174,58,'PROVEEDORES.ELIMINAR','Eliminar proveedor','Eliminar proveedores',1,'2026-09-07 13:58:58',NULL,NULL,NULL),(175,58,'PROVEEDORES.IMPRIMIR','Imprimir proveedores','Imprimir datos de proveedores',1,'2026-09-07 13:58:58',NULL,NULL,NULL);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plan_limites` (
  `IdPlan` int NOT NULL,
  `IdTipoLimite` int NOT NULL,
  `ValorLimite` int NOT NULL COMMENT '-1 = ilimitado',
  `FechaAsignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdPlan`,`IdTipoLimite`),
  KEY `idx_pl_tipolimite` (`IdTipoLimite`),
  CONSTRAINT `fk_planlimites_plan` FOREIGN KEY (`IdPlan`) REFERENCES `planes` (`IdPlan`),
  CONSTRAINT `fk_planlimites_tipolim` FOREIGN KEY (`IdTipoLimite`) REFERENCES `tipos_limite` (`IdTipoLimite`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RF-MON-005: valor l├¡mite por tipo en cada plan';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `plan_limites` VALUES (1,1,1,'2026-09-05 15:38:45'),(1,2,200,'2026-09-05 15:38:45'),(1,3,100,'2026-09-05 15:38:45'),(1,4,200,'2026-09-05 15:38:45'),(1,5,1,'2026-09-05 15:38:45'),(2,1,3,'2026-09-05 15:38:45'),(2,2,2000,'2026-09-05 15:38:45'),(2,3,1000,'2026-09-05 15:38:45'),(2,4,2000,'2026-09-05 15:38:45'),(2,5,5,'2026-09-05 15:38:45'),(3,1,10,'2026-09-05 15:38:45'),(3,2,10000,'2026-09-05 15:38:45'),(3,3,5000,'2026-09-05 15:38:45'),(3,4,20000,'2026-09-05 15:38:45'),(3,5,20,'2026-09-05 15:38:45');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `plan_modulos` (
  `IdPlan` int NOT NULL,
  `IdModulo` int NOT NULL,
  `FechaAsignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdPlan`,`IdModulo`),
  KEY `idx_pm_modulo` (`IdModulo`),
  CONSTRAINT `fk_planmodulos_modulo` FOREIGN KEY (`IdModulo`) REFERENCES `modulos` (`idModulos`),
  CONSTRAINT `fk_planmodulos_plan` FOREIGN KEY (`IdPlan`) REFERENCES `planes` (`IdPlan`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RF-MON-004: m├│dulos incluidos en cada plan';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `plan_modulos` VALUES (1,4,'2026-09-05 15:38:44'),(1,5,'2026-09-05 15:38:44'),(1,6,'2026-09-05 15:38:44'),(1,7,'2026-09-05 15:38:44'),(1,8,'2026-09-05 15:38:44'),(1,9,'2026-09-06 08:23:58'),(1,10,'2026-09-05 15:38:44'),(1,11,'2026-09-06 08:23:58'),(1,12,'2026-09-05 15:38:44'),(1,13,'2026-09-06 08:23:58'),(1,14,'2026-09-06 08:23:58'),(1,15,'2026-09-06 08:23:58'),(1,16,'2026-09-06 08:23:58'),(1,17,'2026-09-06 08:23:58'),(1,18,'2026-09-06 08:23:58'),(1,19,'2026-09-05 15:38:44'),(1,20,'2026-09-06 08:23:58'),(1,21,'2026-09-06 08:27:20'),(1,22,'2026-09-06 09:25:15'),(1,58,'2026-09-07 13:58:58'),(2,4,'2026-09-05 15:38:44'),(2,5,'2026-09-05 15:38:44'),(2,6,'2026-09-05 15:38:44'),(2,7,'2026-09-05 15:38:44'),(2,8,'2026-09-05 15:38:44'),(2,9,'2026-09-05 15:38:44'),(2,10,'2026-09-05 15:38:44'),(2,11,'2026-09-05 15:38:44'),(2,12,'2026-09-05 15:38:44'),(2,13,'2026-09-05 15:38:44'),(2,14,'2026-09-05 15:38:44'),(2,15,'2026-09-05 15:38:44'),(2,16,'2026-09-06 08:23:58'),(2,17,'2026-09-05 15:38:44'),(2,18,'2026-09-05 16:56:55'),(2,19,'2026-09-05 15:38:44'),(2,20,'2026-09-05 15:38:44'),(2,21,'2026-09-06 08:27:20'),(2,22,'2026-09-06 09:25:15'),(2,58,'2026-09-07 13:58:58'),(3,4,'2026-09-05 15:38:44'),(3,5,'2026-09-05 15:38:44'),(3,6,'2026-09-05 15:38:44'),(3,7,'2026-09-05 15:38:44'),(3,8,'2026-09-05 15:38:44'),(3,9,'2026-09-05 15:38:44'),(3,10,'2026-09-05 15:38:44'),(3,11,'2026-09-05 15:38:44'),(3,12,'2026-09-05 15:38:44'),(3,13,'2026-09-05 15:38:44'),(3,14,'2026-09-05 15:38:44'),(3,15,'2026-09-05 15:38:44'),(3,16,'2026-09-05 15:38:44'),(3,17,'2026-09-05 15:38:44'),(3,18,'2026-09-05 15:38:44'),(3,19,'2026-09-05 15:38:44'),(3,20,'2026-09-05 15:38:44'),(3,21,'2026-09-06 08:27:20'),(3,22,'2026-09-06 09:25:15'),(3,58,'2026-09-07 13:58:58');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `planes` (
  `IdPlan` int NOT NULL AUTO_INCREMENT,
  `CodigoPlan` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NombrePlan` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Descripcion` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PrecioMensual` decimal(18,2) NOT NULL DEFAULT '0.00',
  `PrecioAnual` decimal(18,2) NOT NULL DEFAULT '0.00',
  `Moneda` varchar(5) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'COP',
  `MaxUsuarios` int NOT NULL DEFAULT '1',
  `DiasPrueba` int DEFAULT NULL COMMENT 'N┬║ de d├¡as de prueba gratis para este plan (NULL = usa TRIAL_DAYS global)',
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaModificacion` datetime DEFAULT NULL,
  `UsuarioIdModificacion` int DEFAULT NULL,
  PRIMARY KEY (`IdPlan`),
  UNIQUE KEY `uk_plan_codigo` (`CodigoPlan`),
  UNIQUE KEY `uk_plan_nombre` (`NombrePlan`),
  KEY `idx_plan_activo` (`Activo`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RF-MON-001: cat├ílogo de planes comerciales';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `planes` VALUES (1,'BASICO','B├ísico','Para peque├▒as veterinarias: clientes, mascotas, citas y servicios.',199000.00,1990000.00,'COP',2,NULL,1,'2026-09-05 15:38:43',NULL,NULL,NULL),(2,'PROFESIONAL','Profesional','Para cl├¡nicas: historias cl├¡nicas, inventarios, bodegas y ventas.',399000.00,3990000.00,'COP',5,NULL,1,'2026-09-05 15:38:43',NULL,NULL,NULL),(3,'EMPRESARIAL','Empresarial','Para operaciones completas: compras, caja y multi-sede.',799000.00,7990000.00,'COP',10,NULL,1,'2026-09-05 15:38:43',NULL,NULL,NULL);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `procedimientos` (
  `IdProcedimiento` int NOT NULL AUTO_INCREMENT,
  `IdHistoriaClinica` int NOT NULL,
  `IdServicio` int DEFAULT NULL,
  `NombreProcedimiento` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Descripcion` text COLLATE utf8mb4_unicode_ci,
  `Resultado` text COLLATE utf8mb4_unicode_ci,
  `Observaciones` text COLLATE utf8mb4_unicode_ci,
  `FechaCreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdProcedimiento`),
  KEY `fk_procedimientos_servicio` (`IdServicio`),
  KEY `fk_procedimientos_usuario` (`UsuarioIdCreacion`),
  KEY `idx_procedimientos_historia` (`IdHistoriaClinica`),
  KEY `idx_procedimientos_fecha` (`Fecha`),
  KEY `idx_procedimientos_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_procedimientos_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`),
  CONSTRAINT `fk_procedimientos_historia` FOREIGN KEY (`IdHistoriaClinica`) REFERENCES `historiasclinicas` (`IdHistoriaClinica`),
  CONSTRAINT `fk_procedimientos_servicio` FOREIGN KEY (`IdServicio`) REFERENCES `servicios` (`IdServicio`),
  CONSTRAINT `fk_procedimientos_usuario` FOREIGN KEY (`UsuarioIdCreacion`) REFERENCES `usuarios` (`UsuarioId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `productos` (
  `IdProducto` int NOT NULL AUTO_INCREMENT,
  `CodigoProducto` varchar(50) NOT NULL,
  `CodigoBarras` varchar(50) DEFAULT NULL,
  `NombreProducto` varchar(150) NOT NULL,
  `Descripcion` varchar(500) DEFAULT NULL,
  `IdCategoriaProducto` int NOT NULL,
  `IdUnidadMedida` int DEFAULT NULL,
  `IdMarca` int DEFAULT NULL,
  `Referencia` varchar(100) DEFAULT NULL,
  `PrecioVenta` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `CostoActual` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `CostoPromedio` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `StockMinimo` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `StockMaximo` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `ManejaInventario` tinyint(1) NOT NULL DEFAULT '1',
  `PermiteVenta` tinyint(1) NOT NULL DEFAULT '1',
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaModificacion` datetime DEFAULT NULL,
  `UsuarioIdModificacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdProducto`),
  UNIQUE KEY `uk_producto_codigo` (`CodigoProducto`),
  KEY `ix_producto_categoria` (`IdCategoriaProducto`),
  KEY `ix_producto_marca` (`IdMarca`),
  KEY `ix_producto_unidad` (`IdUnidadMedida`),
  KEY `idx_productos_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_producto_categoria` FOREIGN KEY (`IdCategoriaProducto`) REFERENCES `categoriasproducto` (`IdCategoriaProducto`),
  CONSTRAINT `fk_producto_marca` FOREIGN KEY (`IdMarca`) REFERENCES `marcas` (`Id`),
  CONSTRAINT `fk_producto_unidad` FOREIGN KEY (`IdUnidadMedida`) REFERENCES `unidades_medida` (`Id`),
  CONSTRAINT `fk_productos_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB AUTO_INCREMENT=60 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `productos` VALUES (1,'101','111001','MIRRINGO PURINA','MIRRINGO PURINA 10KIL',1,5,4,NULL,25000.0000,5800.0000,5622.7451,10.0000,200.0000,1,1,1,'2026-09-04 17:32:57',3,NULL,NULL,1),(7,'P-2001','7702001','Amoxicilina 500 mg','Amoxicilina 500 mg',2,1,3,NULL,25000.0000,12000.0000,12000.0000,5.0000,100.0000,1,1,1,'2026-09-06 08:49:49',NULL,NULL,NULL,2),(8,'P-2002','7702002','Alimento Royal Canin 10 kg','Alimento Royal Canin 10 kg',1,2,1,NULL,185000.0000,150000.0000,150000.0000,3.0000,30.0000,1,1,1,'2026-09-06 08:49:50',NULL,NULL,NULL,2),(9,'P-2003','7702003','Jeringa 5 ml','Jeringa 5 ml',2,1,NULL,NULL,2500.0000,1200.0000,1200.0000,20.0000,500.0000,1,1,1,'2026-09-06 08:49:50',NULL,NULL,NULL,2),(10,'ALI-001','ALI-001','Alimento Canino Adulto Royal Canin 15kg','Alimento seco premium para perros adultos',1,5,1,NULL,95.0000,75.0000,78.0000,5.0000,40.0000,1,1,1,'2026-09-12 11:10:52',3,NULL,NULL,1),(11,'ALI-002','ALI-002','Alimento Canino Puppy Royal Canin 7kg','Alimento seco para cachorros',1,5,1,NULL,62.0000,48.0000,50.0000,5.0000,40.0000,1,1,1,'2026-09-12 11:10:53',3,NULL,NULL,1),(12,'ALI-003','ALI-003','Alimento Felino Adulto Hills 3kg','Alimento seco para gatos adultos',1,5,2,NULL,55.0000,42.0000,44.0000,5.0000,40.0000,1,1,1,'2026-09-12 11:10:53',3,NULL,NULL,1),(13,'ALI-004','ALI-004','Alimento Felino Kitten Hills 1.5kg','Alimento seco para gatitos',1,5,2,NULL,34.0000,26.0000,27.0000,5.0000,40.0000,1,1,1,'2026-09-12 11:10:53',3,NULL,NULL,1),(14,'ALI-005','ALI-005','Alimento Urinario Felino Prescription 2kg','Dieta cl├¡nica para problemas urinarios',1,5,2,NULL,78.0000,60.0000,62.0000,5.0000,30.0000,1,1,1,'2026-09-12 11:10:53',3,NULL,NULL,1),(15,'ALI-006','ALI-006','Alimento Gastrointestinal Canino 4kg','Dieta cl├¡nica gastrointestinal',1,5,2,NULL,71.0000,55.0000,57.0000,5.0000,30.0000,1,1,1,'2026-09-12 11:10:53',3,NULL,NULL,1),(16,'ALI-007','ALI-007','Alimento Senior Canino Royal Canin 12kg','Alimento para perros geri├ítricos',1,5,1,NULL,89.0000,69.0000,72.0000,5.0000,40.0000,1,1,1,'2026-09-12 11:10:53',3,NULL,NULL,1),(17,'ALI-008','ALI-008','Alimento Humedo Canino Pouch 85g','Pouch humedo para perros adultos',1,1,1,NULL,3.5000,2.6000,2.7000,10.0000,60.0000,1,1,1,'2026-09-12 11:10:53',3,NULL,NULL,1),(18,'ALI-009','ALI-009','Alimento Humedo Felino Lata 95g','Lata de alimento humedo felino',1,1,1,NULL,3.2000,2.4000,2.5000,10.0000,60.0000,1,1,1,'2026-09-12 11:10:54',3,NULL,NULL,1),(19,'FAR-001','FAR-001','Amoxicilina 500mg x10 tab','Antibi├│tico de amplio espectro',2,3,3,NULL,18.0000,12.5000,13.0000,5.0000,50.0000,1,1,1,'2026-09-12 11:10:54',3,NULL,NULL,1),(20,'FAR-002','FAR-002','Amoxicilina Trihidrato 15% Susp 50ml','Suspensi├│n antibi├│tica oral',2,4,3,NULL,22.0000,15.0000,16.0000,5.0000,40.0000,1,1,1,'2026-09-12 11:10:54',3,NULL,NULL,1),(21,'FAR-003','FAR-003','Enrofloxacina 100mg x8 tab','Antibi├│tico fluoroquinolona',2,3,4,NULL,25.0000,17.5000,18.0000,5.0000,40.0000,1,1,1,'2026-09-12 11:10:54',3,NULL,NULL,1),(22,'FAR-004','FAR-004','Panacur 2.5g x3 sobres','Antiparasitario interno',2,2,3,NULL,15.0000,10.0000,10.5000,10.0000,50.0000,1,1,1,'2026-09-12 11:10:54',3,NULL,NULL,1),(23,'FAR-005','FAR-005','Carprofeno 75mg x6 tab','Antiinflamatorio no esteroide',2,3,4,NULL,28.0000,19.5000,20.0000,5.0000,40.0000,1,1,1,'2026-09-12 11:10:54',3,NULL,NULL,1),(24,'FAR-006','FAR-006','Frontline Plus Caninos 20-40kg','Antipulgas y garrapatas',2,2,3,NULL,45.0000,32.0000,33.0000,5.0000,50.0000,1,1,1,'2026-09-12 11:10:55',3,NULL,NULL,1),(25,'FAR-007','FAR-007','Ivermectina 1% Soluci├│n 50ml','Endectocida inyectable',2,4,3,NULL,30.0000,21.0000,22.0000,5.0000,40.0000,1,1,1,'2026-09-12 11:10:55',3,NULL,NULL,1),(26,'FAR-008','FAR-008','Meloxicam 2mg x10 tab','Antiinflamatorio analg├®sico',2,3,4,NULL,16.0000,11.0000,11.5000,5.0000,40.0000,1,1,1,'2026-09-12 11:10:55',3,NULL,NULL,1),(27,'FAR-009','FAR-009','Desparasitante Susp Abderm 30ml','Suspensi├│n desparasitante',2,4,3,NULL,12.0000,8.0000,8.5000,10.0000,50.0000,1,1,1,'2026-09-12 11:10:55',3,NULL,NULL,1),(28,'SUP-001','SUP-001','Pet-Multivit 60ml','Multivitam├¡nico l├¡quido',3,4,NULL,NULL,20.0000,13.5000,14.0000,5.0000,30.0000,1,1,1,'2026-09-12 11:10:55',3,NULL,NULL,1),(29,'SUP-002','SUP-002','Probi├│tico Canino x10 sobres','Fibra prebi├│tica y probi├│ticos',3,2,NULL,NULL,24.0000,16.0000,17.0000,5.0000,30.0000,1,1,1,'2026-09-12 11:10:55',3,NULL,NULL,1),(30,'SUP-003','SUP-003','Chondro Glucosamina 90 tab','Para articulaciones',3,4,NULL,NULL,35.0000,24.0000,25.0000,5.0000,30.0000,1,1,1,'2026-09-12 11:10:55',3,NULL,NULL,1),(31,'SUP-004','SUP-004','Omega 3 Felino 60 caps','├ücidos grasos esenciales',3,4,NULL,NULL,28.0000,19.0000,20.0000,5.0000,30.0000,1,1,1,'2026-09-12 11:10:55',3,NULL,NULL,1),(32,'SUP-005','SUP-005','Pasta Vitaminica NuVita 120g','Complemento vitaminico',3,4,NULL,NULL,18.0000,12.0000,13.0000,5.0000,30.0000,1,1,1,'2026-09-12 11:10:56',3,NULL,NULL,1),(33,'SUP-006','SUP-006','Hierro y Complejo B 100ml','Antian├®mico',3,4,NULL,NULL,14.0000,9.5000,10.0000,5.0000,30.0000,1,1,1,'2026-09-12 11:10:56',3,NULL,NULL,1),(34,'SUP-007','SUP-007','Calcio Canino Polvo 250g','Suplemento de calcio',3,4,NULL,NULL,22.0000,15.5000,16.0000,5.0000,30.0000,1,1,1,'2026-09-12 11:10:56',3,NULL,NULL,1),(35,'SUP-008','SUP-008','Amino├ícidos Renergen 50ml','Recuperaci├│n y anabolismo',3,4,NULL,NULL,26.0000,18.0000,19.0000,5.0000,30.0000,1,1,1,'2026-09-12 11:10:56',3,NULL,NULL,1),(36,'HIG-001','HIG-001','Shampoo Antipulgas Felino 250ml','Higiene y control de pulgas',4,4,NULL,NULL,17.0000,11.5000,12.0000,5.0000,40.0000,1,1,1,'2026-09-12 11:10:56',3,NULL,NULL,1),(37,'HIG-002','HIG-002','Shampoo Neutro Hipoalerg├®nico 300ml','Lavado suave piel sensible',4,4,NULL,NULL,22.0000,15.0000,16.0000,5.0000,40.0000,1,1,1,'2026-09-12 11:10:57',3,NULL,NULL,1),(38,'HIG-003','HIG-003','Jab├│n Antibacteriano Quir├║rgico','Para limpieza prequir├║rgica',4,1,NULL,NULL,12.0000,8.0000,8.5000,5.0000,40.0000,1,1,1,'2026-09-12 11:10:57',3,NULL,NULL,1),(39,'HIG-004','HIG-004','Desinfectante Amonio Cuaternario 1L','Desinfecci├│n de ├íreas',4,7,NULL,NULL,16.0000,10.5000,11.0000,5.0000,30.0000,1,1,1,'2026-09-12 11:10:57',3,NULL,NULL,1),(40,'HIG-005','HIG-005','Loci├│n Alcoh├│lica Patitas 500ml','Higiene de patas',4,8,NULL,NULL,14.0000,9.0000,9.5000,5.0000,40.0000,1,1,1,'2026-09-12 11:10:57',3,NULL,NULL,1),(41,'HIG-006','HIG-006','Cepillo Dental Canino + Pasta','Kit de higiene dental',4,1,NULL,NULL,15.0000,10.0000,10.5000,5.0000,40.0000,1,1,1,'2026-09-12 11:10:57',3,NULL,NULL,1),(42,'HIG-007','HIG-007','Toallas H├║medas de Limpieza 40u','Toallitas de aseo r├ípido',4,2,NULL,NULL,13.0000,8.5000,9.0000,5.0000,40.0000,1,1,1,'2026-09-12 11:10:57',3,NULL,NULL,1),(43,'HIG-008','HIG-008','Limpiador Otol├│gico Cortex 120ml','Limpieza de o├¡dos',4,4,NULL,NULL,24.0000,16.5000,17.0000,5.0000,40.0000,1,1,1,'2026-09-12 11:10:57',3,NULL,NULL,1),(44,'ACC-001','ACC-001','Correa Pet Hunter M 200cm','Correa de adiestramiento',5,1,NULL,NULL,28.0000,19.0000,20.0000,3.0000,30.0000,1,1,1,'2026-09-12 11:10:58',3,NULL,NULL,1),(45,'ACC-002','ACC-002','Arn├®s Ajustable Canino Talla M','Arn├®s de seguridad',5,1,NULL,NULL,22.0000,15.0000,16.0000,3.0000,30.0000,1,1,1,'2026-09-12 11:10:58',3,NULL,NULL,1),(46,'ACC-003','ACC-003','Collar Reflectivo 45cm','Collar con reflectivo',5,1,NULL,NULL,10.0000,6.5000,7.0000,5.0000,40.0000,1,1,1,'2026-09-12 11:10:58',3,NULL,NULL,1),(47,'ACC-004','ACC-004','Placa Identificaci├│n Personalizada','Placa grabada con nombre y tel├®fono',5,1,NULL,NULL,8.5000,5.0000,5.5000,5.0000,40.0000,1,1,1,'2026-09-12 11:10:58',3,NULL,NULL,1),(48,'ACC-005','ACC-005','Camita Plegable Max 60cm','Cama c├│moda plegable',5,1,NULL,NULL,45.0000,32.0000,33.0000,2.0000,20.0000,1,1,1,'2026-09-12 11:10:58',3,NULL,NULL,1),(49,'ACC-006','ACC-006','Comedero Antiansiedad','Comedero lento',5,1,NULL,NULL,18.5000,12.0000,13.0000,5.0000,30.0000,1,1,1,'2026-09-12 11:10:58',3,NULL,NULL,1),(50,'ACC-007','ACC-007','Bebedero Fuente 1.5L','Fuente de agua con filtro',5,1,NULL,NULL,30.0000,21.0000,22.0000,3.0000,20.0000,1,1,1,'2026-09-12 11:10:58',3,NULL,NULL,1),(51,'ACC-008','ACC-008','Correa Retr├íctil 5m','Correa extensible',5,1,NULL,NULL,25.0000,17.5000,18.0000,3.0000,30.0000,1,1,1,'2026-09-12 11:10:58',3,NULL,NULL,1),(52,'EQU-001','EQU-001','Jeringa 5ml x100','Jeringas desechables',6,1,NULL,NULL,20.0000,14.0000,15.0000,5.0000,30.0000,1,1,1,'2026-09-12 11:10:58',3,NULL,NULL,1),(53,'EQU-002','EQU-002','Aguja 21G x50','Agujas hipod├®rmicas',6,1,NULL,NULL,15.0000,10.5000,11.0000,5.0000,30.0000,1,1,1,'2026-09-12 11:10:58',3,NULL,NULL,1),(54,'EQU-003','EQU-003','Suero Fisiol├│gico 500ml','Soluci├│n salina',6,7,NULL,NULL,6.5000,4.0000,4.3000,10.0000,60.0000,1,1,1,'2026-09-12 11:10:59',3,NULL,NULL,1),(55,'EQU-004','EQU-004','Gasas Est├®riles 10cm x50','Gasa quir├║rgica est├®ril',6,2,NULL,NULL,9.5000,6.0000,6.5000,5.0000,30.0000,1,1,1,'2026-09-12 11:10:59',3,NULL,NULL,1),(56,'EQU-005','EQU-005','Guantes de Cirug├¡a Talla M x50','Guantes est├®riles',6,2,NULL,NULL,22.0000,15.5000,16.0000,5.0000,30.0000,1,1,1,'2026-09-12 11:10:59',3,NULL,NULL,1),(57,'EQU-006','EQU-006','Algod├│n M├®dico 500g','Algod├│n absorbente',6,1,NULL,NULL,8.0000,5.5000,6.0000,5.0000,30.0000,1,1,1,'2026-09-12 11:10:59',3,NULL,NULL,1),(58,'EQU-007','EQU-007','Vendaje El├ístico 5cm x4m','Venda de sujeci├│n',6,1,NULL,NULL,12.5000,8.0000,8.5000,5.0000,30.0000,1,1,1,'2026-09-12 11:10:59',3,NULL,NULL,1),(59,'EQU-008','EQU-008','Term├│metro Digital Rectal','Term├│metro veterinario',6,1,NULL,NULL,40.0000,28.0000,30.0000,3.0000,20.0000,1,1,1,'2026-09-12 11:10:59',3,NULL,NULL,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `proveedores` (
  `IdProveedor` int NOT NULL AUTO_INCREMENT,
  `TipoDocumento` varchar(20) DEFAULT NULL,
  `NumeroDocumento` varchar(30) DEFAULT NULL,
  `Nit` varchar(30) DEFAULT NULL,
  `Nombre` varchar(150) NOT NULL,
  `Telefono` varchar(30) DEFAULT NULL,
  `Email` varchar(150) DEFAULT NULL,
  `Direccion` varchar(250) DEFAULT NULL,
  `IdCiudad` int DEFAULT NULL,
  `Contacto` varchar(100) DEFAULT NULL,
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaModificacion` datetime DEFAULT NULL,
  `UsuarioIdModificacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdProveedor`),
  KEY `ix_proveedor_ciudad` (`IdCiudad`),
  KEY `idx_proveedores_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_proveedor_ciudad` FOREIGN KEY (`IdCiudad`) REFERENCES `ciudades` (`Id`),
  CONSTRAINT `fk_proveedores_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `proveedores` VALUES (1,'NIT','900999777-0','900999777-0','Proveedor Pruebas SAS','3150000000','proveedor@pruebas.com','Cra 45 # 10-20',1,'Proveedor Test',1,'2026-09-06 08:49:49',NULL,NULL,NULL,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `recetas` (
  `IdReceta` int NOT NULL AUTO_INCREMENT,
  `IdHistoriaClinica` int NOT NULL,
  `Fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `IdVeterinario` int NOT NULL,
  `Observaciones` text COLLATE utf8mb4_unicode_ci,
  `IndicacionesGenerales` text COLLATE utf8mb4_unicode_ci,
  `Estado` enum('Activa','Dispensada','Cancelada') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activa',
  `FechaCreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdReceta`),
  KEY `fk_recetas_veterinario` (`IdVeterinario`),
  KEY `fk_recetas_usuario` (`UsuarioIdCreacion`),
  KEY `idx_recetas_historia` (`IdHistoriaClinica`),
  KEY `idx_recetas_fecha` (`Fecha`),
  KEY `idx_recetas_estado` (`Estado`),
  KEY `idx_recetas_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_recetas_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`),
  CONSTRAINT `fk_recetas_historia` FOREIGN KEY (`IdHistoriaClinica`) REFERENCES `historiasclinicas` (`IdHistoriaClinica`),
  CONSTRAINT `fk_recetas_usuario` FOREIGN KEY (`UsuarioIdCreacion`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `fk_recetas_veterinario` FOREIGN KEY (`IdVeterinario`) REFERENCES `veterinarios` (`IdVeterinario`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `recetas` VALUES (1,3,'2026-09-04 13:13:32',7,'sdfsdf',' sdfssdf','Activa','2026-09-04 13:13:32',3,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registroanestesico` (
  `IdRegistroAnestesico` int NOT NULL AUTO_INCREMENT,
  `IdCirugia` int NOT NULL,
  `MedicamentosAnestesicos` text COLLATE utf8mb4_unicode_ci,
  `Dosis` text COLLATE utf8mb4_unicode_ci,
  `HoraAdministracion` time DEFAULT NULL,
  `ViaAdministracion` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `HoraInicio` time DEFAULT NULL,
  `HoraFin` time DEFAULT NULL,
  `SignosVitales` text COLLATE utf8mb4_unicode_ci,
  `Observaciones` text COLLATE utf8mb4_unicode_ci,
  `Complicaciones` text COLLATE utf8mb4_unicode_ci,
  `FechaCreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdRegistroAnestesico`),
  UNIQUE KEY `idx_anestesico_cirugia` (`IdCirugia`),
  KEY `fk_anestesico_usuario` (`UsuarioIdCreacion`),
  KEY `idx_registroanestesico_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_anestesico_cirugia` FOREIGN KEY (`IdCirugia`) REFERENCES `cirugias` (`IdCirugia`),
  CONSTRAINT `fk_anestesico_usuario` FOREIGN KEY (`UsuarioIdCreacion`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `fk_registroanestesico_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registropostoperatorio` (
  `IdRegistroPostoperatorio` int NOT NULL AUTO_INCREMENT,
  `IdCirugia` int NOT NULL,
  `EstadoPostoperatorio` text COLLATE utf8mb4_unicode_ci,
  `Medicamentos` text COLLATE utf8mb4_unicode_ci,
  `Tratamiento` text COLLATE utf8mb4_unicode_ci,
  `Recomendaciones` text COLLATE utf8mb4_unicode_ci,
  `Alimentacion` text COLLATE utf8mb4_unicode_ci,
  `Restricciones` text COLLATE utf8mb4_unicode_ci,
  `Cuidados` text COLLATE utf8mb4_unicode_ci,
  `SignosDeAlarma` text COLLATE utf8mb4_unicode_ci,
  `FechaControl` date DEFAULT NULL,
  `Observaciones` text COLLATE utf8mb4_unicode_ci,
  `FechaCreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdRegistroPostoperatorio`),
  UNIQUE KEY `idx_postoperatorio_cirugia` (`IdCirugia`),
  KEY `fk_postoperatorio_usuario` (`UsuarioIdCreacion`),
  KEY `idx_registropostoperatorio_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_postoperatorio_cirugia` FOREIGN KEY (`IdCirugia`) REFERENCES `cirugias` (`IdCirugia`),
  CONSTRAINT `fk_postoperatorio_usuario` FOREIGN KEY (`UsuarioIdCreacion`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `fk_registropostoperatorio_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `registropreoperatorio` (
  `IdRegistroPreoperatorio` int NOT NULL AUTO_INCREMENT,
  `IdCirugia` int NOT NULL,
  `Peso` decimal(5,2) DEFAULT NULL,
  `Temperatura` decimal(4,1) DEFAULT NULL,
  `FrecuenciaCardiaca` int DEFAULT NULL,
  `FrecuenciaRespiratoria` int DEFAULT NULL,
  `EstadoGeneral` text COLLATE utf8mb4_unicode_ci,
  `ExamenesPrequirurgicos` text COLLATE utf8mb4_unicode_ci,
  `RiesgoAnestesico` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Ayuno` text COLLATE utf8mb4_unicode_ci,
  `Observaciones` text COLLATE utf8mb4_unicode_ci,
  `FechaCreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdRegistroPreoperatorio`),
  UNIQUE KEY `idx_preoperatorio_cirugia` (`IdCirugia`),
  KEY `fk_preoperatorio_usuario` (`UsuarioIdCreacion`),
  KEY `idx_registropreoperatorio_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_preoperatorio_cirugia` FOREIGN KEY (`IdCirugia`) REFERENCES `cirugias` (`IdCirugia`),
  CONSTRAINT `fk_preoperatorio_usuario` FOREIGN KEY (`UsuarioIdCreacion`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `fk_registropreoperatorio_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `roles` (
  `IdRol` int NOT NULL AUTO_INCREMENT,
  `IdEmpresa` int DEFAULT NULL,
  `Nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Descripcion` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaModificacion` datetime DEFAULT NULL,
  `UsuarioIdModificacion` int DEFAULT NULL,
  PRIMARY KEY (`IdRol`),
  UNIQUE KEY `uk_rol_empresa_nombre` (`IdEmpresa`,`Nombre`),
  KEY `idx_rol_empresa` (`IdEmpresa`),
  CONSTRAINT `fk_roles_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `roles` VALUES (1,1,'ADMINISTRADOR','Acceso total a todos los m├│dulos',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(2,1,'VETERINARIO','Atenci├│n cl├¡nica y citas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(3,1,'VENDEDOR','Ventas y atenci├│n al cliente',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(4,1,'AUXILIAR','Rol auxiliar editado',1,'2026-09-04 18:20:10',NULL,'2026-09-05 08:46:42',3),(5,1,'BODEGUERO','Inventarios y bodegas',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(6,1,'RECEPCIONISTA','Citas y recepci├│n',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(7,1,'GERENTE','Direcci├│n y reportes',1,'2026-09-04 18:20:10',NULL,NULL,NULL),(8,NULL,'SUPERADMIN','Administraci├│n global del sistema (RF-022)',1,'2026-09-04 19:16:57',NULL,NULL,NULL);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `rolpermisos` (
  `IdRol` int NOT NULL,
  `IdPermiso` int NOT NULL,
  `TipoAcceso` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PERMITIR' COMMENT 'PERMITIR / DENEGAR',
  `AsignadoPor` int DEFAULT NULL,
  `FechaAsignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdRol`,`IdPermiso`),
  KEY `idx_rp_permiso` (`IdPermiso`),
  KEY `fk_rp_asignado_por` (`AsignadoPor`),
  CONSTRAINT `fk_rp_asignado_por` FOREIGN KEY (`AsignadoPor`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `fk_rp_permiso` FOREIGN KEY (`IdPermiso`) REFERENCES `permisos` (`IdPermiso`),
  CONSTRAINT `fk_rp_rol` FOREIGN KEY (`IdRol`) REFERENCES `roles` (`IdRol`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `rolpermisos` VALUES (1,1,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,2,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,3,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,4,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,5,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,6,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,7,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,8,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,9,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,10,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,11,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,12,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,13,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,14,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,15,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,16,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,17,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,18,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,19,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,20,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,21,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,22,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,23,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,24,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,25,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,26,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,27,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,28,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,29,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,30,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,31,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,32,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,33,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,34,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,35,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,36,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,37,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,38,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,39,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,40,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,41,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,42,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,43,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,44,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,45,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,46,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,47,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,48,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,49,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,50,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,51,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,52,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,53,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,54,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,55,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,56,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,57,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,58,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,59,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,60,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,61,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,62,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,63,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,64,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,65,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,66,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,67,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,68,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,69,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,70,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,71,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,72,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,73,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,74,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,75,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,76,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,77,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,78,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,79,'PERMITIR',NULL,'2026-09-05 08:11:36'),(1,166,'PERMITIR',NULL,'2026-09-06 08:27:20'),(1,167,'PERMITIR',NULL,'2026-09-06 08:27:20'),(1,168,'PERMITIR',NULL,'2026-09-06 08:27:20'),(1,169,'PERMITIR',NULL,'2026-09-06 08:27:20'),(1,170,'PERMITIR',NULL,'2026-09-06 09:25:15'),(2,16,'PERMITIR',3,'2026-09-13 11:46:59'),(2,17,'PERMITIR',3,'2026-09-13 11:46:59'),(2,18,'PERMITIR',3,'2026-09-13 11:46:59'),(2,20,'PERMITIR',3,'2026-09-13 11:46:59'),(2,21,'PERMITIR',3,'2026-09-13 11:46:59'),(2,22,'PERMITIR',3,'2026-09-13 11:46:59'),(2,24,'PERMITIR',3,'2026-09-13 11:46:59'),(2,28,'PERMITIR',3,'2026-09-13 11:46:59'),(2,29,'PERMITIR',3,'2026-09-13 11:46:59'),(2,30,'PERMITIR',3,'2026-09-13 11:46:59'),(2,32,'PERMITIR',3,'2026-09-13 11:46:59'),(2,33,'PERMITIR',3,'2026-09-13 11:46:59'),(2,34,'PERMITIR',3,'2026-09-13 11:46:59'),(2,35,'PERMITIR',3,'2026-09-13 11:46:59'),(2,36,'PERMITIR',3,'2026-09-13 11:46:59'),(2,38,'PERMITIR',3,'2026-09-13 11:46:59'),(2,39,'PERMITIR',3,'2026-09-13 11:46:59'),(2,40,'PERMITIR',3,'2026-09-13 11:46:59'),(2,170,'PERMITIR',3,'2026-09-13 11:46:59'),(3,7,'PERMITIR',3,'2026-09-13 14:31:31'),(3,16,'PERMITIR',3,'2026-09-13 14:31:31'),(3,17,'PERMITIR',3,'2026-09-13 14:31:31'),(3,18,'PERMITIR',3,'2026-09-13 14:31:31'),(3,20,'PERMITIR',3,'2026-09-13 14:31:31'),(3,21,'PERMITIR',3,'2026-09-13 14:31:31'),(3,22,'PERMITIR',3,'2026-09-13 14:31:31'),(3,24,'PERMITIR',3,'2026-09-13 14:31:31'),(3,28,'PERMITIR',3,'2026-09-13 14:31:31'),(3,40,'PERMITIR',3,'2026-09-13 14:31:31'),(3,44,'PERMITIR',3,'2026-09-13 14:31:31'),(3,48,'PERMITIR',3,'2026-09-13 14:31:31'),(3,58,'PERMITIR',3,'2026-09-13 14:31:31'),(3,63,'PERMITIR',3,'2026-09-13 14:31:31'),(3,64,'PERMITIR',3,'2026-09-13 14:31:31'),(3,65,'PERMITIR',3,'2026-09-13 14:31:31'),(3,66,'PERMITIR',3,'2026-09-13 14:31:31'),(3,67,'PERMITIR',3,'2026-09-13 14:31:31'),(3,68,'PERMITIR',3,'2026-09-13 14:31:31'),(3,69,'PERMITIR',3,'2026-09-13 14:31:31'),(3,70,'PERMITIR',3,'2026-09-13 14:31:31'),(3,77,'PERMITIR',3,'2026-09-13 14:31:31'),(3,78,'PERMITIR',3,'2026-09-13 14:31:31'),(3,79,'PERMITIR',3,'2026-09-13 14:31:31'),(3,166,'PERMITIR',3,'2026-09-13 14:31:31'),(3,171,'PERMITIR',3,'2026-09-13 14:31:31'),(4,7,'PERMITIR',3,'2026-09-13 11:46:59'),(4,16,'PERMITIR',3,'2026-09-13 11:46:59'),(4,17,'PERMITIR',3,'2026-09-13 11:46:59'),(4,18,'PERMITIR',3,'2026-09-13 11:46:59'),(4,20,'PERMITIR',3,'2026-09-13 11:46:59'),(4,21,'PERMITIR',3,'2026-09-13 11:46:59'),(4,22,'PERMITIR',3,'2026-09-13 11:46:59'),(4,24,'PERMITIR',3,'2026-09-13 11:46:59'),(4,28,'PERMITIR',3,'2026-09-13 11:46:59'),(4,29,'PERMITIR',3,'2026-09-13 11:46:59'),(4,30,'PERMITIR',3,'2026-09-13 11:46:59'),(4,40,'PERMITIR',3,'2026-09-13 11:46:59'),(4,44,'PERMITIR',3,'2026-09-13 11:46:59'),(4,48,'PERMITIR',3,'2026-09-13 11:46:59'),(4,52,'PERMITIR',3,'2026-09-13 11:46:59'),(4,58,'PERMITIR',3,'2026-09-13 11:46:59'),(4,59,'PERMITIR',3,'2026-09-13 11:46:59'),(4,63,'PERMITIR',3,'2026-09-13 11:46:59'),(4,64,'PERMITIR',3,'2026-09-13 11:46:59'),(4,77,'PERMITIR',3,'2026-09-13 11:46:59'),(4,166,'PERMITIR',3,'2026-09-13 11:46:59'),(4,170,'PERMITIR',3,'2026-09-13 11:46:59'),(4,171,'PERMITIR',3,'2026-09-13 11:46:59'),(5,7,'PERMITIR',3,'2026-09-13 11:46:59'),(5,44,'PERMITIR',3,'2026-09-13 11:46:59'),(5,45,'PERMITIR',3,'2026-09-13 11:46:59'),(5,46,'PERMITIR',3,'2026-09-13 11:46:59'),(5,48,'PERMITIR',3,'2026-09-13 11:46:59'),(5,49,'PERMITIR',3,'2026-09-13 11:46:59'),(5,50,'PERMITIR',3,'2026-09-13 11:46:59'),(5,52,'PERMITIR',3,'2026-09-13 11:46:59'),(5,53,'PERMITIR',3,'2026-09-13 11:46:59'),(5,54,'PERMITIR',3,'2026-09-13 11:46:59'),(5,55,'PERMITIR',3,'2026-09-13 11:46:59'),(5,56,'PERMITIR',3,'2026-09-13 11:46:59'),(5,57,'PERMITIR',3,'2026-09-13 11:46:59'),(5,58,'PERMITIR',3,'2026-09-13 11:46:59'),(5,63,'PERMITIR',3,'2026-09-13 11:46:59'),(5,71,'PERMITIR',3,'2026-09-13 11:46:59'),(5,171,'PERMITIR',3,'2026-09-13 11:46:59'),(6,7,'PERMITIR',3,'2026-09-13 11:46:59'),(6,16,'PERMITIR',3,'2026-09-13 11:46:59'),(6,17,'PERMITIR',3,'2026-09-13 11:46:59'),(6,18,'PERMITIR',3,'2026-09-13 11:46:59'),(6,20,'PERMITIR',3,'2026-09-13 11:46:59'),(6,21,'PERMITIR',3,'2026-09-13 11:46:59'),(6,22,'PERMITIR',3,'2026-09-13 11:46:59'),(6,24,'PERMITIR',3,'2026-09-13 11:46:59'),(6,28,'PERMITIR',3,'2026-09-13 11:46:59'),(6,29,'PERMITIR',3,'2026-09-13 11:46:59'),(6,30,'PERMITIR',3,'2026-09-13 11:46:59'),(6,40,'PERMITIR',3,'2026-09-13 11:46:59'),(6,44,'PERMITIR',3,'2026-09-13 11:46:59'),(6,48,'PERMITIR',3,'2026-09-13 11:46:59'),(6,63,'PERMITIR',3,'2026-09-13 11:46:59'),(6,166,'PERMITIR',3,'2026-09-13 11:46:59'),(6,170,'PERMITIR',3,'2026-09-13 11:46:59'),(7,7,'PERMITIR',3,'2026-09-13 11:47:00'),(7,16,'PERMITIR',3,'2026-09-13 11:47:00'),(7,20,'PERMITIR',3,'2026-09-13 11:47:00'),(7,24,'PERMITIR',3,'2026-09-13 11:47:00'),(7,28,'PERMITIR',3,'2026-09-13 11:47:00'),(7,33,'PERMITIR',3,'2026-09-13 11:47:00'),(7,40,'PERMITIR',3,'2026-09-13 11:47:00'),(7,44,'PERMITIR',3,'2026-09-13 11:47:00'),(7,48,'PERMITIR',3,'2026-09-13 11:47:00'),(7,52,'PERMITIR',3,'2026-09-13 11:47:00'),(7,58,'PERMITIR',3,'2026-09-13 11:47:00'),(7,63,'PERMITIR',3,'2026-09-13 11:47:00'),(7,71,'PERMITIR',3,'2026-09-13 11:47:00'),(7,72,'PERMITIR',3,'2026-09-13 11:47:00'),(7,73,'PERMITIR',3,'2026-09-13 11:47:00'),(7,74,'PERMITIR',3,'2026-09-13 11:47:00'),(7,77,'PERMITIR',3,'2026-09-13 11:47:00'),(7,166,'PERMITIR',3,'2026-09-13 11:47:00'),(7,170,'PERMITIR',3,'2026-09-13 11:47:00'),(7,171,'PERMITIR',3,'2026-09-13 11:47:00'),(8,155,'PERMITIR',NULL,'2026-09-05 15:39:30'),(8,156,'PERMITIR',NULL,'2026-09-05 15:39:30'),(8,157,'PERMITIR',NULL,'2026-09-05 15:39:30'),(8,158,'PERMITIR',NULL,'2026-09-05 15:39:30'),(8,159,'PERMITIR',NULL,'2026-09-05 15:39:30'),(8,160,'PERMITIR',NULL,'2026-09-05 15:39:30'),(8,161,'PERMITIR',NULL,'2026-09-05 15:39:30'),(8,162,'PERMITIR',NULL,'2026-09-05 15:39:30'),(8,163,'PERMITIR',NULL,'2026-09-05 15:39:30'),(8,164,'PERMITIR',NULL,'2026-09-05 15:39:30'),(8,165,'PERMITIR',NULL,'2026-09-05 15:39:30');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sedestiendas` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `CodigoSede` varchar(15) DEFAULT NULL,
  `NombreSede` varchar(150) DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  `Estatus` tinyint(1) DEFAULT NULL,
  `DireccionSede` varchar(90) DEFAULT NULL,
  `ContactoSede` varchar(120) DEFAULT NULL,
  `CorreoElectronico` varchar(150) DEFAULT NULL,
  `TelelenoBodega` varchar(15) DEFAULT NULL,
  `IdCiudad` int DEFAULT NULL,
  `IdBodega` int DEFAULT NULL,
  `TiendaActiva` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_SedesTiendas_IdCiudad` (`IdCiudad`),
  KEY `IX_SedesTiendas_IdBodega` (`IdBodega`),
  CONSTRAINT `FK_SedesCiudad` FOREIGN KEY (`IdCiudad`) REFERENCES `ciudades` (`Id`),
  CONSTRAINT `FK_TiendasBodegas` FOREIGN KEY (`IdBodega`) REFERENCES `bodegas` (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `sedestiendas` VALUES (1,'SED-01','Sede Principal',2,1,'Calle Test 123','CLIENTE TEST','sede@vetpruebas.com',NULL,1,5,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `servicios` (
  `IdServicio` int NOT NULL AUTO_INCREMENT,
  `IdCategoriaServicio` int NOT NULL,
  `Nombre` varchar(150) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Descripcion` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Precio` decimal(18,2) NOT NULL DEFAULT '0.00',
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `IdUsuarioCreacion` int NOT NULL,
  `FechaModificacion` datetime DEFAULT NULL,
  `IdUsuarioModificacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdServicio`),
  KEY `FK_Servicios_Categorias` (`IdCategoriaServicio`),
  KEY `FK_Servicios_UsuarioCreacion` (`IdUsuarioCreacion`),
  KEY `FK_Servicios_UsuarioModificacion` (`IdUsuarioModificacion`),
  KEY `idx_servicios_idempresa` (`IdEmpresa`),
  CONSTRAINT `FK_Servicios_Categorias` FOREIGN KEY (`IdCategoriaServicio`) REFERENCES `categoriasservicio` (`IdCategoriaServicio`),
  CONSTRAINT `fk_servicios_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`),
  CONSTRAINT `FK_Servicios_UsuarioCreacion` FOREIGN KEY (`IdUsuarioCreacion`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `FK_Servicios_UsuarioModificacion` FOREIGN KEY (`IdUsuarioModificacion`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `CK_Servicios_Precio` CHECK ((`Precio` >= 0))
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `servicios` VALUES (2,1,'Consultas','Cns',105000.00,1,'2026-09-01 08:38:06',3,NULL,3,1),(4,1,'Consulta','',80000.00,1,'2026-09-07 15:56:49',3,NULL,3,1),(5,1,'Urgencia','Urgencias',80000.00,1,'2026-09-07 15:56:49',3,NULL,3,1),(6,1,'Revisi├│n','',40000.00,1,'2026-09-07 15:56:49',3,NULL,3,1),(7,1,'An├ílisis','Analisis Laboratorios',30000.00,1,'2026-09-07 15:56:49',3,NULL,3,1),(8,1,'Vacunaci├│n','Vacunacion mascotas',55000.00,1,'2026-09-07 15:56:49',3,NULL,3,1),(9,1,'Cirug├¡a','dfsfsdf',300000.00,1,'2026-09-07 15:56:49',3,NULL,3,1),(10,1,'Otros','',35000.00,1,'2026-09-07 15:56:49',3,NULL,3,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `sesiones` (
  `IdSesion` bigint NOT NULL AUTO_INCREMENT,
  `IdEmpresa` int NOT NULL,
  `UsuarioId` int NOT NULL,
  `FechaIngreso` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `FechaSalida` datetime DEFAULT NULL,
  `UltimoAcceso` datetime DEFAULT NULL,
  `DireccionIP` varchar(45) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `UserAgent` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `EstadoSesion` enum('ACTIVA','CERRADA','EXPIRADA','BLOQUEADA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'ACTIVA',
  PRIMARY KEY (`IdSesion`),
  KEY `idx_sesiones_empresa_fecha` (`IdEmpresa`,`FechaIngreso`),
  KEY `idx_sesiones_usuario` (`UsuarioId`),
  KEY `idx_sesiones_estado` (`EstadoSesion`),
  CONSTRAINT `fk_sesiones_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`),
  CONSTRAINT `fk_sesiones_usuario` FOREIGN KEY (`UsuarioId`) REFERENCES `usuarios` (`UsuarioId`)
) ENGINE=InnoDB AUTO_INCREMENT=119 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Control de sesiones (RF-020)';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `sesiones` VALUES (1,1,3,'2026-09-05 08:21:29',NULL,'2026-09-05 08:21:29','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(2,1,3,'2026-09-05 08:21:33',NULL,'2026-09-05 08:21:33','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(3,1,3,'2026-09-05 08:22:39',NULL,'2026-09-05 08:22:39','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(4,1,3,'2026-09-05 08:22:45',NULL,'2026-09-05 08:22:45','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(5,1,3,'2026-09-05 08:23:14',NULL,'2026-09-05 08:23:14','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(6,1,3,'2026-09-05 08:23:32',NULL,'2026-09-05 08:23:32','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(9,1,3,'2026-09-05 08:26:37',NULL,'2026-09-05 08:26:37','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(10,1,3,'2026-09-05 08:46:27',NULL,'2026-09-05 08:46:27','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(11,1,3,'2026-09-05 08:46:36',NULL,'2026-09-05 08:46:36','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(12,1,3,'2026-09-05 08:46:42',NULL,'2026-09-05 08:46:42','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(13,1,3,'2026-09-05 08:53:05',NULL,'2026-09-05 08:53:05','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(14,1,3,'2026-09-05 08:53:11',NULL,'2026-09-05 08:53:11','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(15,1,3,'2026-09-05 08:53:30',NULL,'2026-09-05 08:53:30','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(18,1,3,'2026-09-05 08:54:13',NULL,'2026-09-05 08:54:13','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(21,1,3,'2026-09-05 08:56:16',NULL,'2026-09-05 08:56:16','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(22,1,3,'2026-09-05 08:56:22',NULL,'2026-09-05 08:56:22','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(23,1,3,'2026-09-05 08:56:27',NULL,'2026-09-05 08:56:27','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(24,1,3,'2026-09-05 09:13:21',NULL,'2026-09-05 09:13:21','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(25,1,3,'2026-09-05 09:13:28',NULL,'2026-09-05 09:13:28','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(26,1,3,'2026-09-05 09:13:48',NULL,'2026-09-05 09:13:48','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(27,1,3,'2026-09-05 09:13:58',NULL,'2026-09-05 09:13:58','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(28,1,3,'2026-09-05 09:14:21',NULL,'2026-09-05 09:14:21','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(29,1,3,'2026-09-05 09:14:31',NULL,'2026-09-05 09:14:31','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(34,1,3,'2026-09-05 09:31:26',NULL,'2026-09-05 09:31:26','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(35,1,3,'2026-09-05 09:31:34',NULL,'2026-09-05 09:31:34','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(36,1,3,'2026-09-05 09:33:25',NULL,'2026-09-05 09:33:25','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(37,1,3,'2026-09-05 09:34:17',NULL,'2026-09-05 09:34:17','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(38,1,3,'2026-09-05 09:35:17',NULL,'2026-09-05 09:35:17','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(39,1,3,'2026-09-05 09:35:23',NULL,'2026-09-05 09:35:23','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(43,1,8,'2026-09-05 15:42:32',NULL,'2026-09-05 15:42:32','::1','node','ACTIVA'),(44,1,8,'2026-09-05 15:42:57',NULL,'2026-09-05 15:42:57','::1','node','ACTIVA'),(45,1,3,'2026-09-05 16:12:18',NULL,'2026-09-05 16:12:18','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(46,1,3,'2026-09-05 16:47:20',NULL,'2026-09-05 16:47:20','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(47,1,3,'2026-09-05 16:53:52',NULL,'2026-09-05 16:53:52','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(48,1,3,'2026-09-05 16:55:23',NULL,'2026-09-05 16:55:23','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(49,1,3,'2026-09-05 16:58:39',NULL,'2026-09-05 16:58:39','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(50,1,3,'2026-09-05 17:32:49',NULL,'2026-09-05 17:32:49','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(51,1,3,'2026-09-06 08:43:26',NULL,'2026-09-06 08:43:26','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(52,1,3,'2026-09-06 09:02:54',NULL,'2026-09-06 09:02:54','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(53,1,3,'2026-09-06 09:09:47',NULL,'2026-09-06 09:09:47','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(54,1,3,'2026-09-06 09:26:50',NULL,'2026-09-06 09:26:50','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(55,1,3,'2026-09-07 09:50:50',NULL,'2026-09-07 09:50:50','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(56,1,3,'2026-09-07 09:51:29',NULL,'2026-09-07 09:51:29','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(57,1,3,'2026-09-07 09:55:48',NULL,'2026-09-07 09:55:48','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(58,1,3,'2026-09-07 09:59:43',NULL,'2026-09-07 09:59:43','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(59,1,3,'2026-09-07 10:00:10',NULL,'2026-09-07 10:00:10','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(60,1,3,'2026-09-07 10:00:55',NULL,'2026-09-07 10:00:55','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(61,1,3,'2026-09-07 10:01:13',NULL,'2026-09-07 10:01:13','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(62,1,3,'2026-09-07 10:02:18',NULL,'2026-09-07 10:02:18','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(63,1,3,'2026-09-07 10:23:14',NULL,'2026-09-07 10:23:14','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(64,1,3,'2026-09-07 10:40:42',NULL,'2026-09-07 10:40:42','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(65,1,3,'2026-09-07 10:45:58',NULL,'2026-09-07 10:45:58','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(66,1,3,'2026-09-07 11:37:14',NULL,'2026-09-07 11:37:14','::1','Mozilla/5.0 (Windows NT; Windows NT 10.0; es-ES) WindowsPowerShell/5.1.19041.3031','ACTIVA'),(67,1,3,'2026-09-07 11:37:23',NULL,'2026-09-07 11:37:23','::1','node','ACTIVA'),(68,1,3,'2026-09-07 11:37:51',NULL,'2026-09-07 11:37:51','::1','node','ACTIVA'),(69,1,3,'2026-09-07 12:15:27',NULL,'2026-09-07 12:15:27','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(70,1,3,'2026-09-07 12:25:14',NULL,'2026-09-07 12:25:14','::1','node','ACTIVA'),(71,1,3,'2026-09-07 12:27:52',NULL,'2026-09-07 12:27:52','::1','node','ACTIVA'),(72,1,3,'2026-09-07 12:43:39',NULL,'2026-09-07 12:43:39','::1','node','ACTIVA'),(73,1,3,'2026-09-07 12:44:35',NULL,'2026-09-07 12:44:35','::1','node','ACTIVA'),(74,1,3,'2026-09-07 12:44:51',NULL,'2026-09-07 12:44:51','::1','node','ACTIVA'),(75,1,3,'2026-09-07 12:45:02',NULL,'2026-09-07 12:45:02','::1','node','ACTIVA'),(76,1,3,'2026-09-07 12:45:18',NULL,'2026-09-07 12:45:18','::1','node','ACTIVA'),(77,1,3,'2026-09-07 12:45:23',NULL,'2026-09-07 12:45:23','::1','node','ACTIVA'),(78,1,3,'2026-09-07 12:45:30',NULL,'2026-09-07 12:45:30','::1','node','ACTIVA'),(79,1,3,'2026-09-07 12:45:38',NULL,'2026-09-07 12:45:38','::1','node','ACTIVA'),(80,1,3,'2026-09-07 12:45:49',NULL,'2026-09-07 12:45:49','::1','node','ACTIVA'),(81,1,3,'2026-09-07 12:45:55',NULL,'2026-09-07 12:45:55','::1','node','ACTIVA'),(82,1,3,'2026-09-07 12:46:41',NULL,'2026-09-07 12:46:41','::1','node','ACTIVA'),(83,1,3,'2026-09-07 12:47:42',NULL,'2026-09-07 12:47:42','::1','node','ACTIVA'),(84,1,3,'2026-09-07 12:54:04',NULL,'2026-09-07 12:54:04','::1','node','ACTIVA'),(85,1,3,'2026-09-07 12:54:58',NULL,'2026-09-07 12:54:58','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(86,1,3,'2026-09-07 13:01:39',NULL,'2026-09-07 13:01:39','::1','node','ACTIVA'),(87,1,3,'2026-09-07 13:02:55',NULL,'2026-09-07 13:02:55','::1','node','ACTIVA'),(88,1,3,'2026-09-07 14:01:27',NULL,'2026-09-07 14:01:27','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(89,1,3,'2026-09-08 11:22:34',NULL,'2026-09-08 11:22:34','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(90,1,3,'2026-09-10 11:58:23',NULL,'2026-09-10 11:58:23','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(91,1,3,'2026-09-10 12:00:54',NULL,'2026-09-10 12:00:54','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(92,1,3,'2026-09-10 12:03:49',NULL,'2026-09-10 12:03:49','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(93,1,3,'2026-09-10 12:05:25',NULL,'2026-09-10 12:05:25','::1','node','ACTIVA'),(94,1,3,'2026-09-10 12:28:18',NULL,'2026-09-10 12:28:18','::1','node','ACTIVA'),(95,1,3,'2026-09-10 12:29:18',NULL,'2026-09-10 12:29:18','::1','node','ACTIVA'),(96,1,3,'2026-09-10 13:08:04',NULL,'2026-09-10 13:08:04','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(97,1,3,'2026-09-10 13:21:36',NULL,'2026-09-10 13:21:36','::1','','ACTIVA'),(98,1,3,'2026-09-10 13:36:20',NULL,'2026-09-10 13:36:20','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(99,1,3,'2026-09-12 09:50:42',NULL,'2026-09-12 09:50:42','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(100,1,3,'2026-09-12 10:15:08',NULL,'2026-09-12 10:15:08','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(101,1,3,'2026-09-12 11:05:26',NULL,'2026-09-12 11:05:26','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(102,1,19,'2026-09-12 11:35:34',NULL,'2026-09-12 11:35:34','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(103,1,3,'2026-09-12 11:37:00',NULL,'2026-09-12 11:37:00','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(104,1,19,'2026-09-12 11:51:38',NULL,'2026-09-12 11:51:38','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(105,1,3,'2026-09-12 11:58:29',NULL,'2026-09-12 11:58:29','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(106,1,19,'2026-09-12 11:59:10',NULL,'2026-09-12 11:59:10','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(107,1,3,'2026-09-12 11:59:47',NULL,'2026-09-12 11:59:47','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(108,1,19,'2026-09-12 12:01:57',NULL,'2026-09-12 12:01:57','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(109,1,19,'2026-09-13 09:43:42',NULL,'2026-09-13 09:43:42','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(110,1,3,'2026-09-13 11:05:22',NULL,'2026-09-13 11:05:22','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(111,1,20,'2026-09-13 11:08:57',NULL,'2026-09-13 11:08:57','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(112,1,21,'2026-09-13 11:11:45',NULL,'2026-09-13 11:11:45','::1','node','ACTIVA'),(113,1,21,'2026-09-13 11:11:51',NULL,'2026-09-13 11:11:51','::1','node','ACTIVA'),(114,1,3,'2026-09-13 14:09:45',NULL,'2026-09-13 14:09:45','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36 Edg/153.0.0.0','ACTIVA'),(115,1,3,'2026-09-13 14:30:01',NULL,'2026-09-13 14:30:01','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(116,1,22,'2026-09-13 14:31:49',NULL,'2026-09-13 14:31:49','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(117,1,3,'2026-09-14 08:41:22',NULL,'2026-09-14 08:41:22','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA'),(118,1,3,'2026-09-14 09:25:20',NULL,'2026-09-14 09:25:20','::1','Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/152.0.0.0 Safari/537.36','ACTIVA');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `signosvitales` (
  `IdSignosVitales` int NOT NULL AUTO_INCREMENT,
  `IdHistoriaClinica` int NOT NULL,
  `Peso` decimal(5,2) DEFAULT NULL,
  `Temperatura` decimal(4,1) DEFAULT NULL,
  `FrecuenciaCardiaca` int DEFAULT NULL,
  `FrecuenciaRespiratoria` int DEFAULT NULL,
  `EstadoHidratacion` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `CondicionCorporal` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Mucosas` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TiempoLlenadoCapilar` int DEFAULT NULL,
  `Observaciones` text COLLATE utf8mb4_unicode_ci,
  `FechaCreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdSignosVitales`),
  KEY `idx_signos_historia` (`IdHistoriaClinica`),
  KEY `idx_signosvitales_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_signos_historia` FOREIGN KEY (`IdHistoriaClinica`) REFERENCES `historiasclinicas` (`IdHistoriaClinica`),
  CONSTRAINT `fk_signosvitales_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB AUTO_INCREMENT=2 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `signosvitales` VALUES (1,3,1.00,2.0,1,1,'2','1','2',1,'sdsdd','2026-09-04 13:11:11',1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suscripcion_modulos` (
  `IdSuscripcion` int NOT NULL,
  `IdModulo` int NOT NULL,
  `PrecioAdicional` decimal(18,2) NOT NULL DEFAULT '0.00',
  `FechaAsignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`IdSuscripcion`,`IdModulo`),
  KEY `idx_sm_modulo` (`IdModulo`),
  CONSTRAINT `fk_susmod_modulo` FOREIGN KEY (`IdModulo`) REFERENCES `modulos` (`idModulos`),
  CONSTRAINT `fk_susmod_suscripcion` FOREIGN KEY (`IdSuscripcion`) REFERENCES `suscripciones` (`IdSuscripcion`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RF-MON-010: m├│dulos ADD-ON contratados fuera del plan';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `suscripciones` (
  `IdSuscripcion` int NOT NULL AUTO_INCREMENT,
  `IdEmpresa` int NOT NULL,
  `IdPlan` int NOT NULL,
  `Estado` enum('PRUEBA','ACTIVA','VENCIDA','SUSPENDIDA','CANCELADA') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PRUEBA',
  `FechaInicio` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `FechaFin` datetime DEFAULT NULL,
  `Periodicidad` enum('MENSUAL','ANUAL','UNICO') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'MENSUAL',
  `AutoRenovacion` tinyint(1) NOT NULL DEFAULT '0',
  `FechaProximaFacturacion` datetime DEFAULT NULL,
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaModificacion` datetime DEFAULT NULL,
  `UsuarioIdModificacion` int DEFAULT NULL,
  PRIMARY KEY (`IdSuscripcion`),
  KEY `idx_sus_empresa` (`IdEmpresa`),
  KEY `idx_sus_plan` (`IdPlan`),
  KEY `idx_sus_estado` (`Estado`),
  KEY `idx_sus_fechafin` (`FechaFin`),
  CONSTRAINT `fk_suscripciones_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`),
  CONSTRAINT `fk_suscripciones_plan` FOREIGN KEY (`IdPlan`) REFERENCES `planes` (`IdPlan`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RF-MON-006: suscripci├│n por empresa';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `suscripciones` VALUES (1,1,3,'ACTIVA','2026-09-05 15:38:47','2026-09-20 15:38:47','MENSUAL',0,NULL,'2026-09-05 15:38:47',NULL,'2026-09-05 15:42:57',8),(3,2,3,'ACTIVA','2026-09-06 08:49:49','2026-10-06 08:49:49','MENSUAL',0,NULL,'2026-09-06 08:49:49',NULL,NULL,NULL);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipodocumento` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Codigo` varchar(10) NOT NULL,
  `Documento` varchar(40) NOT NULL,
  `Estatus` tinyint(1) DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=11 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `tipodocumento` VALUES (1,'NIT','NIT',1,1),(2,'CC','C´┐¢dula de Ciudadan´┐¢a',1,1),(3,'CE','C´┐¢dula de Extranjer´┐¢a',1,1),(4,'PA','Pasaporte',1,1),(5,'RU','RUT',1,1),(6,'NIT','NIT',1,2),(7,'CC','Cedula de Ciudadania',1,2),(8,'CE','Cedula de Extranjeria',1,2),(9,'PA','Pasaporte',1,2),(10,'RU','RUT',1,2);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipoimpuesto` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `NombreImpuesto` varchar(60) NOT NULL,
  `Porcentaje` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  `EsIva` tinyint(1) DEFAULT NULL,
  `Signo` varchar(1) DEFAULT NULL,
  PRIMARY KEY (`Id`)
) ENGINE=InnoDB AUTO_INCREMENT=3 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `tipoimpuesto` VALUES (1,'Imp. a las ventas',5,1,1,'+'),(2,'IVA',19,2,1,'+');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipoinventario` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `NombreInventario` varchar(50) DEFAULT NULL,
  `EsPeriodico` tinyint(1) DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL COMMENT 'Empresa propietaria',
  PRIMARY KEY (`Id`),
  KEY `ix_tipoinventario_idempresa` (`IdEmpresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipomovcaja` (
  `id` int NOT NULL AUTO_INCREMENT,
  `DescTipoMovCaja` varchar(70) NOT NULL,
  `ProvisionCaja` tinyint(1) DEFAULT NULL,
  `Gastos` tinyint(1) DEFAULT NULL,
  `Ventas` tinyint(1) DEFAULT NULL,
  `Prestamo` tinyint(1) DEFAULT NULL,
  `idEmpresa` int NOT NULL,
  `Estatus` tinyint(1) NOT NULL,
  `IdUsuario` int NOT NULL,
  `Signo` varchar(1) DEFAULT NULL,
  `AplicaProveedores` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `tipomovcaja` VALUES (1,'VENTA',0,0,1,0,1,1,3,'+',0),(2,'ABONO CLIENTE',0,0,0,0,1,1,3,'+',0),(3,'OTRO INGRESO',0,0,0,0,1,1,3,'+',0),(4,'GASTO',0,1,0,0,1,1,3,'-',1),(5,'PROVISION',1,0,0,0,1,1,3,'-',1),(6,'PRESTAMO',0,0,0,1,1,1,3,'-',0),(7,'OTRO EGRESO',0,0,0,0,1,1,3,'-',0),(8,'VENTA',0,0,1,0,2,1,16,'+',0),(9,'ABONO CLIENTE',0,0,0,0,2,1,16,'+',0),(10,'OTRO INGRESO',0,0,0,0,2,1,16,'+',0),(11,'GASTO',0,1,0,0,2,1,16,'-',1),(12,'PROVISION',1,0,0,0,2,1,16,'-',1),(13,'PRESTAMO',0,0,0,1,2,1,16,'-',0),(14,'OTRO EGRESO',0,0,0,0,2,1,16,'-',0);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipopersona` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `CodigoPersona` varchar(15) NOT NULL,
  `TipoPersona` varchar(30) NOT NULL,
  `Estatus` tinyint(1) DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL COMMENT 'Empresa propietaria',
  PRIMARY KEY (`Id`),
  KEY `ix_tipopersona_idempresa` (`IdEmpresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipos_limite` (
  `IdTipoLimite` int NOT NULL AUTO_INCREMENT,
  `Codigo` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Nombre` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Descripcion` varchar(300) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Unidad` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  PRIMARY KEY (`IdTipoLimite`),
  UNIQUE KEY `uk_tipolimite_codigo` (`Codigo`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='RF-MON-005: cat├ílogo de tipos de l├¡mite (extensible)';
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `tipos_limite` VALUES (1,'BODEGAS','Bodegas','M├íximo de bodegas habilitadas','unidades',1),(2,'MASCOTAS','Mascotas','M├íximo de mascotas registradas','unidades',1),(3,'PRODUCTOS','Productos','M├íximo de productos del cat├ílogo','unidades',1),(4,'CLIENTES','Clientes','M├íximo de clientes registrados','unidades',1),(5,'ALMACENAMIENTO_GB','Almacenamiento','Almacenamiento en gigabytes','GB',1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipospago` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Nombre` varchar(50) NOT NULL,
  `Descripcion` varchar(100) DEFAULT NULL,
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `FechaModificacion` datetime DEFAULT NULL,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `UsuarioIdModificacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `idx_tipospago_empresa` (`IdEmpresa`,`Activo`)
) ENGINE=InnoDB AUTO_INCREMENT=15 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `tipospago` VALUES (1,'EFECTIVO','Pago en efectivo',1,'2026-09-06 08:14:45','2026-09-12 11:56:27',NULL,NULL,1),(2,'TARJETA','Pago con tarjeta',1,'2026-09-06 08:14:45',NULL,NULL,NULL,1),(3,'TRANSFERENCIA','Transferencia bancaria',1,'2026-09-06 08:14:45',NULL,NULL,NULL,1),(4,'OTRO','Otro medio de pago',1,'2026-09-06 08:14:45',NULL,NULL,NULL,1),(9,'NEQUI','paGOS NEQUI',1,'2026-09-06 08:14:45',NULL,NULL,NULL,1),(10,'EFECTIVO','Pago en efectivo',1,'2026-09-06 08:49:49',NULL,16,NULL,2),(11,'TARJETA','Pago con tarjeta',1,'2026-09-06 08:49:49',NULL,16,NULL,2),(12,'TRANSFERENCIA','Transferencia bancaria',1,'2026-09-06 08:49:49',NULL,16,NULL,2),(13,'OTRO','Otro medio de pago',1,'2026-09-06 08:49:49',NULL,16,NULL,2),(14,'NEQUI','paGOS NEQUI',1,'2026-09-06 08:49:49',NULL,16,NULL,2);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tipoterceros` (
  `id` int NOT NULL AUTO_INCREMENT,
  `Codigo` varchar(10) NOT NULL,
  `Nombre` varchar(70) NOT NULL,
  `Estatus` tinyint(1) DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL COMMENT 'Empresa propietaria',
  PRIMARY KEY (`id`),
  KEY `ix_tipoterceros_idempresa` (`IdEmpresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `traslados` (
  `IdTraslado` bigint NOT NULL AUTO_INCREMENT,
  `Numero` varchar(50) NOT NULL,
  `IdBodegaOrigen` int NOT NULL,
  `IdBodegaDestino` int NOT NULL,
  `Fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `Estado` enum('BORRADOR','CONFIRMADA','ANULADA') NOT NULL DEFAULT 'BORRADOR',
  `Observaciones` varchar(500) DEFAULT NULL,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdConfirmacion` int DEFAULT NULL,
  `FechaConfirmacion` datetime DEFAULT NULL,
  `UsuarioIdAnulacion` int DEFAULT NULL,
  `FechaAnulacion` datetime DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdTraslado`),
  UNIQUE KEY `uk_traslado_numero` (`Numero`),
  KEY `ix_traslado_origen` (`IdBodegaOrigen`),
  KEY `ix_traslado_destino` (`IdBodegaDestino`),
  KEY `idx_traslados_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_traslado_destino` FOREIGN KEY (`IdBodegaDestino`) REFERENCES `bodegas` (`Id`),
  CONSTRAINT `fk_traslado_origen` FOREIGN KEY (`IdBodegaOrigen`) REFERENCES `bodegas` (`Id`),
  CONSTRAINT `fk_traslados_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `traslados_detalle` (
  `IdTrasladoDetalle` bigint NOT NULL AUTO_INCREMENT,
  `IdTraslado` bigint NOT NULL,
  `IdProducto` int NOT NULL,
  `Cantidad` decimal(18,4) NOT NULL,
  `CostoUnitario` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdTrasladoDetalle`),
  KEY `ix_trasladodetalle_traslado` (`IdTraslado`),
  KEY `ix_trasladodetalle_producto` (`IdProducto`),
  KEY `idx_traslados_detalle_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_trasladodetalle_producto` FOREIGN KEY (`IdProducto`) REFERENCES `productos` (`IdProducto`),
  CONSTRAINT `fk_trasladodetalle_traslado` FOREIGN KEY (`IdTraslado`) REFERENCES `traslados` (`IdTraslado`),
  CONSTRAINT `fk_traslados_detalle_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tratamientos` (
  `IdTratamiento` int NOT NULL AUTO_INCREMENT,
  `IdHistoriaClinica` int NOT NULL,
  `NombreTratamiento` varchar(200) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Descripcion` text COLLATE utf8mb4_unicode_ci,
  `FechaInicio` date DEFAULT NULL,
  `FechaFin` date DEFAULT NULL,
  `Indicaciones` text COLLATE utf8mb4_unicode_ci,
  `Observaciones` text COLLATE utf8mb4_unicode_ci,
  `Estado` enum('Activo','Finalizado','Suspendido','Cancelado') COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'Activo',
  `FechaCreacion` datetime DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaModificacion` datetime DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `UsuarioIdModificacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdTratamiento`),
  KEY `fk_tratamientos_usuario_creacion` (`UsuarioIdCreacion`),
  KEY `fk_tratamientos_usuario_modificacion` (`UsuarioIdModificacion`),
  KEY `idx_tratamientos_historia` (`IdHistoriaClinica`),
  KEY `idx_tratamientos_estado` (`Estado`),
  KEY `idx_tratamientos_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_tratamientos_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`),
  CONSTRAINT `fk_tratamientos_historia` FOREIGN KEY (`IdHistoriaClinica`) REFERENCES `historiasclinicas` (`IdHistoriaClinica`),
  CONSTRAINT `fk_tratamientos_usuario_creacion` FOREIGN KEY (`UsuarioIdCreacion`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `fk_tratamientos_usuario_modificacion` FOREIGN KEY (`UsuarioIdModificacion`) REFERENCES `usuarios` (`UsuarioId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `unidades_medida` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `Unidad` varchar(20) NOT NULL,
  `Descripcion` varchar(100) DEFAULT NULL,
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaModificacion` datetime DEFAULT NULL,
  `UsuarioIdModificacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL COMMENT 'Empresa propietaria',
  PRIMARY KEY (`Id`),
  UNIQUE KEY `uk_unidad_medida_nombre` (`Unidad`),
  KEY `ix_unidades_medida_idempresa` (`IdEmpresa`)
) ENGINE=InnoDB AUTO_INCREMENT=9 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `unidades_medida` VALUES (1,'Unidad','Pieza individual',1,'2026-09-04 16:32:59',NULL,NULL,NULL,1),(2,'Caja','Contenedor de varias unidades',1,'2026-09-04 16:32:59',NULL,'2026-09-12 11:20:59',NULL,1),(3,'Blister','Empaque de tabletas o c├ípsulas',1,'2026-09-04 16:32:59',NULL,NULL,NULL,1),(4,'Frasco','Envase de l├¡quidos o soluci├│n',1,'2026-09-04 16:32:59',NULL,NULL,NULL,1),(5,'Bolsa','Empaque sellado',1,'2026-09-04 16:32:59',NULL,NULL,NULL,1),(6,'Kilogramo','Peso',1,'2026-09-04 16:32:59',NULL,NULL,NULL,1),(7,'Litro','Volumen',1,'2026-09-04 16:32:59',NULL,NULL,NULL,1),(8,'Mililitro','Volumen peque├▒o',1,'2026-09-04 16:32:59',NULL,NULL,NULL,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuariopermisos` (
  `UsuarioId` int NOT NULL,
  `IdPermiso` int NOT NULL,
  `TipoAcceso` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL DEFAULT 'PERMITIR',
  `AsignadoPor` int DEFAULT NULL,
  `FechaAsignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`UsuarioId`,`IdPermiso`),
  KEY `idx_up_permiso` (`IdPermiso`),
  KEY `fk_up_asignadopor` (`AsignadoPor`),
  CONSTRAINT `fk_up_asignadopor` FOREIGN KEY (`AsignadoPor`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `fk_up_permiso` FOREIGN KEY (`IdPermiso`) REFERENCES `permisos` (`IdPermiso`),
  CONSTRAINT `fk_up_usuario` FOREIGN KEY (`UsuarioId`) REFERENCES `usuarios` (`UsuarioId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Permisos directos a usuario (RF-010)';
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarioroles` (
  `UsuarioId` int NOT NULL,
  `IdRol` int NOT NULL,
  `AsignadoPor` int DEFAULT NULL,
  `FechaAsignacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (`UsuarioId`,`IdRol`),
  KEY `idx_ur_rol` (`IdRol`),
  KEY `fk_ur_asignado_por` (`AsignadoPor`),
  CONSTRAINT `fk_ur_asignado_por` FOREIGN KEY (`AsignadoPor`) REFERENCES `usuarios` (`UsuarioId`),
  CONSTRAINT `fk_ur_rol` FOREIGN KEY (`IdRol`) REFERENCES `roles` (`IdRol`),
  CONSTRAINT `fk_ur_usuario` FOREIGN KEY (`UsuarioId`) REFERENCES `usuarios` (`UsuarioId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `usuarioroles` VALUES (3,1,3,'2026-09-05 08:21:53'),(8,8,NULL,'2026-09-05 15:41:17'),(16,1,16,'2026-09-06 08:49:49'),(21,2,3,'2026-09-13 11:11:39');
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `usuarios` (
  `UsuarioId` int NOT NULL AUTO_INCREMENT,
  `Username` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `PasswordHash` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
  `IdEmpresa` int DEFAULT NULL,
  `IdPerfil` int DEFAULT NULL,
  `TipoDocumento` varchar(20) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `NumeroDocumento` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PrimerNombre` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SegundoNombre` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PrimerApellido` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `SegundoApellido` varchar(60) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Correo` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Telefono` varchar(15) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  `Bloqueado` tinyint(1) NOT NULL DEFAULT '0',
  `IntentosFallidos` int NOT NULL DEFAULT '0',
  `FechaUltimoIngreso` datetime DEFAULT NULL,
  `UltimoAcceso` datetime DEFAULT NULL,
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaModificacion` datetime DEFAULT NULL,
  `UsuarioIdModificacion` int DEFAULT NULL,
  PRIMARY KEY (`UsuarioId`),
  UNIQUE KEY `UQ_Usuarios_Username_Empresa` (`IdEmpresa`,`Username`),
  KEY `idx_usuarios_empresa` (`IdEmpresa`),
  KEY `idx_usuarios_perfil` (`IdPerfil`),
  KEY `idx_usuarios_documento` (`NumeroDocumento`),
  CONSTRAINT `fk_usuarios_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`),
  CONSTRAINT `fk_usuarios_perfil` FOREIGN KEY (`IdPerfil`) REFERENCES `perfiles` (`IdPerfil`)
) ENGINE=InnoDB AUTO_INCREMENT=23 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `usuarios` VALUES (3,'admin','$2b$10$xj7JqaXSBKDvP56ZwhJGyOVn4uAh78CwMbO7oLIFUYV/Ze.XLnqrS',1,1,'CC','123456789','Administrador',NULL,'Sistema',NULL,'admin@bissvet.local','3000000000',1,0,0,'2026-09-14 09:25:20','2026-09-14 09:25:20','2026-09-05 08:23:07',NULL,NULL,NULL),(8,'superadmin_test','$2b$10$iqwRt.cC7LX7Quk5dMDI8Ov5UBNHBW6iZfF.8ClyCDMOhkBwCDj.O',1,NULL,'CC','999999','Prueba',NULL,'Superadmin',NULL,'sa@bissvet.local','3001112222',1,0,0,'2026-09-05 15:42:57','2026-09-05 15:42:57','2026-09-05 15:41:17',NULL,NULL,NULL),(16,'admin2','$2b$10$GFMv66mlq3YLvTa2ha/eIeYyUozNv/VyKXfSjZYEV/4FKokYIzk6a',2,1,'CC','1000000002','Admin',NULL,'Pruebas',NULL,'admin2@vetpruebas.com',NULL,1,0,0,NULL,NULL,'2026-09-06 08:49:49',NULL,NULL,NULL),(17,'vend1','$2b$10$wvdpUTVzqXKrvXs6TcAtqOUfUbAgCcIAdVW0p0i7B5F8kD.BzghjW',1,3,'CC','652665','vende1',NULL,'otro ven',NULL,NULL,NULL,1,0,0,NULL,NULL,'2026-09-06 09:03:38',3,NULL,NULL),(19,'roven1','$2b$10$s0z33YsFGMixPNB6oH7mo..F6esiSkBcfRZCT0SHQPXHwP4z13k.u',1,3,'CC','234234234234','rosa',NULL,'vendedora',NULL,NULL,'3000521252',1,0,0,'2026-09-13 09:43:42','2026-09-13 09:43:42','2026-09-12 11:35:04',3,NULL,NULL),(20,'Inve1','$2b$10$QEIHkH.n0Tr1zYA4uqRo6ep2uRBiiMPHuv0FeHYnbmS7YSUHL99V2',1,5,'CC','64646','inve1','adad',NULL,NULL,NULL,NULL,1,0,0,'2026-09-13 11:08:57','2026-09-13 11:08:57','2026-09-13 11:06:35',3,NULL,NULL),(21,'vete1','$2b$10$By3bCWaeo623tTFccOrzteVkz9KG8WgBEAi.OZNJulp7G3mQN/XFm',1,2,'CC','1234567890','Vete',NULL,'Uno',NULL,'vete1@bissvet.local','3000000000',1,0,0,'2026-09-13 11:11:51','2026-09-13 11:11:51','2026-09-13 11:11:39',3,NULL,NULL),(22,'vend2','$2b$10$zbJ9ZsSr7UYKixi5Nqg0R.ZrN3sWllrddUTFHuur/K94Dhi87kloi',1,3,'CC','3353534','vende 2',NULL,'pruebas',NULL,NULL,NULL,1,0,0,'2026-09-13 14:31:49','2026-09-13 14:31:49','2026-09-13 14:31:31',3,NULL,NULL);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `vendedores` (
  `Id` int NOT NULL AUTO_INCREMENT,
  `IdBodega` int NOT NULL,
  `NombreVendedor` varchar(80) NOT NULL,
  `IdEmpresa` int DEFAULT NULL,
  `Estatus` tinyint(1) DEFAULT NULL,
  PRIMARY KEY (`Id`),
  KEY `IX_Vendedores_IdBodega` (`IdBodega`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ventas` (
  `IdVenta` bigint NOT NULL AUTO_INCREMENT,
  `NumeroVenta` varchar(50) NOT NULL,
  `Fecha` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `IdCliente` int NOT NULL,
  `IdMascota` int DEFAULT NULL,
  `IdBodega` int NOT NULL,
  `IdVendedor` int DEFAULT NULL COMMENT 'Usuario vendedor',
  `TipoPago` varchar(50) DEFAULT NULL COMMENT 'Efectivo, tarjeta, transferencia, otro',
  `PorcentajeImpuesto` decimal(5,2) NOT NULL DEFAULT '0.00' COMMENT '% de IVA aplicado',
  `Subtotal` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `Descuento` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `Impuesto` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `Total` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `CostoTotal` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `Utilidad` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `Estado` enum('BORRADOR','CONFIRMADA','ANULADA') NOT NULL DEFAULT 'BORRADOR',
  `Observaciones` varchar(500) DEFAULT NULL,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdConfirmacion` int DEFAULT NULL,
  `FechaConfirmacion` datetime DEFAULT NULL,
  `UsuarioIdAnulacion` int DEFAULT NULL,
  `FechaAnulacion` datetime DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdVenta`),
  UNIQUE KEY `uk_venta_numero_empresa` (`NumeroVenta`,`IdEmpresa`),
  KEY `ix_venta_cliente` (`IdCliente`),
  KEY `ix_venta_mascota` (`IdMascota`),
  KEY `ix_venta_bodega` (`IdBodega`),
  KEY `ix_venta_fecha` (`Fecha`),
  KEY `ix_venta_estado` (`Estado`),
  KEY `idx_ventas_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_venta_bodega` FOREIGN KEY (`IdBodega`) REFERENCES `bodegas` (`Id`),
  CONSTRAINT `fk_venta_cliente` FOREIGN KEY (`IdCliente`) REFERENCES `clientes` (`ClienteId`),
  CONSTRAINT `fk_venta_mascota` FOREIGN KEY (`IdMascota`) REFERENCES `mascotas` (`IdMascota`),
  CONSTRAINT `fk_ventas_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB AUTO_INCREMENT=34 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `ventas` VALUES (1,'V-001','2026-09-05 00:00:00',1,1,4,NULL,NULL,0.00,5000.0000,0.0000,0.0000,50000.0000,0.0000,0.0000,'BORRADOR','fghfhfh',3,'2026-09-05 16:19:40',NULL,NULL,NULL,NULL,1),(2,'v-002','2026-09-05 00:00:00',1,3,4,NULL,NULL,0.00,6000.0000,0.0000,0.0000,6000.0000,0.0000,0.0000,'BORRADOR','sdsdssd',3,'2026-09-05 17:00:58',NULL,NULL,NULL,NULL,1),(8,'V-3','2026-09-06 00:00:00',1,NULL,4,3,'NEQUI',19.00,25000.0000,0.0000,4750.0000,29750.0000,0.0000,0.0000,'BORRADOR','fbhfhfghfgh',3,'2026-09-06 08:44:20',NULL,NULL,NULL,NULL,1),(10,'V-1','2026-09-06 08:58:57',2,NULL,5,16,'EFECTIVO',19.00,50000.0000,0.0000,9500.0000,59500.0000,0.0000,0.0000,'ANULADA',NULL,16,'2026-09-06 08:58:56',16,'2026-09-06 08:58:56',16,'2026-09-06 08:58:57',2),(11,'V-4','2026-09-06 00:00:00',1,NULL,4,17,'EFECTIVO',19.00,25000.0000,0.0000,4750.0000,29750.0000,0.0000,0.0000,'BORRADOR','ewrwwerwerweewrwerw',3,'2026-09-06 09:04:18',NULL,NULL,NULL,NULL,1),(12,'V-2','2026-09-06 09:12:02',2,NULL,5,16,'EFECTIVO',19.00,25000.0000,0.0000,4750.0000,29750.0000,0.0000,0.0000,'ANULADA',NULL,16,'2026-09-06 09:12:01',16,'2026-09-06 09:12:02',16,'2026-09-06 09:12:02',2),(13,'V-3','2026-09-06 09:18:32',2,NULL,5,16,'EFECTIVO',19.00,45000.0000,0.0000,8550.0000,53550.0000,0.0000,0.0000,'ANULADA',NULL,16,'2026-09-06 09:18:31',16,'2026-09-06 09:18:31',16,'2026-09-06 09:18:32',2),(14,'V-4','2026-09-06 09:26:53',2,NULL,5,16,'EFECTIVO',19.00,45000.0000,0.0000,8550.0000,53550.0000,0.0000,0.0000,'ANULADA',NULL,16,'2026-09-06 09:26:53',16,'2026-09-06 09:26:53',16,'2026-09-06 09:26:53',2),(15,'V-5','2026-09-06 00:00:00',1,NULL,4,17,'EFECTIVO',5.00,25000.0000,0.0000,1250.0000,26250.0000,20000.0000,6250.0000,'CONFIRMADA','dsrssdrf',3,'2026-09-06 09:29:51',3,'2026-09-06 10:32:58',NULL,NULL,1),(16,'V-5','2026-09-06 09:42:54',2,NULL,5,16,'EFECTIVO',19.00,25000.0000,0.0000,4750.0000,29750.0000,0.0000,0.0000,'ANULADA',NULL,16,'2026-09-06 09:42:53',16,'2026-09-06 09:42:53',16,'2026-09-06 09:42:54',2),(17,'V-6','2026-09-06 09:43:14',2,NULL,5,16,'EFECTIVO',19.00,24975000.0000,0.0000,4745250.0000,29720250.0000,0.0000,0.0000,'ANULADA',NULL,16,'2026-09-06 09:43:13',16,'2026-09-06 09:43:13',16,'2026-09-06 09:43:13',2),(18,'V-6','2026-09-07 09:55:59',1,NULL,4,3,'EFECTIVO',5.00,55000.0000,0.0000,2750.0000,57750.0000,0.0000,57750.0000,'CONFIRMADA','Facturaci├│n de cita del servicio: Consultas (IdCita 5)',3,'2026-09-07 09:55:58',3,'2026-09-07 09:55:58',NULL,NULL,1),(19,'V-7','2026-09-07 09:56:10',1,NULL,4,3,'EFECTIVO',5.00,55000.0000,0.0000,2750.0000,57750.0000,0.0000,57750.0000,'CONFIRMADA','Facturaci├│n de cita del servicio: Consultas (IdCita 5)',3,'2026-09-07 09:56:09',3,'2026-09-07 09:56:10',NULL,NULL,1),(21,'V-8','2026-09-07 10:23:03',1,NULL,4,3,'EFECTIVO',5.00,55000.0000,0.0000,2750.0000,57750.0000,0.0000,57750.0000,'CONFIRMADA','Facturaci├│n de cita del servicio: Consultas (IdCita 5)',3,'2026-09-07 10:23:02',3,'2026-09-07 10:23:03',NULL,NULL,1),(22,'V-9','2026-09-07 10:23:06',1,NULL,4,3,'EFECTIVO',5.00,55000.0000,0.0000,2750.0000,57750.0000,0.0000,57750.0000,'CONFIRMADA','Facturaci├│n de cita del servicio: Consultas (IdCita 5)',3,'2026-09-07 10:23:05',3,'2026-09-07 10:23:06',NULL,NULL,1),(23,'V-10','2026-09-07 10:24:59',1,NULL,4,3,'EFECTIVO',5.00,55000.0000,0.0000,2750.0000,57750.0000,0.0000,57750.0000,'CONFIRMADA','Facturaci├│n de cita del servicio: Consultas (IdCita 5)',3,'2026-09-07 10:24:59',3,'2026-09-07 10:24:59',NULL,NULL,1),(24,'V-11','2026-09-07 10:25:02',1,NULL,4,3,'EFECTIVO',5.00,55000.0000,0.0000,2750.0000,57750.0000,0.0000,57750.0000,'CONFIRMADA','Facturaci├│n de cita del servicio: Consultas (IdCita 5)',3,'2026-09-07 10:25:02',3,'2026-09-07 10:25:02',NULL,NULL,1),(25,'V-12','2026-09-07 00:00:00',1,NULL,4,3,'EFECTIVO',5.00,25000.0000,0.0000,1250.0000,26250.0000,0.0000,0.0000,'BORRADOR','vbgghgh',3,'2026-09-07 10:48:26',NULL,NULL,NULL,NULL,1),(28,'V-13','2026-09-07 00:00:00',1,NULL,4,3,'EFECTIVO',19.00,25000.0000,0.0000,4750.0000,29750.0000,20000.0000,9750.0000,'CONFIRMADA','diag-flujo',3,'2026-09-07 11:37:51',3,'2026-09-07 11:37:52',NULL,NULL,1),(29,'V-14','2026-09-07 00:00:00',1,NULL,4,3,'EFECTIVO',5.00,25000.0000,0.0000,1250.0000,26250.0000,0.0000,0.0000,'BORRADOR','n/a',3,'2026-09-07 12:19:09',NULL,NULL,NULL,NULL,1),(30,'V-15','2026-09-07 12:23:11',1,NULL,4,3,'EFECTIVO',5.00,55000.0000,0.0000,2750.0000,57750.0000,0.0000,57750.0000,'CONFIRMADA','Facturaci├│n de cita del servicio: Consultas (IdCita 5)',3,'2026-09-07 12:23:10',3,'2026-09-07 12:23:11',NULL,NULL,1),(31,'V-16','2026-09-07 12:46:41',1,NULL,4,3,'EFECTIVO',5.00,25000.0000,0.0000,1250.0000,26250.0000,5566.6667,20683.3333,'CONFIRMADA','diag-purina-fresh',3,'2026-09-07 12:46:41',3,'2026-09-07 13:35:32',NULL,NULL,1),(32,'V-17','2026-09-07 00:00:00',1,NULL,4,3,'EFECTIVO',5.00,25000.0000,0.0000,1250.0000,26250.0000,0.0000,0.0000,'BORRADOR','fgsfgfdsg',3,'2026-09-07 13:09:27',NULL,NULL,NULL,NULL,1),(33,'V-18','2026-09-13 00:00:00',3,NULL,4,17,'EFECTIVO',5.00,90.0000,0.0000,4.5000,94.5000,66.0000,28.5000,'CONFIRMADA','fghf',19,'2026-09-13 10:58:03',19,'2026-09-13 10:58:10',NULL,NULL,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `ventas_detalle` (
  `IdDetalleVenta` bigint NOT NULL AUTO_INCREMENT,
  `IdVenta` bigint NOT NULL,
  `IdProducto` int DEFAULT NULL,
  `IdServicio` int DEFAULT NULL,
  `Cantidad` decimal(18,4) NOT NULL,
  `PrecioUnitario` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `Descuento` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `Impuesto` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `Total` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `CostoUnitario` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `CostoTotal` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `Utilidad` decimal(18,4) NOT NULL DEFAULT '0.0000',
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdDetalleVenta`),
  KEY `ix_ventadetalle_venta` (`IdVenta`),
  KEY `ix_ventadetalle_producto` (`IdProducto`),
  KEY `idx_ventas_detalle_idempresa` (`IdEmpresa`),
  CONSTRAINT `fk_ventadetalle_producto` FOREIGN KEY (`IdProducto`) REFERENCES `productos` (`IdProducto`),
  CONSTRAINT `fk_ventadetalle_venta` FOREIGN KEY (`IdVenta`) REFERENCES `ventas` (`IdVenta`),
  CONSTRAINT `fk_ventas_detalle_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB AUTO_INCREMENT=33 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `ventas_detalle` VALUES (2,1,1,NULL,1.0000,5000.0000,0.0000,0.0000,50000.0000,0.0000,0.0000,0.0000,1),(3,2,1,NULL,1.0000,6000.0000,0.0000,0.0000,6000.0000,0.0000,0.0000,0.0000,1),(9,8,1,NULL,1.0000,25000.0000,0.0000,4750.0000,29750.0000,0.0000,0.0000,0.0000,1),(11,10,7,NULL,2.0000,25000.0000,0.0000,9500.0000,59500.0000,12000.0000,24000.0000,35500.0000,2),(12,11,1,NULL,1.0000,25000.0000,0.0000,4750.0000,29750.0000,0.0000,0.0000,0.0000,1),(13,12,7,NULL,1.0000,25000.0000,0.0000,4750.0000,29750.0000,12000.0000,12000.0000,17750.0000,2),(14,13,NULL,3,1.0000,45000.0000,0.0000,8550.0000,53550.0000,0.0000,0.0000,53550.0000,2),(15,14,NULL,3,1.0000,45000.0000,0.0000,8550.0000,53550.0000,0.0000,0.0000,53550.0000,2),(16,15,1,NULL,1.0000,25000.0000,0.0000,1250.0000,26250.0000,20000.0000,20000.0000,6250.0000,1),(17,16,7,NULL,1.0000,25000.0000,0.0000,4750.0000,29750.0000,12000.0000,12000.0000,17750.0000,2),(18,17,7,NULL,999.0000,25000.0000,0.0000,4745250.0000,29720250.0000,0.0000,0.0000,29720250.0000,2),(19,18,NULL,2,1.0000,55000.0000,0.0000,2750.0000,57750.0000,0.0000,0.0000,57750.0000,1),(20,19,NULL,2,1.0000,55000.0000,0.0000,2750.0000,57750.0000,0.0000,0.0000,57750.0000,1),(22,21,NULL,2,1.0000,55000.0000,0.0000,2750.0000,57750.0000,0.0000,0.0000,57750.0000,1),(23,22,NULL,2,1.0000,55000.0000,0.0000,2750.0000,57750.0000,0.0000,0.0000,57750.0000,1),(24,23,NULL,2,1.0000,55000.0000,0.0000,2750.0000,57750.0000,0.0000,0.0000,57750.0000,1),(25,24,NULL,2,1.0000,55000.0000,0.0000,2750.0000,57750.0000,0.0000,0.0000,57750.0000,1),(26,25,1,NULL,1.0000,25000.0000,0.0000,1250.0000,26250.0000,0.0000,0.0000,0.0000,1),(27,28,1,NULL,1.0000,25000.0000,0.0000,4750.0000,29750.0000,20000.0000,20000.0000,9750.0000,1),(28,29,1,NULL,1.0000,25000.0000,0.0000,1250.0000,26250.0000,0.0000,0.0000,0.0000,1),(29,30,NULL,2,1.0000,55000.0000,0.0000,2750.0000,57750.0000,0.0000,0.0000,57750.0000,1),(30,31,1,NULL,1.0000,25000.0000,0.0000,1250.0000,26250.0000,5566.6667,5566.6667,20683.3333,1),(31,32,1,NULL,1.0000,25000.0000,0.0000,1250.0000,26250.0000,0.0000,0.0000,0.0000,1),(32,33,48,NULL,2.0000,45.0000,0.0000,4.5000,94.5000,33.0000,66.0000,28.5000,1);
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `veterinarios` (
  `IdVeterinario` int NOT NULL AUTO_INCREMENT,
  `UsuarioId` int NOT NULL,
  `PrimerNombre` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SegundoNombre` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `PrimerApellido` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `SegundoApellido` varchar(50) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `TipoDocumento` varchar(20) COLLATE utf8mb4_unicode_ci NOT NULL,
  `NumeroDocumento` varchar(30) COLLATE utf8mb4_unicode_ci NOT NULL,
  `TarjetaProfesional` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
  `Especialidad` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Telefono` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Telefono2` varchar(30) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Correo` varchar(150) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Direccion` varchar(200) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `IdCiudad` int DEFAULT NULL,
  `FechaNacimiento` date DEFAULT NULL,
  `Observaciones` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
  `Activo` tinyint(1) NOT NULL DEFAULT '1',
  `FechaCreacion` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `UsuarioIdCreacion` int DEFAULT NULL,
  `FechaModificacion` datetime DEFAULT NULL,
  `UsuarioIdModificacion` int DEFAULT NULL,
  `IdEmpresa` int DEFAULT NULL,
  PRIMARY KEY (`IdVeterinario`),
  UNIQUE KEY `UQ_Veterinarios_Documento` (`TipoDocumento`,`NumeroDocumento`),
  UNIQUE KEY `UQ_Veterinarios_Tarjeta` (`TarjetaProfesional`),
  KEY `FK_Veterinarios_Ciudad` (`IdCiudad`),
  KEY `idx_veterinarios_idempresa` (`IdEmpresa`),
  CONSTRAINT `FK_Veterinarios_Ciudad` FOREIGN KEY (`IdCiudad`) REFERENCES `ciudades` (`Id`),
  CONSTRAINT `fk_veterinarios_empresa` FOREIGN KEY (`IdEmpresa`) REFERENCES `empresas` (`IdEmpresa`)
) ENGINE=InnoDB AUTO_INCREMENT=10 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
/*!40101 SET character_set_client = @saved_cs_client */;
INSERT INTO `veterinarios` VALUES (4,3,'Carlos','M','Leon','sdfsdf','CC','242243','234342423','dsfsdfds','42432432','23432342','fdfgfg@gmail.com','dfdfs',1,'2026-09-03','sdfsd',1,'2026-09-02 15:28:04',3,NULL,NULL,1),(6,3,'RAquel','K','Caicedo','dfgdfgdf','CC','44','23234234','fvfdf','4242342','324432342','dfded@gmail.com','dg',1,'2026-09-03','dfgdfg',1,'2026-09-02 16:10:28',3,NULL,NULL,1),(7,3,'nando ','','DELTRU','','CC','7307558','121212','GENERAL','34444443344','','djfndjdf@gmail.com','CRA',1,'2018-02-04','dytyt',1,'2026-09-04 10:25:25',3,NULL,NULL,1),(8,16,'Admin',NULL,'Pruebas',NULL,'CC','1000000002','TP-0002','General','3100000000',NULL,'admin2@vetpruebas.com',NULL,1,NULL,NULL,1,'2026-09-06 08:49:49',16,NULL,NULL,2),(9,21,'Vete',NULL,'Uno',NULL,'CC','1234567890','TP-000001','Medicina General','3000000000',NULL,'vete1@bissvet.local',NULL,1,NULL,NULL,1,'2026-09-13 11:11:39',3,NULL,NULL,1);
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_cirugias_programadas` AS SELECT 
 1 AS `IdCirugia`,
 1 AS `NombreMascota`,
 1 AS `Especie`,
 1 AS `NombreCliente`,
 1 AS `TipoCirugia`,
 1 AS `FechaProgramacion`,
 1 AS `FechaCirugia`,
 1 AS `NombreVeterinario`,
 1 AS `Estado`,
 1 AS `Motivo`*/;
SET character_set_client = @saved_cs_client;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_proximos_controles` AS SELECT 
 1 AS `IdControl`,
 1 AS `NombreMascota`,
 1 AS `Especie`,
 1 AS `NombreCliente`,
 1 AS `Telefono`,
 1 AS `FechaProximoControl`,
 1 AS `Motivo`,
 1 AS `NombreVeterinario`,
 1 AS `Recomendaciones`*/;
SET character_set_client = @saved_cs_client;
SET @saved_cs_client     = @@character_set_client;
/*!50503 SET character_set_client = utf8mb4 */;
/*!50001 CREATE VIEW `vw_resumen_historiaclinica` AS SELECT 
 1 AS `IdMascota`,
 1 AS `NombreMascota`,
 1 AS `Especie`,
 1 AS `Raza`,
 1 AS `ClienteId`,
 1 AS `NombreCliente`,
 1 AS `IdHistoriaClinica`,
 1 AS `FechaAtencion`,
 1 AS `MotivoConsulta`,
 1 AS `EstadoAtencion`,
 1 AS `NombreVeterinario`,
 1 AS `Diagnosticos`,
 1 AS `Tratamientos`*/;
SET character_set_client = @saved_cs_client;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `bissvet_add_column`(IN p_tabla VARCHAR(64), IN p_columna VARCHAR(64), IN p_def TEXT)
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.COLUMNS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = p_tabla
          AND COLUMN_NAME  = p_columna
    ) THEN
        SELECT CONCAT('OK (ya exist├¡a):  ', p_tabla, '.', p_columna) AS aviso;
    ELSE
        SET @ddl = CONCAT('ALTER TABLE `', p_tabla, '` ADD COLUMN ', p_def);
        PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
        SELECT CONCAT('AGREGADA:          ', p_tabla, '.', p_columna) AS aviso;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `bissvet_add_idempresa`(IN p_tabla VARCHAR(64), IN p_indice VARCHAR(64))
BEGIN
  DECLARE EXIT HANDLER FOR SQLEXCEPTION
    SELECT CONCAT('AVISO: la tabla [', p_tabla, '] no se pudo procesar (┬┐no existe o FK inv├ílida?)') AS aviso;

  IF EXISTS (
    SELECT 1 FROM information_schema.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_tabla
      AND COLUMN_NAME = 'IdEmpresa'
  ) THEN
    SELECT CONCAT(p_tabla, ': IdEmpresa ya existe (sin cambios)') AS aviso;
  ELSE
    SET @ddl = CONCAT(
      'ALTER TABLE `', p_tabla, '` ',
      'ADD COLUMN IdEmpresa INT NULL, ',
      'ADD INDEX `', p_indice, '` (IdEmpresa)'
    );
    PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

    SET @ddl = CONCAT(
      'ALTER TABLE `', p_tabla, '` ',
      'ADD CONSTRAINT `fk_', p_tabla, '_empresa` ',
      'FOREIGN KEY (IdEmpresa) REFERENCES empresas(IdEmpresa)'
    );
    PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;

    SELECT CONCAT(p_tabla, ': IdEmpresa + ├¡ndice + FK agregados') AS aviso;
  END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'IGNORE_SPACE,ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `bissvet_crear_suscripcion_prueba`()
BEGIN
  DECLARE v_dias INT;
  SELECT COALESCE(MAX(CAST(Valor AS UNSIGNED)), 15) INTO v_dias
  FROM parametrosseguridad WHERE Codigo = 'TRIAL_DAYS';

  INSERT IGNORE INTO suscripciones (IdEmpresa, IdPlan, Estado, FechaInicio, FechaFin, Periodicidad, AutoRenovacion)
  SELECT e.IdEmpresa, p.IdPlan, 'PRUEBA', NOW(), DATE_ADD(NOW(), INTERVAL COALESCE(p.DiasPrueba, v_dias) DAY),
         'MENSUAL', 0
  FROM empresas e
  INNER JOIN planes p ON p.CodigoPlan = 'BASICO'
  WHERE NOT EXISTS (SELECT 1 FROM suscripciones s WHERE s.IdEmpresa = e.IdEmpresa);
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `bissvet_ensure_fk`(IN p_tabla VARCHAR(64), IN p_fk VARCHAR(64), IN p_ddl TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
    WHERE CONSTRAINT_SCHEMA = DATABASE()
      AND TABLE_NAME = p_tabla
      AND CONSTRAINT_NAME = p_fk
  ) THEN
    SET @ddl = p_ddl;
    PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    SELECT CONCAT('FK AGREGADA: ', p_tabla, '.', p_fk) AS aviso;
  ELSE
    SELECT CONCAT('OK (ya exist├¡a): ', p_tabla, '.', p_fk) AS aviso;
  END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `bissvet_ensure_index`(IN p_tabla VARCHAR(64), IN p_indice VARCHAR(64), IN p_ddl TEXT)
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = p_tabla
      AND INDEX_NAME = p_indice
  ) THEN
    SET @ddl = p_ddl;
    PREPARE stmt FROM @ddl; EXECUTE stmt; DEALLOCATE PREPARE stmt;
    SELECT CONCAT('├ìNDICE AGREGADO: ', p_tabla, '.', p_indice) AS aviso;
  ELSE
    SELECT CONCAT('OK (ya exist├¡a): ', p_tabla, '.', p_indice) AS aviso;
  END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `bissvet_seguridad_add_index_documento`()
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.STATISTICS
        WHERE TABLE_SCHEMA = DATABASE()
          AND TABLE_NAME   = 'Usuarios'
          AND INDEX_NAME   = 'idx_usuarios_documento'
    ) THEN
        ALTER TABLE Usuarios ADD INDEX idx_usuarios_documento (NumeroDocumento);
        SELECT '├ìNDICE CREATE:   idx_usuarios_documento' AS aviso;
    ELSE
        SELECT 'OK (ya exist├¡a): idx_usuarios_documento' AS aviso;
    END IF;
END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `sp_consultar_costo_producto`(
    IN p_producto_id INT
)
BEGIN
	/* Procedimiento para consultar el costo actual*/
    SELECT
        id,
        codigo,
        nombre,
        cantidad,
        costo_promedio,
        cantidad * costo_promedio AS valor_inventario,
        precio_venta,
        precio_venta - costo_promedio AS utilidad_unitaria
    FROM productos
    WHERE id = p_producto_id;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `sp_inventario_entrada`(
    IN p_producto_id INT,
    IN p_cantidad DECIMAL(18,4),
    IN p_costo DECIMAL(18,4),
    IN p_tipo VARCHAR(30),
    IN p_documento_tipo VARCHAR(30),
    IN p_documento_id BIGINT,
    IN p_observaciones VARCHAR(500)
)
BEGIN
   /* Este procedimiento actualiza autom├íticamente el costo promedio.*/
    DECLARE v_cantidad_actual DECIMAL(18,4);
    DECLARE v_costo_actual DECIMAL(18,4);
    DECLARE v_nueva_cantidad DECIMAL(18,4);
    DECLARE v_nuevo_costo DECIMAL(18,4);

    START TRANSACTION;

    SELECT cantidad, costo_promedio
    INTO v_cantidad_actual, v_costo_actual
    FROM productos
    WHERE id = p_producto_id
    FOR UPDATE;

    SET v_nueva_cantidad =
        v_cantidad_actual + p_cantidad;

    IF v_nueva_cantidad > 0 THEN

        SET v_nuevo_costo =
        (
            (v_cantidad_actual * v_costo_actual)
            +
            (p_cantidad * p_costo)
        )
        / v_nueva_cantidad;

    ELSE

        SET v_nuevo_costo = p_costo;

    END IF;

    UPDATE productos
    SET
        cantidad = v_nueva_cantidad,
        costo_promedio = v_nuevo_costo,
        fecha_modificacion = NOW()
    WHERE id = p_producto_id;

    INSERT INTO movimientos_inventario
    (
        producto_id,
        tipo,
        documento_tipo,
        documento_id,
        cantidad,
        costo_unitario,
        entrada,
        salida,
        saldo_cantidad,
        saldo_costo,
        observaciones
    )
    VALUES
    (
        p_producto_id,
        p_tipo,
        p_documento_tipo,
        p_documento_id,
        p_cantidad,
        p_costo,
        p_cantidad,
        0,
        v_nueva_cantidad,
        v_nuevo_costo,
        p_observaciones
    );

    COMMIT;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `sp_inventario_salida`(
    IN p_producto_id INT,
    IN p_cantidad DECIMAL(18,4),
    IN p_tipo VARCHAR(30),
    IN p_documento_tipo VARCHAR(30),
    IN p_documento_id BIGINT,
    IN p_observaciones VARCHAR(500)
)
BEGIN

    /* Para una venta:*/
    DECLARE v_existencia DECIMAL(18,4);
    DECLARE v_costo DECIMAL(18,4);
    DECLARE v_nueva_existencia DECIMAL(18,4);

    START TRANSACTION;

    SELECT cantidad, costo_promedio
    INTO v_existencia, v_costo
    FROM productos
    WHERE id = p_producto_id
    FOR UPDATE;

    IF v_existencia < p_cantidad THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'Inventario insuficiente';

    END IF;

    SET v_nueva_existencia =
        v_existencia - p_cantidad;

    UPDATE productos
    SET
        cantidad = v_nueva_existencia,
        fecha_modificacion = NOW()
    WHERE id = p_producto_id;

    INSERT INTO movimientos_inventario
    (
        producto_id,
        tipo,
        documento_tipo,
        documento_id,
        cantidad,
        costo_unitario,
        entrada,
        salida,
        saldo_cantidad,
        saldo_costo,
        observaciones
    )
    VALUES
    (
        p_producto_id,
        p_tipo,
        p_documento_tipo,
        p_documento_id,
        p_cantidad,
        v_costo,
        0,
        p_cantidad,
        v_nueva_existencia,
        v_costo,
        p_observaciones
    );

    COMMIT;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `sp_kardex_producto`(
    IN p_producto_id INT,
    IN p_fecha_inicio DATETIME,
    IN p_fecha_fin DATETIME
)
BEGIN
     /* Procedimiento para obtener el Kardex   */
    SELECT
        m.fecha,
        m.tipo,
        m.documento_tipo,
        m.documento_id,

        m.entrada,
        m.salida,

        m.costo_unitario,

        m.saldo_cantidad,

        m.saldo_cantidad * m.saldo_costo
            AS valor_inventario,

        m.observaciones

    FROM movimientos_inventario m

    WHERE m.producto_id = p_producto_id
      AND m.fecha BETWEEN p_fecha_inicio AND p_fecha_fin

    ORDER BY m.fecha, m.id;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `sp_registrar_venta`(
    IN p_numero VARCHAR(30),
    IN p_cliente_id INT,
    IN p_fecha DATETIME,
    IN p_productos JSON,
    IN p_observaciones VARCHAR(500)
)
BEGIN
	/* registrar una venta    */
    DECLARE v_venta_id BIGINT;

    DECLARE v_producto_id INT;
    DECLARE v_cantidad DECIMAL(18,4);
    DECLARE v_precio DECIMAL(18,4);
    DECLARE v_descuento DECIMAL(18,4);

    DECLARE v_costo DECIMAL(18,4);
    DECLARE v_existencia DECIMAL(18,4);

    DECLARE v_total DECIMAL(18,4);
    DECLARE v_costo_total DECIMAL(18,4);
    DECLARE v_utilidad DECIMAL(18,4);

    DECLARE v_subtotal DECIMAL(18,4) DEFAULT 0;
    DECLARE v_descuento_total DECIMAL(18,4) DEFAULT 0;
    DECLARE v_costo_venta_total DECIMAL(18,4) DEFAULT 0;

    DECLARE v_i INT DEFAULT 0;
    DECLARE v_total_productos INT;

    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;

        SELECT
            0 AS resultado,
            'Error al registrar la venta. Se realiz├│ ROLLBACK.' AS mensaje;
    END;

    START TRANSACTION;


    /* =====================================================
       1. VALIDAR PRODUCTOS RECIBIDOS
       ===================================================== */

    IF p_productos IS NULL
       OR JSON_LENGTH(p_productos) = 0 THEN

        SIGNAL SQLSTATE '45000'
        SET MESSAGE_TEXT = 'La venta no contiene productos';

    END IF;


    SET v_total_productos = JSON_LENGTH(p_productos);


    /* =====================================================
       2. CREAR CABECERA DE LA VENTA
       ===================================================== */

    INSERT INTO ventas
    (
        numero,
        cliente_id,
        fecha,
        subtotal,
        descuento,
        impuesto,
        total,
        costo_total,
        utilidad_total,
        estado,
        observaciones
    )
    VALUES
    (
        p_numero,
        p_cliente_id,
        COALESCE(p_fecha, NOW()),
        0,
        0,
        0,
        0,
        0,
        0,
        'BORRADOR',
        p_observaciones
    );

    SET v_venta_id = LAST_INSERT_ID();


    /* =====================================================
       3. PROCESAR CADA PRODUCTO
       ===================================================== */

    WHILE v_i < v_total_productos DO

        SET v_producto_id =
            CAST(
                JSON_UNQUOTE(
                    JSON_EXTRACT(
                        p_productos,
                        CONCAT('$[', v_i, '].producto_id')
                    )
                ) AS UNSIGNED
            );

        SET v_cantidad =
            CAST(
                JSON_UNQUOTE(
                    JSON_EXTRACT(
                        p_productos,
                        CONCAT('$[', v_i, '].cantidad')
                    )
                ) AS DECIMAL(18,4)
            );

        SET v_precio =
            CAST(
                JSON_UNQUOTE(
                    JSON_EXTRACT(
                        p_productos,
                        CONCAT('$[', v_i, '].precio_unitario')
                    )
                ) AS DECIMAL(18,4)
            );

        SET v_descuento =
            COALESCE(
                CAST(
                    JSON_UNQUOTE(
                        JSON_EXTRACT(
                            p_productos,
                            CONCAT('$[', v_i, '].descuento')
                        )
                    ) AS DECIMAL(18,4)
                ),
                0
            );


        /* =================================================
           4. VALIDACIONES
           ================================================= */

        IF v_cantidad <= 0 THEN

            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'La cantidad del producto debe ser mayor que cero';

        END IF;


        IF v_precio < 0 THEN

            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'El precio del producto no puede ser negativo';

        END IF;


        /* =================================================
           5. BLOQUEAR PRODUCTO Y OBTENER INVENTARIO
           ================================================= */

        SELECT
            cantidad,
            costo_promedio
        INTO
            v_existencia,
            v_costo
        FROM productos
        WHERE id = v_producto_id
          AND activo = 1
          AND controla_inventario = 1
        FOR UPDATE;


        /* =================================================
           6. VALIDAR EXISTENCIA
           ================================================= */

        IF v_existencia IS NULL THEN

            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'El producto no existe o est├í inactivo';

        END IF;


        IF v_existencia < v_cantidad THEN

            SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT =
                'Inventario insuficiente para uno de los productos';

        END IF;


        /* =================================================
           7. CALCULAR VALORES
           ================================================= */

        SET v_total =
            (v_cantidad * v_precio) - v_descuento;

        SET v_costo_total =
            v_cantidad * v_costo;

        SET v_utilidad =
            v_total - v_costo_total;


        /* =================================================
           8. INSERTAR DETALLE DE VENTA
           ================================================= */

        INSERT INTO ventas_detalle
        (
            venta_id,
            producto_id,
            cantidad,
            precio_unitario,
            costo_unitario,
            descuento,
            impuesto,
            total,
            costo_total,
            utilidad
        )
        VALUES
        (
            v_venta_id,
            v_producto_id,
            v_cantidad,
            v_precio,
            v_costo,
            v_descuento,
            0,
            v_total,
            v_costo_total,
            v_utilidad
        );


        /* =================================================
           9. ACTUALIZAR INVENTARIO
           ================================================= */

        UPDATE productos
        SET
            cantidad = cantidad - v_cantidad,
            fecha_modificacion = NOW()
        WHERE id = v_producto_id;


        /* =================================================
           10. REGISTRAR KARDEX
           ================================================= */

        INSERT INTO movimientos_inventario
        (
            producto_id,
            fecha,
            tipo,
            documento_tipo,
            documento_id,
            cantidad,
            costo_unitario,
            entrada,
            salida,
            saldo_cantidad,
            saldo_costo,
            observaciones
        )
        SELECT
            v_producto_id,
            COALESCE(p_fecha, NOW()),
            'VENTA',
            'VENTA',
            v_venta_id,
            v_cantidad,
            v_costo,
            0,
            v_cantidad,
            cantidad,
            costo_promedio,
            CONCAT(
                'Venta ',
                p_numero
            )
        FROM productos
        WHERE id = v_producto_id;


        /* =================================================
           11. ACUMULAR TOTALES
           ================================================= */

        SET v_subtotal =
            v_subtotal +
            (v_cantidad * v_precio);

        SET v_descuento_total =
            v_descuento_total +
            v_descuento;

        SET v_costo_venta_total =
            v_costo_venta_total +
            v_costo_total;


        SET v_i = v_i + 1;

    END WHILE;


    /* =====================================================
       12. CALCULAR UTILIDAD GENERAL
       ===================================================== */

    SET v_utilidad =
        (v_subtotal - v_descuento_total)
        - v_costo_venta_total;


    /* =====================================================
       13. ACTUALIZAR CABECERA
       ===================================================== */

    UPDATE ventas
    SET
        subtotal = v_subtotal,
        descuento = v_descuento_total,
        impuesto = 0,
        total = v_subtotal - v_descuento_total,
        costo_total = v_costo_venta_total,
        utilidad_total = v_utilidad,
        estado = 'CONFIRMADA'
    WHERE id = v_venta_id;


    /* =====================================================
       14. CONFIRMAR TRANSACCI├ôN
       ===================================================== */

    COMMIT;


    /* =====================================================
       15. DEVOLVER RESULTADO
       ===================================================== */

    SELECT
        1 AS resultado,
        v_venta_id AS venta_id,
        p_numero AS numero,
        v_subtotal AS subtotal,
        v_descuento_total AS descuento,
        v_subtotal - v_descuento_total AS total,
        v_costo_venta_total AS costo_total,
        v_utilidad AS utilidad,
        'Venta registrada correctamente' AS mensaje;


END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50003 SET @saved_cs_client      = @@character_set_client */ ;
/*!50003 SET @saved_cs_results     = @@character_set_results */ ;
/*!50003 SET @saved_col_connection = @@collation_connection */ ;
/*!50003 SET character_set_client  = utf8mb4 */ ;
/*!50003 SET character_set_results = utf8mb4 */ ;
/*!50003 SET collation_connection  = utf8mb4_0900_ai_ci */ ;
/*!50003 SET @saved_sql_mode       = @@sql_mode */ ;
/*!50003 SET sql_mode              = 'ONLY_FULL_GROUP_BY,STRICT_TRANS_TABLES,NO_ZERO_IN_DATE,NO_ZERO_DATE,ERROR_FOR_DIVISION_BY_ZERO,NO_ENGINE_SUBSTITUTION' */ ;
DELIMITER ;;
CREATE DEFINER=CURRENT_USER PROCEDURE `sp_utilidad_venta`(
    IN p_venta_id BIGINT
)
BEGIN
    /*  . Procedimiento para calcular utilidad  */
    SELECT
        v.id,
        v.numero,
        v.fecha,

        SUM(vd.total) AS ventas,

        SUM(vd.costo_total) AS costo,

        SUM(vd.utilidad) AS utilidad,

        CASE
            WHEN SUM(vd.total) > 0 THEN
                (SUM(vd.utilidad) /
                 SUM(vd.total)) * 100
            ELSE 0
        END AS margen_porcentaje

    FROM ventas v

    INNER JOIN ventas_detalle vd
        ON vd.venta_id = v.id

    WHERE v.id = p_venta_id

    GROUP BY
        v.id,
        v.numero,
        v.fecha;

END ;;
DELIMITER ;
/*!50003 SET sql_mode              = @saved_sql_mode */ ;
/*!50003 SET character_set_client  = @saved_cs_client */ ;
/*!50003 SET character_set_results = @saved_cs_results */ ;
/*!50003 SET collation_connection  = @saved_col_connection */ ;
/*!50001 DROP VIEW IF EXISTS `vw_cirugias_programadas`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=CURRENT_USER SQL SECURITY DEFINER */
/*!50001 VIEW `vw_cirugias_programadas` AS select `ci`.`IdCirugia` AS `IdCirugia`,`m`.`Nombre` AS `NombreMascota`,`m`.`Especie` AS `Especie`,concat(`c`.`PrimerNombre`,' ',`c`.`PrimerApellido`) AS `NombreCliente`,`ci`.`TipoCirugia` AS `TipoCirugia`,`ci`.`FechaProgramacion` AS `FechaProgramacion`,`ci`.`FechaCirugia` AS `FechaCirugia`,concat(`v`.`PrimerNombre`,' ',`v`.`PrimerApellido`) AS `NombreVeterinario`,`ci`.`Estado` AS `Estado`,`ci`.`Motivo` AS `Motivo` from (((`cirugias` `ci` join `mascotas` `m` on((`ci`.`IdMascota` = `m`.`IdMascota`))) join `clientes` `c` on((`m`.`ClienteId` = `c`.`ClienteId`))) join `veterinarios` `v` on((`ci`.`IdVeterinario` = `v`.`IdVeterinario`))) where (`ci`.`Estado` in ('Programada','Realizada')) order by `ci`.`FechaProgramacion` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `vw_proximos_controles`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=CURRENT_USER SQL SECURITY DEFINER */
/*!50001 VIEW `vw_proximos_controles` AS select `con`.`IdControl` AS `IdControl`,`m`.`Nombre` AS `NombreMascota`,`m`.`Especie` AS `Especie`,concat(`c`.`PrimerNombre`,' ',`c`.`PrimerApellido`) AS `NombreCliente`,`c`.`Telefono` AS `Telefono`,`con`.`FechaControl` AS `FechaProximoControl`,`con`.`Motivo` AS `Motivo`,concat(`v`.`PrimerNombre`,' ',`v`.`PrimerApellido`) AS `NombreVeterinario`,`con`.`Recomendaciones` AS `Recomendaciones` from (((`controles` `con` join `mascotas` `m` on((`con`.`IdMascota` = `m`.`IdMascota`))) join `clientes` `c` on((`m`.`ClienteId` = `c`.`ClienteId`))) join `veterinarios` `v` on((`con`.`IdVeterinario` = `v`.`IdVeterinario`))) where ((`con`.`FechaControl` >= curdate()) and (`con`.`ProximoControl` is not null)) order by `con`.`ProximoControl` */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
/*!50001 DROP VIEW IF EXISTS `vw_resumen_historiaclinica`*/;
/*!50001 SET @saved_cs_client          = @@character_set_client */;
/*!50001 SET @saved_cs_results         = @@character_set_results */;
/*!50001 SET @saved_col_connection     = @@collation_connection */;
/*!50001 SET character_set_client      = cp850 */;
/*!50001 SET character_set_results     = cp850 */;
/*!50001 SET collation_connection      = cp850_general_ci */;
/*!50001 CREATE ALGORITHM=UNDEFINED */
/*!50013 DEFINER=CURRENT_USER SQL SECURITY DEFINER */
/*!50001 VIEW `vw_resumen_historiaclinica` AS select `m`.`IdMascota` AS `IdMascota`,`m`.`Nombre` AS `NombreMascota`,`m`.`Especie` AS `Especie`,`m`.`Raza` AS `Raza`,`m`.`ClienteId` AS `ClienteId`,concat(`c`.`PrimerNombre`,' ',`c`.`PrimerApellido`) AS `NombreCliente`,`hc`.`IdHistoriaClinica` AS `IdHistoriaClinica`,`hc`.`FechaAtencion` AS `FechaAtencion`,`hc`.`MotivoConsulta` AS `MotivoConsulta`,`hc`.`Estado` AS `EstadoAtencion`,concat(`v`.`PrimerNombre`,' ',`v`.`PrimerApellido`) AS `NombreVeterinario`,(select group_concat(`d`.`Diagnostico` separator '; ') from `diagnosticos` `d` where (`d`.`IdHistoriaClinica` = `hc`.`IdHistoriaClinica`)) AS `Diagnosticos`,(select group_concat(`t`.`NombreTratamiento` separator '; ') from `tratamientos` `t` where (`t`.`IdHistoriaClinica` = `hc`.`IdHistoriaClinica`)) AS `Tratamientos` from (((`historiasclinicas` `hc` join `mascotas` `m` on((`hc`.`IdMascota` = `m`.`IdMascota`))) join `clientes` `c` on((`m`.`ClienteId` = `c`.`ClienteId`))) join `veterinarios` `v` on((`hc`.`IdVeterinario` = `v`.`IdVeterinario`))) order by `hc`.`FechaAtencion` desc */;
/*!50001 SET character_set_client      = @saved_cs_client */;
/*!50001 SET character_set_results     = @saved_cs_results */;
/*!50001 SET collation_connection      = @saved_col_connection */;
SET FOREIGN_KEY_CHECKS = 1;
-- FIN DEL DUMP BISSVET
