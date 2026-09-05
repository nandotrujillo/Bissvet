export interface Bodega {

  Id?: number;

  CodigoBodega: string;

  NombreBodega: string;

  IdEmpresa?: number | null;

  Estatus?: number;

  exAuxiliar?: number;

  Descripcion?: string;

  Direccion?: string;

  Responsable?: string;

  Activo: number;

}

