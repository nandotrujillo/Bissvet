export interface Plan {
  IdPlan?: number;
  CodigoPlan: string;
  NombrePlan: string;
  Descripcion?: string;
  PrecioMensual?: number;
  PrecioAnual?: number;
  Moneda?: string;
  MaxUsuarios?: number;
  DiasPrueba?: number;
  Activo?: number;
  modulos?: PlanModulo[];
  limites?: PlanLimite[];
  FechaCreacion?: string;
}

export interface PlanModulo {
  idModulos?: number;
  Codigo?: string;
  NombreModulo?: string;
  Orden?: number;
}

export interface PlanLimite {
  IdPlan?: number;
  IdTipoLimite?: number;
  Codigo?: string;
  Nombre?: string;
  Unidad?: string;
  maximo?: number;
  actual?: number;
}

export interface TipoLimite {
  IdTipoLimite: number;
  Codigo: string;
  Nombre: string;
  Descripcion?: string;
  Unidad?: string;
}