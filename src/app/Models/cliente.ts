export interface Cliente {

  ClienteId?: number;

  TipoDocumento: string;
  NumeroDocumento: string;

  PrimerNombre: string;
  SegundoNombre?: string;

  PrimerApellido: string;
  SegundoApellido?: string;

  Telefono?: string;
  Telefono2?: string;

  Correo?: string;
  Direccion?: string;
  IdCiudad?: Number;

  FechaNacimiento?: string | null;

  Observaciones?: string;

  Activo: boolean;

  FechaCreacion?: string | null;
  UsuarioIdCreacion?: number | null;

  FechaModificacion?: string | null;
  UsuarioIdModificacion?: number | null;

}