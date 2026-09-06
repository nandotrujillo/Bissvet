export interface Venta {

  IdVenta?: number;

  NumeroVenta?: string;

  Fecha?: string;

  Estado?: string;

  IdCliente?: number | null;

  NombreCliente?: string;

  IdVendedor?: number | null;

  NombreVendedor?: string;

  TipoPago?: string;

  PorcentajeImpuesto?: number;

  IdBodega?: number | null;

  NombreBodega?: string;

  Subtotal?: number;

  Descuento?: number;

  Impuesto?: number;

  Total?: number;

  CostoTotal?: number;

  Utilidad?: number;

  Observaciones?: string;

  UsuarioIdCreacion?: number | null;

  FechaCreacion?: string;

  FechaConfirmacion?: string;

  FechaAnulacion?: string;

  TotalItems?: number;

}