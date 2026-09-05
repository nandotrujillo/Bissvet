import { Component, OnInit } from '@angular/core';
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

          if (this.empresas.length > 0) {

            this.IdEmpresa = this.empresas[0].IdEmpresa;

          }

          console.log('Empresas cargadas:', this.empresas);

        },

        error: (error) => {

          console.error('Error cargando empresas:', error);

          this.mensaje =
            'No fue posible cargar las empresas';

        }

      });

  }


  ingresar(): void {

    console.log("Consulta ok1");

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

    console.log("Vamos a validar el usuario desde login");
    this.usuarioService
      .validarUsuario(
        this.Username,
        this.PasswordHash,
        this.IdEmpresa
      )
      .subscribe({

        next: (respuesta) => {
          console.log(respuesta);  
          this.cargando = false;

          console.log(
            'Usuario autenticado:',
            respuesta
          );

          console.log('RESPUESTA COMPLETA LOGIN:', respuesta);
          console.log('UsuarioId recibido:', respuesta.usuario.UsuarioId);
          console.log('IdEmpresa recibido:', respuesta.usuario.IdEmpresa);

          // Contexto de seguridad: usuario, empresa, token e IdEmpresa
          localStorage.clear();
          localStorage.setItem('token', respuesta.token);
          localStorage.setItem(
            'UsuarioId',
            JSON.stringify(respuesta.usuario.UsuarioId)
          );
          localStorage.setItem(
            'usuario',
            JSON.stringify(respuesta.usuario.UsuarioId)
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

          this.seguridadService.limpiarCache();

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