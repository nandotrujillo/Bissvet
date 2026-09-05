export interface Producto {

  IdProducto?: number;

  CodigoProducto: string;

  CodigoBarras?: string;

  NombreProducto: string;

  Descripcion?: string;

  IdCategoriaProducto: number;

  Categoria?: string;

  IdUnidadMedida?: number | null;

  UnidadMedida?: string;

  IdMarca?: number | null;

  NombreMarca?: string;

  Referencia?: string;

  PrecioVenta?: number;

  CostoActual?: number;

  CostoPromedio?: number;

  StockMinimo?: number;

  StockMaximo?: number;

  ManejaInventario?: number;

  PermiteVenta?: number;

  Activo: number;

  FechaCreacion?: string;

  FechaModificacion?: string;

}