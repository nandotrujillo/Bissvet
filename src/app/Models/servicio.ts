export interface Servicio {

  IdServicio?: number;

  IdCategoriaServicio?: number | null;

  Nombre: string;

  Descripcion?: string | null;

  Precio?: number;

  Activo?: number;

  IdEmpresa?: number | null;

  NombreCategoria?: string;

}
