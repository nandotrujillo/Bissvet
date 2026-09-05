import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PlanesService } from '../../Services/planes.service';
import { ModulosService } from '../../Services/modulos.service';
import { SeguridadService } from '../../Services/seguridad.service';
import { Plan, PlanLimite, TipoLimite } from '../../Models/plan';
import { Modulo } from '../../Models/modulo';

@Component({
  selector: 'app-planes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './planes.component.html',
  styleUrls: ['./planes.component.css']
})
export class PlanesComponent implements OnInit {

  planes: Plan[] = [];
  modulos: Modulo[] = [];
  tiposLimite: TipoLimite[] = [];

  plan: Plan = this.nuevoPlan();
  editando = false;
  mostrarFormulario = false;
  textoBusqueda = '';

  modulosSeleccionados: { [key: number]: boolean } = {};
  limitesPlan: PlanLimite[] = [];

  mensaje = '';
  error = '';
  cargando = false;

  puedeCrear = false;
  puedeEditar = false;
  puedeInactivar = false;
  puedeConfigurar = false;

  constructor(
    private planesService: PlanesService,
    private modulosService: ModulosService,
    private seguridadService: SeguridadService
  ) {}

  ngOnInit(): void {
    this.verificarPermisos();
    this.cargarPlanes();
    this.cargarModulos();
    this.cargarTiposLimite();
  }

  verificarPermisos(): void {
    const permisos = this.seguridadService.obtenerPermisosLocal();
    this.puedeCrear = permisos.includes('PLANES.CREAR');
    this.puedeEditar = permisos.includes('PLANES.EDITAR');
    this.puedeInactivar = permisos.includes('PLANES.ELIMINAR');
    this.puedeConfigurar = permisos.includes('PLANES.CONFIGURAR');
  }

  cargarPlanes(): void {
    this.cargando = true;
    this.planesService.listar().subscribe({
      next: (respuesta) => {
        this.planes = respuesta.datos || [];
        this.cargando = false;
      },
      error: (err) => {
        console.error('Error cargando planes:', err);
        this.error = 'No fue posible cargar los planes';
        this.cargando = false;
      }
    });
  }

  cargarModulos(): void {
    this.modulosService.listar().subscribe({
      next: (respuesta) => {
        this.modulos = respuesta.datos || [];
      },
      error: (err) => {
        console.error('Error cargando módulos:', err);
      }
    });
  }

  cargarTiposLimite(): void {
    this.planesService.tiposLimite().subscribe({
      next: (respuesta) => {
        this.tiposLimite = respuesta.datos || [];
      },
      error: (err) => {
        console.error('Error cargando tipos de límite:', err);
      }
    });
  }

  nuevoPlan(): Plan {
    return {
      CodigoPlan: '',
      NombrePlan: '',
      Descripcion: '',
      PrecioMensual: 0,
      PrecioAnual: 0,
      Moneda: 'COP',
      MaxUsuarios: 1,
      DiasPrueba: null as any,
      Activo: 1
    };
  }

  nuevo(): void {
    this.plan = this.nuevoPlan();
    this.editando = false;
    this.limpiarSeleccion();
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';
  }

  editar(plan: Plan): void {
    this.plan = {
      IdPlan: plan.IdPlan,
      CodigoPlan: plan.CodigoPlan,
      NombrePlan: plan.NombrePlan,
      Descripcion: plan.Descripcion,
      PrecioMensual: plan.PrecioMensual,
      PrecioAnual: plan.PrecioAnual,
      Moneda: plan.Moneda,
      MaxUsuarios: plan.MaxUsuarios,
      DiasPrueba: plan.DiasPrueba,
      Activo: plan.Activo
    };
    this.editando = true;

    this.modulosSeleccionados = {};
    (plan.modulos || []).forEach((mod: any) => {
      this.modulosSeleccionados[mod.idModulos] = true;
    });

    this.limitesPlan = (plan.limites || []).map((l: any) => ({
      IdTipoLimite: l.IdTipoLimite || l.idTipolimite,
      Codigo: l.Codigo,
      Nombre: l.Nombre,
      Unidad: l.Unidad,
      maximo: l.maximo
    }));

    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';
  }

  limpiarSeleccion(): void {
    this.modulosSeleccionados = {};
    this.limitesPlan = [];
  }

  toggleModulo(idModulos: number): void {
    this.modulosSeleccionados[idModulos] = !this.modulosSeleccionados[idModulos];
  }

  obtenerMaximoLimite(idTipoLimite: number): number {
    const l = this.limitesPlan.find((x) => x.IdTipoLimite === idTipoLimite);
    return l ? Number(l.maximo) : 0;
  }

  definirLimite(idTipoLimite: number, valor: number): void {
    const existe = this.limitesPlan.find((x) => x.IdTipoLimite === idTipoLimite);
    if (existe) {
      existe.maximo = valor;
    } else {
      const tipo = this.tiposLimite.find((t) => t.IdTipoLimite === idTipoLimite);
      this.limitesPlan.push({
        IdTipoLimite: idTipoLimite,
        Codigo: tipo?.Codigo || '',
        Nombre: tipo?.Nombre || '',
        Unidad: tipo?.Unidad || '',
        maximo: valor
      });
    }
  }

  nombreModulo(idModulos: number): string {
    const m = this.modulos.find((x) => x.idModulos === idModulos);
    return m ? `${m.Icono ? m.Icono + ' ' : ''}${m.NombreModulo}` : '';
  }

  validar(): boolean {
    if (!this.plan.CodigoPlan || !this.plan.NombrePlan) {
      this.error = 'Código y nombre del plan son obligatorios';
      return false;
    }
    if (!this.plan.MaxUsuarios || this.plan.MaxUsuarios < 1) {
      this.error = 'El máximo de usuarios debe ser al menos 1';
      return false;
    }
    return true;
  }

  guardar(): void {
    if (!this.validar()) return;

    const accion = this.editando && this.plan.IdPlan
      ? this.planesService.actualizar(this.plan.IdPlan, this.plan)
      : this.planesService.crear(this.plan);

    accion.subscribe({
      next: (respuesta) => {
        const idPlan = respuesta.IdPlan || this.plan.IdPlan;
        this.mensaje = respuesta.mensaje || 'Plan guardado correctamente';
        this.guardarConfiguracion(idPlan);
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'Error guardando el plan';
      }
    });
  }

  guardarConfiguracion(idPlan: number): void {
    if (!idPlan) {
      this.guardarControl(0);
      return;
    }

    if (this.puedeConfigurar) {
      const idsModulos = Object.keys(this.modulosSeleccionados)
        .filter((k) => this.modulosSeleccionados[Number(k)])
        .map((k) => Number(k));

      const limites = this.limitesPlan
        .filter((l) => l.IdTipoLimite && l.maximo !== undefined)
        .map((l) => ({
          IdTipoLimite: l.IdTipoLimite,
          ValorLimite: l.maximo
        }));

      this.planesService.guardarModulos(idPlan, idsModulos).subscribe({
        next: () => {
          this.planesService.guardarLimites(idPlan, limites).subscribe({
            next: () => {
              this.guardarControl(1);
            },
            error: () => this.guardarControl(2)
          });
        },
        error: () => this.guardarControl(2)
      });
    } else {
      this.guardarControl(0);
    }
  }

  guardarControl(opcion: number): void {
    if (opcion === 2) {
      this.error = 'El plan se guardó pero hubo un error configurando módulos o límites';
    }
    this.cancelar();
    this.cargarPlanes();
  }

  cambiarEstado(plan: Plan): void {
    if (!confirm(`¿Desea ${plan.Activo ? 'inactivar' : 'activar'} el plan ${plan.NombrePlan}?`)) return;

    this.planesService.cambiarEstado(plan.IdPlan!, plan.Activo ? false : true).subscribe({
      next: (respuesta) => {
        this.mensaje = respuesta.mensaje || 'Estado actualizado';
        this.cargarPlanes();
      },
      error: (err) => {
        this.error = err.error?.mensaje || 'Error actualizando estado del plan';
      }
    });
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.editando = false;
    this.plan = this.nuevoPlan();
    this.limpiarSeleccion();
    this.error = '';
    this.mensaje = '';
  }

  plansFiltrados(): Plan[] {
    const t = this.textoBusqueda.trim().toLowerCase();
    if (!t) return this.planes;
    return this.planes.filter(
      (p) =>
        p.NombrePlan?.toLowerCase().includes(t) ||
        p.CodigoPlan?.toLowerCase().includes(t) ||
        (p.Descripcion || '').toLowerCase().includes(t)
    );
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