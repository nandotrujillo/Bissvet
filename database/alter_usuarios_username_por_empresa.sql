-- ============================================================================
-- Migración: unicidad de Usuario POR EMPRESA (login usuario + empresa)
-- ----------------------------------------------------------------------------
-- Modelo elegido: cada empresa puede tener su propio "admin" / "usuario".
-- Se elimina la unicidad global de Username y se crea UNIQUE(IdEmpresa, Username).
-- ============================================================================

USE BissVet;

-- 1) Eliminar la unicidad global del username
ALTER TABLE Usuarios
  DROP INDEX UQ_Usuarios_Username;

-- 2) Crear unicidad compuesta: (IdEmpresa, Username)
--    IdEmpresa es NULLable sólo por compatibilidad (no hay usuarios globales hoy).
ALTER TABLE Usuarios
  ADD UNIQUE KEY UQ_Usuarios_Username_Empresa (IdEmpresa, Username);