export interface Veterinario {

  IdVeterinario?: number;

  UsuarioId: number;

  PrimerNombre: string;
  SegundoNombre?: string;

  PrimerApellido: string;
  SegundoApellido?: string;

  TipoDocumento: string;
  NumeroDocumento: string;

  TarjetaProfesional: string;

  Especialidad?: string;

  Telefono?: string;
  Telefono2?: string;

  Correo?: string;

  Direccion?: string;

  IdCiudad?: number;

  FechaNacimiento?: string;

  Observaciones?: string;

  Activo?: boolean;

  FechaCreacion?: string;
  UsuarioIdCreacion?: number;

  FechaModificacion?: string;
  UsuarioIdModificacion?: number;
}