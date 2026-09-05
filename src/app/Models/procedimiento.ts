export interface Procedimiento {
  IdProcedimiento?: number;
  IdHistoriaClinica: number;
  IdServicio?: number | null;
  NombreProcedimiento: string;
  Fecha?: string;
  Descripcion?: string | null;
  Resultado?: string | null;
  Observaciones?: string | null;
  FechaCreacion?: string;
  UsuarioIdCreacion?: number | null;
  NombreServicio?: string;
}
