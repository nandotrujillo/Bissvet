-- ============================================================================
-- MIGRACIÓN: IdEmpresa INT transversal en las entidades de negocio
-- ----------------------------------------------------------------------------
-- Agrega la columna `IdEmpresa INT NULL` a TODAS las tablas base del esquema
-- BissVet que aún NO la tienen, para aislar los datos de cada empresa
-- (multiempresa) y poder filtrar por empresa en cualquier consulta/reporte.
--
-- Características:
--  * TRANSVERSAL: se genera automáticamente leyendo information_schema, así
--    que incluye también tablas creadas con posterioridad a esta migración.
--  * IDEMPOTENTE: se puede ejecutar varias veces sin error; las tablas que ya
--    tienen `IdEmpresa` (o `idEmpresa`) se omiten.
--  * SOLO TABLAS BASE: las vistas (vw_*) se ignoran (no admiten columnas).
--  * RELLENO: las filas nuevas se inicializan con la empresa por defecto (1),
--    igual que hizo alter_trazabilidad_datos.sql para las columnas existentes.
--
-- TABLAS EXCLUIDAS (globales de la plataforma, NO por empresa): se listan aquí
-- para revisarlas fácilmente. Si alguna debe llevar IdEmpresa, solo quítela del
-- listado y vuelva a ejecutar el script.
--   modulos, permisos, perfiles, roles, usuarioroles, rolpermisos,
--   perfilpermisos, usuariopermisos, parametrosseguridad, planes,
--   plan_modulos, plan_limites, tipos_limite, suscripcion_modulos,
--   ciudades
-- ============================================================================

USE BissVet;

-- ----------------------------------------------------------------------------
-- Procedimiento que agrega IdEmpresa a las tablas base que no la tienen
-- ----------------------------------------------------------------------------
DROP PROCEDURE IF EXISTS bissvet_agregar_idempresa;

DELIMITER $$
CREATE PROCEDURE bissvet_agregar_idempresa()
BEGIN
    DECLARE v_done  INT DEFAULT 0;
    DECLARE v_tabla VARCHAR(64);
    DECLARE v_sql   TEXT;
    DECLARE v_sin_empresa CURSOR FOR
        SELECT t.TABLE_NAME
          FROM information_schema.TABLES t
         WHERE t.TABLE_SCHEMA = DATABASE()
           AND t.TABLE_TYPE   = 'BASE TABLE'
           AND NOT EXISTS (
               SELECT 1 FROM information_schema.COLUMNS c
                WHERE c.TABLE_SCHEMA = t.TABLE_SCHEMA
                  AND c.TABLE_NAME   = t.TABLE_NAME
                  AND c.COLUMN_NAME IN ('IdEmpresa','idEmpresa'))
           AND t.TABLE_NAME NOT IN (
               'modulos','permisos','perfiles','roles',
               'usuarioroles','rolpermisos','perfilpermisos','usuariopermisos',
               'parametrosseguridad','planes','plan_modulos','plan_limites',
               'tipos_limite','suscripcion_modulos','ciudades')
         ORDER BY t.TABLE_NAME;
    DECLARE CONTINUE HANDLER FOR NOT FOUND SET v_done = 1;

    OPEN v_sin_empresa;

    -- 1) Agrega la columna + índice a cada tabla que no la tiene.
    --    NOT NULL se evita a propósito para no bloquear datos existentes.
    agregar: LOOP
        FETCH v_sin_empresa INTO v_tabla;
        IF v_done THEN
            LEAVE agregar;
        END IF;

        SET @s = CONCAT(
            'ALTER TABLE `', v_tabla,
            '` ADD COLUMN IdEmpresa INT NULL COMMENT ''Empresa propietaria''',
            ', ADD KEY `ix_', v_tabla, '_idempresa` (IdEmpresa)'
        );
        PREPARE stmt FROM @s;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END LOOP;

    CLOSE v_sin_empresa;

    -- 2) Rellena con la empresa por defecto (1) las filas ya existentes.
    SET v_done = 0;
    OPEN v_sin_empresa;

    rellenar: LOOP
        FETCH v_sin_empresa INTO v_tabla;
        IF v_done THEN
            LEAVE rellenar;
        END IF;

        SET @s = CONCAT(
            'UPDATE `', v_tabla, '` SET IdEmpresa = 1 WHERE IdEmpresa IS NULL'
        );
        PREPARE stmt FROM @s;
        EXECUTE stmt;
        DEALLOCATE PREPARE stmt;
    END LOOP;

    CLOSE v_sin_empresa;
END$$
DELIMITER ;

CALL bissvet_agregar_idempresa();
DROP PROCEDURE IF EXISTS bissvet_agregar_idempresa;

-- ----------------------------------------------------------------------------
-- Vista de control: tablas de negocio sin columna IdEmpresa (debe quedar vacía)
-- ----------------------------------------------------------------------------
SELECT TABLE_NAME AS SinIdEmpresa
  FROM information_schema.TABLES t
 WHERE t.TABLE_SCHEMA = DATABASE()
   AND t.TABLE_TYPE   = 'BASE TABLE'
   AND NOT EXISTS (
       SELECT 1 FROM information_schema.COLUMNS c
        WHERE c.TABLE_SCHEMA = t.TABLE_SCHEMA
          AND c.TABLE_NAME   = t.TABLE_NAME
          AND c.COLUMN_NAME IN ('IdEmpresa','idEmpresa'))
   AND t.TABLE_NAME NOT IN (
       'modulos','permisos','perfiles','roles',
       'usuarioroles','rolpermisos','perfilpermisos','usuariopermisos',
       'parametrosseguridad','planes','plan_modulos','plan_limites',
       'tipos_limite','suscripcion_modulos','ciudades');