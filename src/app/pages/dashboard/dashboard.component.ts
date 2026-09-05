import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  RouterLink,
  RouterOutlet,
  Router
} from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { SeguridadService, ModuloSistema } from '../../Services/seguridad.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,

  imports: [
    CommonModule,
    RouterLink,
    RouterOutlet
  ],

  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {

  empresaNombre: string = '';
  modulos: ModuloSistema[] = [];
  usuarioActual: string = '';
  planActual: string = '';
  planEstado: string = '';
  planVence: string = '';

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

    this.cargarMenu();
  }

  cargarMenu(): void {

    this.seguridadService.obtenerMenu().subscribe({

      next: (respuesta) => {

        this.modulos = respuesta.datos || [];

        if (typeof localStorage !== 'undefined') {
          localStorage.setItem('menu', JSON.stringify(this.modulos));
        }
      },

      error: (error) => {

        console.error('Error cargando menú:', error);
      }
    });
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