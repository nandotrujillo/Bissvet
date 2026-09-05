import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Bodega } from '../../Models/bodega';
import { Producto } from '../../Models/producto';

import { TrasladosService } from '../../Services/traslados.service';
import { BodegaService } from '../../Services/Bodega.service';
import { ProductosService } from '../../Services/productos.service';

@Component({
  selector: 'app-traslados',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './traslados.component.html',
  styleUrls: ['./traslados.component.css']
})
export class TrasladosComponent implements OnInit {

  traslados: any[] = [];
  bodegas: Bodega[] = [];
  productos: Producto[] = [];

  filtroEstado = '';
  filtroOrigen = 0;
  filtroDestino = 0;

  // Formulario
  traslado: any = this.nuevoTraslado();
  detalle: any[] = [];
  editando = false;
  mostrarFormulario = false;
  IdTrasladoEdicion?: number;

  // Ver detalle
  detalleVista: any = null;

  mensaje = '';
  error = '';

  constructor(
    private trasladosService: TrasladosService,
    private bodegaService: BodegaService,
    private productosService: ProductosService
  ) {}

  ngOnInit(): void {
    this.cargarTraslados();
    this.cargarBodegas();
    this.cargarProductos();
  }

  nuevoTraslado(): any {
    return {
      Numero: '',
      IdBodegaOrigen: 0,
      IdBodegaDestino: 0,
      Fecha: new Date().toISOString().slice(0, 10),
      Observaciones: ''
    };
  }

  nuevoItem(): any {
    return { IdProducto: 0, Cantidad: 1 };
  }

  cargarTraslados(): void {
    const params: any = {};
    if (this.filtroEstado) { params.estado = this.filtroEstado; }
    if (Number(this.filtroOrigen) > 0) { params.origen = this.filtroOrigen; }
    if (Number(this.filtroDestino) > 0) { params.destino = this.filtroDestino; }

    this.trasladosService.listar(params).subscribe({
      next: (r: any) => { this.traslados = r?.datos ?? []; },
      error: (e: any) => {
        console.error('Error cargando traslados:', e);
        this.error = 'No fue posible cargar los traslados.';
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
  // FORMULARIO
  // ==================================================

  agregarItem(): void {
    this.detalle.push(this.nuevoItem());
  }

  quitarItem(index: number): void {
    this.detalle.splice(index, 1);
  }

  nueva(): void {
    this.traslado = this.nuevoTraslado();
    this.detalle = [this.nuevoItem()];
    this.editando = false;
    this.IdTrasladoEdicion = undefined;
    this.mostrarFormulario = true;
    this.detalleVista = null;
    this.mensaje = '';
    this.error = '';
  }

  editar(traslado: any): void {
    this.trasladosService.obtener(traslado.IdTraslado).subscribe({
      next: (r: any) => {
        const datos = r?.datos ?? {};
        this.IdTrasladoEdicion = traslado.IdTraslado;
        this.traslado = {
          Numero: datos.Numero,
          IdBodegaOrigen: datos.IdBodegaOrigen,
          IdBodegaDestino: datos.IdBodegaDestino,
          Fecha: (datos.Fecha || '').slice(0, 10),
          Observaciones: datos.Observaciones
        };
        this.detalle = (datos.Detalle || []).map((d: any) => ({
          IdProducto: d.IdProducto,
          Cantidad: d.Cantidad
        }));
        if (!this.detalle.length) { this.detalle = [this.nuevoItem()]; }
        this.editando = true;
        this.mostrarFormulario = true;
        this.detalleVista = null;
        this.mensaje = '';
        this.error = '';
      },
      error: (e: any) => {
        console.error('Error obteniendo traslado:', e);
        this.error = 'No fue posible cargar el traslado.';
      }
    });
  }

  cancelar(): void {
    this.traslado = this.nuevoTraslado();
    this.detalle = [];
    this.mostrarFormulario = false;
    this.editando = false;
    this.IdTrasladoEdicion = undefined;
    this.mensaje = '';
    this.error = '';
  }

  guardar(): void {

    this.mensaje = '';
    this.error = '';

    if (!this.traslado.Numero || !this.traslado.Numero.trim()) {
      this.error = 'El número del documento es obligatorio.';
      return;
    }
    if (!this.traslado.IdBodegaOrigen) {
      this.error = 'Debe seleccionar la bodega de origen.';
      return;
    }
    if (!this.traslado.IdBodegaDestino) {
      this.error = 'Debe seleccionar la bodega de destino.';
      return;
    }
    if (Number(this.traslado.IdBodegaOrigen) === Number(this.traslado.IdBodegaDestino)) {
      this.error = 'La bodega de origen y destino deben ser diferentes.';
      return;
    }
    if (!this.detalle.length) {
      this.error = 'Debe agregar al menos un producto.';
      return;
    }
    for (const item of this.detalle) {
      if (!item.IdProducto) { this.error = 'Cada fila debe tener un producto.'; return; }
      if (!item.Cantidad || item.Cantidad <= 0) { this.error = 'La cantidad debe ser mayor a 0.'; return; }
    }

    const body: any = {
      Numero: this.traslado.Numero,
      IdBodegaOrigen: this.traslado.IdBodegaOrigen,
      IdBodegaDestino: this.traslado.IdBodegaDestino,
      Fecha: this.traslado.Fecha,
      Observaciones: this.traslado.Observaciones,
      UsuarioIdCreacion: null,
      Detalle: this.detalle
    };

    if (this.editando && this.IdTrasladoEdicion) {

      body['UsuarioIdModificacion'] = null;

      this.trasladosService.actualizar(this.IdTrasladoEdicion, body).subscribe({
        next: () => {
          this.mensaje = 'Traslado actualizado (BORRADOR).';
          this.cargarTraslados();
          this.cancelar();
        },
        error: (e: any) => {
          console.error('Error actualizando traslado:', e);
          this.error = e?.error?.mensaje || 'No fue posible actualizar el traslado.';
        }
      });

    } else {

      this.trasladosService.crear(body).subscribe({
        next: (respuesta: any) => {
          this.mensaje = 'Traslado creado en estado BORRADOR (Id ' + respuesta.IdTraslado + ').';
          this.cargarTraslados();
          this.cancelar();
        },
        error: (e: any) => {
          console.error('Error creando traslado:', e);
          this.error = e?.error?.mensaje || 'No fue posible crear el traslado.';
        }
      });
    }
  }

  // ==================================================
  // ACCIONES SOBRE DOCUMENTO
  // ==================================================

  ver(traslado: any): void {
    this.trasladosService.obtener(traslado.IdTraslado).subscribe({
      next: (r: any) => {
        this.detalleVista = r?.datos ?? null;
        this.mostrarFormulario = false;
        this.mensaje = '';
        this.error = '';
      },
      error: (e: any) => {
        console.error('Error obteniendo traslado:', e);
        this.error = 'No fue posible cargar el detalle.';
      }
    });
  }

  cerrarVista(): void {
    this.detalleVista = null;
  }

  confirmar(traslado: any): void {

    const confirmar = confirm(`¿Confirmar el traslado #${traslado.Numero}? Se moverá mercancía entre bodegas.`);

    if (!confirmar) { return; }

    this.trasladosService.confirmar(traslado.IdTraslado, { UsuarioIdConfirmacion: null }).subscribe({
      next: () => {
        this.mensaje = 'Traslado confirmado, inventario actualizado en ambas bodegas.';
        this.cargarTraslados();
      },
      error: (e: any) => {
        console.error('Error confirmando traslado:', e);
        this.error = e?.error?.mensaje || 'No fue posible confirmar el traslado.';
      }
    });
  }

  anular(traslado: any): void {

    const motivo = prompt('Motivo de anulación:');

    if (motivo === null) { return; }

    this.trasladosService.anular(traslado.IdTraslado, { UsuarioIdAnulacion: null, MotivoAnulacion: motivo }).subscribe({
      next: () => {
        this.mensaje = 'Traslado anulado, inventario revertido.';
        this.cargarTraslados();
      },
      error: (e: any) => {
        console.error('Error anulando traslado:', e);
        this.error = e?.error?.mensaje || 'No fue posible anular el traslado.';
      }
    });
  }

  eliminar(traslado: any): void {

    const confirmar = confirm(`¿Eliminar el traslado #${traslado.Numero}?`);

    if (!confirmar) { return; }

    this.trasladosService.eliminar(traslado.IdTraslado).subscribe({
      next: () => {
        this.mensaje = 'Traslado eliminado.';
        this.cargarTraslados();
      },
      error: (e: any) => {
        console.error('Error eliminando traslado:', e);
        this.error = e?.error?.mensaje || 'No fue posible eliminar el traslado.';
      }
    });
  }

  nombreProducto(id: number): string {
    const p = this.productos.find(x => x.IdProducto === id);
    return p ? `${p.CodigoProducto} - ${p.NombreProducto}` : '';
  }
}