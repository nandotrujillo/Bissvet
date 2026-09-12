import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoriaServicio } from '../../Models/categoria-servicio';
import { CategoriasServicioService } from '../../Services/categorias-servicio.service';

@Component({
  selector: 'app-categorias-servicio',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './categorias-servicio.component.html',
  styleUrls: ['./categorias-servicio.component.css']
})
export class CategoriasServicioComponent implements OnInit {

  categorias: CategoriaServicio[] = [];
  categoria: CategoriaServicio = this.nuevaCategoria();
  editando = false;
  mostrarFormulario = false;
  mensaje = '';
  error = '';

  constructor(
    private categoriasService: CategoriasServicioService
  ) {}

  ngOnInit(): void {
    this.cargarCategorias();
  }

  nuevaCategoria(): CategoriaServicio {
    return {
      Nombre: '',
      Descripcion: '',
      Activo: true
    };
  }

  cargarCategorias(): void {
    this.categoriasService.listar().subscribe({
      next: (respuesta: any) => {
        this.categorias = respuesta.datos || [];
      },
      error: (error: any) => {
        console.error('Error cargando categorías:', error);
        this.error = 'No fue posible cargar las categorías.';
      }
    });
  }

  nueva(): void {
    this.categoria = this.nuevaCategoria();
    this.editando = false;
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';
  }

  editar(categoria: CategoriaServicio): void {
    this.categoria = { ...categoria };
    this.editando = true;
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';
  }

  cancelar(): void {
    this.categoria = this.nuevaCategoria();
    this.editando = false;
    this.mostrarFormulario = false;
    this.mensaje = '';
    this.error = '';
  }

  guardar(): void {
    this.mensaje = '';
    this.error = '';

    if (!this.categoria.Nombre || !this.categoria.Nombre.trim()) {
      this.error = 'El nombre de la categoría es obligatorio.';
      return;
    }

    if (this.editando && this.categoria.IdCategoriaServicio) {

      this.categoriasService
        .actualizar(this.categoria.IdCategoriaServicio, this.categoria)
        .subscribe({
          next: () => {
            this.mensaje = 'Categoría actualizada correctamente.';
            this.cargarCategorias();
            this.mostrarFormulario = false;
            this.editando = false;
            this.categoria = this.nuevaCategoria();
          },
          error: (error: any) => {
            console.error('Error actualizando categoría:', error);
            this.error = error?.error?.mensaje || 'No fue posible actualizar la categoría.';
          }
        });

    } else {

      this.categoriasService.crear(this.categoria).subscribe({
        next: () => {
          this.mensaje = 'Categoría creada correctamente.';
          this.cargarCategorias();
          this.mostrarFormulario = false;
          this.categoria = this.nuevaCategoria();
        },
        error: (error: any) => {
          console.error('Error creando categoría:', error);
          this.error = error?.error?.mensaje || 'No fue posible crear la categoría.';
        }
      });

    }
  }

  eliminar(categoria: CategoriaServicio): void {
    if (!categoria.IdCategoriaServicio) return;

    const confirmar = confirm(
      `¿Está seguro de eliminar la categoría "${categoria.Nombre}"?`
    );
    if (!confirmar) return;

    this.categoriasService.eliminar(categoria.IdCategoriaServicio).subscribe({
      next: () => {
        this.mensaje = 'Categoría eliminada correctamente.';
        this.cargarCategorias();
      },
      error: (error: any) => {
        console.error('Error eliminando categoría:', error);
        this.error = error?.error?.mensaje || 'No fue posible eliminar la categoría.';
      }
    });
  }
}
