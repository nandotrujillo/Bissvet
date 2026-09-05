import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanesService } from '../../Services/planes.service';
import { SuscripcionesService } from '../../Services/suscripciones.service';
import { Plan } from '../../Models/plan';

@Component({
  selector: 'app-mi-plan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './mi-plan.component.html',
  styleUrls: ['./mi-plan.component.css']
})
export class MiPlanComponent implements OnInit {

  suscripcion: any = null;
  modulos: any[] = [];
  consumo: any = null;
  existe = false;
  cargando = true;

  planes: Plan[] = [];
  mostrarCambioPlan = false;
  planSeleccionado: number = 0;
  motivo = '';
  mensaje = '';
  error = '';
  cambiando = false;

  constructor(
    private planesService: PlanesService,
    private suscripcionesService: SuscripcionesService
  ) {}

  ngOnInit(): void {
    this.cargarMiPlan();
  }

  cargarMiPlan(): void {
    this.cargando = true;
    this.planesService.miPlan().subscribe({
      next: (respuesta) => {
        const datos = respuesta.datos || {};
        this.existe = !!datos.existe;
        if (this.existe) {
          this.suscripcion = datos.suscripcion;
          this.modulos = datos.modulos || [];
          this.consumo = datos.consumo || null;
        }
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando mi plan:', err);
        this.error = 'No fue posible cargar la información de su plan';
        this.cargando = false;
      }
    });
  }

  estadoLabel(): string {
    const estados: any = {
      PRUEBA: 'Periodo de prueba',
      ACTIVA: 'Activa',
      VENCIDA: 'Vencida',
      SUSPENDIDA: 'Suspendida',
      CANCELADA: 'Cancelada'
    };
    return this.suscripcion?.Estado ? estados[this.suscripcion.Estado] || this.suscripcion.Estado : '';
  }

  formatoFecha(fecha: string): string {
    if (!fecha) return '-';
    return new Date(fecha).toLocaleDateString('es-CO', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  formatoMoneda(precio?: number, moneda?: string): string {
    if (precio === null || precio === undefined) return '-';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: moneda || 'COP',
      minimumFractionDigits: 0
    }).format(precio);
  }

  porcentajeUsado(limite: any): number {
    if (!limite || limite.maximo <= 0) return 0;
    const p = Math.round((limite.actual / limite.maximo) * 100);
    return p > 100 ? 100 : p;
  }

  alertaLimite(limite: any): boolean {
    return limite.maximo > 0 && limite.actual >= limite.maximo;
  }

  abrirCambioPlan(): void {
    this.mostrarCambioPlan = true;
    this.planSeleccionado = this.suscripcion?.IdPlan || 0;
    this.motivo = '';
    this.mensaje = '';
    this.error = '';

    if (this.planes.length === 0) {
      this.planesService.listar().subscribe({
        next: (respuesta) => {
          this.planes = respuesta.datos || [];
        },
        error: (err) => {
          this.error = err.error?.mensaje || 'No fue posible cargar los planes disponibles';
        }
      });
    }
  }

  cambiarPlan(): void {
    if (!this.planSeleccionado) {
      this.error = 'Debe seleccionar un plan';
      return;
    }

    const idSuscripcion = this.suscripcion?.IdSuscripcion;
    if (!idSuscripcion) {
      this.error = 'Su empresa no tiene suscripción activa';
      return;
    }

    this.cambiando = true;
    this.error = '';
    this.mensaje = '';

    this.suscripcionesService.cambiarPlan(idSuscripcion, Number(this.planSeleccionado), this.motivo || undefined)
      .subscribe({
        next: (respuesta) => {
          this.cambiando = false;
          this.mensaje = respuesta.mensaje || 'Plan actualizado correctamente';
          this.mostrarCambioPlan = false;
          this.cargarMiPlan();
        },
        error: (err) => {
          this.cambiando = false;
          this.error = err.error?.mensaje || 'Error cambiando de plan';
        }
      });
  }
}