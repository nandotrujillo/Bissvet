export interface Mascota {

  IdMascota?: number;

  ClienteId: number;

  Nombre: string;

  Especie: string;

  Raza?: string;

  Sexo?: string;

  FechaNacimiento?: string;

  Color?: string;

  Peso?: number;

  Microchip?: string;

  Esterilizado?: boolean;

  Observaciones?: string;

  Activo?: boolean;

  FechaCreacion?: string;

  UsuarioIdCreacion?: number;

  FechaModificacion?: string;

  UsuarioIdModificacion?: number;

  // Campos del cliente (devueltos por el backend con JOIN)
  NombreCliente?: string;
  NombreClienteCompleto?: string;
  TelefonoCliente?: string;
  CorreoCliente?: string;
  DireccionCliente?: string;

}