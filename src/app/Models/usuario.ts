export interface Usuario {

  UsuarioId?: number;

  IdEmpresa?: number;
  IdPerfil?: number;

  Username?: string;

  Password?: string;

  TipoDocumento?: string;
  NumeroDocumento?: string;

  PrimerNombre?: string;
  SegundoNombre?: string;
  PrimerApellido?: string;
  SegundoApellido?: string;

  Correo?: string;
  Telefono?: string;

  Activo?: boolean;
  Bloqueado?: boolean;

  Perfil?: string;
  NombreComercial?: string;

  IntentosFallidos?: number;
  FechaUltimoIngreso?: string | null;
  FechaCreacion?: string | null;

}