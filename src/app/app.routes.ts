import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [

  // =====================================================
  // LOGIN
  // =====================================================

  {
    path: 'login',

    loadComponent: () =>
      import('../app/pages/Login/login.component')
        .then(m => m.LoginComponent)
  },


  // =====================================================
  // DASHBOARD
  // =====================================================

  {
    path: 'dashboard',

    loadComponent: () =>
      import('./pages/dashboard/dashboard.component')
        .then(m => m.DashboardComponent),

    canActivate: [authGuard],

    children: [

      // -------------------------------------------------
      // CLIENTES
      // -------------------------------------------------

      {
        path: 'clientes',

        loadComponent: () =>
          import('./pages/clientes/clientes/clientes.component')
            .then(m => m.ClientesComponent)
      },


      // -------------------------------------------------
      // MASCOTAS
      // -------------------------------------------------

      {
        path: 'mascotas',

        loadComponent: () =>
          import('./pages/mascotas/mascotas.component')
            .then(m => m.MascotasComponent)
      },


      // -------------------------------------------------
      // CITAS
      // -------------------------------------------------

      {
        path: 'citas',

        loadComponent: () =>
          import('./pages/citas/citas.component')
            .then(m => m.CitasComponent)
      },


      // -------------------------------------------------
      // VETERINARIOS
      // -------------------------------------------------

      {
        path: 'veterinarios',

        loadComponent: () =>
          import('./pages/veterinarios/veterinarios/veterinarios.component')
            .then(m => m.VeterinariosComponent)
      },

       // NUEVA RUTA: BODEGAS
      {
        path: 'bodegas',
        loadComponent: () =>
          import('../app/pages/bodegas/bodegas/bodegas.component')
            .then(m => m.BodegasComponent)
      },

      // -------------------------------------------------
      // EMPRESA (INFORMACIÓN Y ACTUALIZACIÓN)
      // -------------------------------------------------

      {
        path: 'empresas',
        loadComponent: () =>
          import('../app/pages/empresas/empresas/empresas.component')
            .then(m => m.EmpresasComponent)
      },

      // -------------------------------------------------
      // PRODUCTOS (MÓDULO INVENTARIO)
      // -------------------------------------------------

      {
        path: 'productos',
        loadComponent: () =>
          import('./pages/productos/productos/productos.component')
            .then(m => m.ProductosComponent)
      },

      // -------------------------------------------------
      // PROVEEDORES (MÓDULO INVENTARIO)
      // -------------------------------------------------

      {
        path: 'proveedores',
        loadComponent: () =>
          import('./pages/proveedores/proveedores/proveedores.component')
            .then(m => m.ProveedoresComponent)
      },

      // -------------------------------------------------
      // INVENTARIO (MÓDULO INVENTARIO)
      // -------------------------------------------------

      {
        path: 'inventario',
        loadComponent: () =>
          import('./pages/inventario/inventario.component')
            .then(m => m.InventarioComponent)
      },

      // -------------------------------------------------
      // KARDEX (MÓDULO INVENTARIO)
      // -------------------------------------------------

      {
        path: 'kardex',
        loadComponent: () =>
          import('./pages/kardex/kardex.component')
            .then(m => m.KardexComponent)
      },

      // -------------------------------------------------
      // COMPRAS (MÓDULO INVENTARIO)
      // -------------------------------------------------

      {
        path: 'compras',
        loadComponent: () =>
          import('./pages/compras/compras.component')
            .then(m => m.ComprasComponent)
      },

      // -------------------------------------------------
      // VENTAS (MÓDULO INVENTARIO)
      // -------------------------------------------------

      {
        path: 'ventas',
        loadComponent: () =>
          import('./pages/ventas/ventas.component')
            .then(m => m.VentasComponent)
      },

      // -------------------------------------------------
      // TRASLADOS (MÓDULO INVENTARIO)
      // -------------------------------------------------

      {
        path: 'traslados',
        loadComponent: () =>
          import('./pages/traslados/traslados.component')
            .then(m => m.TrasladosComponent)
      },

      // -------------------------------------------------
      // AJUSTES (MÓDULO INVENTARIO)
      // -------------------------------------------------

      {
        path: 'ajustes',
        loadComponent: () =>
          import('./pages/ajustes/ajustes.component')
            .then(m => m.AjustesComponent)
      },

      // -------------------------------------------------
      // HISTORIA CLINICA
      // -------------------------------------------------

      {
        path: 'historiaclinica',
        loadComponent: () =>
          import('./pages/historiaclinica/historiaclinica.component')
            .then(m => m.HistoriaClinicaComponent)
      },

      {
        path: 'historiaclinica/:idMascota',
        loadComponent: () =>
          import('./pages/historiaclinica/historiaclinica.component')
            .then(m => m.HistoriaClinicaComponent)
      },

      {
        path: 'historiaclinica/:idMascota/:idHistoria',
        loadComponent: () =>
          import('../app/pages/historiaclinica/historiaclinica.component')
            .then(m => m.HistoriaClinicaComponent)
      },

      // -------------------------------------------------
      // INICIO (RAÍZ DEL DASHBOARD)
      // -------------------------------------------------

      {
        path: '',
        loadComponent: () =>
          import('./pages/dashboard/inicio/dashboard-inicio.component')
            .then(m => m.DashboardInicioComponent)
      },

      // -------------------------------------------------
      // SEGURIDAD Y ADMINISTRACIÓN (FASE 6)
      // -------------------------------------------------

      {
        path: 'seguridad',
        loadComponent: () =>
          import('./pages/seguridad/seguridad.component')
            .then(m => m.SeguridadComponent)
      },

      {
        path: 'perfiles',
        loadComponent: () =>
          import('./pages/perfiles/perfiles.component')
            .then(m => m.PerfilesComponent)
      },

      {
        path: 'roles',
        loadComponent: () =>
          import('./pages/roles/roles.component')
            .then(m => m.RolesComponent)
      },

      {
        path: 'sesiones',
        loadComponent: () =>
          import('./pages/sesiones/sesiones.component')
            .then(m => m.SesionesComponent)
      },

      {
        path: 'auditoria',
        loadComponent: () =>
          import('./pages/auditoria/auditoria.component')
            .then(m => m.AuditoriaComponent)
      },

      {
        path: 'usuarios',
        loadComponent: () =>
          import('./pages/usuarios/usuarios.component')
            .then(m => m.UsuariosComponent)
      },

      {
        path: 'caja',
        loadComponent: () =>
          import('./pages/caja/caja.component')
            .then(m => m.CajaComponent)
      },

      {
        path: 'reportes',
        loadComponent: () =>
          import('./pages/reportes/reportes.component')
            .then(m => m.ReportesComponent)
      },

      {
        path: 'servicios',
        loadComponent: () =>
          import('./pages/servicios/servicios.component')
            .then(m => m.ServiciosComponent)
      },

      // -------------------------------------------------
      // MONETIZACIÓN: PLANES, SUSCRIPCIONES Y MI PLAN
      // -------------------------------------------------

      {
        path: 'planes',
        loadComponent: () =>
          import('./pages/planes/planes.component')
            .then(m => m.PlanesComponent)
      },

      {
        path: 'mi-plan',
        loadComponent: () =>
          import('./pages/mi-plan/mi-plan.component')
            .then(m => m.MiPlanComponent)
      },

      {
        path: 'suscripciones',
        loadComponent: () =>
          import('./pages/suscripciones/suscripciones.component')
            .then(m => m.SuscripcionesComponent)
      }

    ]

  },


  // =====================================================
  // RUTA INICIAL (PASO OBLIGADO: LOGIN)
  // =====================================================

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  }

];