import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';

import { EmpresasComponent }
  from '../../empresas/empresas/empresas.component';

import { DashboardService }
  from '../../../Services/dashboard.service';

interface Atajo {
  codigo: string;
  ruta: string;
  icono: string;
  texto: string;
  descripcion: string;
}

const ATAJOS: Atajo[] = [
  {
    codigo: 'CITAS',
    ruta: '/dashboard/citas',
    icono: '📅',
    texto: 'Citas',
    descripcion: 'Agendar y gestionar citas'
  },
  {
    codigo: 'VENTAS',
    ruta: '/dashboard/ventas',
    icono: '🧾',
    texto: 'Ventas',
    descripcion: 'Registrar y confirmar ventas'
  },
  {
    codigo: 'CLIENTES',
    ruta: '/dashboard/clientes',
    icono: '👥',
    texto: 'Clientes',
    descripcion: 'Administrar dueños de mascotas'
  },
  {
    codigo: 'MASCOTAS',
    ruta: '/dashboard/mascotas',
    icono: '🐾',
    texto: 'Mascotas',
    descripcion: 'Registro y seguimiento de pacientes'
  },
  {
    codigo: 'PRODUCTOS',
    ruta: '/dashboard/productos',
    icono: '📦',
    texto: 'Productos',
    descripcion: 'Catálogo de productos'
  },
  {
    codigo: 'INVENTARIOS',
    ruta: '/dashboard/inventario',
    icono: '📈',
    texto: 'Inventario',
    descripcion: 'Existencias y movimientos'
  },
  {
    codigo: 'COMPRAS',
    ruta: '/dashboard/compras',
    icono: '🛒',
    texto: 'Compras',
    descripcion: 'Órdenes de compra'
  },
  {
    codigo: 'REPORTES',
    ruta: '/dashboard/reportes',
    icono: '📊',
    texto: 'Reportes',
    descripcion: 'Indicadores y exportaciones'
  }
];

@Component({
  selector: 'app-dashboard-inicio',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    EmpresasComponent
  ],
  templateUrl: './dashboard-inicio.component.html',
  styleUrls: ['./dashboard-inicio.component.css']
})
export class DashboardInicioComponent implements OnInit {

  kpis: any = null;
  cargando = false;
  error = '';
  atajos: Atajo[] = [];
  empresaNombre: string = '';
  usuarioActual: string = '';

  constructor(
    private dashboardService: DashboardService
  ) {}

  ngOnInit(): void {
    this.cargarSesion();
    this.cargarAtajos();
    this.cargarResumen();
  }

  cargarSesion(): void {

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

      const usuarioRaw = localStorage.getItem('usuario');

      if (usuarioRaw) {

        try {

          const usuario = JSON.parse(usuarioRaw);

          this.usuarioActual = usuario?.Username || '';

        } catch (error) {

          console.error('Error leyendo usuario de sesión:', error);
        }
      }
    }
  }

  cargarAtajos(): void {

    const codigosMenu = new Set<string>();

    if (typeof localStorage !== 'undefined') {

      const menu = localStorage.getItem('menu');

      if (menu) {

        try {

          const modulos = JSON.parse(menu);

          for (const mod of modulos || []) {

            if (mod?.Codigo) {
              codigosMenu.add(mod.Codigo);
            }
          }

        } catch (error) {

          console.error('Error leyendo menú de sesión:', error);
        }
      }
    }

    this.atajos = ATAJOS.filter((a) => codigosMenu.has(a.codigo));
  }

  cargarResumen(): void {
    this.cargando = true;
    this.error = '';
    this.dashboardService.resumen().subscribe({
      next: (respuesta: any) => {
        this.kpis = respuesta.datos || null;
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error cargando resumen:', err);
        this.error = 'No fue posible cargar el resumen del dashboard.';
        this.cargando = false;
      }
    });
  }

  formatoMoneda(valor: number): string {
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0
    }).format(valor || 0);
  }
}