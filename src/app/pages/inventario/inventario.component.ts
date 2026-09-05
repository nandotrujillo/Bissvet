import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Bodega } from '../../Models/bodega';
import { Producto } from '../../Models/producto';

import { InventarioService } from '../../Services/inventario.service';
import { BodegaService } from '../../Services/Bodega.service';
import { ProductosService } from '../../Services/productos.service';

@Component({
  selector: 'app-inventario',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './inventario.component.html',
  styleUrls: ['./inventario.component.css']
})
export class InventarioComponent implements OnInit {

  vista: 'existencias' | 'consolidado' | 'inicial' = 'existencias';

  existencias: any[] = [];
  consolidado: any[] = [];

  bodegas: Bodega[] = [];
  productos: Producto[] = [];

  // Filtros existencias
  filtroBodega = 0;
  buscar = '';

  // Inventario inicial
  IdBodegaInicial = 0;
  itemsInicial: any[] = [this.nuevoItemInicial()];

  mensaje = '';
  error = '';

  constructor(
    private inventarioService: InventarioService,
    private bodegaService: BodegaService,
    private productosService: ProductosService
  ) {}

  ngOnInit(): void {
    this.cargarBodegas();
    this.cargarProductos();
    this.cargarExistencias();
    this.cargarConsolidado();
  }

  nuevoItemInicial(): any {
    return { IdProducto: 0, Cantidad: 1, CostoUnitario: 0 };
  }

  cambiarVista(vista: 'existencias' | 'consolidado' | 'inicial'): void {
    this.vista = vista;
    this.mensaje = '';
    this.error = '';
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

  cargarExistencias(): void {
    const params: any = {};
    if (Number(this.filtroBodega) > 0) { params.bodega = this.filtroBodega; }
    if (this.buscar.trim()) { params.buscar = this.buscar.trim(); }

    this.inventarioService.listar(params).subscribe({
      next: (r: any) => { this.existencias = r?.datos ?? []; },
      error: (e: any) => {
        console.error('Error cargando existencias:', e);
        this.error = 'No fue posible cargar las existencias.';
      }
    });
  }

  cargarConsolidado(): void {
    this.inventarioService.consolidado().subscribe({
      next: (r: any) => { this.consolidado = r?.datos ?? []; },
      error: (e: any) => {
        console.error('Error cargando consolidado:', e);
        this.error = 'No fue posible cargar el consolidado.';
      }
    });
  }

  // ==================================================
  // INVENTARIO INICIAL
  // ==================================================

  agregarItemInicial(): void {
    this.itemsInicial.push(this.nuevoItemInicial());
  }

  quitarItemInicial(index: number): void {
    this.itemsInicial.splice(index, 1);
  }

  guardarInventarioInicial(): void {

    this.mensaje = '';
    this.error = '';

    if (!this.IdBodegaInicial) {
      this.error = 'Debe seleccionar una bodega.';
      return;
    }

    for (const item of this.itemsInicial) {
      if (!item.IdProducto) {
        this.error = 'Cada fila debe tener un producto.';
        return;
      }
      if (!item.Cantidad || item.Cantidad <= 0) {
        this.error = `Cantidad inválida en la fila.`;
        return;
      }
      if (item.CostoUnitario === undefined || item.CostoUnitario < 0) {
        this.error = `Costo unitario inválido en la fila.`;
        return;
      }
    }

    const body = {
      IdBodega: this.IdBodegaInicial,
      UsuarioId: null,
      Items: this.itemsInicial
    };

    this.inventarioService.inicial(body).subscribe({
      next: (respuesta: any) => {
        this.mensaje = 'Inventario inicial registrado correctamente.';
        this.IdBodegaInicial = 0;
        this.itemsInicial = [this.nuevoItemInicial()];
        this.cargarExistencias();
        this.cargarConsolidado();
      },
      error: (error: any) => {
        console.error('Error registrando inventario inicial:', error);
        this.error = error?.error?.mensaje || 'No fue posible registrar el inventario inicial.';
        this.vista = 'inicial';
      }
    });
  }

  nombreProducto(id: number): string {
    const p = this.productos.find(x => x.IdProducto === id);
    return p ? p.NombreProducto : '';
  }

  badgeAlerta(alerta: string): string {
    switch (alerta) {
      case 'AGOTADO': return 'agotado';
      case 'STOCK BAJO': return 'bajo';
      case 'STOCK ALTO': return 'alto';
      default: return 'ok';
    }
  }
}