export interface Empresa {

  IdEmpresa: number;

  CodigoEmpresa: string;

  Nit: string;

  RazonSocial: string;

  NombreComercial: string;

  TipoDocumento?: string;

  Direccion?: string;

  Telefono?: string;

  Correo?: string;

  Contacto?: string;

  TelefonoContacto?: string;

  IdCiudad?: number;

  Activo?: number;

  UsaControlCaja?: number;

  ControlExistencias?: number;

}