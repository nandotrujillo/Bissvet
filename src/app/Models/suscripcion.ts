export interface Suscripcion {
  IdSuscripcion?: number;
  IdEmpresa: number;
  IdPlan: number;
  Estado: 'PRUEBA' | 'ACTIVA' | 'VENCIDA' | 'SUSPENDIDA' | 'CANCELADA';
  FechaInicio?: string;
  FechaFin?: string;
  Periodicidad?: 'MENSUAL' | 'ANUAL' | 'UNICO';
  AutoRenovacion?: number;
  FechaProximaFacturacion?: string;
  FechaCreacion?: string;
  FechaModificacion?: string;
  Motivo?: string;

  CodigoEmpresa?: string;
  NombreComercial?: string;
  Nit?: string;
  CodigoPlan?: string;
  NombrePlan?: string;
  PrecioMensual?: number;
  PrecioAnual?: number;
  Moneda?: string;
  MaxUsuarios?: number;
  usuariosActuales?: number;
  addonsActuales?: number;

  addons?: SuscripcionAddon[];
  historial?: HistorialSuscripcion[];
}

export interface SuscripcionAddon {
  IdModulo?: number;
  Codigo?: string;
  NombreModulo?: string;
  PrecioAdicional?: number;
}

export interface HistorialSuscripcion {
  IdHistorial?: number;
  IdSuscripcion?: number;
  IdEmpresa?: number;
  PlanAnterior?: number;
  PlanNuevo?: number;
  EstadoAnterior?: string;
  EstadoNuevo?: string;
  PrecioAnterior?: number;
  PrecioNuevo?: number;
  Motivo?: string;
  Username?: string;
  FechaCambio?: string;
}

export interface MiPlanRespuesta {
  existe: boolean;
  suscripcion?: any;
  modulos?: any[];
  consumo?: any;
}