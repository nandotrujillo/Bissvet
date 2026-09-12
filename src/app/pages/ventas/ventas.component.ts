import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Bodega } from '../../Models/bodega';
import { Producto } from '../../Models/producto';

import { VentasService } from '../../Services/ventas.service';
import { ClientesService } from '../../Services/clientes.service';
import { UsuarioService } from '../../Services/usuario.service';
import { BodegaService } from '../../Services/Bodega.service';
import { ProductosService } from '../../Services/productos.service';
import { TipoPagoService } from '../../Services/tipo-pago.service';
import { TipoImpuestoService } from '../../Services/tipo-impuesto.service';

@Component({
  selector: 'app-ventas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './ventas.component.html',
  styleUrls: ['./ventas.component.css']
})
export class VentasComponent implements OnInit {

  ventas: any[] = [];
  clientes: any[] = [];
  vendedores: any[] = [];
  tiposPago: any[] = [];
  bodegas: Bodega[] = [];
  productos: Producto[] = [];

  filtroEstado = '';
  filtroCliente = 0;
  filtroBodega = 0;

  // Formulario
  venta: any = this.nuevaVenta();
  detalle: any[] = [];
  editando = false;
  mostrarFormulario = false;
  IdVentaEdicion?: number;

  // Parámetro global de impuesto a las ventas (leído automáticamente)
  impuestoVentas = 0;

  // Ver detalle
  detalleVista: any = null;

  mensaje = '';
  error = '';

  // Protección contra doble submit y envíos en curso
  cargando = false;
  facturando = false;
  imprimiendo = false;

  constructor(
    private ventasService: VentasService,
    private clientesService: ClientesService,
    private usuarioService: UsuarioService,
    private bodegaService: BodegaService,
    private productosService: ProductosService,
    private tipoPagoService: TipoPagoService,
    private tipoImpuestoService: TipoImpuestoService
  ) {}

  ngOnInit(): void {
    this.cargarVentas();
    this.cargarClientes();
    this.cargarVendedores();
    this.cargarTiposPago();
    this.cargarBodegas();
    this.cargarProductos();
    this.cargarImpuestoVentas();
  }

  cargarImpuestoVentas(): void {
    this.tipoImpuestoService.impuestoVentas().subscribe({
      next: (r: any) => {
        const pct = Number(r?.datos?.Porcentaje) || 0;
        this.impuestoVentas = pct;
        this.venta.PorcentajeImpuesto = pct;
      },
      error: (e: any) => {
        console.error('Error cargando impuesto a las ventas:', e);
      }
    });
  }

  nuevaVenta(): any {
    return {
      IdCliente: 0,
      IdVendedor: 0,
      TipoPago: '',
      PorcentajeImpuesto: this.impuestoVentas,
      IdBodega: 0,
      Fecha: new Date().toISOString().slice(0, 10),
      Observaciones: ''
    };
  }

  nuevoItem(): any {
    return { IdProducto: 0, Cantidad: 1, PrecioUnitario: 0, Descuento: 0 };
  }

  nombreCompletoCliente(c: any): string {
    return [c.PrimerNombre, c.SegundoNombre, c.PrimerApellido, c.SegundoApellido]
      .filter(Boolean)
      .join(' ');
  }

  nombreVendedor(u: any): string {
    return [u.PrimerNombre, u.SegundoNombre, u.PrimerApellido, u.SegundoApellido]
      .filter(Boolean)
      .join(' ');
  }

  cargarVentas(): void {
    const params: any = {};
    if (this.filtroEstado) { params.estado = this.filtroEstado; }
    if (Number(this.filtroCliente) > 0) { params.cliente = this.filtroCliente; }
    if (Number(this.filtroBodega) > 0) { params.bodega = this.filtroBodega; }

    this.ventasService.listar(params).subscribe({
      next: (r: any) => { this.ventas = r?.datos ?? []; },
      error: (e: any) => {
        console.error('Error cargando ventas:', e);
        this.error = 'No fue posible cargar las ventas.';
      }
    });
  }

  cargarClientes(): void {
    this.clientesService.listar().subscribe({
      next: (r: any) => { this.clientes = r?.datos ?? []; },
      error: (e: any) => {
        console.error('Error cargando clientes:', e);
        this.error = 'No fue posible cargar los clientes.';
      }
    });
  }

  cargarVendedores(): void {
    this.usuarioService.obtenerVendedores().subscribe({
      next: (r: any) => { this.vendedores = r?.datos ?? []; },
      error: (e: any) => {
        console.error('Error cargando vendedores:', e);
        this.error = 'No fue posible cargar los vendedores.';
      }
    });
  }

  cargarTiposPago(): void {
    this.tipoPagoService.listar(true).subscribe({
      next: (r: any) => { this.tiposPago = r?.datos ?? []; },
      error: (e: any) => {
        console.error('Error cargando tipos de pago:', e);
        this.error = 'No fue posible cargar los tipos de pago.';
      }
    });
  }

  cargarBodegas(): void {
    this.bodegaService.listar().subscribe({
      next: (r: any) => { this.bodegas = r?.datos ?? []; },
      error: (e: any) => {
        console.error('Error cargando bodegas:', e);
        this.error = 'No fue posible cargar las bodegas.';
      }
    });
  }

  cargarProductos(): void {
    this.productosService.listar().subscribe({
      next: (r: any) => { this.productos = r?.datos ?? []; },
      error: (e: any) => {
        console.error('Error cargando productos:', e);
        this.error = 'No fue posible cargar los productos.';
      }
    });
  }

  // ==================================================
  // TOTALES
  // ==================================================

  // Impuesto por línea: (importe línea) * % IVA / 100
  impuestoLinea(item: any): number {
    const base = (Number(item.Cantidad) || 0) * (Number(item.PrecioUnitario) || 0);
    const desc = Number(item.Descuento) || 0;
    const pct = Number(this.venta.PorcentajeImpuesto) || 0;
    return Math.round((base - desc) * pct) / 100;
  }

  calcularTotales(): any {
    let Subtotal = 0, Descuento = 0, Impuesto = 0, Total = 0;
    for (const item of this.detalle) {
      const base = (Number(item.Cantidad) || 0) * (Number(item.PrecioUnitario) || 0);
      const desc = Number(item.Descuento) || 0;
      const subLinea = base - desc;
      const imp = this.impuestoLinea(item);
      Subtotal += subLinea;
      Descuento += desc;
      Impuesto += imp;
      Total += subLinea + imp;
    }
    return { Subtotal, Descuento, Impuesto, Total };
  }

  // ==================================================
  // FORMULARIO
  // ==================================================

  agregarItem(): void {
    this.detalle.push(this.nuevoItem());
  }

  // Al elegir un producto se carga automáticamente su precio de venta.
  onProductoChange(item: any): void {
    const p = this.productos.find(x => x.IdProducto === item.IdProducto);
    if (p) {
      item.PrecioUnitario = p.PrecioVenta ?? 0;
    } else {
      item.PrecioUnitario = 0;
    }
  }

  quitarItem(index: number): void {
    this.detalle.splice(index, 1);
  }

  nueva(): void {
    this.venta = this.nuevaVenta();
    this.detalle = [this.nuevoItem()];
    this.editando = false;
    this.IdVentaEdicion = undefined;
    this.mostrarFormulario = true;
    this.detalleVista = null;
    this.mensaje = '';
    this.error = '';
  }

  editar(venta: any): void {
    this.ventasService.obtener(venta.IdVenta).subscribe({
      next: (r: any) => {
        const datos = r?.datos ?? {};
        this.IdVentaEdicion = venta.IdVenta;
        this.venta = {
          IdCliente: datos.IdCliente,
          IdVendedor: datos.IdVendedor || 0,
          TipoPago: datos.TipoPago || '',
          PorcentajeImpuesto: Number(datos.PorcentajeImpuesto) || 0,
          IdBodega: datos.IdBodega,
          Fecha: (datos.Fecha || '').slice(0, 10),
          Observaciones: datos.Observaciones
        };
        this.detalle = (datos.Detalle || []).map((d: any) => ({
          IdProducto: d.IdProducto,
          IdServicio: d.IdServicio,
          NombreServicio: d.NombreServicio,
          Cantidad: d.Cantidad,
          PrecioUnitario: d.PrecioUnitario,
          Descuento: d.Descuento
        }));
        if (!this.detalle.length) { this.detalle = [this.nuevoItem()]; }
        this.editando = true;
        this.mostrarFormulario = true;
        this.detalleVista = null;
        this.mensaje = '';
        this.error = '';
      },
      error: (e: any) => {
        console.error('Error obteniendo venta:', e);
        this.error = 'No fue posible cargar la venta.';
      }
    });
  }

  cancelar(): void {
    this.venta = this.nuevaVenta();
    this.detalle = [];
    this.mostrarFormulario = false;
    this.editando = false;
    this.IdVentaEdicion = undefined;
    this.mensaje = '';
    this.error = '';
  }

  guardar(): void {

    if (this.cargando || this.facturando) { return; }

    this.mensaje = '';
    this.error = '';

    if (!this.validar()) { return; }

    this.cargando = true;

    const IdEmpresa = Number(localStorage.getItem('IdEmpresa')) || null;
    const UsuarioId = Number(localStorage.getItem('UsuarioId')) || null;

    const body: any = {
      IdCliente: this.venta.IdCliente,
      IdVendedor: this.venta.IdVendedor,
      TipoPago: this.venta.TipoPago,
      PorcentajeImpuesto: this.venta.PorcentajeImpuesto,
      IdBodega: this.venta.IdBodega,
      Fecha: this.venta.Fecha,
      Observaciones: this.venta.Observaciones,
      UsuarioIdCreacion: UsuarioId,
      IdEmpresa,
      Detalle: this.detalle
    };

    if (this.editando && this.IdVentaEdicion) {

      body['UsuarioIdModificacion'] = null;

      this.ventasService.actualizar(this.IdVentaEdicion, body).subscribe({
        next: () => {
          this.cargando = false;
          this.mensaje = 'Venta actualizada (BORRADOR).';
          this.cargarVentas();
          this.cancelar();
        },
        error: (e: any) => {
          this.cargando = false;
          console.error('Error actualizando venta:', e);
          this.error = e?.error?.mensaje || 'No fue posible actualizar la venta.';
        }
      });

    } else {

      this.ventasService.crear(body).subscribe({
        next: (respuesta: any) => {
          this.cargando = false;
          this.mensaje = 'Venta ' + (respuesta.NumeroVenta || ('Id ' + respuesta.IdVenta)) + ' creada en estado BORRADOR.';
          this.cargarVentas();
          this.cancelar();
        },
        error: (e: any) => {
          this.cargando = false;
          console.error('Error creando venta:', e);
          this.error = e?.error?.mensaje || 'No fue posible crear la venta.';
        }
      });
    }
  }

  // Validación compartida del formulario (borrador y facturación).
  private validar(): boolean {
    if (!this.venta.IdCliente) {
      this.error = 'Debe seleccionar un cliente.';
      return false;
    }
    if (!this.venta.IdVendedor) {
      this.error = 'Debe seleccionar un vendedor.';
      return false;
    }
    if (!this.venta.TipoPago || !this.venta.TipoPago.trim()) {
      this.error = 'Debe seleccionar el tipo de pago.';
      return false;
    }
    if (!Number(this.venta.IdBodega) || Number(this.venta.IdBodega) <= 0) {
      this.error = 'Debe seleccionar una bodega válida.';
      return false;
    }
    if (!this.detalle.length) {
      this.error = 'Debe agregar al menos un producto.';
      return false;
    }
    for (const item of this.detalle) {
      if (!item.IdProducto) { this.error = 'Cada fila debe tener un producto.'; return false; }
      if (!item.Cantidad || item.Cantidad <= 0) { this.error = 'La cantidad debe ser mayor a 0.'; return false; }
      if (item.PrecioUnitario === undefined || item.PrecioUnitario < 0) { this.error = 'El precio unitario es inválido.'; return false; }
    }
    return true;
  }

  // ==================================================
  // FACTURAR + IMPRIMIR (flujo unificado)
  // Crea el borrador, lo CONFIRMA y abre la factura en PDF,
  // todo en una sola acción y sin permitir doble envío.
  // ==================================================

  facturar(): void {

    if (this.cargando || this.facturando) { return; }

    this.mensaje = '';
    this.error = '';

    if (!this.validar()) { return; }

    this.facturando = true;

    const UsuarioId = Number(localStorage.getItem('UsuarioId')) || null;

    const body: any = {
      IdCliente: this.venta.IdCliente,
      IdVendedor: this.venta.IdVendedor,
      TipoPago: this.venta.TipoPago,
      PorcentajeImpuesto: this.venta.PorcentajeImpuesto,
      IdBodega: this.venta.IdBodega,
      Fecha: this.venta.Fecha,
      Observaciones: this.venta.Observaciones,
      UsuarioIdCreacion: UsuarioId,
      IdEmpresa: Number(localStorage.getItem('IdEmpresa')) || null,
      Detalle: this.detalle
    };

    this.ventasService.crear(body).subscribe({
      next: (respuesta: any) => {
        const IdVenta = respuesta.IdVenta;
        const NumeroVenta = respuesta.NumeroVenta || '';

        this.ventasService.confirmar(IdVenta, { UsuarioIdConfirmacion: UsuarioId }).subscribe({
          next: () => {
            this.facturando = false;
            this.mensaje = 'Venta ' + NumeroVenta + ' facturada correctamente.';
            this.cargarVentas();
            this.cancelar();
            this.imprimir(IdVenta);
          },
          error: (e: any) => {
            this.facturando = false;
            console.error('Error confirmando venta:', e);
            this.error = e?.error?.mensaje || 'No fue posible confirmar la factura.';
            this.cargarVentas();
          }
        });
      },
      error: (e: any) => {
        this.facturando = false;
        console.error('Error creando venta:', e);
        this.error = e?.error?.mensaje || 'No fue posible crear la factura.';
      }
    });
  }

  // Descarga el PDF de la venta (factura).
  imprimir(IdVenta?: number): void {

    if (this.imprimiendo) { return; }

    const id = IdVenta ?? (this.detalleVista ? this.detalleVista.IdVenta : null);
    if (!id) { return; }

    this.imprimiendo = true;

    this.ventasService.imprimir(Number(id)).subscribe({
      next: (blob: Blob) => {
        this.imprimiendo = false;
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.target = '_blank';
        a.download = `factura.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (e: any) => {
        this.imprimiendo = false;
        console.error('Error imprimiendo venta:', e);
        this.error = e?.error?.mensaje || 'No fue posible generar la factura PDF.';
      }
    });
  }

  // ==================================================
  // ACCIONES SOBRE DOCUMENTO
  // ==================================================

  ver(venta: any): void {
    this.ventasService.obtener(venta.IdVenta).subscribe({
      next: (r: any) => {
        this.detalleVista = r?.datos ?? null;
        this.mostrarFormulario = false;
        this.mensaje = '';
        this.error = '';
      },
      error: (e: any) => {
        console.error('Error obteniendo venta:', e);
        this.error = 'No fue posible cargar el detalle.';
      }
    });
  }

  cerrarVista(): void {
    this.detalleVista = null;
  }

  confirmar(venta: any): void {

    const confirmar = confirm(`¿Confirmar la venta #${venta.NumeroVenta}? Saldrá mercancía de inventario (CPP).`);

    if (!confirmar) { return; }

    this.ventasService.confirmar(venta.IdVenta, { UsuarioIdConfirmacion: Number(localStorage.getItem('UsuarioId')) || null }).subscribe({
      next: () => {
        this.mensaje = 'Venta confirmada, inventario actualizado.';
        this.cargarVentas();
      },
      error: (e: any) => {
        console.error('Error confirmando venta:', e);
        this.error = e?.error?.mensaje || 'No fue posible confirmar la venta.';
      }
    });
  }

  anular(venta: any): void {

    const motivo = prompt('Motivo de anulación:');

    if (motivo === null) { return; }

    this.ventasService.anular(venta.IdVenta, { UsuarioIdAnulacion: Number(localStorage.getItem('UsuarioId')) || null, MotivoAnulacion: motivo }).subscribe({
      next: () => {
        this.mensaje = 'Venta anulada, inventario restaurado.';
        this.cargarVentas();
      },
      error: (e: any) => {
        console.error('Error anulando venta:', e);
        this.error = e?.error?.mensaje || 'No fue posible anular la venta.';
      }
    });
  }

  eliminar(venta: any): void {

    const confirmar = confirm(`¿Eliminar la venta #${venta.NumeroVenta}?`);

    if (!confirmar) { return; }

    this.ventasService.eliminar(venta.IdVenta).subscribe({
      next: () => {
        this.mensaje = 'Venta eliminada.';
        this.cargarVentas();
      },
      error: (e: any) => {
        console.error('Error eliminando venta:', e);
        this.error = e?.error?.mensaje || 'No fue posible eliminar la venta.';
      }
    });
  }

  nombreProducto(id: number): string {
    const p = this.productos.find(x => x.IdProducto === id);
    return p ? `${p.CodigoProducto} - ${p.NombreProducto}` : '';
  }
}