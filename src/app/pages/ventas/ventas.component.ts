import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Bodega } from '../../Models/bodega';
import { Producto } from '../../Models/producto';

import { VentasService } from '../../Services/ventas.service';
import { ClientesService } from '../../Services/clientes.service';
import { MascotasService } from '../../Services/mascotas.service';
import { BodegaService } from '../../Services/Bodega.service ';
import { ProductosService } from '../../Services/productos.service';

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
  mascotas: any[] = [];
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

  // Ver detalle
  detalleVista: any = null;

  mensaje = '';
  error = '';

  constructor(
    private ventasService: VentasService,
    private clientesService: ClientesService,
    private mascotasService: MascotasService,
    private bodegaService: BodegaService,
    private productosService: ProductosService
  ) {}

  ngOnInit(): void {
    this.cargarVentas();
    this.cargarClientes();
    this.cargarMascotas();
    this.cargarBodegas();
    this.cargarProductos();
  }

  nuevaVenta(): any {
    return {
      NumeroVenta: '',
      IdCliente: 0,
      IdMascota: 0,
      IdBodega: 0,
      Fecha: new Date().toISOString().slice(0, 10),
      Observaciones: ''
    };
  }

  nuevoItem(): any {
    return { IdProducto: 0, Cantidad: 1, PrecioUnitario: 0, Descuento: 0, Impuesto: 0 };
  }

  nombreCompletoCliente(c: any): string {
    return [c.PrimerNombre, c.SegundoNombre, c.PrimerApellido, c.SegundoApellido]
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

  cargarMascotas(): void {
    this.mascotasService.listar().subscribe({
      next: (r: any) => { this.mascotas = r?.datos ?? []; },
      error: (e: any) => {
        console.error('Error cargando mascotas:', e);
        this.error = 'No fue posible cargar las mascotas.';
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

  calcularTotales(): any {
    let Subtotal = 0, Descuento = 0, Impuesto = 0, Total = 0;
    for (const item of this.detalle) {
      const base = (Number(item.Cantidad) || 0) * (Number(item.PrecioUnitario) || 0);
      const desc = Number(item.Descuento) || 0;
      const imp = Number(item.Impuesto) || 0;
      const subLinea = base - desc;
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
          NumeroVenta: datos.NumeroVenta,
          IdCliente: datos.IdCliente,
          IdMascota: datos.IdMascota,
          IdBodega: datos.IdBodega,
          Fecha: (datos.Fecha || '').slice(0, 10),
          Observaciones: datos.Observaciones
        };
        this.detalle = (datos.Detalle || []).map((d: any) => ({
          IdProducto: d.IdProducto,
          Cantidad: d.Cantidad,
          PrecioUnitario: d.PrecioUnitario,
          Descuento: d.Descuento,
          Impuesto: d.Impuesto
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

    this.mensaje = '';
    this.error = '';

    if (!this.venta.NumeroVenta || !this.venta.NumeroVenta.trim()) {
      this.error = 'El número de venta es obligatorio.';
      return;
    }
    if (!this.venta.IdCliente) {
      this.error = 'Debe seleccionar un cliente.';
      return;
    }
    if (!this.venta.IdBodega) {
      this.error = 'Debe seleccionar una bodega.';
      return;
    }
    if (!this.detalle.length) {
      this.error = 'Debe agregar al menos un producto.';
      return;
    }
    for (const item of this.detalle) {
      if (!item.IdProducto) { this.error = 'Cada fila debe tener un producto.'; return; }
      if (!item.Cantidad || item.Cantidad <= 0) { this.error = 'La cantidad debe ser mayor a 0.'; return; }
      if (item.PrecioUnitario === undefined || item.PrecioUnitario < 0) { this.error = 'El precio unitario es inválido.'; return; }
    }

    const body: any = {
      NumeroVenta: this.venta.NumeroVenta,
      IdCliente: this.venta.IdCliente,
      IdMascota: this.venta.IdMascota || null,
      IdBodega: this.venta.IdBodega,
      Fecha: this.venta.Fecha,
      Observaciones: this.venta.Observaciones,
      UsuarioIdCreacion: null,
      Detalle: this.detalle
    };

    if (this.editando && this.IdVentaEdicion) {

      body['UsuarioIdModificacion'] = null;

      this.ventasService.actualizar(this.IdVentaEdicion, body).subscribe({
        next: () => {
          this.mensaje = 'Venta actualizada (BORRADOR).';
          this.cargarVentas();
          this.cancelar();
        },
        error: (e: any) => {
          console.error('Error actualizando venta:', e);
          this.error = e?.error?.mensaje || 'No fue posible actualizar la venta.';
        }
      });

    } else {

      this.ventasService.crear(body).subscribe({
        next: (respuesta: any) => {
          this.mensaje = 'Venta creada en estado BORRADOR (Id ' + respuesta.IdVenta + ').';
          this.cargarVentas();
          this.cancelar();
        },
        error: (e: any) => {
          console.error('Error creando venta:', e);
          this.error = e?.error?.mensaje || 'No fue posible crear la venta.';
        }
      });
    }
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

    this.ventasService.confirmar(venta.IdVenta, { UsuarioIdConfirmacion: null }).subscribe({
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

    this.ventasService.anular(venta.IdVenta, { UsuarioIdAnulacion: null, MotivoAnulacion: motivo }).subscribe({
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