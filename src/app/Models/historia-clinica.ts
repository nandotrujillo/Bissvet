export interface HistoriaClinica {
  IdHistoriaClinica?: number;
  IdCita?: number | null;
  IdMascota: number;
  IdVeterinario: number;
  FechaAtencion: string;
  MotivoConsulta: string;
  EnfermedadActual?: string | null;
  Observaciones?: string | null;
  Estado?: string;
  FechaCreacion?: string;
  UsuarioIdCreacion?: number | null;
  FechaModificacion?: string;
  UsuarioIdModificacion?: number | null;
  // Join fields
  NombreMascota?: string;
  NombreVeterinario?: string;
}
