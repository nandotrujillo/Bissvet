import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { TipoPago } from '../../Models/tipo-pago';

import { TipoPagoService } from '../../Services/tipo-pago.service';

@Component({
  selector: 'app-tipos-pago',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './tipos-pago.component.html',
  styleUrls: ['./tipos-pago.component.css']
})
export class TiposPagoComponent implements OnInit {

  tipos: TipoPago[] = [];

  tipoPago: TipoPago = this.nuevoTipoPago();

  editando = false;
  mostrarFormulario = false;

  mensaje = '';
  error = '';

  constructor(private tipoPagoService: TipoPagoService) {}

  ngOnInit(): void {
    this.cargarTipos();
  }

  nuevoTipoPago(): TipoPago {
    return {
      Nombre: '',
      Descripcion: '',
      Activo: 1
    };
  }

  cargarTipos(): void {
    this.tipoPagoService.listar().subscribe({
      next: (respuesta: any) => {
        this.tipos = respuesta?.datos ?? [];
      },
      error: (error: any) => {
        console.error('Error cargando tipos de pago:', error);
        this.error = 'No fue posible cargar los tipos de pago.';
      }
    });
  }

  nueva(): void {
    this.tipoPago = this.nuevoTipoPago();
    this.editando = false;
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';
  }

  editar(tipo: TipoPago): void {
    this.tipoPago = { ...tipo };
    this.editando = true;
    this.mostrarFormulario = true;
    this.mensaje = '';
    this.error = '';
  }

  cancelar(): void {
    this.tipoPago = this.nuevoTipoPago();
    this.editando = false;
    this.mostrarFormulario = false;
    this.mensaje = '';
    this.error = '';
  }

  guardar(): void {
    this.mensaje = '';
    this.error = '';

    if (!this.tipoPago.Nombre || !this.tipoPago.Nombre.trim()) {
      this.error = 'El nombre del tipo de pago es obligatorio.';
      return;
    }

    if (this.editando && this.tipoPago.Id) {

      this.tipoPagoService
        .actualizar(this.tipoPago.Id, this.tipoPago)
        .subscribe({
          next: () => {
            this.mensaje = 'Tipo de pago actualizado correctamente.';
            this.cargarTipos();
            this.mostrarFormulario = false;
            this.editando = false;
            this.tipoPago = this.nuevoTipoPago();
          },
          error: (error: any) => {
            console.error('Error actualizando tipo de pago:', error);
            this.error = error?.error?.mensaje || 'No fue posible actualizar el tipo de pago.';
          }
        });

    } else {

      this.tipoPagoService
        .crear(this.tipoPago)
        .subscribe({
          next: () => {
            this.mensaje = 'Tipo de pago creado correctamente.';
            this.cargarTipos();
            this.mostrarFormulario = false;
            this.tipoPago = this.nuevoTipoPago();
          },
          error: (error: any) => {
            console.error('Error creando tipo de pago:', error);
            this.error = error?.error?.mensaje || 'No fue posible crear el tipo de pago.';
          }
        });
    }
  }

  eliminar(tipo: TipoPago): void {

    if (!tipo.Id) {
      return;
    }

    const confirmar = confirm(
      `¿Está seguro de eliminar el tipo de pago "${tipo.Nombre}"?`
    );

    if (!confirmar) {
      return;
    }

    this.tipoPagoService
      .eliminar(tipo.Id)
      .subscribe({
        next: () => {
          this.mensaje = 'Tipo de pago eliminado correctamente.';
          this.cargarTipos();
        },
        error: (error: any) => {
          console.error('Error eliminando tipo de pago:', error);
          this.error = error?.error?.mensaje || 'No fue posible eliminar el tipo de pago.';
        }
      });
  }
}