import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Proveedor } from '../../Models/proveedor';
import { Bodega } from '../../Models/bodega';
import { Producto } from '../../Models/producto';

import { ComprasService } from '../../Services/compras.service';
import { ProveedoresService } from '../../Services/proveedores.service';
import { BodegaService } from '../../Services/Bodega.service';
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

  // Confirmar compra (modal)
  confirmandoCompra: any = null;

  // Abonar (modal)
  abonarCuota: any = null;

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
      Observaciones: '',
      MetodoPago: 'CONTADO'
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
          Observaciones: datos.Observaciones,
          MetodoPago: datos.MetodoPago || 'CONTADO'
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
      MetodoPago: this.compra.MetodoPago,
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

  // ==================================================
  // CONFIRMAR (modal de pago / egreso de caja)
  // ==================================================

  abrirConfirmar(compra: any): void {
    this.comprasService.obtener(compra.IdCompra).subscribe({
      next: (r: any) => {
        const datos = r?.datos ?? {};
        const totalCompra = Number(datos.Total) || 0;
        const metodo = datos.MetodoPago || 'CONTADO';
        this.confirmandoCompra = {
          IdCompra: compra.IdCompra,
          Numero: compra.Numero,
          Total: totalCompra,
          MetodoPago: metodo,
          AfectaCaja: false,
          PagoInicial: metodo === 'CONTADO' ? totalCompra : 0,
          Cuotas: metodo === 'CONTADO'
            ? []
            : [{ ValorCuota: totalCompra, FechaVencimiento: '' }],
          guardando: false,
          EgresaCaja: true
        };
        this.mensaje = '';
        this.error = '';
        this.detalleVista = null;
      },
      error: (e: any) => {
        console.error('Error obteniendo compra para confirmar:', e);
        this.error = e?.error?.mensaje || 'No fue posible cargar la compra.';
      }
    });
  }

  cerrarConfirmar(): void {
    this.confirmandoCompra = null;
  }

  // Redistribuir el saldo pendiente en N cuotas iguales (o repartir al pulsar).
  agregarCuotaConfirmar(): void {
    const c = this.confirmandoCompra;
    const total = Number(c.Total) || 0;
    const inicial = Number(c.PagoInicial) || 0;
    const saldo = Math.max(0, total - inicial);
    if (saldo <= 0) { return; }
    c.Cuotas = c.Cuotas || [];
    const n = c.Cuotas.length + 1;
    // Repartir el saldo en n cuotas (la última absorbe el redondeo).
    const partes = Math.floor((saldo * 100) / n) / 100;
    const nuevas = [];
    for (let i = 0; i < n; i++) {
      const valor = (i === n - 1) ? saldo - partes * (n - 1) : partes;
      nuevas.push({ ValorCuota: Math.round(valor * 100) / 100, FechaVencimiento: '' });
    }
    c.Cuotas = nuevas;
  }

  quitarCuotaConfirmar(i: number): void {
    const c = this.confirmandoCompra;
    if (c.Cuotas.length > 1) { c.Cuotas.splice(i, 1); }
  }

  calcularSaldoPendienteConfirmar(): number {
    const c = this.confirmandoCompra;
    if (!c) { return 0; }
    const total = Number(c.Total) || 0;
    const inicial = Number(c.PagoInicial) || 0;
    const sumaCuotas = (c.Cuotas || []).reduce((s: number, q: any) => s + (Number(q.ValorCuota) || 0), 0);
    return Math.max(0, total - inicial - sumaCuotas);
  }

  ejecutarConfirmar(): void {
    const c = this.confirmandoCompra;
    this.mensaje = '';
    this.error = '';

    const total = Number(c.Total) || 0;
    const inicial = Number(c.PagoInicial) || 0;
    if (inicial < 0 || inicial > total) {
      this.error = 'El pago inicial no puede ser negativo ni superar el total.';
      return;
    }
    const saldo = total - inicial;
    if (c.MetodoPago === 'CREDITO' && saldo > 0) {
      const cuotas = c.Cuotas || [];
      if (!cuotas.length) {
        this.error = 'Debe definir cuotas para el saldo diferido.';
        return;
      }
      const sumaCuotas = cuotas.reduce((s: number, q: any) => s + (Number(q.ValorCuota) || 0), 0);
      if (Math.abs(sumaCuotas - saldo) > 0.01) {
        this.error = 'La suma de las cuotas no coincide con el saldo pendiente.';
        return;
      }
    }

    c.guardando = true;
    const body: any = {
      AfectaCaja: !!c.AfectaCaja,
      MetodoPago: c.MetodoPago,
      PagoInicial: inicial,
      Cuotas: c.MetodoPago === 'CREDITO'
        ? (c.Cuotas || []).map((q: any) => ({
            ValorCuota: Number(q.ValorCuota) || 0,
            FechaVencimiento: q.FechaVencimiento || null
          }))
        : []
    };

    this.comprasService.confirmar(c.IdCompra, body).subscribe({
      next: () => {
        this.mensaje = 'Compra confirmada. Inventario actualizado.';
        this.confirmandoCompra = null;
        this.cargarCompras();
      },
      error: (e: any) => {
        console.error('Error confirmando compra:', e);
        c.guardando = false;
        this.error = e?.error?.mensaje || 'No fue posible confirmar la compra.';
      }
    });
  }

  // ==================================================
  // ABONO A CUOTA
  // ==================================================

  abrirAbono(cuota: any, idCompra?: number): void {
    this.abonarCuota = {
      ...cuota,
      IdCompra: idCompra ?? this.detalleVista?.IdCompra ?? cuota.IdCompra,
      ValorAbono: Number(cuota.SaldoPendiente) || 0,
      AfectaCaja: false,
      guardando: false
    };
    this.mensaje = '';
    this.error = '';
  }

  cerrarAbono(): void {
    this.abonarCuota = null;
  }

  ejecutarAbono(): void {
    const a = this.abonarCuota;
    this.mensaje = '';
    this.error = '';

    const monto = Number(a.ValorAbono) || 0;
    if (monto <= 0) {
      this.error = 'El valor del abono debe ser mayor a 0.';
      return;
    }
    if (monto > Number(a.SaldoPendiente)) {
      this.error = 'El abono no puede superar el saldo pendiente de la cuota.';
      return;
    }

    a.guardando = true;
    const body = { IdPagoCompra: a.IdPagoCompra, ValorAbono: monto, AfectaCaja: !!a.AfectaCaja };
    this.comprasService.abonar(this.abonarCuota.IdCompra, body).subscribe({
      next: () => {
        this.mensaje = 'Abono registrado correctamente.';
        const idVista = this.detalleVista ? this.detalleVista.IdCompra : null;
        this.abonarCuota = null;
        if (idVista) {
          this.recargarDetalle(idVista);
        } else {
          this.cargarCompras();
        }
      },
      error: (e: any) => {
        console.error('Error registrando abono:', e);
        a.guardando = false;
        this.error = e?.error?.mensaje || 'No fue posible registrar el abono.';
      }
    });
  }

  recargarDetalle(id: number): void {
    this.comprasService.obtener(id).subscribe({
      next: (r: any) => {
        this.detalleVista = r?.datos ?? null;
        this.mostrarFormulario = false;
        this.mensaje = this.mensaje;
      },
      error: (e: any) => {
        console.error('Error recargando detalle:', e);
        this.error = 'No fue posible recargar el detalle.';
      }
    });
  }

  num(v: any): number { return Number(v) || 0; }

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