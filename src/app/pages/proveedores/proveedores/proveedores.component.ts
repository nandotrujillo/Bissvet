import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Proveedor } from '../../../Models/proveedor';
import { Ciudad } from '../../../Models/ciudad';

import { ProveedoresService } from '../../../Services/proveedores.service';
import { CiudadService } from '../../../Services/ciudad.service';

@Component({
  selector: 'app-proveedores',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './proveedores.component.html',
  styleUrls: ['./proveedores.component.css']
})
export class ProveedoresComponent implements OnInit {

  proveedores: Proveedor[] = [];
  ciudades: Ciudad[] = [];

  proveedor: Proveedor = this.nuevoProveedor();

  editando = false;
  mostrarFormulario = false;

  buscar = '';

  mensaje = '';
  error = '';

  constructor(
    private proveedoresService: ProveedoresService,
    private ciudadService: CiudadService
  ) {}

  ngOnInit(): void {
    this.cargarProveedores();
    this.cargarCiudades();
  }

  nuevoProveedor(): Proveedor {
    return {
      TipoDocumento: 'NIT',
      NumeroDocumento: '',
      Nit: '',
      Nombre: '',
      Telefono: '',
      Email: '',
      Direccion: '',
      IdCiudad: 0,
      Contacto: '',
      Activo: 1
    };
  }

  cargarProveedores(): void {

    const params: any = {};
    if (this.buscar.trim()) { params.buscar = this.buscar.trim(); }

    this.proveedoresService.listar(params).subscribe({
      next: (respuesta: any) => {
        this.proveedores = respuesta?.datos ?? [];
      },
      error: (error: any) => {
        console.error('Error cargando proveedores:', error);
        this.error = 'No fue posible cargar los proveedores.';
      }
    });
  }

  cargarCiudades(): void {

    this.ciudadService.listar().subscribe({
      next: (respuesta: any) => {
        this.ciudades = respuesta?.datos ?? [];
      },
      error: (error: any) => {
        console.error('Error cargando ciudades:', error);
        this.error = 'No fue posible cargar las ciudades.';
      }
    });
  }

  nueva(): void {

    this.proveedor = this.nuevoProveedor();

    this.editando = false;
    this.mostrarFormulario = true;

    this.mensaje = '';
    this.error = '';
  }

  editar(proveedor: Proveedor): void {

    this.proveedor = { ...proveedor };

    this.editando = true;
    this.mostrarFormulario = true;

    this.mensaje = '';
    this.error = '';
  }

  cancelar(): void {

    this.proveedor = this.nuevoProveedor();

    this.editando = false;
    this.mostrarFormulario = false;

    this.mensaje = '';
    this.error = '';
  }

  guardar(): void {

    this.mensaje = '';
    this.error = '';

    if (!this.proveedor.Nombre || !this.proveedor.Nombre.trim()) {
      this.error = 'El nombre del proveedor es obligatorio.';
      return;
    }

    if (this.editando && this.proveedor.IdProveedor) {

      this.proveedoresService
        .actualizar(this.proveedor.IdProveedor, this.proveedor)
        .subscribe({
          next: () => {
            this.mensaje = 'Proveedor actualizado correctamente.';
            this.cargarProveedores();
            this.mostrarFormulario = false;
            this.editando = false;
            this.proveedor = this.nuevoProveedor();
          },
          error: (error: any) => {
            console.error('Error actualizando proveedor:', error);
            this.error = error?.error?.mensaje || 'No fue posible actualizar el proveedor.';
          }
        });

    } else {

      this.proveedoresService
        .crear(this.proveedor)
        .subscribe({
          next: () => {
            this.mensaje = 'Proveedor creado correctamente.';
            this.cargarProveedores();
            this.mostrarFormulario = false;
            this.proveedor = this.nuevoProveedor();
          },
          error: (error: any) => {
            console.error('Error creando proveedor:', error);
            this.error = error?.error?.mensaje || 'No fue posible crear el proveedor.';
          }
        });
    }
  }

  eliminar(proveedor: Proveedor): void {

    if (!proveedor.IdProveedor) {
      return;
    }

    const confirmar = confirm(
      `¿Está seguro de eliminar el proveedor "${proveedor.Nombre}"?`
    );

    if (!confirmar) {
      return;
    }

    this.proveedoresService
      .eliminar(proveedor.IdProveedor)
      .subscribe({
        next: () => {
          this.mensaje = 'Proveedor eliminado correctamente.';
          this.cargarProveedores();
        },
        error: (error: any) => {
          console.error('Error eliminando proveedor:', error);
          this.error = error?.error?.mensaje || 'No fue posible eliminar el proveedor.';
        }
      });
  }
}