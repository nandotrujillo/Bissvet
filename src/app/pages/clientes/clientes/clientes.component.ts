import {
  Component,
  OnInit
} from '@angular/core';

import {
  CommonModule
} from '@angular/common';

import {
  FormsModule
} from '@angular/forms';

import {
  ClientesService
} from '../../../Services/clientes.service';

import {
  CiudadService
} from '../../../Services/ciudad.service';

import {
  Cliente
} from '../../../Models/cliente';

import {
  Ciudad
} from '../../../Models/ciudad';


@Component({
  selector: 'app-clientes',

  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './clientes.component.html',

  styleUrls: [
    './clientes.component.css'
  ]
})
export class ClientesComponent
  implements OnInit {


  clientes: Cliente[] = [];

  ciudades: Ciudad[] = [];


  cliente: Cliente = this.nuevoCliente();


  editando = false;

  mostrarFormulario = false;


  textoBusqueda = '';


  mensaje = '';

  error = '';


  constructor(
    private clientesService: ClientesService,

    private ciudadService: CiudadService
  ) {}


  ngOnInit(): void {

    this.cargarClientes();

    this.cargarCiudades();

  }


  // =====================================
  // CLIENTES
  // =====================================

  cargarClientes(): void {

    this.clientesService.listar()
      .subscribe({

        next: (respuesta:any) => {

          this.clientes =
            respuesta.datos || [];

        },

        error: (error: any) => {

          console.error(
            'Error cargando clientes:',
            error
          );

        }

      });

  }


  // =====================================
  // CIUDADES
  // =====================================

  cargarCiudades(): void {

    this.ciudadService.listar()
      .subscribe({

        next: (respuesta:any) => {

          this.ciudades =
            respuesta.datos || [];

        },

        error: (error: any) => {

          console.error(
            'Error cargando ciudades:',
            error
          );

        }

      });

  }


  // =====================================
  // NUEVO CLIENTE
  // =====================================

  nuevo(): void {

    this.cliente =
      this.nuevoCliente();

    this.editando = false;

    this.mostrarFormulario = true;

  }


  nuevoCliente(): Cliente {

  return {

    TipoDocumento: 'CC',

    NumeroDocumento: '',

    PrimerNombre: '',

    SegundoNombre: '',

    PrimerApellido: '',

    SegundoApellido: '',

    Telefono: '',

    Telefono2: '',

    Correo: '',

    Direccion: '',

    IdCiudad: 0,

    FechaNacimiento: null,

    Observaciones: '',

    Activo: true,

    FechaCreacion: null,

    UsuarioIdCreacion: null,

    FechaModificacion: null,

    UsuarioIdModificacion: null

  };
}

  // =====================================
  // EDITAR
  // =====================================

  editar(cliente: Cliente): void {

    this.cliente = {

      ...cliente

    };

    this.editando = true;

    this.mostrarFormulario = true;

  }


  // =====================================
  // GUARDAR
  // =====================================

  guardar(): void {

    this.mensaje = '';

    this.error = '';

    if (!this.validar()) {

      return;

    }


    if (this.editando &&
        this.cliente.ClienteId) {

      this.clientesService
        .actualizar(
          this.cliente.ClienteId,
          this.cliente
        )
        .subscribe({

          next: () => {

            this.mensaje =
              'Cliente actualizado correctamente';

            this.cargarClientes();

            this.cancelar();

          },

          error: (error: any) => {

            console.error(error);

            this.error =
              error?.error?.mensaje ||
              'No fue posible actualizar el cliente';

          }

        });

    }

    else {

      this.clientesService
        .crear(this.cliente)
        .subscribe({

          next: () => {

            this.mensaje =
              'Cliente creado correctamente';

            this.cargarClientes();

            this.cancelar();

          },

          error: (error: any) => {

            console.error(error);

            this.error =
              error?.error?.mensaje ||
              'No fue posible crear el cliente';

          }

        });

    }

  }


  // =====================================
  // ELIMINAR
  // =====================================

  eliminar(cliente: Cliente): void {

    this.mensaje = '';

    this.error = '';

    if (!cliente.ClienteId) {

      return;

    }


    if (
      !confirm(
        `¿Desea eliminar al cliente ${this.nombreCompleto(cliente)}?`
      )
    ) {

      return;

    }


    this.clientesService
      .eliminar(cliente.ClienteId)
      .subscribe({

        next: () => {

          this.mensaje =
            'Cliente eliminado correctamente';

          this.cargarClientes();

        },

        error: (error: any) => {

          console.error(error);

          this.error =
            error?.error?.mensaje ||
            'No fue posible eliminar el cliente';

        }

      });

  }


  // =====================================
  // CANCELAR
  // =====================================

  cancelar(): void {

    this.mostrarFormulario = false;

    this.editando = false;

    this.cliente =
      this.nuevoCliente();

  }


  // =====================================
  // VALIDAR
  // =====================================

  validar(): boolean {

    if (!this.cliente.NumeroDocumento) {

      this.error =
        'Digite el número de documento';

      return false;

    }


    if (!this.cliente.PrimerNombre) {

      this.error =
        'Digite el primer nombre';

      return false;

    }


    if (!this.cliente.PrimerApellido) {

      this.error =
        'Digite el primer apellido';

      return false;

    }


    return true;

  }


  // =====================================
  // NOMBRE COMPLETO
  // =====================================

  nombreCompleto(
    cliente: Cliente
  ): string {

    return [

      cliente.PrimerNombre,

      cliente.SegundoNombre,

      cliente.PrimerApellido,

      cliente.SegundoApellido

    ]
      .filter(x => x)

      .join(' ');

  }


  // =====================================
  // BUSCAR
  // =====================================

  clientesFiltrados(): Cliente[] {

    const texto =
      this.textoBusqueda
        .trim()
        .toLowerCase();


    if (!texto) {

      return this.clientes;

    }


    return this.clientes.filter(
      cliente => {

        return (

          this.nombreCompleto(cliente)
            .toLowerCase()
            .includes(texto)

          ||

          (
            cliente.NumeroDocumento || ''
          )
            .toLowerCase()
            .includes(texto)

          ||

          (
            cliente.Telefono || ''
          )
            .toLowerCase()
            .includes(texto)

        );

      }
    );

  }


  // =====================================
  // CIUDAD
  // =====================================

  nombreCiudad(
    idCiudad: number | null | undefined
  ): string {

    const ciudad =
      this.ciudades.find(
        c => c.Id === idCiudad
      );

    return ciudad
      ? ciudad.Ciudad
      : '';

  }

}