export interface Compra {

  IdCompra?: number;

  Numero?: string;

  Fecha?: string;

  Estado?: string;

  IdProveedor?: number | null;

  NombreProveedor?: string;

  Nit?: string;

  IdBodega?: number | null;

  NombreBodega?: string;

  Subtotal?: number;

  Descuento?: number;

  Impuesto?: number;

  Total?: number;

  MetodoPago?: string;

  SaldoPendiente?: number;

  Cuotas?: any[];

  Observaciones?: string;

  UsuarioIdCreacion?: number | null;

  FechaCreacion?: string;

  FechaConfirmacion?: string;

  FechaAnulacion?: string;

  TotalItems?: number;

}