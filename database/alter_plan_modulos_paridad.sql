-- ============================================================================
-- MIGRACIÓN: Paridad de módulos en todos los planes
-- Asegura que los planes BÁSICO (1), PROFESIONAL (2) y EMPRESARIAL (3) tengan
-- asignados TODOS los módulos operativos del sistema (idModulos 4..20),
-- de modo que cada empresa pueda contratarlos según su suscripción.
-- Los módulos legados MOD_1/2/3 (1,2,3) y los de monetización (55..57) no se
-- tocan. Idempotente: se puede ejecutar varias veces sin error.
-- ============================================================================

INSERT INTO plan_modulos (IdPlan, IdModulo, FechaAsignacion)
SELECT p.IdPlan, m.idModulos, NOW()
FROM planes p
JOIN modulos m ON m.Activo = 1 AND m.idModulos BETWEEN 4 AND 20
WHERE NOT EXISTS (
    SELECT 1 FROM plan_modulos pm
    WHERE pm.IdPlan = p.IdPlan AND pm.IdModulo = m.idModulos
);

-- Verificación
SELECT p.NombrePlan AS Plan, COUNT(pm.IdModulo) AS Modulos
FROM planes p
LEFT JOIN plan_modulos pm ON pm.IdPlan = p.IdPlan
GROUP BY p.IdPlan, p.NombrePlan
ORDER BY p.IdPlan;