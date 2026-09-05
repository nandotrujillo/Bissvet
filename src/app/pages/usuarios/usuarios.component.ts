import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UsuarioService } from '../../Services/usuario.service';
import { SeguridadService } from '../../Services/seguridad.service';
import { Usuario } from '../../Models/usuario';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './usuarios.component.html',
  styleUrls: ['./usuarios.component.css']
})
export class UsuariosComponent implements OnInit {

  usuarios: Usuario[] = [];

  usuariosFiltrados: Usuario[] = [];

  usuario: Usuario = this.nuevoUsuario();

  perfiles: any[] = [];

  modoEdicion = false;

  mostrarFormulario = false;

  mostrarModalClave = false;

  textoBusqueda = '';

  nuevaClave = '';

  confirmarClave = '';

  usuarioSeleccionado: Usuario | null = null;

  cargando = false;

  mensaje = '';

  error = '';

  // Permisos disponibles del usuario autenticado
  puedeCrear = false;
  puedeEditar = false;
  puedeConsultar = false;
  puedeBloquear = false;
  puedeCambiarClave = false;

  constructor(
    private usuarioService: UsuarioService,
    private seguridadService: SeguridadService
  ) { }

  ngOnInit(): void {
    this.cargarPermisos();
    this.cargarPerfiles();
    this.cargarUsuarios();
  }

  // =====================================================
  // PERMISOS DEL USUARIO AUTENTICADO (localStorage)
  // =====================================================

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

    this.puedeCrear = permisos.includes('USUARIOS.CREAR');
    this.puedeEditar = permisos.includes('USUARIOS.EDITAR');
    this.puedeConsultar = permisos.includes('USUARIOS.CONSULTAR');
    this.puedeBloquear = permisos.includes('USUARIOS.BLOQUEAR');
    this.puedeCambiarClave = permisos.includes('USUARIOS.CAMBIAR_CLAVE');
  }

  // =====================================================
  // NUEVO USUARIO
  // =====================================================

  nuevoUsuario(): Usuario {
    return {
      IdPerfil: 0,
      Username: '',
      TipoDocumento: '',
      NumeroDocumento: '',
      PrimerNombre: '',
      SegundoNombre: '',
      PrimerApellido: '',
      SegundoApellido: '',
      Correo: '',
      Telefono: '',
      Activo: true,
      Bloqueado: false
    };
  }

  // =====================================================
  // CARGAR PERFILES
  // =====================================================

  cargarPerfiles(): void {
    this.seguridadService.obtenerPerfiles().subscribe({
      next: (respuesta) => {
        this.perfiles = respuesta.datos || [];
      },
      error: (error: any) => {
        console.error('Error cargando perfiles:', error);
      }
    });
  }

  // =====================================================
  // CARGAR USUARIOS
  // =====================================================

  cargarUsuarios(): void {
    this.cargando = true;

    this.error = '';

    this.usuarioService.obtenerUsuarios().subscribe({
      next: (respuesta) => {
        this.usuarios = respuesta.datos || [];
        this.usuariosFiltrados = [...this.usuarios];
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error cargando usuarios:', error);
        this.error = 'No fue posible cargar los usuarios.';
        this.cargando = false;
      }
    });
  }

  // =====================================================
  // BUSCAR
  // =====================================================

  buscar(): void {
    const texto = this.textoBusqueda.trim().toLowerCase();

    if (!texto) {
      this.usuariosFiltrados = [...this.usuarios];
      return;
    }

    this.usuariosFiltrados = this.usuarios.filter(u => {
      const nombreCompleto = [
        u.PrimerNombre,
        u.SegundoNombre,
        u.PrimerApellido,
        u.SegundoApellido
      ]
        .filter(x => x)
        .join(' ')
        .toLowerCase();

      return (
        (u.Username || '').toLowerCase().includes(texto) ||
        nombreCompleto.includes(texto) ||
        (u.NumeroDocumento || '').toLowerCase().includes(texto) ||
        (u.Correo || '').toLowerCase().includes(texto) ||
        (u.Perfil || '').toLowerCase().includes(texto)
      );
    });
  }

  nombreCompleto(u: Usuario): string {
    return [
      u.PrimerNombre,
      u.SegundoNombre,
      u.PrimerApellido,
      u.SegundoApellido
    ]
      .filter((x): x is string => !!x)
      .join(' ') || u.Username || '';
  }

  // =====================================================
  // MOSTRAR NUEVO
  // =====================================================

  nueva(): void {
    this.usuario = this.nuevoUsuario();
    this.modoEdicion = false;
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';
  }

  // =====================================================
  // EDITAR
  // =====================================================

  editar(u: Usuario): void {
    this.usuario = {
      ...u,
      Activo: !!u.Activo,
      Bloqueado: !!u.Bloqueado
    };
    this.modoEdicion = true;
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';
  }

  // =====================================================
  // CANCELAR
  // =====================================================

  cancelar(): void {
    this.mostrarFormulario = false;
    this.usuario = this.nuevoUsuario();
    this.mensaje = '';
    this.error = '';
  }

  // =====================================================
  // GUARDAR
  // =====================================================

  guardar(): void {
    this.error = '';
    this.mensaje = '';

    if (!this.usuario.Username?.trim()) {
      this.error = 'El nombre de usuario es obligatorio.';
      return;
    }

    if (!this.usuario.IdPerfil) {
      this.error = 'Debe seleccionar el perfil.';
      return;
    }

    // ===============================================
    // EDITAR
    // ===============================================

    if (this.modoEdicion && this.usuario.UsuarioId) {
      const payload: Usuario = {
        IdPerfil: this.usuario.IdPerfil,
        TipoDocumento: this.usuario.TipoDocumento,
        NumeroDocumento: this.usuario.NumeroDocumento,
        PrimerNombre: this.usuario.PrimerNombre,
        SegundoNombre: this.usuario.SegundoNombre,
        PrimerApellido: this.usuario.PrimerApellido,
        SegundoApellido: this.usuario.SegundoApellido,
        Correo: this.usuario.Correo,
        Telefono: this.usuario.Telefono,
        Activo: this.usuario.Activo,
        Bloqueado: this.usuario.Bloqueado
      };

      this.usuarioService
        .actualizarUsuario(this.usuario.UsuarioId, payload)
        .subscribe({
          next: () => {
            this.mensaje = 'Usuario actualizado correctamente.';
            this.mostrarFormulario = false;
            this.cargarUsuarios();
          },
          error: (error: any) => {
            console.error(error);
            this.error = error.error?.mensaje || 'Error actualizando usuario.';
          }
        });

      return;
    }

    // ===============================================
    // CREAR
    // ===============================================

    if (!this.usuario.Password?.trim()) {
      this.error = 'La contraseña es obligatoria.';
      return;
    }

    this.usuarioService
      .crearUsuario(this.usuario)
      .subscribe({
        next: () => {
          this.mensaje = 'Usuario creado correctamente.';
          this.mostrarFormulario = false;
          this.cargarUsuarios();
        },
        error: (error: any) => {
          console.error(error);
          this.error = error.error?.mensaje || 'Error creando usuario.';
        }
      });
  }

  // =====================================================
  // CAMBIAR CONTRASEÑA
  // =====================================================

  abrirModalClave(u: Usuario): void {
    this.usuarioSeleccionado = u;
    this.nuevaClave = '';
    this.confirmarClave = '';
    this.mostrarModalClave = true;
    this.error = '';
  }

  cerrarModalClave(): void {
    this.mostrarModalClave = false;
    this.usuarioSeleccionado = null;
  }

  cambiarClave(): void {
    this.error = '';

    if (!this.usuarioSeleccionado?.UsuarioId) {
      return;
    }

    if (!this.nuevaClave || this.nuevaClave.length < 6) {
      this.error = 'La nueva contraseña debe tener al menos 6 caracteres.';
      return;
    }

    if (this.nuevaClave !== this.confirmarClave) {
      this.error = 'Las contraseñas no coinciden.';
      return;
    }

    this.usuarioService
      .cambiarClave(this.usuarioSeleccionado.UsuarioId, this.nuevaClave)
      .subscribe({
        next: () => {
          this.mensaje = 'Contraseña actualizada correctamente.';
          this.cerrarModalClave();
        },
        error: (error: any) => {
          console.error(error);
          this.error = error.error?.mensaje || 'Error cambiando la contraseña.';
        }
      });
  }

  // =====================================================
  // BLOQUEAR / DESBLOQUEAR
  // =====================================================

  bloquear(u: Usuario): void {
    if (!u.UsuarioId) {
      return;
    }

    const bloqueando = !u.Bloqueado;

    const confirmar = confirm(
      bloqueando
        ? `¿Bloquear al usuario "${u.Username}"?`
        : `¿Desbloquear al usuario "${u.Username}"?`
    );

    if (!confirmar) {
      return;
    }

    const payload: Usuario = { Bloqueado: bloqueando };

    this.usuarioService
      .actualizarUsuario(u.UsuarioId, payload)
      .subscribe({
        next: () => {
          this.mensaje = bloqueando
            ? 'Usuario bloqueado.'
            : 'Usuario desbloqueado.';
          this.cargarUsuarios();
        },
        error: (error: any) => {
          console.error(error);
          this.error = error.error?.mensaje || 'Error actualizando el estado del usuario.';
        }
      });
  }

  // =====================================================
  // UTILITARIO PERFIL
  // =====================================================

  obtenerPerfil(perfilId: number | undefined | null): string {
    const perfil = this.perfiles.find(p => p.IdPerfil === perfilId);
    return perfil?.Nombre || 'Sin perfil';
  }
}