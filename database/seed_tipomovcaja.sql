-- =============================================================================
-- SEED: tipomovcaja  (tipos de movimiento de caja por empresa)
-- Idempotente: solo inserta si el tipo no existe para la empresa.
-- Ejecutar: mysql -u root -p BissVet < database/seed_tipomovcaja.sql
-- =============================================================================

INSERT INTO tipomovcaja (DescTipoMovCaja, ProvisionCaja, Gastos, Ventas, Prestamo, idEmpresa, Estatus, IdUsuario, Signo, AplicaProveedores)
SELECT 'VENTA',         0, 0, 1, 0, e.idEmpresa, 1, (SELECT UsuarioId FROM Usuarios WHERE Username = 'admin' LIMIT 1), '+', 0
FROM empresas e
WHERE e.Activo = 1
  AND NOT EXISTS (SELECT 1 FROM tipomovcaja t
                  WHERE t.idEmpresa = e.idEmpresa AND t.DescTipoMovCaja = 'VENTA');

INSERT INTO tipomovcaja (DescTipoMovCaja, ProvisionCaja, Gastos, Ventas, Prestamo, idEmpresa, Estatus, IdUsuario, Signo, AplicaProveedores)
SELECT 'ABONO CLIENTE', 0, 0, 0, 0, e.idEmpresa, 1, (SELECT UsuarioId FROM Usuarios WHERE Username = 'admin' LIMIT 1), '+', 0
FROM empresas e
WHERE e.Activo = 1
  AND NOT EXISTS (SELECT 1 FROM tipomovcaja t
                  WHERE t.idEmpresa = e.idEmpresa AND t.DescTipoMovCaja = 'ABONO CLIENTE');

INSERT INTO tipomovcaja (DescTipoMovCaja, ProvisionCaja, Gastos, Ventas, Prestamo, idEmpresa, Estatus, IdUsuario, Signo, AplicaProveedores)
SELECT 'OTRO INGRESO',  0, 0, 0, 0, e.idEmpresa, 1, (SELECT UsuarioId FROM Usuarios WHERE Username = 'admin' LIMIT 1), '+', 0
FROM empresas e
WHERE e.Activo = 1
  AND NOT EXISTS (SELECT 1 FROM tipomovcaja t
                  WHERE t.idEmpresa = e.idEmpresa AND t.DescTipoMovCaja = 'OTRO INGRESO');

INSERT INTO tipomovcaja (DescTipoMovCaja, ProvisionCaja, Gastos, Ventas, Prestamo, idEmpresa, Estatus, IdUsuario, Signo, AplicaProveedores)
SELECT 'GASTO',         0, 1, 0, 0, e.idEmpresa, 1, (SELECT UsuarioId FROM Usuarios WHERE Username = 'admin' LIMIT 1), '-', 1
FROM empresas e
WHERE e.Activo = 1
  AND NOT EXISTS (SELECT 1 FROM tipomovcaja t
                  WHERE t.idEmpresa = e.idEmpresa AND t.DescTipoMovCaja = 'GASTO');

INSERT INTO tipomovcaja (DescTipoMovCaja, ProvisionCaja, Gastos, Ventas, Prestamo, idEmpresa, Estatus, IdUsuario, Signo, AplicaProveedores)
SELECT 'PROVISION',     1, 0, 0, 0, e.idEmpresa, 1, (SELECT UsuarioId FROM Usuarios WHERE Username = 'admin' LIMIT 1), '-', 1
FROM empresas e
WHERE e.Activo = 1
  AND NOT EXISTS (SELECT 1 FROM tipomovcaja t
                  WHERE t.idEmpresa = e.idEmpresa AND t.DescTipoMovCaja = 'PROVISION');

INSERT INTO tipomovcaja (DescTipoMovCaja, ProvisionCaja, Gastos, Ventas, Prestamo, idEmpresa, Estatus, IdUsuario, Signo, AplicaProveedores)
SELECT 'PRESTAMO',      0, 0, 0, 1, e.idEmpresa, 1, (SELECT UsuarioId FROM Usuarios WHERE Username = 'admin' LIMIT 1), '-', 0
FROM empresas e
WHERE e.Activo = 1
  AND NOT EXISTS (SELECT 1 FROM tipomovcaja t
                  WHERE t.idEmpresa = e.idEmpresa AND t.DescTipoMovCaja = 'PRESTAMO');

INSERT INTO tipomovcaja (DescTipoMovCaja, ProvisionCaja, Gastos, Ventas, Prestamo, idEmpresa, Estatus, IdUsuario, Signo, AplicaProveedores)
SELECT 'OTRO EGRESO',   0, 0, 0, 0, e.idEmpresa, 1, (SELECT UsuarioId FROM Usuarios WHERE Username = 'admin' LIMIT 1), '-', 0
FROM empresas e
WHERE e.Activo = 1
  AND NOT EXISTS (SELECT 1 FROM tipomovcaja t
                  WHERE t.idEmpresa = e.idEmpresa AND t.DescTipoMovCaja = 'OTRO EGRESO');