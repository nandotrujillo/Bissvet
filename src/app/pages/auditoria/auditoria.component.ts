import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SeguridadService } from '../../Services/seguridad.service';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './auditoria.component.html',
  styleUrls: ['./auditoria.component.css']
})
export class AuditoriaComponent implements OnInit {

  registros: any[] = [];

  registrosFiltrados: any[] = [];

  textoBusqueda = '';

  filtroAccion = 'TODAS';

  acciones: string[] = [];

  cargando = false;

  error = '';

  constructor(private seguridadService: SeguridadService) { }

  ngOnInit(): void {
    this.cargarAuditoria();
  }

  cargarAuditoria(): void {
    this.cargando = true;

    this.error = '';

    this.seguridadService.obtenerAuditoria().subscribe({
      next: (respuesta) => {
        this.registros = respuesta.datos || [];

        const setAcciones = new Set<string>();
        for (const r of this.registros) {
          if (r.Accion) {
            setAcciones.add(r.Accion);
          }
        }
        this.acciones = Array.from(setAcciones).sort();

        this.aplicarFiltros();
        this.cargando = false;
      },
      error: (error: any) => {
        console.error('Error cargando auditoría:', error);
        this.error = 'No fue posible cargar la auditoría.';
        this.cargando = false;
      }
    });
  }

  aplicarFiltros(): void {
    const texto = this.textoBusqueda.trim().toLowerCase();

    this.registrosFiltrados = this.registros.filter(r => {
      const coincideTexto =
        !texto ||
        (r.Username || '').toLowerCase().includes(texto) ||
        (r.Accion || '').toLowerCase().includes(texto) ||
        (r.ModuloCodigo || '').toLowerCase().includes(texto) ||
        (r.Tabla || '').toLowerCase().includes(texto) ||
        (r.Descripcion || '').toLowerCase().includes(texto) ||
        (r.DireccionIP || '').toLowerCase().includes(texto);

      const coincideAccion =
        this.filtroAccion === 'TODAS' ||
        r.Accion === this.filtroAccion;

      return coincideTexto && coincideAccion;
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