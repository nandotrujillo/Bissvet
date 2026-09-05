export interface Proveedor {

  IdProveedor?: number;

  TipoDocumento?: string;

  NumeroDocumento?: string;

  Nit?: string;

  Nombre: string;

  Telefono?: string;

  Email?: string;

  Direccion?: string;

  IdCiudad?: number | null;

  NombreCiudad?: string;

  Contacto?: string;

  Activo: number;

  FechaCreacion?: string;

  FechaModificacion?: string;

}