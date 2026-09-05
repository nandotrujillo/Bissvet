import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Proveedor } from '../../Models/proveedor';
import { Bodega } from '../../Models/bodega';
import { Producto } from '../../Models/producto';

import { ComprasService } from '../../Services/compras.service';
import { ProveedoresService } from '../../Services/proveedores.service';
import { BodegaService } from '../../Services/Bodega.service ';
import { ProductosService } from '../../Services/productos.service';

@Component({
  selector: 'app-compras',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './compras.component.html',
  styleUrls: ['./compras.component.css']
})
export class ComprasComponent implements OnInit {

  compras: any[] = [];
  proveedores: Proveedor[] = [];
  bodegas: Bodega[] = [];
  productos: Producto[] = [];

  filtroEstado = '';
  filtroProveedor = 0;
  filtroBodega = 0;

  // Formulario
  compra: any = this.nuevaCompra();
  detalle: any[] = [];
  editando = false;
  mostrarFormulario = false;
  IdCompraEdicion?: number;

  // Ver detalle
  detalleVista: any = null;

  mensaje = '';
  error = '';

  constructor(
    private comprasService: ComprasService,
    private proveedoresService: ProveedoresService,
    private bodegaService: BodegaService,
    private productosService: ProductosService
  ) {}

  ngOnInit(): void {
    this.cargarCompras();
    this.cargarProveedores();
    this.cargarBodegas();
    this.cargarProductos();
  }

  nuevaCompra(): any {
    return {
      Numero: '',
      IdProveedor: 0,
      IdBodega: 0,
      Fecha: new Date().toISOString().slice(0, 10),
      Observaciones: ''
    };
  }

  nuevoItem(): any {
    return { IdProducto: 0, Cantidad: 1, CostoUnitario: 0, Descuento: 0, Impuesto: 0 };
  }

  cargarCompras(): void {
    const params: any = {};
    if (this.filtroEstado) { params.estado = this.filtroEstado; }
    if (Number(this.filtroProveedor) > 0) { params.proveedor = this.filtroProveedor; }
    if (Number(this.filtroBodega) > 0) { params.bodega = this.filtroBodega; }

    this.comprasService.listar(params).subscribe({
      next: (r: any) => { this.compras = r?.datos ?? []; },
      error: (e: any) => {
        console.error('Error cargando compras:', e);
        this.error = 'No fue posible cargar las compras.';
      }
    });
  }

  cargarProveedores(): void {
    this.proveedoresService.listar().subscribe({
      next: (r: any) => { this.proveedores = r?.datos ?? []; },
      error: (e: any) => {
        console.error('Error cargando proveedores:', e);
        this.error = 'No fue posible cargar los proveedores.';
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
      const base = (Number(item.Cantidad) || 0) * (Number(item.CostoUnitario) || 0);
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
    this.compra = this.nuevaCompra();
    this.detalle = [this.nuevoItem()];
    this.editando = false;
    this.IdCompraEdicion = undefined;
    this.mostrarFormulario = true;
    this.detalleVista = null;
    this.mensaje = '';
    this.error = '';
  }

  editar(compra: any): void {
    this.comprasService.obtener(compra.IdCompra).subscribe({
      next: (r: any) => {
        const datos = r?.datos ?? {};
        this.IdCompraEdicion = compra.IdCompra;
        this.compra = {
          Numero: datos.Numero,
          IdProveedor: datos.IdProveedor,
          IdBodega: datos.IdBodega,
          Fecha: (datos.Fecha || '').slice(0, 10),
          Observaciones: datos.Observaciones
        };
        this.detalle = (datos.Detalle || []).map((d: any) => ({
          IdProducto: d.IdProducto,
          Cantidad: d.Cantidad,
          CostoUnitario: d.CostoUnitario,
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
        console.error('Error obteniendo compra:', e);
        this.error = 'No fue posible cargar la compra.';
      }
    });
  }

  cancelar(): void {
    this.compra = this.nuevaCompra();
    this.detalle = [];
    this.mostrarFormulario = false;
    this.editando = false;
    this.IdCompraEdicion = undefined;
    this.mensaje = '';
    this.error = '';
  }

  guardar(): void {

    this.mensaje = '';
    this.error = '';

    if (!this.compra.Numero || !this.compra.Numero.trim()) {
      this.error = 'El número del documento es obligatorio.';
      return;
    }
    if (!this.compra.IdProveedor) {
      this.error = 'Debe seleccionar un proveedor.';
      return;
    }
    if (!this.compra.IdBodega) {
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
      if (item.CostoUnitario === undefined || item.CostoUnitario < 0) { this.error = 'El costo unitario es inválido.'; return; }
    }

    const totales = this.calcularTotales();
    const body: any = {
      Numero: this.compra.Numero,
      IdProveedor: this.compra.IdProveedor,
      IdBodega: this.compra.IdBodega,
      Fecha: this.compra.Fecha,
      Observaciones: this.compra.Observaciones,
      UsuarioIdCreacion: null,
      Detalle: this.detalle
    };

    if (this.editando && this.IdCompraEdicion) {

      body['UsuarioIdModificacion'] = null;

      this.comprasService.actualizar(this.IdCompraEdicion, body).subscribe({
        next: () => {
          this.mensaje = 'Compra actualizada (BORRADOR).';
          this.cargarCompras();
          this.cancelar();
        },
        error: (e: any) => {
          console.error('Error actualizando compra:', e);
          this.error = e?.error?.mensaje || 'No fue posible actualizar la compra.';
        }
      });

    } else {

      this.comprasService.crear(body).subscribe({
        next: (respuesta: any) => {
          this.mensaje = 'Compra creada en estado BORRADOR (Id ' + respuesta.IdCompra + ').';
          this.cargarCompras();
          this.cancelar();
        },
        error: (e: any) => {
          console.error('Error creando compra:', e);
          this.error = e?.error?.mensaje || 'No fue posible crear la compra.';
        }
      });
    }
  }

  // ==================================================
  // ACCIONES SOBRE DOCUMENTO
  // ==================================================

  ver(compra: any): void {
    this.comprasService.obtener(compra.IdCompra).subscribe({
      next: (r: any) => {
        this.detalleVista = r?.datos ?? null;
        this.mostrarFormulario = false;
        this.mensaje = '';
        this.error = '';
      },
      error: (e: any) => {
        console.error('Error obteniendo compra:', e);
        this.error = 'No fue posible cargar el detalle.';
      }
    });
  }

  cerrarVista(): void {
    this.detalleVista = null;
  }

  confirmar(compra: any): void {

    const confirmar = confirm(`¿Confirmar la compra #${compra.Numero}? Actualizará el inventario (CPP).`);

    if (!confirmar) { return; }

    this.comprasService.confirmar(compra.IdCompra, { UsuarioIdConfirmacion: null }).subscribe({
      next: () => {
        this.mensaje = 'Compra confirmada, inventario actualizado.';
        this.cargarCompras();
      },
      error: (e: any) => {
        console.error('Error confirmando compra:', e);
        this.error = e?.error?.mensaje || 'No fue posible confirmar la compra.';
      }
    });
  }

  anular(compra: any): void {

    const motivo = prompt('Motivo de anulación:');

    if (motivo === null) { return; }

    this.comprasService.anular(compra.IdCompra, { UsuarioIdAnulacion: null, MotivoAnulacion: motivo }).subscribe({
      next: () => {
        this.mensaje = 'Compra anulada, inventario revertido.';
        this.cargarCompras();
      },
      error: (e: any) => {
        console.error('Error anulando compra:', e);
        this.error = e?.error?.mensaje || 'No fue posible anular la compra.';
      }
    });
  }

  eliminar(compra: any): void {

    const confirmar = confirm(`¿Eliminar la compra #${compra.Numero}?`);

    if (!confirmar) { return; }

    this.comprasService.eliminar(compra.IdCompra).subscribe({
      next: () => {
        this.mensaje = 'Compra eliminada.';
        this.cargarCompras();
      },
      error: (e: any) => {
        console.error('Error eliminando compra:', e);
        this.error = e?.error?.mensaje || 'No fue posible eliminar la compra.';
      }
    });
  }

  nombreProducto(id: number): string {
    const p = this.productos.find(x => x.IdProducto === id);
    return p ? `${p.CodigoProducto} - ${p.NombreProducto}` : '';
  }
}