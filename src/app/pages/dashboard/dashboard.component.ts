import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterLink,
  RouterLinkActive,
  RouterOutlet,
  Router,
  NavigationEnd
} from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { SeguridadService, ModuloSistema } from '../../Services/seguridad.service';
import { environment } from '../../../environments/environment';

export interface SeccionMenu {
  nombre: string;
  icono: string;
  modulos: ModuloSistema[];
  abierta: boolean;
}

const ICONOS_EMOJI: Record<string, string> = {
  lock: '🔐',
  business: '🏢',
  person: '👤',
  group: '👥',
  pets: '🐾',
  medical: '🩺',
  calendar: '📅',
  folder: '📁',
  healing: '🩹',
  category: '🏷️',
  inventory: '📦',
  warehouse: '🏭',
  analytics: '📈',
  shopping_cart: '🛒',
  receipt: '🧾',
  payments: '💰',
  bar_chart: '📊',
  history: '🕒',
  pricing: '💲',
  subscriptions: '🔄',
  dashboard: '🏠'
};

const ORDEN_SECCIONES: { nombre: string; icono: string }[] = [
  { nombre: 'Atención', icono: '🩺' },
  { nombre: 'Inventario', icono: '📦' },
  { nombre: 'Ventas y Caja', icono: '💰' },
  { nombre: 'Reportes', icono: '📊' },
  { nombre: 'Administración', icono: '⚙️' },
  { nombre: 'Plataforma', icono: '🌐' }
];

const CODIGO_SECCION: Record<string, string> = {
  CLIENTES: 'Atención',
  MASCOTAS: 'Atención',
  CITAS: 'Atención',
  VETERINARIOS: 'Atención',
  HISTORIA_CLINICA: 'Atención',
  SERVICIOS: 'Atención',
  CATEGORIAS_SERVICIO: 'Atención',
  PRODUCTOS: 'Inventario',
  BODEGAS: 'Inventario',
  INVENTARIOS: 'Inventario',
  COMPRAS: 'Inventario',
  VENTAS: 'Ventas y Caja',
  CAJA: 'Ventas y Caja',
  REPORTES: 'Reportes',
  EMPRESAS: 'Administración',
  SEGURIDAD: 'Administración',
  USUARIOS: 'Administración',
  AUDITORIA: 'Administración',
  PLANES: 'Plataforma',
  SUSCRIPCIONES: 'Plataforma'
};

@Component({
  selector: 'app-dashboard',
  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    RouterOutlet
  ],

  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit, OnDestroy {

  empresaNombre: string = '';
  modulos: ModuloSistema[] = [];
  secciones: SeccionMenu[] = [];
  panelAbierta: boolean = true;
  usuarioActual: string = '';
  planActual: string = '';
  planEstado: string = '';
  planVence: string = '';

  private subNav: Subscription = new Subscription();

  constructor(
    private seguridadService: SeguridadService,
    private http: HttpClient,
    private router: Router
  ) { }

  ngOnInit(): void {

    if (typeof localStorage !== 'undefined') {

      const sesion = localStorage.getItem('empresa');

      if (sesion) {

        try {

          const empresa = JSON.parse(sesion);

          this.empresaNombre =
            empresa?.NombreComercial || '';

        } catch (error) {

          console.error('Error leyendo empresa de sesión:', error);
        }
      }

      const sub = localStorage.getItem('suscripcion');

      if (sub) {

        try {

          const suscripcion = JSON.parse(sub);

          this.planActual = suscripcion?.NombrePlan || '';
          this.planEstado = suscripcion?.Estado || '';
          this.planVence = suscripcion?.FechaFin || '';

        } catch (error) {

          console.error('Error leyendo suscripción de sesión:', error);
        }
      }
    }

    this.subNav = this.router.events
      .pipe(
        filter((e): e is NavigationEnd => e instanceof NavigationEnd)
      )
      .subscribe(() => {
        this.abrirSeccionActiva();
      });

    this.cargarMenu();
  }

  ngOnDestroy(): void {
    this.subNav.unsubscribe();
  }

  cargarMenu(): void {

    this.seguridadService.obtenerMenu().subscribe({

      next: (respuesta) => {

        this.modulos = respuesta.datos || [];

        this.construirSecciones();

        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('menu', JSON.stringify(this.modulos));
        }
      },

      error: (error) => {

        console.error('Error cargando menú:', error);
      }
    });
  }

  construirSecciones(): void {

    const agrupados = new Map<string, ModuloSistema[]>();

    for (const mod of this.modulos) {

      const nombreSeccion = CODIGO_SECCION[mod.Codigo] || 'Otros';

      if (!agrupados.has(nombreSeccion)) {
        agrupados.set(nombreSeccion, []);
      }

      agrupados.get(nombreSeccion)!.push(mod);
    }

    this.secciones = ORDEN_SECCIONES
      .map((s) => ({
        nombre: s.nombre,
        icono: s.icono,
        modulos: agrupados.get(s.nombre) || [],
        abierta: false
      }))
      .filter((s) => s.modulos.length > 0);

    for (const [nombre, modulos] of agrupados) {

      if (!this.secciones.some((s) => s.nombre === nombre)) {
        this.secciones.push({ nombre, icono: '📌', modulos, abierta: false });
      }
    }

    this.abrirSeccionActiva();
  }

  abrirSeccionActiva(): void {

    const url = this.router.url;

    for (const sec of this.secciones) {

      const activa = sec.modulos.some(
        (m) => !!m.Ruta && url.startsWith(m.Ruta)
      );

      if (activa) {
        sec.abierta = true;
      }
    }
  }

  toggleSeccion(seccion: SeccionMenu): void {
    seccion.abierta = !seccion.abierta;
  }

  iconoModulo(mod: ModuloSistema): string {
    return ICONOS_EMOJI[mod.Icono || ''] || '📄';
  }

  salir(): void {

    this.seguridadService.limpiarCache();

    if (typeof localStorage !== 'undefined') {

      const idSesion = localStorage.getItem('IdSesion');
      const idSesionNum = idSesion ? Number(idSesion) : null;

      if (idSesionNum) {

        this.http.post(
          `${environment.apiUrl}/usuarios/logout`,
          { IdSesion: idSesionNum }
        ).subscribe({
          next: () => {},
          error: () => {}
        });
      }
    }

    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }

    this.router.navigate(['/login']);
  }
}