import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Empresa } from '../../../Models/empresa';
import { EmpresaService } from '../../../Services/empresas.service';
import { Ciudad } from '../../../Models/ciudad';
import { CiudadService } from '../../../Services/ciudad.service';

@Component({
  selector: 'app-empresas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './empresas.component.html',
  styleUrls: ['./empresas.component.css']
})
export class EmpresasComponent implements OnInit {

  empresa: Empresa = this.nuevaEmpresa();

  ciudades: Ciudad[] = [];

  editando = false;

  mensaje = '';
  error = '';

  constructor(
    private empresaService: EmpresaService,
    private ciudadService: CiudadService
  ) {}

  ngOnInit(): void {
    this.cargarCiudades();
    this.cargarEmpresa();
  }

  get idEmpresaSesion(): number {

    if (typeof localStorage !== 'undefined') {

      const valor = localStorage.getItem('IdEmpresa');

      if (valor) {

        return Number(JSON.parse(valor));

      }

    }

    return 0;
  }

  nuevaEmpresa(): Empresa {

    return {
      IdEmpresa: 0,
      CodigoEmpresa: '',
      Nit: '',
      RazonSocial: '',
      NombreComercial: '',
      TipoDocumento: '',
      Direccion: '',
      Telefono: '',
      Correo: '',
      Contacto: '',
      TelefonoContacto: '',
      IdCiudad: 0,
      Activo: 1,
      UsaControlCaja: 0
    };
  }

  cargarCiudades(): void {

    this.ciudadService.listar().subscribe({

      next: (respuesta: any) => {

        if (Array.isArray(respuesta)) {

          this.ciudades = respuesta;

        } else if (respuesta?.data) {

          this.ciudades = respuesta.data;

        } else if (respuesta?.datos) {

          this.ciudades = respuesta.datos;

        } else {

          this.ciudades = [];
        }

      },

      error: (error: any) => {

        console.error('Error cargando ciudades:', error);
      }

    });
  }

  get nombreCiudad(): string {

    const ciudad = this.ciudades.find(c => c.Id === this.empresa.IdCiudad);

    return ciudad ? ciudad.Ciudad : '';
  }

  get controlCaja(): boolean {
    return this.empresa.UsaControlCaja === 1;
  }

  set controlCaja(valor: boolean) {
    this.empresa.UsaControlCaja = valor ? 1 : 0;
  }

  cargarEmpresa(): void {

    const id = this.idEmpresaSesion;

    const procesar = (obs: { subscribe: (arg0: {
      next: (respuesta: any) => void;
      error: (error: any) => void
    }) => void }) => {

      obs.subscribe({

        next: (respuesta: any) => {

          const datos = respuesta?.datos;

          if (datos) {

            this.empresa = { ...datos };

          } else {

            this.error =
              'No fue posible cargar la empresa.';
          }
        },

        error: (error: any) => {

          console.error('Error cargando empresa:', error);

          this.error =
            'No fue posible cargar la empresa.';
        }

      });
    };

    if (id) {

      procesar(
        this.empresaService.obtenerEmpresaPorId(id)
      );

    } else {

      procesar(
        this.empresaService.obtenerEmpresas()
      );
    }
  }

  editar(): void {

    this.editando = true;

    this.mensaje = '';
    this.error = '';
  }

  cancelar(): void {

    this.editando = false;

    this.mensaje = '';
    this.error = '';

    this.cargarEmpresa();
  }

  guardar(): void {

    this.mensaje = '';
    this.error = '';

    if (!this.empresa.CodigoEmpresa || !this.empresa.CodigoEmpresa.trim()) {

      this.error = 'El código de la empresa es obligatorio.';
      return;
    }

    if (!this.empresa.Nit || !this.empresa.Nit.trim()) {

      this.error = 'El Nit es obligatorio.';
      return;
    }

    if (!this.empresa.RazonSocial || !this.empresa.RazonSocial.trim()) {

      this.error = 'La razón social es obligatoria.';
      return;
    }

    if (!this.empresa.NombreComercial || !this.empresa.NombreComercial.trim()) {

      this.error = 'El nombre comercial es obligatorio.';
      return;
    }

    this.empresaService
      .actualizar(this.empresa.IdEmpresa, this.empresa)
      .subscribe({

        next: () => {

          this.mensaje =
            'Empresa actualizada correctamente.';

          this.editando = false;

          this.cargarEmpresa();
        },

        error: (error: any) => {

          console.error('Error actualizando empresa:', error);

          this.error =
            error?.error?.mensaje ||
            'No fue posible actualizar la empresa.';
        }

      });
  }
}