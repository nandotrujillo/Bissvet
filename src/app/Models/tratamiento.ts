export interface Tratamiento {
  IdTratamiento?: number;
  IdHistoriaClinica: number;
  NombreTratamiento: string;
  Descripcion?: string | null;
  FechaInicio?: string | null;
  FechaFin?: string | null;
  Indicaciones?: string | null;
  Observaciones?: string | null;
  Estado?: string;
  FechaCreacion?: string;
  UsuarioIdCreacion?: number | null;
  FechaModificacion?: string;
  UsuarioIdModificacion?: number | null;
  NombreMascota?: string;
}
