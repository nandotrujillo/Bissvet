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
  selector: 'app-perfiles',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './perfiles.component.html',
  styleUrls: ['./perfiles.component.css']
})
export class PerfilesComponent implements OnInit {

  perfiles: any[] = [];

  perfil: any = {
    Nombre: '',
    Descripcion: ''
  };

  modoEdicion = false;

  mostrarFormulario = false;

  mostrarModal = false;

  perfilSeleccionado: any = null;

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
    this.cargarPerfiles();
  }

  cargarPermisos(): void {
    const permisos = this.seguridadService.obtenerPermisosLocal();

    this.puedeCrear = permisos.includes('SEGURIDAD.CREAR');
    this.puedeEditar = permisos.includes('SEGURIDAD.EDITAR');
    this.puedeAsignar = permisos.includes('SEGURIDAD.ASIGNAR_PERMISOS');
  }

  cargarPerfiles(): void {
    this.cargando = true;

    this.error = '';

    this.seguridadService.obtenerPerfiles().subscribe({
      next: (respuesta) => {
        this.perfiles = respuesta.datos || [];
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error cargando perfiles:', error);
        this.error = 'No fue posible cargar los perfiles.';
        this.cargando = false;
      }
    });
  }

  nombrePerfil(idPerfil: number): string {
    const p = this.perfiles.find(x => x.IdPerfil === idPerfil);
    return p?.Nombre || 'Sin perfil';
  }

  // =====================================================
  // FORMULARIO CREAR / EDITAR
  // =====================================================

  nuevaPerfil(): void {
    this.perfil = { Nombre: '', Descripcion: '', Activo: true };
    this.modoEdicion = false;
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';
  }

  editarPerfil(p: any): void {
    this.perfil = { ...p, Activo: !!p.Activo };
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';
  }

  cancelar(): void {
    this.mostrarFormulario = false;
    this.perfil = { Nombre: '', Descripcion: '' };
    this.mensaje = '';
    this.error = '';
  }

  guardar(): void {
    this.error = '';
    this.mensaje = '';

    if (!this.perfil.Nombre?.trim()) {
      this.error = 'El nombre del perfil es obligatorio.';
      return;
    }

    if (this.modoEdicion && this.perfil.IdPerfil) {
      this.seguridadService
        .actualizarPerfil(this.perfil.IdPerfil, {
          Nombre: this.perfil.Nombre,
          Descripcion: this.perfil.Descripcion,
          Activo: this.perfil.Activo
        })
        .subscribe({
          next: () => {
            this.mensaje = 'Perfil actualizado correctamente.';
            this.mostrarFormulario = false;
            this.cargarPerfiles();
          },
          error: (error: any) => {
            console.error(error);
            this.error = error.error?.mensaje || 'Error actualizando perfil.';
          }
        });
      return;
    }

    this.seguridadService
      .crearPerfil({
        Nombre: this.perfil.Nombre,
        Descripcion: this.perfil.Descripcion
      })
      .subscribe({
        next: () => {
          this.mensaje = 'Perfil creado correctamente.';
          this.mostrarFormulario = false;
          this.cargarPerfiles();
        },
        error: (error: any) => {
          console.error(error);
          this.error = error.error?.mensaje || 'Error creando perfil.';
        }
      });
  }

  // =====================================================
  // MATRIZ DE PERMISOS DEL PERFIL
  // =====================================================

  abrirMatriz(p: any): void {
    this.perfilSeleccionado = p;
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

        this.seguridadService.obtenerPerfilPermisos(p.IdPerfil).subscribe({
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
            this.error = 'Error cargando permisos del perfil.';
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

  filasPermisosPermitidosModulo(codigo: string): PermisoFila[] {
    return this.filasPermisos.filter(f => f.ModuloCodigo === codigo);
  }

  cerrarMatriz(): void {
    this.mostrarModal = false;
    this.perfilSeleccionado = null;
  }

  guardarMatriz(): void {
    if (!this.perfilSeleccionado?.IdPerfil) {
      return;
    }

    const payload = this.filasPermisos
      .filter(f => f.Estado !== 'NINGUNO')
      .map(f => ({ IdPermiso: f.IdPermiso, TipoAcceso: f.Estado }));

    this.seguridadService
      .asignarPerfilPermisos(this.perfilSeleccionado.IdPerfil, payload)
      .subscribe({
        next: () => {
          this.mensaje = 'Permisos del perfil actualizados.';
          this.cerrarMatriz();
        },
        error: (error: any) => {
          console.error(error);
          this.error = error.error?.mensaje || 'Error guardando permisos.';
        }
      });
  }
}