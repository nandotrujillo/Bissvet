export interface Cita {
  IdCita?: number;
  IdMascota: number;
  IdVeterinario: number;
  IdServicio: number;
  FechaCita: string;
  HoraCita: string;
  Estado?: string;
  MotivoConsulta?: string | null;
  Observaciones?: string | null;
  FechaCreacion?: string;
  UsuarioIdCreacion?: number | null;
  FechaModificacion?: string;
  UsuarioIdModificacion?: number | null;
  // Join fields
  NombreMascota?: string;
  Especie?: string;
  Raza?: string;
  Sexo?: string;
  NombreVeterinario?: string;
  TarjetaProfesional?: string;
  Especialidad?: string;
  NombreServicio?: string;
  Precio?: number;
  NombreCliente?: string;
  TelefonoCliente?: string;
}
