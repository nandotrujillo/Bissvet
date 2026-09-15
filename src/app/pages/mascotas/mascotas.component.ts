import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MascotasService } from '../../Services/mascotas.service';
import { ClientesService } from '../../Services/clientes.service';
import { Mascota } from '../../Models/mascota';
import { Cliente } from '../../Models/cliente';


@Component({
  selector: 'app-mascotas',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './mascotas.component.html',
  styleUrls: ['./mascotas.component.css']
})
export class MascotasComponent implements OnInit {

  mascotas: Mascota[] = [];

  mascotasFiltradas: Mascota[] = [];

  mascota: Mascota = this.nuevaMascota();

  modoEdicion = false;

  mostrarFormulario = false;

  textoBusqueda = '';

  cargando = false;

  mensaje = '';

  error = '';

  
  clientes: Cliente[] = [];

  clientesFiltrados: Cliente[] = [];

  textoCliente = '';

  mostrarClientes = false;

  clienteSeleccionado: Cliente | null = null;

  constructor(
    private mascotasService: MascotasService,
    private clientesService: ClientesService
  ) { }


  ngOnInit(): void {

     this.cargarMascotas();

    this.cargarClientes();

  }


  // =====================================================
  // NUEVA MASCOTA
  // =====================================================

  buscarClientes(): void {

    const texto =
      this.textoCliente
        .trim()
        .toLowerCase();


    if (!texto) {

      this.clientesFiltrados =
        [...this.clientes];

      this.mostrarClientes = true;

      return;

    }


    this.clientesFiltrados =
      this.clientes.filter(cliente => {

        const nombreCompleto =
          [
            cliente.PrimerNombre,
            cliente.SegundoNombre,
            cliente.PrimerApellido,
            cliente.SegundoApellido
          ]
          .filter(x => x)
          .join(' ')
          .toLowerCase();


        const documento =
          (
            cliente.NumeroDocumento || ''
          ).toLowerCase();


        const telefono =
          (
            cliente.Telefono || ''
          ).toLowerCase();


        return (
          nombreCompleto.includes(texto) ||
          documento.includes(texto) ||
          telefono.includes(texto)
        );

      });


    this.mostrarClientes = true;

  }


  nombreCompleto(cliente: Cliente): string {

    return [

      cliente.PrimerNombre,
      cliente.SegundoNombre,
      cliente.PrimerApellido,
      cliente.SegundoApellido

    ]
    .filter(x => x)
    .join(' ');

  }


  seleccionarCliente(cliente: Cliente): void {

  if (!cliente.ClienteId) {
    this.error = 'El cliente seleccionado no tiene un ID válido.';
    return;
  }

  this.clienteSeleccionado = cliente;

  this.mascota.ClienteId = cliente.ClienteId;

  this.textoCliente = this.nombreCompleto(cliente);

  this.mostrarClientes = false;

  this.error = '';
}

  
  nuevaMascota(): Mascota {

    return {

      ClienteId: 0,

      Nombre: '',

      Especie: '',

      Raza: '',

      Sexo: '',

      FechaNacimiento: '',

      Color: '',

      Peso: undefined,

      Microchip: '',

      Esterilizado: false,

      Observaciones: '',

      Activo: true

    };

  }


  // =====================================================
  // CARGAR MASCOTAS
  // =====================================================

  cargarMascotas(): void {

    this.cargando = true;

    this.error = '';

    this.mascotasService.listar().subscribe({

      next: (respuesta) => {

        this.mascotas = respuesta.datos || [];

        this.mascotasFiltradas = [...this.mascotas];

        this.cargando = false;

      },

      error: (error: any) => {

        console.error(
          'Error cargando mascotas:',
          error
        );

        this.error =
          'No fue posible cargar las mascotas.';

        this.cargando = false;

      }

    });

  }


  // =====================================================
  // BUSCAR
  // =====================================================

  buscar(): void {

    const texto =
      this.textoBusqueda
        .trim()
        .toLowerCase();


    if (!texto) {

      this.mascotasFiltradas =
        [...this.mascotas];

      return;

    }


    this.mascotasFiltradas =
      this.mascotas.filter(m =>

        (m.Nombre || '')
          .toLowerCase()
          .includes(texto)

        ||

        (m.Especie || '')
          .toLowerCase()
          .includes(texto)

        ||

        (m.Raza || '')
          .toLowerCase()
          .includes(texto)

        ||

        String(m.ClienteId)
          .includes(texto)

      );

  }

cargarClientes(): void {

  this.clientesService.listar().subscribe({

    next: (respuesta: any) => {

      this.clientes = respuesta.datos || [];

      this.clientesFiltrados = [...this.clientes];

    },

    error: (error: any) => {

      console.error(
        'Error cargando clientes:',
        error
      );

      this.error =
        'No fue posible cargar los clientes.';

    }

  });

}
  // =====================================================
  // MOSTRAR NUEVA MASCOTA
  // =====================================================

  nueva(): void {

    this.mascota =
      this.nuevaMascota();

    this.modoEdicion = false;

    this.mostrarFormulario = true;

    this.mensaje = '';

    this.error = '';

  }


  // =====================================================
  // EDITAR
  // =====================================================
editar(mascota: Mascota): void {

  this.mascota = {
    ...mascota
  };

  this.modoEdicion = true;

  this.mostrarFormulario = true;

  this.mensaje = '';

  this.error = '';

  // Mostrar el dueño ya asociado a la mascota (1 mascota = 1 cliente).
  this.textoCliente =
    mascota.NombreClienteCompleto ||
    mascota.NombreCliente ||
    '';

  this.clienteSeleccionado =
    this.clientes.find(c => c.ClienteId === mascota.ClienteId) ||
    null;

}

  // =====================================================
  // CANCELAR
  // =====================================================

  cancelar(): void {

    this.mostrarFormulario = false;

    this.mascota =
      this.nuevaMascota();

    this.textoCliente = '';

    this.clienteSeleccionado = null;

    this.mensaje = '';

    this.error = '';

  }


  // =====================================================
  // GUARDAR
  // =====================================================

  guardar(): void {

    this.error = '';

    this.mensaje = '';


    if (!this.mascota.ClienteId) {

      this.error =
        'Debe ingresar el ClienteId.';

      return;

    }


    if (!this.mascota.Nombre?.trim()) {

      this.error =
        'El nombre de la mascota es obligatorio.';

      return;

    }


    if (!this.mascota.Especie?.trim()) {

      this.error =
        'La especie es obligatoria.';

      return;

    }


    // ===============================================
    // ACTUALIZAR
    // ===============================================

    if (
      this.modoEdicion &&
      this.mascota.IdMascota
    ) {

      this.mascotasService
        .actualizar(
          this.mascota.IdMascota,
          this.mascota
        )
        .subscribe({

          next: () => {

            this.mensaje =
              'Mascota actualizada correctamente.';

            this.mostrarFormulario = false;

            this.cargarMascotas();

          },

          error: (error: any) => {

            console.error(error);

            this.error =
              error.error?.mensaje ||
              'Error actualizando mascota.';

          }

        });

      return;

    }


    // ===============================================
    // CREAR
    // ===============================================

    this.mascotasService
      .crear(this.mascota)
      .subscribe({

        next: () => {

          this.mensaje =
            'Mascota creada correctamente.';

          this.mostrarFormulario = false;

          this.cargarMascotas();

        },

        error: (error: any) => {

          console.error(error);

          this.error =
            error.error?.mensaje ||
            'Error creando mascota.';

        }

      });

  }


  // =====================================================
  // ELIMINAR
  // =====================================================

  eliminar(mascota: Mascota): void {

    if (!mascota.IdMascota) {

      return;

    }


    const confirmar =
      confirm(
        `¿Desea eliminar la mascota "${mascota.Nombre}"?`
      );


    if (!confirmar) {

      return;

    }


    this.mascotasService
      .eliminar(mascota.IdMascota)
      .subscribe({

        next: () => {

          this.mensaje =
            'Mascota eliminada correctamente.';

          this.cargarMascotas();

        },

        error: (error: any) => {

          console.error(error);

          this.error =
            error.error?.mensaje ||
            'Error eliminando mascota.';

        }

      });

  }

}