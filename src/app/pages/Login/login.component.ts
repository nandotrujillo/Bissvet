import { Component, OnInit, HostListener } from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { UsuarioService } from '../../Services/usuario.service';
import { EmpresaService } from '../../Services/empresas.service';
import { SeguridadService } from '../../Services/seguridad.service';
import { Empresa } from '../../Models/empresa';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule,FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent implements OnInit {

  Username: string = '';
  PasswordHash: string = '';

  IdEmpresa: number = 0;

  empresas: Empresa[] = [];

  empresasAbierto: boolean = false;

  busquedaEmpresa: string = '';

  mensaje: string = '';

  cargando: boolean = false;


  constructor(
    private usuarioService: UsuarioService,
    private empresaService: EmpresaService,
    private seguridadService: SeguridadService,
    private router: Router
  ) { }


  ngOnInit(): void {

    this.cargarEmpresas();

  }


  cargarEmpresas(): void {

    this.empresaService
      .obtenerEmpresas()
      .subscribe({

        next: (respuesta) => {

          this.empresas = respuesta.datos || [];

          // Preseleccionar la última empresa usada, si sigue activa
          const ultima = localStorage.getItem('ultimaEmpresa');

          const idUltima = ultima
            ? Number(JSON.parse(ultima))
            : null;

          const existeUltima =
            idUltima !== null &&
            this.empresas.some((e) => e.IdEmpresa === idUltima);

          this.IdEmpresa = existeUltima
            ? idUltima
            : (this.empresas[0]?.IdEmpresa || 0);

        },

        error: (error) => {

          console.error('Error cargando empresas:', error);

          this.mensaje =
            'No fue posible cargar las empresas';

        }

      });

  }

  // =====================================================
  // COMBO DE EMPRESA PROFESIONAL
  // =====================================================

  @HostListener('document:click')
  cerrarEmpresas(): void {
    this.empresasAbierto = false;
  }

  @HostListener('document:keydown.escape')
  cerrarEmpresasConEscape(): void {
    this.empresasAbierto = false;
  }

  get empresaSeleccionada(): Empresa | undefined {
    return this.empresas.find((e) => e.IdEmpresa === this.IdEmpresa);
  }

  get empresasFiltradas(): Empresa[] {
    const busqueda = this.busquedaEmpresa.trim().toLowerCase();
    if (!busqueda) {
      return this.empresas;
    }
    return this.empresas.filter(
      (e) =>
        (e.NombreComercial || '').toLowerCase().includes(busqueda) ||
        (e.RazonSocial || '').toLowerCase().includes(busqueda) ||
        (e.Nit || '').toLowerCase().includes(busqueda)
    );
  }

  inicialesEmpresa(empresa: Empresa | undefined): string {
    if (!empresa) {
      return 'EI';
    }
    const nombre = (empresa.NombreComercial || '').trim();
    if (!nombre) {
      return (empresa.RazonSocial || 'EI').trim().slice(0, 2).toUpperCase();
    }
    const palabras = nombre.split(/\s+/);
    if (palabras.length === 1) {
      return palabras[0].slice(0, 2).toUpperCase();
    }
    return (palabras[0][0] + palabras[palabras.length - 1][0]).toUpperCase();
  }

  toggleEmpresas(evento: Event): void {
    evento.stopPropagation();
    this.empresasAbierto = !this.empresasAbierto;
  }

  seleccionarEmpresa(empresa: Empresa): void {
    this.IdEmpresa = empresa.IdEmpresa;
    this.busquedaEmpresa = '';
    this.empresasAbierto = false;
  }


  ingresar(): void {

    this.mensaje = '';

    if (!this.Username || !this.PasswordHash) {

      this.mensaje =
        'Debe ingresar usuario y contraseña';

      return;

    }

    if (!this.IdEmpresa) {

      this.mensaje =
        'Debe seleccionar la empresa';

      return;

    }


    this.cargando = true;

    this.usuarioService
      .validarUsuario(
        this.Username,
        this.PasswordHash,
        this.IdEmpresa
      )
      .subscribe({

        next: (respuesta) => {
          this.cargando = false;

          // Contexto de seguridad: usuario, empresa, token e IdEmpresa
          localStorage.clear();
          localStorage.setItem('token', respuesta.token);
          localStorage.setItem(
            'UsuarioId',
            JSON.stringify(respuesta.usuario.UsuarioId)
          );
          localStorage.setItem(
            'usuario',
            JSON.stringify(respuesta.usuario)
          );
          localStorage.setItem(
            'IdEmpresa',
            JSON.stringify(respuesta.usuario.IdEmpresa)
          );
          localStorage.setItem(
            'empresa',
            JSON.stringify(respuesta.empresa)
          );
          localStorage.setItem(
            'IdSesion',
            JSON.stringify(respuesta.usuario.IdSesion)
          );
          if (respuesta.suscripcion) {
            localStorage.setItem(
              'suscripcion',
              JSON.stringify(respuesta.suscripcion)
            );
          } else {
            localStorage.removeItem('suscripcion');
          }

          this.seguridadService.limpiarCache();

          // Recordar la última empresa para la próxima sesión
          localStorage.setItem(
            'ultimaEmpresa',
            JSON.stringify(respuesta.empresa.IdEmpresa)
          );

          this.seguridadService.obtenerMenu().subscribe({
            next: (menu) => {
              localStorage.setItem('menu', JSON.stringify(menu.datos || []));
            },
            error: () => {}
          });

          this.seguridadService.obtenerMisPermisos().subscribe({
            next: (resPermisos) => {
              localStorage.setItem('permisos', JSON.stringify(resPermisos.datos || []));
            },
            error: () => {}
          });

          // Ir a la página principal
          this.router.navigate(['/dashboard']);

        },


        error: (error) => {

          this.cargando = false;

          console.error(
            'Error login:',
            error
          );


          if (error.status === 401) {

            this.mensaje =
              error.error?.mensaje ||
              'Usuario o contraseña incorrectos';

          } else if (error.status === 400) {

            this.mensaje =
              error.error?.mensaje ||
              'Datos de ingreso incompletos';

          } else {

            this.mensaje =
              'No fue posible conectar con el servidor';

          }

        }

      });

  }

}