import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeguridadService } from '../../Services/seguridad.service';

interface PermisoFila {
  IdPermiso: number;
  Codigo: string;
  Nombre: string;
  ModuloCodigo: string;
  NombreModulo: string;
  Estado: 'NINGUNO' | 'PERMITIR' | 'DENEGAR';
}

@Component({
  selector: 'app-roles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './roles.component.html',
  styleUrls: ['./roles.component.css']
})
export class RolesComponent implements OnInit {

  roles: any[] = [];

  rol: any = {
    Nombre: '',
    Descripcion: ''
  };

  modoEdicion = false;

  mostrarFormulario = false;

  mostrarModal = false;

  rolSeleccionado: any = null;

  cargando = false;

  mensaje = '';

  error = '';

  // Matriz de permisos
  modulos: any[] = [];

  filasPermisos: PermisoFila[] = [];

  // Permisos del usuario autenticado
  puedeCrear = false;
  puedeEditar = false;
  puedeAsignar = false;

  constructor(private seguridadService: SeguridadService) { }

  ngOnInit(): void {
    this.cargarPermisos();
    this.cargarRoles();
  }

  cargarPermisos(): void {
    let permisos: string[] = [];

    if (typeof localStorage !== 'undefined') {
      try {
        const raw = localStorage.getItem('permisos');
        if (raw) {
          permisos = JSON.parse(raw);
        }
      } catch (e) {
        permisos = [];
      }
    }

    this.puedeCrear = permisos.includes('SEGURIDAD.CREAR');
    this.puedeEditar = permisos.includes('SEGURIDAD.EDITAR');
    this.puedeAsignar = permisos.includes('SEGURIDAD.ASIGNAR_PERMISOS');
  }

  cargarRoles(): void {
    this.cargando = true;

    this.error = '';

    this.seguridadService.obtenerRoles().subscribe({
      next: (respuesta) => {
        this.roles = respuesta.datos || [];
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error cargando roles:', error);
        this.error = 'No fue posible cargar los roles.';
        this.cargando = false;
      }
    });
  }

  esGlobal(rol: any): boolean {
    return rol.IdEmpresa === null || rol.IdEmpresa === undefined;
  }

  // =====================================================
  // FORMULARIO CREAR / EDITAR
  // =====================================================

  nuevoRol(): void {
    this.rol = { Nombre: '', Descripcion: '', Activo: true };
    this.modoEdicion = false;
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';
  }

  editarRol(r: any): void {
    this.rol = { ...r, Activo: !!r.Activo };
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.rol = { Nombre: '', Descripcion: '' };
    this.mensaje = '';
    this.error = '';
  }

  guardar(): void {
    this.error = '';
    this.mensaje = '';

    if (!this.rol.Nombre?.trim()) {
      this.error = 'El nombre del rol es obligatorio.';
      return;
    }

    if (this.modoEdicion && this.rol.IdRol) {
      this.seguridadService
        .actualizarRol(this.rol.IdRol, {
          Nombre: this.rol.Nombre,
          Descripcion: this.rol.Descripcion,
          Activo: this.rol.Activo
        })
        .subscribe({
          next: () => {
            this.mensaje = 'Rol actualizado correctamente.';
            this.mostrarFormulario = false;
            this.cargarRoles();
          },
          error: (error: any) => {
            console.error(error);
            this.error = error.error?.mensaje || 'Error actualizando rol.';
          }
        });
      return;
    }

    this.seguridadService
      .crearRol({
        Nombre: this.rol.Nombre,
        Descripcion: this.rol.Descripcion
      })
      .subscribe({
        next: () => {
          this.mensaje = 'Rol creado correctamente.';
          this.mostrarFormulario = false;
          this.cargarRoles();
        },
        error: (error: any) => {
          console.error(error);
          this.error = error.error?.mensaje || 'Error creando rol.';
        }
      });
  }

  // =====================================================
  // MATRIZ DE PERMISOS DEL ROL
  // =====================================================

  abrirMatriz(r: any): void {
    this.rolSeleccionado = r;
    this.error = '';
    this.filasPermisos = [];

    this.seguridadService.obtenerPermisos().subscribe({
      next: (respuesta) => {
        const permisos = respuesta.datos || [];

        const modulosMap = new Map<string, string>();
        for (const prm of permisos) {
          if (!modulosMap.has(prm.ModuloCodigo)) {
            modulosMap.set(prm.ModuloCodigo, prm.NombreModulo);
          }
        }
        this.modulos = Array.from(modulosMap, ([Codigo, NombreModulo]) => ({ Codigo, NombreModulo }));

        this.seguridadService.obtenerRolPermisos(r.IdRol).subscribe({
          next: (resPermisos) => {
            const asignados = new Map<number, string>();
            for (const ap of (resPermisos.datos || [])) {
              asignados.set(ap.IdPermiso, ap.TipoAcceso);
            }

            this.filasPermisos = permisos.map((prm: any) => ({
              IdPermiso: prm.IdPermiso,
              Codigo: prm.Codigo,
              Nombre: prm.Nombre,
              ModuloCodigo: prm.ModuloCodigo,
              NombreModulo: prm.NombreModulo,
              Estado: asignados.get(prm.IdPermiso) === 'DENEGAR'
                ? 'DENEGAR'
                : (asignados.get(prm.IdPermiso) === 'PERMITIR' ? 'PERMITIR' : 'NINGUNO')
            }));

            this.mostrarModal = true;
          },
          error: (error: any) => {
            console.error(error);
            this.error = 'Error cargando permisos del rol.';
          }
        });
      },
      error: (error: any) => {
        console.error(error);
        this.error = 'Error cargando catálogo de permisos.';
      }
    });
  }

  cicloEstado(fila: PermisoFila): void {
    const orden: Array<PermisoFila['Estado']> = ['NINGUNO', 'PERMITIR', 'DENEGAR'];
    const idx = orden.indexOf(fila.Estado);
    fila.Estado = orden[(idx + 1) % orden.length];
  }

  contarPorModulo(codigo: string): string {
    const filas = this.filasPermisos.filter(f => f.ModuloCodigo === codigo);
    const permitidos = filas.filter(f => f.Estado === 'PERMITIR').length;
    const denegados = filas.filter(f => f.Estado === 'DENEGAR').length;
    return `${permitidos} ✓ · ${denegados} ✕`;
  }

  filasPermisosModulo(codigo: string): PermisoFila[] {
    return this.filasPermisos.filter(f => f.ModuloCodigo === codigo);
  }

  cerrarMatriz(): void {
    this.mostrarModal = false;
    this.rolSeleccionado = null;
  }

  guardarMatriz(): void {
    if (!this.rolSeleccionado?.IdRol) {
      return;
    }

    const payload = this.filasPermisos
      .filter(f => f.Estado !== 'NINGUNO')
      .map(f => ({ IdPermiso: f.IdPermiso, TipoAcceso: f.Estado }));

    this.seguridadService
      .asignarRolPermisos(this.rolSeleccionado.IdRol, payload)
      .subscribe({
        next: () => {
          this.mensaje = 'Permisos del rol actualizados.';
          this.cerrarMatriz();
        },
        error: (error: any) => {
          console.error(error);
          this.error = error.error?.mensaje || 'Error guardando permisos.';
        }
      });
  }
}