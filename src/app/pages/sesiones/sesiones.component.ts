import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeguridadService } from '../../Services/seguridad.service';

@Component({
  selector: 'app-sesiones',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './sesiones.component.html',
  styleUrls: ['./sesiones.component.css']
})
export class SesionesComponent implements OnInit {

  sesiones: any[] = [];

  sesionesFiltradas: any[] = [];

  textoBusqueda = '';

  filtroEstado = 'TODAS';

  cargando = false;

  mensaje = '';

  error = '';

  constructor(private seguridadService: SeguridadService) { }

  ngOnInit(): void {
    this.cargarSesiones();
  }

  cargarSesiones(): void {
    this.cargando = true;

    this.error = '';

    this.seguridadService.obtenerSesiones().subscribe({
      next: (respuesta) => {
        this.sesiones = respuesta.datos || [];
        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error cargando sesiones:', error);
        this.error = 'No fue posible cargar las sesiones.';
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    const texto = this.textoBusqueda.trim().toLowerCase();

    this.sesionesFiltradas = this.sesiones.filter(s => {
      const coincideTexto =
        !texto ||
        (s.Username || '').toLowerCase().includes(texto) ||
        (s.DireccionIP || '').toLowerCase().includes(texto);

      const coincideEstado =
        this.filtroEstado === 'TODAS' ||
        s.EstadoSesion === this.filtroEstado;

      return coincideTexto && coincideEstado;
    });
  }

  formatearFecha(fecha: string | null | undefined): string {
    if (!fecha) {
      return '-';
    }
    const d = new Date(fecha);
    return d.toLocaleString('es-CO');
  }
}