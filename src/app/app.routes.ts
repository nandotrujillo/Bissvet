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
          import('./Shared/enconstruccion.component')
            .then(m => m.EnConstruccionComponent),
        data: { titulo: 'Inicio' }
      },

      // -------------------------------------------------
      // SEGURIDAD Y ADMINISTRACIÓN (FASE 6)
      // -------------------------------------------------

      {
        path: 'seguridad',
        loadComponent: () =>
          import('./Shared/enconstruccion.component')
            .then(m => m.EnConstruccionComponent),
        data: { titulo: 'Seguridad' }
      },

      {
        path: 'usuarios',
        loadComponent: () =>
          import('./Shared/enconstruccion.component')
            .then(m => m.EnConstruccionComponent),
        data: { titulo: 'Usuarios' }
      },

      {
        path: 'caja',
        loadComponent: () =>
          import('./Shared/enconstruccion.component')
            .then(m => m.EnConstruccionComponent),
        data: { titulo: 'Caja' }
      },

      {
        path: 'reportes',
        loadComponent: () =>
          import('./Shared/enconstruccion.component')
            .then(m => m.EnConstruccionComponent),
        data: { titulo: 'Reportes' }
      },

      {
        path: 'auditoria',
        loadComponent: () =>
          import('./Shared/enconstruccion.component')
            .then(m => m.EnConstruccionComponent),
        data: { titulo: 'Auditoría' }
      },

      {
        path: 'servicios',
        loadComponent: () =>
          import('./Shared/enconstruccion.component')
            .then(m => m.EnConstruccionComponent),
        data: { titulo: 'Servicios' }
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