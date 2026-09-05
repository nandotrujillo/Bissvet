export interface Control {
  IdControl?: number;
  IdHistoriaClinica?: number | null;
  IdMascota: number;
  IdVeterinario: number;
  IdCirugia?: number | null;
  FechaControl: string;
  Motivo?: string | null;
  Evolucion?: string | null;
  Peso?: number | null;
  SignosVitales?: string | null;
  Observaciones?: string | null;
  Recomendaciones?: string | null;
  ProximoControl?: string | null;
  FechaCreacion?: string;
  UsuarioIdCreacion?: number | null;
  NombreMascota?: string;
  NombreVeterinario?: string;
}
