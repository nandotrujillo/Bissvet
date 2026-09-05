import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ReportesService } from '../../Services/reportes.service';
import { SeguridadService } from '../../Services/seguridad.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-reportes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './reportes.component.html',
  styleUrls: ['./reportes.component.css']
})
export class ReportesComponent implements OnInit {

  Math = Math;

  catalogo: any[] = [];

  seleccion: any = null;

  // Filtros
  desde = '';
  hasta = '';
  estado = '';
  productoId: number | null = null;

  productos: any[] = [];

  // Estados disponibles por reporte
  estadosDisponibles: string[] = [];

  datos: any[] = [];

  cargando = false;

  mensaje = '';

  error = '';

  // Permisos
  puedeConsultar = false;
  puedeExportar = false;
  puedeImprimir = false;

  constructor(
    private reportesService: ReportesService,
    private http: HttpClient,
    private seguridadService: SeguridadService
  ) { }

  ngOnInit(): void {
    this.cargarPermisos();
    this.cargarCatalogo();
  }

  hoy(): string {
    return new Date().toISOString().slice(0, 10);
  }

  // =====================================================
  // PERMISOS DEL USUARIO AUTENTICADO
  // =====================================================

  cargarPermisos(): void {
    const permisos = this.seguridadService.obtenerPermisosLocal();

    this.puedeConsultar = permisos.includes('REPORTES.CONSULTAR');
    this.puedeExportar = permisos.includes('REPORTES.EXPORTAR');
    this.puedeImprimir = permisos.includes('REPORTES.IMPRIMIR');
  }

  // =====================================================
  // CARGA INICIAL
  // =====================================================

  cargarCatalogo(): void {
    this.reportesService.obtenerCatalogo().subscribe({
      next: (r) => {
        this.catalogo = r.datos || [];
        if (this.catalogo.length > 0 && !this.seleccion) {
          this.seleccionar(this.catalogo[0]);
        }
      },
      error: () => {
        this.error = 'No fue posible cargar los reportes disponibles.';
      }
    });
  }

  // =====================================================
  // SELECCIÓN DE REPORTE
  // =====================================================

  seleccionar(reporte: any): void {
    this.seleccion = reporte;
    this.mensaje = '';
    this.error = '';
    this.estado = '';
    this.productoId = null;
    this.cargarOpciones(reporte.id);
    this.ejecutar();
  }

  requiereRango(reporteId: string): boolean {
    return ['ventas', 'cartera', 'kardex', 'compras', 'citas'].includes(reporteId);
  }

  estadosValidos(reporteId: string): string[] {
    if (reporteId === 'ventas') {
      return ['BORRADOR', 'CONFIRMADA'];
    }
    if (reporteId === 'compras') {
      return ['BORRADOR', 'CONFIRMADA'];
    }
    if (reporteId === 'citas') {
      return ['Pendiente', 'Confirmada', 'Atendida', 'Cancelada'];
    }
    return [];
  }

  requiereProducto(reporteId: string): boolean {
    return reporteId === 'kardex';
  }

  requiereEstado(reporteId: string): boolean {
    return ['ventas', 'compras', 'citas'].includes(reporteId);
  }

  cargarOpciones(reporteId: string): void {
    this.estadosDisponibles = this.estadosValidos(reporteId);

    if (this.requiereProducto(reporteId)) {
      this.http.get<any>(`${environment.apiUrl}/productos`).subscribe({
        next: (r) => {
          this.productos = r.datos || [];
        },
        error: () => {
          this.productos = [];
        }
      });
    } else {
      this.productos = [];
    }
  }

  // =====================================================
  // EJECUCIÓN DEL REPORTE
  // =====================================================

  ejecutar(): void {
    if (!this.seleccion) {
      return;
    }

    this.cargando = true;
    this.mensaje = '';
    this.error = '';

    this.reportesService.obtenerReporte({
      id: this.seleccion.id,
      desde: this.desde || undefined,
      hasta: this.hasta || undefined,
      producto: this.productoId || undefined,
      estado: this.estado || undefined
    }).subscribe({
      next: (r) => {
        this.datos = r.datos || [];
        this.cargando = false;
      },
      error: (e) => {
        this.cargando = false;
        this.datos = [];
        this.error = e.error?.mensaje || 'No fue posible generar el reporte.';
      }
    });
  }

  opciones(): { id: string; desde?: string; hasta?: string; producto?: number | null; estado?: string } {
    return {
      id: this.seleccion.id,
      desde: this.desde || undefined,
      hasta: this.hasta || undefined,
      producto: this.productoId || undefined,
      estado: this.estado || undefined
    };
  }

  // =====================================================
  // EXPORTAR / IMPRIMIR (descarga autenticada por blob)
  // =====================================================

  exportar(): void {
    if (!this.puedeExportar) {
      return;
    }
    this.descargar(
      this.reportesService.exportarCSV(this.opciones()),
      'reporte_' + this.seleccion.id + '.csv'
    );
  }

  imprimir(): void {
    if (!this.puedeImprimir) {
      return;
    }
    this.descargar(
      this.reportesService.imprimirPDF(this.opciones()),
      'reporte_' + this.seleccion.id + '.pdf'
    );
  }

  private descargar(url: string, nombreArchivo: string): void {
    if (typeof localStorage === 'undefined') {
      return;
    }
    const token = localStorage.getItem('token');

    fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.blob();
      })
      .then((blob) => {
        const objetoUrl = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = objetoUrl;
        enlace.download = nombreArchivo;
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        URL.revokeObjectURL(objetoUrl);
      })
      .catch(() => {
        this.error = 'No fue posible descargar el archivo. Verifique sus permisos.';
      });
  }

  // =====================================================
  // COLUMNAS DINÁMICAS DE CADA REPORTE
  // =====================================================

  columnas(): string[] {
    if (!this.seleccion) {
      return [];
    }
    const mapa: any = {
      ventas: ['NumeroVenta', 'Fecha', 'Cliente', 'DocumentoCliente', 'Bodega', 'Estado', 'Subtotal', 'Descuento', 'Impuesto', 'Total', 'Utilidad'],
      cartera: ['Fecha', 'Caja', 'Bodega', 'Apertura', 'Ingresos', 'Egresos', 'Saldo', 'Estado', 'Entregado', 'Descuadre'],
      inventario: ['Bodega', 'CodigoProducto', 'Producto', 'Lote', 'Cantidad'],
      kardex: ['Fecha', 'Bodega', 'Movimiento', 'Documento', 'Entrada', 'Salida', 'SaldoCantidad', 'CostoPromedio', 'SaldoValor'],
      compras: ['Numero', 'Fecha', 'Nit', 'Proveedor', 'Bodega', 'Estado', 'Subtotal', 'Descuento', 'Impuesto', 'Total'],
      clientes: ['Cliente', 'Documento', 'Telefono', 'Correo', 'Mascotas'],
      citas: ['Fecha', 'Hora', 'Paciente', 'Servicio', 'Veterinario', 'Estado', 'Precio']
    };
    return mapa[this.seleccion.id] || [];
  }

  etiquetaColumna(col: string): string {
    const mapa: any = {
      NumeroVenta: 'Documento',
      DocumentoCliente: 'Identificación',
      CodigoProducto: 'Código',
      SaldoCantidad: 'Saldo cant.',
      CostoPromedio: 'Costo prom.',
      SaldoValor: 'Saldo valor',
      Telefono: 'Teléfono',
      Correo: 'Correo',
      Mascotas: 'Mascotas'
    };
    return mapa[col] || col;
  }

  esMoneda(col: string): boolean {
    return ['Subtotal', 'Descuento', 'Impuesto', 'Total', 'Utilidad', 'Apertura', 'Ingresos', 'Egresos', 'Saldo', 'Entregado', 'Descuadre', 'Precio', 'CostoPromedio', 'SaldoValor'].includes(col);
  }

  esCantidad(col: string): boolean {
    return ['Cantidad', 'Entrada', 'Salida', 'SaldoCantidad', 'Mascotas'].includes(col);
  }

  formatValor(v: any): string {
    const n = Number(v || 0);
    return n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  // =====================================================
  // TOTALES
  // =====================================================

  totales(): { Etiqueta: string; Subtotal: number; Descuento: number; Impuesto: number; Total: number; Utilidad: number } | null {
    if (!this.seleccion || this.datos.length === 0) {
      return null;
    }
    if (['ventas', 'compras'].includes(this.seleccion.id)) {
      const acc = this.datos.reduce(
        (a, f) => ({
          Subtotal: a.Subtotal + Number(f.Subtotal || 0),
          Descuento: a.Descuento + Number(f.Descuento || 0),
          Impuesto: a.Impuesto + Number(f.Impuesto || 0),
          Total: a.Total + Number(f.Total || 0),
          Utilidad: a.Utilidad + Number(f.Utilidad || 0)
        }),
        { Subtotal: 0, Descuento: 0, Impuesto: 0, Total: 0, Utilidad: 0 }
      );
      return { Etiqueta: 'Totales', ...acc };
    }
    if (this.seleccion.id === 'cartera') {
      const a = this.datos.reduce(
        (acc2, f) => ({
          Apertura: acc2.Apertura + Number(f.Apertura || 0),
          Ingresos: acc2.Ingresos + Number(f.Ingresos || 0),
          Egresos: acc2.Egresos + Number(f.Egresos || 0),
          Saldo: acc2.Saldo + Number(f.Saldo || 0)
        }),
        { Apertura: 0, Ingresos: 0, Egresos: 0, Saldo: 0 }
      );
      return { Etiqueta: 'Totales', Subtotal: a.Ingresos, Descuento: 0, Impuesto: 0, Total: a.Saldo, Utilidad: a.Apertura };
    }
    return null;
  }

  puedeMostrarColumnaTotales(col: string): boolean {
    const t = this.totales();
    if (!t) {
      return false;
    }
    if (this.seleccion.id === 'cartera') {
      return ['Ingresos', 'Egresos', 'Saldo'].includes(col);
    }
    return ['Subtotal', 'Descuento', 'Impuesto', 'Total', 'Utilidad'].includes(col);
  }

  totalColumna(col: string): number {
    const t = this.totales();
    if (!t) {
      return 0;
    }
    const tAny: any = t;
    if (this.seleccion.id === 'cartera') {
      const map: any = { Ingresos: tAny.Subtotal, Egresos: tAny.Descuento, Saldo: tAny.Total };
      return map[col] || 0;
    }
    return Number(tAny[col] || 0);
  }
}