import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SuscripcionesService } from '../../Services/suscripciones.service';
import { PlanesService } from '../../Services/planes.service';
import { EmpresaService } from '../../Services/empresas.service';
import { SeguridadService } from '../../Services/seguridad.service';
import { Suscripcion } from '../../Models/suscripcion';
import { Plan } from '../../Models/plan';

@Component({
  selector: 'app-suscripciones',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suscripciones.component.html',
  styleUrls: ['./suscripciones.component.css']
})
export class SuscripcionesComponent implements OnInit {

  suscripciones: Suscripcion[] = [];
  planes: Plan[] = [];
  empresas: any[] = [];
  modulos: any[] = [];

  suscripcion: Suscripcion = this.nuevaSuscripcion();
  detalle: any = null;
  editando = false;
  mostrarFormulario = false;
  mostrandoDetalle = false;
  mostrarAddons = false;
  textoBusqueda = '';

  mensaje = '';
  error = '';
  cargando = false;

  puedeAsignar = false;
  puedeCambiarPlan = false;
  puedeSuspender = false;
  puedeAddons = false;

  addonsSeleccionados: { [key: number]: boolean } = {};

  constructor(
    private suscripcionesService: SuscripcionesService,
    private planesService: PlanesService,
    private empresaService: EmpresaService,
    private seguridadService: SeguridadService
  ) {}

  ngOnInit(): void {
    this.verificarPermisos();
    this.cargarSuscripciones();
    this.cargarPlanes();
    this.cargarEmpresas();
    this.cargarModulos();
  }

  verificarPermisos(): void {
    const permisos = this.seguridadService.obtenerPermisosLocal();
    this.puedeAsignar = permisos.includes('SUSCRIPCIONES.ASIGNAR');
    this.puedeCambiarPlan = permisos.includes('SUSCRIPCIONES.CAMBIAR_PLAN');
    this.puedeSuspender = permisos.includes('SUSCRIPCIONES.SUSPENDER');
    this.puedeAddons = permisos.includes('SUSCRIPCIONES.ADDONS');
  }

  cargarSuscripciones(): void {
    this.cargando = true;
    this.suscripcionesService.listar().subscribe({
      next: (respuesta) => {
        this.suscripciones = respuesta.datos || [];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando suscripciones:', err);
        this.error = 'No fue posible cargar las suscripciones';
        this.cargando = false;
      }
    });
  }

  cargarPlanes(): void {
    this.planesService.listar().subscribe({
      next: (respuesta) => {
        this.planes = respuesta.datos || [];
      },
      error: (err) => console.error('Error cargando planes:', err)
    });
  }

  cargarEmpresas(): void {
    this.empresaService.obtenerEmpresas().subscribe({
      next: (respuesta) => {
        this.empresas = respuesta.datos || [];
      },
      error: (err) => console.error('Error cargando empresas:', err)
    });
  }

  cargarModulos(): void {
    this.seguridadService.obtenerModulos().subscribe({
      next: (respuesta) => {
        this.modulos = respuesta.datos || [];
      },
      error: (err) => console.error('Error cargando módulos:', err)
    });
  }

  nuevaSuscripcion(): Suscripcion {
    return {
      IdEmpresa: 0,
      IdPlan: 0,
      Estado: 'PRUEBA',
      Periodicidad: 'MENSUAL',
      AutoRenovacion: 0
    };
  }

  nuevo(): void {
    this.suscripcion = this.nuevaSuscripcion();
    this.editando = false;
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';
  }

  editar(s: Suscripcion): void {
    this.suscripcion = { ...s };
    this.editando = true;
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';
  }

  validar(): boolean {
    if (!this.suscripcion.IdEmpresa) {
      this.error = 'Debe seleccionar la empresa';
      return false;
    }
    if (!this.suscripcion.IdPlan) {
      this.error = 'Debe seleccionar el plan';
      return false;
    }
    return true;
  }

  guardar(): void {
    if (!this.validar()) return;

    const payload: Suscripcion = {
      IdEmpresa: Number(this.suscripcion.IdEmpresa),
      IdPlan: Number(this.suscripcion.IdPlan),
      Estado: this.suscripcion.Estado,
      Periodicidad: this.suscripcion.Periodicidad,
      AutoRenovacion: this.suscripcion.AutoRenovacion ? 1 : 0,
      FechaInicio: this.suscripcion.FechaInicio || undefined,
      FechaFin: this.suscripcion.FechaFin || undefined,
      FechaProximaFacturacion: this.suscripcion.FechaProximaFacturacion || undefined,
      Motivo: this.suscripcion.Motivo
    };

    const accion = this.editando && this.suscripcion.IdSuscripcion
      ? this.suscripcionesService.actualizar(this.suscripcion.IdSuscripcion, payload)
      : this.suscripcionesService.crear(payload);

    accion.subscribe({
      next: (respuesta) => {
        this.mensaje = respuesta.mensaje || 'Suscripción guardada correctamente';
        this.mostrarFormulario = false;
        this.cargarSuscripciones();
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'Error guardando la suscripción';
      }
    });
  }

  cambiarEstado(s: Suscripcion, nuevoEstado: Suscripcion['Estado']): void {
    const confirmacion = confirm(`¿Desea ${nuevoEstado === 'SUSPENDIDA' ? 'suspender' :
      nuevoEstado === 'ACTIVA' ? 'activar' :
      nuevoEstado === 'CANCELADA' ? 'cancelar' : 'cambiar estado de'} la suscripción de ${s.NombreComercial}?`);
    if (!confirmacion) return;

    this.suscripcionesService.actualizar(s.IdSuscripcion!, { Estado: nuevoEstado }).subscribe({
      next: (respuesta) => {
        this.mensaje = respuesta.mensaje || 'Estado actualizado';
        this.cargarSuscripciones();
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'Error actualizando estado';
      }
    });
  }

  cambiarEstadoDetalle(estado: string): void {
    const estadoValido = estado as Suscripcion['Estado'];
    this.cambiarEstado(this.detalle, estadoValido);
  }

  nombrePlanDesdeId(idPlan: number): string {
    if (!idPlan) return '-';
    const plan = this.planes.find((p) => p.IdPlan === idPlan);
    return plan ? plan.NombrePlan : `Plan #${idPlan}`;
  }

  verDetalle(s: Suscripcion): void {
    this.suscripcionesService.obtener(s.IdSuscripcion!).subscribe({
      next: (respuesta) => {
        this.detalle = respuesta.datos || null;
        this.mostrandoDetalle = true;
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'Error obteniendo detalle';
      }
    });
  }

  verAddons(s: Suscripcion): void {
    this.suscripcionesService.obtener(s.IdSuscripcion!).subscribe({
      next: (respuesta) => {
        const datos = respuesta.datos || null;
        this.detalle = datos;
        this.suscripcion.IdSuscripcion = datos.IdSuscripcion;
        this.suscripcion.IdEmpresa = datos.IdEmpresa;
        this.mostrarAddons = true;
        this.addonsSeleccionados = {};
        (datos.addons || []).forEach((a: any) => {
          this.addonsSeleccionados[a.IdModulo] = true;
        });
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'Error obteniendo ADD-ONs';
      }
    });
  }

  nombreModulo(idModulos: number): string {
    const m = this.modulos.find((x) => x.idModulos === idModulos);
    return m ? `${m.Icono ? m.Icono + ' ' : ''}${m.NombreModulo}` : 'Módulo';
  }

  guardarAddons(): void {
    const idSuscripcion = this.suscripcion.IdSuscripcion;
    if (!idSuscripcion) return;

    const modulos = Object.keys(this.addonsSeleccionados)
      .filter((k) => this.addonsSeleccionados[Number(k)])
      .map((k) => ({ IdModulo: Number(k), PrecioAdicional: 0 }));

    this.suscripcionesService.guardarAddons(idSuscripcion, modulos).subscribe({
      next: (respuesta) => {
        this.mensaje = respuesta.mensaje || 'ADD-ONs actualizados';
        this.mostrarAddons = false;
        this.cargarSuscripciones();
      },
      error: (err) => {
        this.error = err.error?.mensaje || err.error?.error || 'Error guardando ADD-ONs';
      }
    });
  }

  cambiarPlanDetalle(planId: string | number): void {
    if (!this.detalle?.IdSuscripcion) return;

    this.suscripcionesService.cambiarPlan(this.detalle.IdSuscripcion, Number(planId))
      .subscribe({
        next: (respuesta) => {
          this.mensaje = respuesta.mensaje || 'Plan cambiado';
          this.mostrandoDetalle = false;
          this.cargarSuscripciones();
        },
        error: (err) => {
          this.error = err.error?.mensaje || 'Error cambiando plan';
        }
      });
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.editando = false;
    this.suscripcion = this.nuevaSuscripcion();
    this.error = '';
    this.mensaje = '';
  }

  suscripcionesFiltradas(): Suscripcion[] {
    const t = this.textoBusqueda.trim().toLowerCase();
    if (!t) return this.suscripciones;
    return this.suscripciones.filter(
      (s) =>
        s.NombreComercial?.toLowerCase().includes(t) ||
        s.NombrePlan?.toLowerCase().includes(t) ||
        s.Estado?.toLowerCase().includes(t) ||
        (s.Nit || '').toLowerCase().includes(t)
    );
  }

  estadoLabel(estado: string): string {
    const estados: any = {
      PRUEBA: 'Prueba',
      ACTIVA: 'Activa',
      VENCIDA: 'Vencida',
      SUSPENDIDA: 'Suspendida',
      CANCELADA: 'Cancelada'
    };
    return estados[estado] || estado;
  }

  formatoFecha(fecha?: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-CO');
  }

  formatoMoneda(precio?: number, moneda?: string): string {
    if (precio === null || precio === undefined) return '-';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda || 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  }
}