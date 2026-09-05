import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Bodega } from '../../../Models/bodega';
import { BodegaService } from '../../../Services/Bodega.service ';

@Component({
  selector: 'app-bodegas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './bodegas.component.html',
  styleUrls: ['./bodegas.component.css']
})
export class BodegasComponent implements OnInit {

  bodegas: Bodega[] = [];

  bodega: Bodega = this.nuevaBodega();

  editando = false;
  mostrarFormulario = false;

  mensaje = '';
  error = '';

  constructor(private bodegaService: BodegaService) {}

  ngOnInit(): void {
    this.cargarBodegas();
  }

nuevaBodega(): Bodega {
  return {
    CodigoBodega: '',
    NombreBodega: '',
    IdEmpresa: null,
    Estatus: 1,
    exAuxiliar: 0,
    Descripcion: '',
    Direccion: '',
    Responsable: '',
    Activo: 1
  };
}

  cargarBodegas(): void {

    this.bodegaService.listar().subscribe({

      next: (respuesta: any) => {

        console.log('Bodegas:', respuesta);

        if (respuesta?.datos) {
          this.bodegas = respuesta.datos;
        } else if (Array.isArray(respuesta)) {
          this.bodegas = respuesta;
        } else {
          this.bodegas = [];
        }

      },

      error: (error: any) => {
        console.error('Error cargando bodegas:', error);
        this.error = 'No fue posible cargar las bodegas.';
      }

    });
  }

  nueva(): void {

    this.bodega = this.nuevaBodega();

    this.editando = false;
    this.mostrarFormulario = true;

    this.mensaje = '';
    this.error = '';
  }

  editar(bodega: Bodega): void {

    this.bodega = {
      ...bodega
    };

    this.editando = true;
    this.mostrarFormulario = true;

    this.mensaje = '';
    this.error = '';
  }

  cancelar(): void {

    this.bodega = this.nuevaBodega();

    this.editando = false;
    this.mostrarFormulario = false;

    this.mensaje = '';
    this.error = '';
  }

  guardar(): void {

    this.mensaje = '';
    this.error = '';

if (!this.bodega.CodigoBodega || !this.bodega.CodigoBodega.trim()) {
  this.error = 'El código de la bodega es obligatorio.';
  return;
}

if (!this.bodega.NombreBodega || !this.bodega.NombreBodega.trim()) {
  this.error = 'El nombre de la bodega es obligatorio.';
  return;
}
    if (this.editando && this.bodega.Id) {

      this.bodegaService
        .actualizar(this.bodega.Id, this.bodega)
        .subscribe({

          next: () => {

            this.mensaje = 'Bodega actualizada correctamente.';

            this.cargarBodegas();

            this.mostrarFormulario = false;
            this.editando = false;
            this.bodega = this.nuevaBodega();
          },

          error: (error: any) => {

            console.error('Error actualizando bodega:', error);

            this.error =
              error?.error?.mensaje ||
              'No fue posible actualizar la bodega.';
          }

        });

    } else {

      this.bodegaService
        .crear(this.bodega)
        .subscribe({

          next: () => {

            this.mensaje = 'Bodega creada correctamente.';

            this.cargarBodegas();

            this.mostrarFormulario = false;
            this.bodega = this.nuevaBodega();
          },

          error: (error: any) => {

            console.error('Error creando bodega:', error);

            this.error =
              error?.error?.mensaje ||
              'No fue posible crear la bodega.';
          }

        });
    }
  }

  eliminar(bodega: Bodega): void {

    if (!bodega.Id) {
      return;
    }

    const confirmar = confirm(
      `¿Está seguro de eliminar la bodega "${bodega.NombreBodega}"?`
    );

    if (!confirmar) {
      return;
    }

    this.bodegaService
      .eliminar(bodega.Id)
      .subscribe({

        next: () => {

          this.mensaje = 'Bodega eliminada correctamente.';

          this.cargarBodegas();
        },

        error: (error: any) => {

          console.error('Error eliminando bodega:', error);

          this.error =
            error?.error?.mensaje ||
            'No fue posible eliminar la bodega.';
        }

      });
  }
}