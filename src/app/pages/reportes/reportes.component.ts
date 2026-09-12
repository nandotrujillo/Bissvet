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
  agruparPorProducto = false;

  productos: any[] = [];

  proveedores: any[] = [];

  proveedorId: number | null = null;

  // Plan de la empresa (desde sesión): restringe reportes premium.
  codigoPlan: string = '';

  // Módulos contratados por la empresa (códigos).
  modulosContratados: string[] = [];

  // Mapa reporte -> módulo requerido (debe coincidir con el backend).
  private reportesModulos: Record<string, string> = {
    ventas: 'VENTAS',
    cartera: 'CAJA',
    inventario: 'INVENTARIOS',
    kardex: 'INVENTARIOS',
    compras: 'COMPRAS',
    clientes: 'CLIENTES',
    citas: 'CITAS',
    cuentaspagar: 'COMPRAS'
  };

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
    this.leerPlan();
    this.cargarProveedores();
    this.cargarModulosContratados();
  }

  private leerPlan(): void {
    if (typeof localStorage !== 'undefined') {
      const sub = localStorage.getItem('suscripcion');
      if (sub) {
        try {
          this.codigoPlan = (JSON.parse(sub)?.CodigoPlan || '').toUpperCase();
        } catch (error) {
          this.codigoPlan = '';
        }
      }
    }
  }

  private cargarModulosContratados(): void {
    this.seguridadService.obtenerMenu().subscribe({
      next: (r) => {
        this.modulosContratados = (r.datos || []).map(m => m.Codigo);
        this.cargarCatalogo();
      },
      error: () => {
        this.modulosContratados = [];
        this.cargarCatalogo();
      }
    });
  }

  cargarProveedores(): void {
    this.http.get<any>(`${environment.apiUrl}/proveedores`).subscribe({
      next: (r) => { this.proveedores = r.datos || []; },
      error: () => { this.proveedores = []; }
    });
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
        let catalogo = r.datos || [];
        // Filtrar reportes que requieran módulos no contratados por la empresa.
        if (this.modulosContratados.length > 0) {
          catalogo = catalogo.filter((x: any) => {
            const modulo = this.reportesModulos[x.id];
            return !modulo || this.modulosContratados.includes(modulo);
          });
        }
        this.catalogo = catalogo;
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
    this.proveedorId = null;
    this.agruparPorProducto = false;
    this.cargarOpciones(reporte.id);
    this.ejecutar();
  }

  requiereProveedor(reporteId: string): boolean {
    return reporteId === 'cuentaspagar';
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

  requiereAgrupar(reporteId: string): boolean {
    return ['ventas', 'kardex'].includes(reporteId);
  }

  ventasAgrupadas(): boolean {
    return this.seleccion?.id === 'ventas' && this.agruparPorProducto;
  }

  kardexAgrupado(): boolean {
    return this.seleccion?.id === 'kardex' && this.agruparPorProducto;
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
      proveedor: this.proveedorId || undefined,
      estado: this.estado || undefined,
      agrupar: this.ventasAgrupadas() || this.kardexAgrupado()
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

  opciones(): { id: string; desde?: string; hasta?: string; producto?: number | null; proveedor?: number | null; estado?: string; agrupar?: boolean } {
    return {
      id: this.seleccion.id,
      desde: this.desde || undefined,
      hasta: this.hasta || undefined,
      producto: this.productoId || undefined,
      proveedor: this.proveedorId || undefined,
      estado: this.estado || undefined,
      agrupar: this.ventasAgrupadas() || this.kardexAgrupado()
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

  exportarSiigo(): void {
    if (!this.puedeExportar) {
      return;
    }
    this.descargar(
      this.reportesService.exportarSIIGO(this.opciones()),
      'compras_siigo.csv'
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
    if (this.ventasAgrupadas()) {
      return ['CodigoProducto', 'Producto', 'Cantidad', 'Subtotal', 'Descuento', 'Impuesto', 'Total', 'Utilidad'];
    }
    if (this.kardexAgrupado()) {
      return ['CodigoProducto', 'Producto', 'Entrada', 'Salida', 'SaldoCantidad', 'CostoPromedio', 'SaldoValor'];
    }
    const mapa: any = {
      ventas: ['NumeroVenta', 'Fecha', 'Cliente', 'DocumentoCliente', 'Bodega', 'Estado', 'Subtotal', 'Descuento', 'Impuesto', 'Total', 'Utilidad'],
      cartera: ['Fecha', 'Caja', 'Bodega', 'Apertura', 'Ingresos', 'Egresos', 'Saldo', 'Estado', 'Entregado', 'Descuadre'],
      inventario: ['Bodega', 'CodigoProducto', 'Producto', 'Lote', 'Cantidad'],
      kardex: ['Fecha', 'Bodega', 'Movimiento', 'Documento', 'Entrada', 'Salida', 'SaldoCantidad', 'CostoPromedio', 'SaldoValor'],
      compras: ['Numero', 'Fecha', 'Nit', 'Proveedor', 'Bodega', 'Estado', 'TipoDocumento', 'NumeroDocumentoProveedor', 'Subtotal', 'Descuento', 'Impuesto', 'Total'],
      clientes: ['Cliente', 'Documento', 'Telefono', 'Correo', 'Mascotas'],
      citas: ['Fecha', 'Hora', 'Paciente', 'Servicio', 'Veterinario', 'Estado', 'Precio'],
      cuentaspagar: ['IdProveedor', 'Proveedor', 'NitProveedor', 'NumeroCompra', 'Fecha', 'Cuota', 'Vencimiento', 'ValorCuota', 'SaldoPendiente', 'Estado']
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
      Mascotas: 'Mascotas',
      IdProveedor: 'Id Proveedor',
      NitProveedor: 'NIT',
      Nit: 'NIT',
      NumeroCompra: 'Compra',
      Fecha: 'Fecha',
      Cuota: 'Cuota',
      Vencimiento: 'Vencimiento',
      ValorCuota: 'Valor cuota',
      SaldoPendiente: 'Saldo pendiente',
      TipoDocumento: 'Tipo doc.',
      NumeroDocumentoProveedor: 'Nro. doc. proveedor'
    };
    return mapa[col] || col;
  }

  esMoneda(col: string): boolean {
    return ['Subtotal', 'Descuento', 'Impuesto', 'Total', 'Utilidad', 'Apertura', 'Ingresos', 'Egresos', 'Saldo', 'Entregado', 'Descuadre', 'Precio', 'CostoPromedio', 'SaldoValor', 'ValorCuota', 'SaldoPendiente'].includes(col);
  }

  esCantidad(col: string): boolean {
    return ['Cantidad', 'Entrada', 'Salida', 'SaldoCantidad', 'Mascotas', 'Cuota'].includes(col);
  }

  formatValor(v: any): string {
    const n = Number(v || 0);
    return n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  // =====================================================
  // TOTALES
  // =====================================================

  totales(): any {
    if (!this.seleccion || this.datos.length === 0) {
      return null;
    }
    if (['ventas', 'compras'].includes(this.seleccion.id)) {
      const acc = this.datos.reduce(
        (a, f) => ({
          Cantidad: a.Cantidad + Number(f.Cantidad || 0),
          Subtotal: a.Subtotal + Number(f.Subtotal || 0),
          Descuento: a.Descuento + Number(f.Descuento || 0),
          Impuesto: a.Impuesto + Number(f.Impuesto || 0),
          Total: a.Total + Number(f.Total || 0),
          Utilidad: a.Utilidad + Number(f.Utilidad || 0)
        }),
        { Cantidad: 0, Subtotal: 0, Descuento: 0, Impuesto: 0, Total: 0, Utilidad: 0 }
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
    if (this.seleccion.id === 'cuentaspagar') {
      const a = this.datos.reduce(
        (acc2, f) => ({
          ValorCuota: acc2.ValorCuota + Number(f.ValorCuota || 0),
          SaldoPendiente: acc2.SaldoPendiente + Number(f.SaldoPendiente || 0)
        }),
        { ValorCuota: 0, SaldoPendiente: 0 }
      );
      return { Etiqueta: 'Totales', Subtotal: a.ValorCuota, Impuesto: a.SaldoPendiente, Total: a.SaldoPendiente, Utilidad: a.ValorCuota };
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
    if (this.seleccion.id === 'cuentaspagar') {
      return ['ValorCuota', 'SaldoPendiente'].includes(col);
    }
    if (this.ventasAgrupadas()) {
      return col === 'Cantidad' || ['Subtotal', 'Descuento', 'Impuesto', 'Total', 'Utilidad'].includes(col);
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
    if (this.seleccion.id === 'cuentaspagar') {
      const map: any = { ValorCuota: tAny.Subtotal, SaldoPendiente: tAny.Impuesto };
      return map[col] || 0;
    }
    return Number(tAny[col] || 0);
  }
}