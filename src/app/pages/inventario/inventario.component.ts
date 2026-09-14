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

  // Inventario inicial por CSV
  archivoCSV: File | null = null;
  erroresCSV: string[] = [];
  cargandoCSV = false;

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

  // ==================================================
  // INVENTARIO INICIAL POR CSV
  // ==================================================

  onArchivoChange(event: any): void {
    const file = event?.target?.files?.[0];
    this.archivoCSV = file || null;
    this.mensaje = '';
    this.error = '';
    this.erroresCSV = [];
  }

  descargarEjemploCSV(): void {

    const filas: string[] = ['CodigoProducto;Cantidad;CostoUnitario'];

    if (this.productos.length > 0) {
      const muestra = this.productos.slice(0, 5);
      const cantidades = [50, 100, 25, 75, 10];
      muestra.forEach((p, i) => {
        filas.push(`${p.CodigoProducto};${cantidades[i] || 10};${Number(p.CostoActual ?? p.PrecioVenta ?? 0).toFixed(2)}`);
      });
    } else {
      filas.push('ALI-001;50;75.00');
      filas.push('FAR-006;20;32.00');
      filas.push('EQU-003;100;4.00');
    }

    const contenido = '\uFEFF' + filas.join('\r\n');
    const blob = new Blob([contenido], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'inventario_inicial_ejemplo.csv';
    a.click();
    URL.revokeObjectURL(url);
  }

  cargarCSVInicial(): void {

    this.mensaje = '';
    this.error = '';
    this.erroresCSV = [];

    if (!this.IdBodegaInicial) {
      this.error = 'Debe seleccionar una bodega.';
      return;
    }

    if (!this.archivoCSV) {
      this.error = 'Debe seleccionar el archivo CSV.';
      return;
    }

    this.cargandoCSV = true;

    this.inventarioService.inicialCSV(this.IdBodegaInicial, this.archivoCSV).subscribe({
      next: (respuesta: any) => {
        this.cargandoCSV = false;
        this.erroresCSV = respuesta?.errores ?? [];
        this.mensaje = respuesta?.mensaje || 'Inventario inicial registrado correctamente.';
        this.archivoCSV = null;
        this.cargarExistencias();
        this.cargarConsolidado();
      },
      error: (error: any) => {
        this.cargandoCSV = false;
        console.error('Error cargando CSV:', error);
        this.erroresCSV = error?.error?.errores ?? [];
        this.error = error?.error?.mensaje || 'No fue posible procesar el archivo CSV.';
      }
    });
  }
}