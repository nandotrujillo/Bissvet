import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Servicio } from '../../Models/servicio';
import { ServiciosService } from '../../Services/servicios.service';
import { CategoriaServicio } from '../../Models/categoria-servicio';
import { CategoriasServicioService } from '../../Services/categorias-servicio.service';

@Component({
  selector: 'app-servicios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './servicios.component.html',
  styleUrls: ['./servicios.component.css']
})
export class ServiciosComponent implements OnInit {

  servicios: Servicio[] = [];

  servicio: Servicio = this.nuevoServicio();

  categorias: CategoriaServicio[] = [];

  editando = false;
  mostrarFormulario = false;

  mensaje = '';
  error = '';

  constructor(
    private serviciosService: ServiciosService,
    private categoriasService: CategoriasServicioService
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();
    this.cargarServicios();
  }

  nuevoServicio(): Servicio {
    return {
      Nombre: '',
      Descripcion: '',
      IdCategoriaServicio: null,
      Precio: 0,
      Activo: 1
    };
  }

  cargarCategorias(): void {

    this.categoriasService.listar().subscribe({

      next: (respuesta: any) => {

        this.categorias = this.extraerLista(respuesta);

      },

      error: (error: any) => {

        console.error('Error cargando categorías:', error);

        this.error =
          'No fue posible cargar las categorías de servicio.';
      }

    });
  }

  cargarServicios(): void {

    this.serviciosService.listar().subscribe({

      next: (respuesta: any) => {

        this.servicios = this.extraerLista(respuesta);

      },

      error: (error: any) => {

        console.error('Error cargando servicios:', error);

        this.error =
          'No fue posible cargar los servicios.';
      }

    });
  }

  extraerLista(respuesta: any): any[] {

    if (respuesta?.datos) {

      return respuesta.datos;

    } else if (Array.isArray(respuesta)) {

      return respuesta;

    }

    return [];
  }

  nueva(): void {

    this.servicio = this.nuevoServicio();

    this.editando = false;
    this.mostrarFormulario = true;

    this.mensaje = '';
    this.error = '';
  }

  editar(servicio: Servicio): void {

    const idCategoria =
      servicio.IdCategoriaServicio != null
        ? Number(servicio.IdCategoriaServicio)
        : null;

    this.servicio = {
      IdServicio: servicio.IdServicio,
      IdCategoriaServicio: idCategoria,
      Nombre: servicio.Nombre,
      Descripcion: servicio.Descripcion || '',
      Precio: Number(servicio.Precio) || 0,
      Activo: servicio.Activo === 0 ? 0 : 1
    };

    this.editando = true;
    this.mostrarFormulario = true;

    this.mensaje = '';
    this.error = '';
  }

  cancelar(): void {

    this.servicio = this.nuevoServicio();

    this.editando = false;
    this.mostrarFormulario = false;

    this.mensaje = '';
    this.error = '';
  }

  guardar(): void {

    this.mensaje = '';
    this.error = '';

    if (!this.servicio.Nombre || !this.servicio.Nombre.trim()) {

      this.error = 'El nombre del servicio es obligatorio.';
      return;
    }

    const precio = Number(this.servicio.Precio);

    if (isNaN(precio) || precio < 0) {

      this.error = 'El precio debe ser un número válido mayor o igual a 0.';
      return;
    }

    const body: any = {
      IdCategoriaServicio: this.servicio.IdCategoriaServicio,
      Nombre: this.servicio.Nombre.trim(),
      Descripcion: this.servicio.Descripcion,
      Precio: precio,
      Activo: this.servicio.Activo
    };

    if (this.editando && this.servicio.IdServicio) {

      this.serviciosService
        .actualizar(this.servicio.IdServicio, body)
        .subscribe({

          next: () => {

            this.mensaje = 'Servicio actualizado correctamente.';

            this.cargarServicios();

            this.mostrarFormulario = false;
            this.editando = false;
            this.servicio = this.nuevoServicio();
          },

          error: (error: any) => {

            console.error('Error actualizando servicio:', error);

            this.error =
              error?.error?.mensaje ||
              'No fue posible actualizar el servicio.';
          }

        });

    } else {

      this.serviciosService
        .crear(body)
        .subscribe({

          next: () => {

            this.mensaje = 'Servicio creado correctamente.';

            this.cargarServicios();

            this.mostrarFormulario = false;
            this.servicio = this.nuevoServicio();
          },

          error: (error: any) => {

            console.error('Error creando servicio:', error);

            this.error =
              error?.error?.mensaje ||
              'No fue posible crear el servicio.';
          }

        });
    }
  }

  eliminar(servicio: Servicio): void {

    if (!servicio.IdServicio) {
      return;
    }

    const confirmar = confirm(
      `¿Está seguro de eliminar el servicio "${servicio.Nombre}"?`
    );

    if (!confirmar) {
      return;
    }

    this.serviciosService
      .eliminar(servicio.IdServicio)
      .subscribe({

        next: () => {

          this.mensaje = 'Servicio eliminado correctamente.';

          this.cargarServicios();
        },

        error: (error: any) => {

          console.error('Error eliminando servicio:', error);

          this.error =
            error?.error?.mensaje ||
            'No fue posible eliminar el servicio.';
        }

      });
  }
}