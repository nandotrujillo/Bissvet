import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { CajaService } from '../../Services/caja.service';
import { SeguridadService } from '../../Services/seguridad.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-caja',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './caja.component.html',
  styleUrls: ['./caja.component.css']
})
export class CajaComponent implements OnInit {

  Math = Math;

  jornadas: any[] = [];

  tipos: any[] = [];

  bodegas: any[] = [];

  jornadaAbierta: any = null;

  // Modal apertura
  mostrarApertura = false;
  apertura = { cajaMesa: 1, ValorApertura: 0, IdBodega: null as number | null, diaProceso: this.hoy() };

  // Modal movimiento
  mostrarMovimiento = false;
  movimiento = { TipoMov: 0, ValorMov: 0, DescMov: '', idProveedor: null as number | null, NroDocumentoProveedor: '' };

  // Modal cierre
  mostrarCierre = false;
  valorEntregado: number | null = null;

  // Movimientos de jornada
  movimientosJornada: any = null;
  movimientos: any[] = [];
  filtroOrigen = '';
  movimientosCargando = false;

  // Arqueo
  mostrarArqueo = false;
  arqueoDesde = this.hoy();
  arqueoHasta = this.hoy();
  arqueo: any = null;
  arqueoCargado = false;

  // Filtros
  filtroEstado = '';

  cargando = false;

  mensaje = '';

  error = '';

  // Permisos
  puedeConsultar = false;
  puedeAbrir = false;
  puedeCerrar = false;

  constructor(
    private cajaService: CajaService,
    private http: HttpClient,
    private seguridadService: SeguridadService
  ) { }

  ngOnInit(): void {
    this.cargarPermisos();
    this.cargarTipos();
    this.cargarBodegas();
    this.cargarJornadas();
  }

  hoy(): string {
    return new Date().toISOString().slice(0, 10);
  }

  // =====================================================
  // PERMISOS DEL USUARIO AUTENTICADO
  // =====================================================

  cargarPermisos(): void {
    const permisos = this.seguridadService.obtenerPermisosLocal();

    this.puedeConsultar = permisos.includes('CAJA.CONSULTAR');
    this.puedeAbrir = permisos.includes('CAJA.ABRIR');
    this.puedeCerrar = permisos.includes('CAJA.CERRAR');
  }

  // =====================================================
  // CARGA INICIAL
  // =====================================================

  cargarTipos(): void {
    this.cajaService.obtenerTipos().subscribe({
      next: (r) => {
        this.tipos = r.datos || [];
      },
      error: () => { /* sin permiso o sin conexión */ }
    });
  }

  cargarBodegas(): void {
    this.http.get<any>(`${environment.apiUrl}/bodegas`).subscribe({
      next: (r) => {
        this.bodegas = r.datos || [];
      },
      error: () => { /* opcional */ }
    });
  }

  cargarJornadas(): void {
    this.cargando = true;
    this.cajaService.obtenerJornadas({}).subscribe({
      next: (r) => {
        this.jornadas = r.datos || [];
        this.jornadaAbierta = this.jornadas.find(j => j.EstadoJornada === 'ABIERTA') || null;
        this.cargando = false;
        const inicial = this.jornadaAbierta || this.jornadas[0] || null;
        if (inicial && (!this.movimientosJornada || !this.jornadas.some(j => j.Id === this.movimientosJornada.Id))) {
          this.seleccionarJornada(inicial);
        } else if (this.movimientosJornada) {
          const vigente = this.jornadas.find(j => j.Id === this.movimientosJornada.Id);
          this.movimientosJornada = vigente || null;
        }
      },
      error: () => {
        this.cargando = false;
        this.error = 'No fue posible consultar la caja.';
      }
    });
  }

  // =====================================================
  // APERTURA DE CAJA
  // =====================================================

  abrirModalApertura(): void {
    this.apertura = {
      cajaMesa: 1,
      ValorApertura: 0,
      IdBodega: this.bodegas.length === 1 ? this.bodegas[0].Id : null,
      diaProceso: this.hoy()
    };
    this.mostrarApertura = true;
    this.error = '';
  }

  abrirCaja(): void {
    this.error = '';
    this.cajaService.abrirCaja(this.apertura).subscribe({
      next: (r) => {
        this.mensaje = r.mensaje || 'Caja abierta';
        this.mostrarApertura = false;
        this.cargarJornadas();
      },
      error: (e) => {
        this.error = e.error?.mensaje || 'Error abriendo la caja.';
      }
    });
  }

  // =====================================================
  // MOVIMIENTOS
  // =====================================================

  abrirModalMovimiento(): void {
    this.movimiento = { TipoMov: 0, ValorMov: 0, DescMov: '', idProveedor: null, NroDocumentoProveedor: '' };
    this.mostrarMovimiento = true;
    this.error = '';
  }

  esIngreso(tipoId: number | null): boolean {
    const t = this.tipos.find(x => x.id === tipoId);
    return !!t && t.Signo === '+';
  }

  registrarMovimiento(): void {
    this.error = '';
    const payload: any = {
      TipoMov: this.movimiento.TipoMov,
      ValorMov: this.movimiento.ValorMov,
      DescMov: this.movimiento.DescMov
    };
    if (this.movimiento.idProveedor && this.esIngreso(this.movimiento.TipoMov) === false) {
      payload.idProveedor = this.movimiento.idProveedor;
      payload.NroDocumentoProveedor = this.movimiento.NroDocumentoProveedor || null;
    }
    this.cajaService.registrarMovimiento(payload).subscribe({
      next: (r) => {
        this.mensaje = r.mensaje || 'Movimiento registrado';
        this.mostrarMovimiento = false;
        this.cargarJornadas();
      },
      error: (e) => {
        this.error = e.error?.mensaje || 'Error registrando el movimiento.';
      }
    });
  }

  // =====================================================
  // CIERRE DE CAJA
  // =====================================================

  abrirModalCierre(): void {
    this.valorEntregado = null;
    this.mostrarCierre = true;
    this.error = '';
  }

  cerrarCaja(): void {
    this.error = '';
    this.cajaService.cerrarCaja({ valorEntregado: this.valorEntregado }).subscribe({
      next: (r) => {
        this.mensaje = r.mensaje || 'Caja cerrada';
        this.mostrarCierre = false;
        this.cargarJornadas();
      },
      error: (e) => {
        this.error = e.error?.mensaje || 'Error cerrando la caja.';
      }
    });
  }

  // =====================================================
  // VER MOVIMIENTOS DE UNA JORNADA
  // =====================================================

  esJornadaSeleccionada(jornada: any): boolean {
    return !!this.movimientosJornada && this.movimientosJornada.Id === jornada.Id;
  }

  seleccionarJornada(jornada: any): void {
    if (!jornada || (this.movimientosJornada && this.movimientosJornada.Id === jornada.Id)) {
      return;
    }
    this.movimientosJornada = jornada;
    this.movimientos = [];
    this.filtroOrigen = '';
    this.movimientosCargando = true;
    this.cajaService.obtenerMovimientos(jornada.Id).subscribe({
      next: (r) => {
        this.movimientos = r.datos || [];
        this.movimientosCargando = false;
      },
      error: () => {
        this.movimientos = [];
        this.movimientosCargando = false;
        this.error = 'No fue posible consultar los movimientos.';
      }
    });
  }

  movimientosFiltrados(): any[] {
    if (!this.filtroOrigen) {
      return this.movimientos;
    }
    return this.movimientos.filter(m => m.Origen === this.filtroOrigen);
  }

  tipoMovimiento(tipoId: number | null): any {
    return this.tipos.find(t => t.id === tipoId) || null;
  }

  totalIngresosMov(): number {
    return this.movimientosFiltrados()
      .filter(m => m.Signo === '+')
      .reduce((acc, m) => acc + Number(m.ValorMov), 0);
  }

  totalEgresosMov(): number {
    return this.movimientosFiltrados()
      .filter(m => m.Signo === '-')
      .reduce((acc, m) => acc + Number(m.ValorMov), 0);
  }

  saldoMovimientos(): number {
    return this.totalIngresosMov() - this.totalEgresosMov();
  }

  // =====================================================
  // ARQUEO
  // =====================================================

  abrirModalArqueo(): void {
    this.arqueoDesde = this.hoy();
    this.arqueoHasta = this.hoy();
    this.arqueo = null;
    this.arqueoCargado = false;
    this.mostrarArqueo = true;
    this.error = '';
  }

  generarArqueo(): void {
    this.error = '';
    this.arqueoCargado = false;
    this.cajaService.obtenerArqueo(this.arqueoDesde, this.arqueoHasta).subscribe({
      next: (r) => {
        this.arqueo = r.datos;
        this.arqueoCargado = true;
      },
      error: (e) => {
        this.error = e.error?.mensaje || 'Error generando el arqueo.';
      }
    });
  }

  // =====================================================
  // FORMATO / FILTROS
  // =====================================================

  filtrar(): any[] {
    if (!this.filtroEstado) {
      return this.jornadas;
    }
    return this.jornadas.filter(j => j.EstadoJornada === this.filtroEstado);
  }

  formatValor(v: any): string {
    const n = Number(v || 0);
    return n.toLocaleString('es-CO', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  cerrarModales(): void {
    this.mostrarApertura = false;
    this.mostrarMovimiento = false;
    this.mostrarCierre = false;
    this.mostrarArqueo = false;
  }
}