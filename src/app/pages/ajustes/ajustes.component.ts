import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Bodega } from '../../Models/bodega';
import { Producto } from '../../Models/producto';

import { AjustesService } from '../../Services/ajustes.service';
import { BodegaService } from '../../Services/Bodega.service ';
import { ProductosService } from '../../Services/productos.service';

@Component({
  selector: 'app-ajustes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './ajustes.component.html',
  styleUrls: ['./ajustes.component.css']
})
export class AjustesComponent implements OnInit {

  ajustes: any[] = [];
  bodegas: Bodega[] = [];
  productos: Producto[] = [];

  filtroEstado = '';
  filtroTipo = '';
  filtroBodega = 0;

  // Formulario
  ajuste: any = this.nuevoAjuste();
  detalle: any[] = [];
  editando = false;
  mostrarFormulario = false;
  IdAjusteEdicion?: number;

  // Ver detalle
  detalleVista: any = null;

  mensaje = '';
  error = '';

  constructor(
    private ajustesService: AjustesService,
    private bodegaService: BodegaService,
    private productosService: ProductosService
  ) {}

  ngOnInit(): void {
    this.cargarAjustes();
    this.cargarBodegas();
    this.cargarProductos();
  }

  nuevoAjuste(): any {
    return {
      Numero: '',
      IdBodega: 0,
      Fecha: new Date().toISOString().slice(0, 10),
      TipoAjuste: 'POSITIVO',
      Motivo: '',
      Observaciones: ''
    };
  }

  nuevoItem(): any {
    return { IdProducto: 0, Cantidad: 1, CostoUnitario: 0 };
  }

  cargarAjustes(): void {
    const params: any = {};
    if (this.filtroEstado) { params.estado = this.filtroEstado; }
    if (this.filtroTipo) { params.tipo = this.filtroTipo; }
    if (Number(this.filtroBodega) > 0) { params.bodega = this.filtroBodega; }

    this.ajustesService.listar(params).subscribe({
      next: (r: any) => { this.ajustes = r?.datos ?? []; },
      error: (e: any) => {
        console.error('Error cargando ajustes:', e);
        this.error = 'No fue posible cargar los ajustes.';
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
    this.ajuste = this.nuevoAjuste();
    this.detalle = [this.nuevoItem()];
    this.editando = false;
    this.IdAjusteEdicion = undefined;
    this.mostrarFormulario = true;
    this.detalleVista = null;
    this.mensaje = '';
    this.error = '';
  }

  editar(ajuste: any): void {
    this.ajustesService.obtener(ajuste.IdAjuste).subscribe({
      next: (r: any) => {
        const datos = r?.datos ?? {};
        this.IdAjusteEdicion = ajuste.IdAjuste;
        this.ajuste = {
          Numero: datos.Numero,
          IdBodega: datos.IdBodega,
          Fecha: (datos.Fecha || '').slice(0, 10),
          TipoAjuste: datos.TipoAjuste,
          Motivo: datos.Motivo,
          Observaciones: datos.Observaciones
        };
        this.detalle = (datos.Detalle || []).map((d: any) => ({
          IdProducto: d.IdProducto,
          Cantidad: d.Cantidad,
          CostoUnitario: d.CostoUnitario
        }));
        if (!this.detalle.length) { this.detalle = [this.nuevoItem()]; }
        this.editando = true;
        this.mostrarFormulario = true;
        this.detalleVista = null;
        this.mensaje = '';
        this.error = '';
      },
      error: (e: any) => {
        console.error('Error obteniendo ajuste:', e);
        this.error = 'No fue posible cargar el ajuste.';
      }
    });
  }

  cancelar(): void {
    this.ajuste = this.nuevoAjuste();
    this.detalle = [];
    this.mostrarFormulario = false;
    this.editando = false;
    this.IdAjusteEdicion = undefined;
    this.mensaje = '';
    this.error = '';
  }

  guardar(): void {

    this.mensaje = '';
    this.error = '';

    if (!this.ajuste.Numero || !this.ajuste.Numero.trim()) {
      this.error = 'El número del documento es obligatorio.';
      return;
    }
    if (!this.ajuste.IdBodega) {
      this.error = 'Debe seleccionar una bodega.';
      return;
    }
    if (!this.ajuste.Motivo || !this.ajuste.Motivo.trim()) {
      this.error = 'El motivo del ajuste es obligatorio.';
      return;
    }
    if (!this.detalle.length) {
      this.error = 'Debe agregar al menos un producto.';
      return;
    }
    for (const item of this.detalle) {
      if (!item.IdProducto) { this.error = 'Cada fila debe tener un producto.'; return; }
      if (!item.Cantidad || item.Cantidad <= 0) { this.error = 'La cantidad debe ser mayor a 0.'; return; }
      if (this.ajuste.TipoAjuste === 'POSITIVO' && (item.CostoUnitario === undefined || item.CostoUnitario < 0)) {
        this.error = `El costo unitario es obligatorio en ajustes POSITIVOS.`;
        return;
      }
    }

    const body: any = {
      Numero: this.ajuste.Numero,
      IdBodega: this.ajuste.IdBodega,
      Fecha: this.ajuste.Fecha,
      TipoAjuste: this.ajuste.TipoAjuste,
      Motivo: this.ajuste.Motivo,
      Observaciones: this.ajuste.Observaciones,
      UsuarioIdCreacion: null,
      Detalle: this.detalle
    };

    if (this.editando && this.IdAjusteEdicion) {

      body['UsuarioIdModificacion'] = null;

      this.ajustesService.actualizar(this.IdAjusteEdicion, body).subscribe({
        next: () => {
          this.mensaje = 'Ajuste actualizado (BORRADOR).';
          this.cargarAjustes();
          this.cancelar();
        },
        error: (e: any) => {
          console.error('Error actualizando ajuste:', e);
          this.error = e?.error?.mensaje || 'No fue posible actualizar el ajuste.';
        }
      });

    } else {

      this.ajustesService.crear(body).subscribe({
        next: (respuesta: any) => {
          this.mensaje = 'Ajuste creado en estado BORRADOR (Id ' + respuesta.IdAjuste + ').';
          this.cargarAjustes();
          this.cancelar();
        },
        error: (e: any) => {
          console.error('Error creando ajuste:', e);
          this.error = e?.error?.mensaje || 'No fue posible crear el ajuste.';
        }
      });
    }
  }

  // ==================================================
  // ACCIONES SOBRE DOCUMENTO
  // ==================================================

  ver(ajuste: any): void {
    this.ajustesService.obtener(ajuste.IdAjuste).subscribe({
      next: (r: any) => {
        this.detalleVista = r?.datos ?? null;
        this.mostrarFormulario = false;
        this.mensaje = '';
        this.error = '';
      },
      error: (e: any) => {
        console.error('Error obteniendo ajuste:', e);
        this.error = 'No fue posible cargar el detalle.';
      }
    });
  }

  cerrarVista(): void {
    this.detalleVista = null;
  }

  confirmar(ajuste: any): void {

    const confirmar = confirm(`¿Confirmar el ajuste ${ajuste.TipoAjuste} #${ajuste.Numero}? Afectará el inventario.`);

    if (!confirmar) { return; }

    this.ajustesService.confirmar(ajuste.IdAjuste, { UsuarioIdConfirmacion: null }).subscribe({
      next: () => {
        this.mensaje = 'Ajuste confirmado, inventario actualizado.';
        this.cargarAjustes();
      },
      error: (e: any) => {
        console.error('Error confirmando ajuste:', e);
        this.error = e?.error?.mensaje || 'No fue posible confirmar el ajuste.';
      }
    });
  }

  anular(ajuste: any): void {

    const motivo = prompt('Motivo de anulación:');

    if (motivo === null) { return; }

    this.ajustesService.anular(ajuste.IdAjuste, { UsuarioIdAnulacion: null, MotivoAnulacion: motivo }).subscribe({
      next: () => {
        this.mensaje = 'Ajuste anulado, inventario revertido.';
        this.cargarAjustes();
      },
      error: (e: any) => {
        console.error('Error anulando ajuste:', e);
        this.error = e?.error?.mensaje || 'No fue posible anular el ajuste.';
      }
    });
  }

  eliminar(ajuste: any): void {

    const confirmar = confirm(`¿Eliminar el ajuste #${ajuste.Numero}?`);

    if (!confirmar) { return; }

    this.ajustesService.eliminar(ajuste.IdAjuste).subscribe({
      next: () => {
        this.mensaje = 'Ajuste eliminado.';
        this.cargarAjustes();
      },
      error: (e: any) => {
        console.error('Error eliminando ajuste:', e);
        this.error = e?.error?.mensaje || 'No fue posible eliminar el ajuste.';
      }
    });
  }

  nombreProducto(id: number): string {
    const p = this.productos.find(x => x.IdProducto === id);
    return p ? `${p.CodigoProducto} - ${p.NombreProducto}` : '';
  }
}