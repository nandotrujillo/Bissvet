export interface DetalleReceta {
  IdDetalleReceta?: number;
  IdReceta: number;
  IdProducto?: number | null;
  Medicamento: string;
  Concentracion?: string | null;
  FormaFarmaceutica?: string | null;
  Dosis?: string | null;
  UnidadDosis?: string | null;
  Frecuencia?: string | null;
  ViaAdministracion?: string | null;
  Duracion?: string | null;
  Cantidad?: number | null;
  Indicaciones?: string | null;
  Observaciones?: string | null;
  FechaCreacion?: string;
}

export interface Receta {
  IdReceta?: number;
  IdHistoriaClinica: number;
  Fecha?: string;
  IdVeterinario: number;
  Observaciones?: string | null;
  IndicacionesGenerales?: string | null;
  Estado?: string;
  FechaCreacion?: string;
  UsuarioIdCreacion?: number | null;
  NombreVeterinario?: string;
  TarjetaProfesional?: string;
  TotalMedicamentos?: number;
  detalle?: DetalleReceta[];
}
