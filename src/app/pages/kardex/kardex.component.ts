import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Bodega } from '../../Models/bodega';
import { Producto } from '../../Models/producto';

import { KardexService } from '../../Services/kardex.service';
import { BodegaService } from '../../Services/Bodega.service ';
import { ProductosService } from '../../Services/productos.service';

@Component({
  selector: 'app-kardex',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './kardex.component.html',
  styleUrls: ['./kardex.component.css']
})
export class KardexComponent implements OnInit {

  vista: 'movimientos' | 'resumen' = 'movimientos';

  movimientos: any[] = [];
  resumen: any[] = [];

  bodegas: Bodega[] = [];
  productos: Producto[] = [];

  filtroProducto = 0;
  filtroBodega = 0;
  filtroTipo = '';
  desde = '';
  hasta = '';

  mensaje = '';
  error = '';

  constructor(
    private kardexService: KardexService,
    private bodegaService: BodegaService,
    private productosService: ProductosService
  ) {}

  ngOnInit(): void {
    this.cargarBodegas();
    this.cargarProductos();
    this.cargarMovimientos();
  }

  cambiarVista(vista: 'movimientos' | 'resumen'): void {
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

  construirParams(): any {
    const params: any = {};
    if (Number(this.filtroProducto) > 0) { params.producto = this.filtroProducto; }
    if (Number(this.filtroBodega) > 0) { params.bodega = this.filtroBodega; }
    if (this.filtroTipo) { params.tipo = this.filtroTipo; }
    if (this.desde) { params.desde = this.desde; }
    if (this.hasta) { params.hasta = this.hasta; }
    return params;
  }

  cargarMovimientos(): void {
    this.kardexService.listar(this.construirParams()).subscribe({
      next: (r: any) => { this.movimientos = r?.datos ?? []; },
      error: (e: any) => {
        console.error('Error cargando kardex:', e);
        this.error = 'No fue posible cargar los movimientos.';
      }
    });
  }

  cargarResumen(): void {
    this.kardexService.resumen(this.construirParams()).subscribe({
      next: (r: any) => { this.resumen = r?.datos ?? []; },
      error: (e: any) => {
        console.error('Error cargando resumen:', e);
        this.error = 'No fue posible cargar el resumen.';
      }
    });
  }

  esEntrada(item: any): boolean {
    return Number(item.EntradaCantidad) > 0;
  }
}