import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { Veterinario } from '../../../Models/veterinario';
import {CiudadService,Ciudad} from '../../../Services/ciudad.service';

import { VeterinariosService } from '../../../Services/veterinarios.service';

@Component({
  selector: 'app-veterinarios',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule
  ],
  templateUrl: './veterinarios.component.html',
  styleUrl: './veterinarios.component.css'
})
export class VeterinariosComponent implements OnInit {

  // =====================================================
  // CIUDADES
  // =====================================================

  ciudades: Ciudad[] = [];


  // =====================================================
  // VETERINARIOS
  // =====================================================

  veterinarios: Veterinario[] = [];

  veterinariosFiltrados: Veterinario[] = [];


  // =====================================================
  // VETERINARIO ACTUAL
  // =====================================================

  veterinario: Veterinario =
    this.nuevoVeterinario();


  // =====================================================
  // VARIABLES DE CONTROL
  // =====================================================

  textoBusqueda = '';

  mostrarFormulario = false;

  modoEdicion = false;

  cargando = false;

  mensaje = '';

  error = '';


  // =====================================================
  // CONSTRUCTOR
  // =====================================================

  constructor(
    private veterinariosService: VeterinariosService,
    private ciudadService: CiudadService
  ) {}


  // =====================================================
  // INICIO
  // =====================================================

  ngOnInit(): void {

    this.cargarVeterinarios();

    this.cargarCiudades();

  }


  // =====================================================
  // MODELO NUEVO
  // =====================================================

  nuevoVeterinario(): Veterinario {

    return {

      UsuarioId: 0,

      PrimerNombre: '',
      SegundoNombre: '',

      PrimerApellido: '',
      SegundoApellido: '',

      TipoDocumento: 'CC',

      NumeroDocumento: '',

      TarjetaProfesional: '',

      Especialidad: '',

      Telefono: '',

      Telefono2: '',

      Correo: '',

      Direccion: '',

      IdCiudad: undefined,

      FechaNacimiento: '',

      Observaciones: '',

      Activo: true

    };

  }


  // =====================================================
  // CARGAR CIUDADES
  // =====================================================

  cargarCiudades(): void {

    this.ciudadService.listar().subscribe({

      next: (respuesta) => {

        this.ciudades =
          respuesta.data ||
          respuesta.datos ||
          [];

      },


      error: (error) => {

        console.error(
          'Error cargando ciudades:',
          error
        );

        this.error =
          'No fue posible cargar las ciudades.';

      }

    });

  }


  // =====================================================
  // CARGAR VETERINARIOS
  // =====================================================

  cargarVeterinarios(): void {

    this.cargando = true;

    this.error = '';


    this.veterinariosService
      .listar()
      .subscribe({

        next: (respuesta) => {

          this.veterinarios =
            respuesta.datos || [];


          this.veterinariosFiltrados =
            [...this.veterinarios];


          this.cargando = false;

        },


        error: (error) => {

          console.error(
            'Error cargando veterinarios:',
            error
          );


          this.error =
            'No fue posible cargar los veterinarios.';


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

      this.veterinariosFiltrados =
        [...this.veterinarios];

      return;

    }


    this.veterinariosFiltrados =
      this.veterinarios.filter(
        (v: Veterinario) => {

          const nombre = [

            v.PrimerNombre,
            v.SegundoNombre,
            v.PrimerApellido,
            v.SegundoApellido

          ]
          .filter(x => x)
          .join(' ')
          .toLowerCase();


          return (

            nombre.includes(texto) ||

            (v.NumeroDocumento || '')
              .toLowerCase()
              .includes(texto) ||

            (v.TarjetaProfesional || '')
              .toLowerCase()
              .includes(texto) ||

            (v.Especialidad || '')
              .toLowerCase()
              .includes(texto)

          );

        }
      );

  }


  // =====================================================
  // NOMBRE COMPLETO
  // =====================================================

  nombreCompleto(
    v: Veterinario
  ): string {

    return [

      v.PrimerNombre,
      v.SegundoNombre,
      v.PrimerApellido,
      v.SegundoApellido

    ]
    .filter(x => x)
    .join(' ');

  }


  // =====================================================
  // NUEVO
  // =====================================================

  nuevo(): void {

    this.veterinario =
      this.nuevoVeterinario();


    this.modoEdicion = false;

    this.mostrarFormulario = true;

    this.mensaje = '';

    this.error = '';
    

  }


  // =====================================================
  // EDITAR
  // =====================================================

  editar(
    veterinario: Veterinario
  ): void {

    this.veterinario = {

      ...veterinario,

      IdCiudad:
        veterinario.IdCiudad !== null &&
        veterinario.IdCiudad !== undefined
          ? Number(veterinario.IdCiudad)
          : undefined

    };


    this.modoEdicion = true;

    this.mostrarFormulario = true;

    this.mensaje = '';

    this.error = '';

  }


  // =====================================================
  // CANCELAR
  // =====================================================

  cancelar(): void {

    this.mostrarFormulario = false;

    this.veterinario =
      this.nuevoVeterinario();

    this.error = '';

    this.mensaje = '';

  }


  // =====================================================
  // GUARDAR
  // =====================================================

  guardar(): void {

    this.error = '';

    this.mensaje = '';

    const usuarioIdGuardado =  localStorage.getItem('UsuarioId');

    const usuarioId =  usuarioIdGuardado  ? Number(usuarioIdGuardado) : 0;

    // -------------------------------------------------
    // VALIDACIONES
    // -------------------------------------------------

    if (!Number.isInteger(usuarioId) || usuarioId <= 0) {
      this.error = 'No se encontró un UsuarioId válido en la sesión.';
      return;
    }

    if (
      !this.veterinario.PrimerNombre ||
      !this.veterinario.PrimerNombre.trim()
    ) {

      this.error =
        'El primer nombre es obligatorio.';

      return;

    }


    if (
      !this.veterinario.PrimerApellido ||
      !this.veterinario.PrimerApellido.trim()
    ) {

      this.error =
        'El primer apellido es obligatorio.';

      return;

    }


    if (
      !this.veterinario.NumeroDocumento ||
      !this.veterinario.NumeroDocumento.trim()
    ) {

      this.error =
        'El número de documento es obligatorio.';

      return;

    }


    if (
      !this.veterinario.TarjetaProfesional ||
      !this.veterinario.TarjetaProfesional.trim()
    ) {

      this.error =
        'La tarjeta profesional es obligatoria.';

      return;

    }



    // -------------------------------------------------
    // ASEGURAR ID CIUDAD NUMÉRICO
    // -------------------------------------------------

    if (
      this.veterinario.IdCiudad !== undefined &&
      this.veterinario.IdCiudad !== null
    ) {

      this.veterinario.IdCiudad =
        Number(
          this.veterinario.IdCiudad
        );

    }


    // =================================================
    // ACTUALIZAR
    // =================================================

    if (
      this.modoEdicion &&
      this.veterinario.IdVeterinario
    ) {

      this.veterinario.UsuarioId =
        Number(usuarioId);


      this.veterinariosService
        .actualizar(
          this.veterinario.IdVeterinario,
          this.veterinario
        )
        .subscribe({

          next: () => {

            this.mensaje =
              'Veterinario actualizado correctamente.';

            this.mostrarFormulario = false;

            this.cargarVeterinarios();

          },


          error: (error) => {

            console.error(
              'Error actualizando:',
              error
            );


            this.error =
              error.error?.mensaje ||
              'Error actualizando veterinario.';

          }

        });


      return;

    }


    // =================================================
    // CREAR
    // =================================================

    this.veterinario.UsuarioId =
      Number(usuarioId);


    this.veterinariosService
      .crear(
        this.veterinario
      )
      .subscribe({

        next: () => {

          this.mensaje =
            'Veterinario creado correctamente.';

          this.mostrarFormulario = false;

          this.cargarVeterinarios();

        },


        error: (error) => {

          console.error(
            'Error creando veterinario:',
            error
          );


          this.error =
            error.error?.mensaje ||
            'Error creando veterinario.';

        }

      });

  }


  // =====================================================
  // ELIMINAR
  // =====================================================

  eliminar(
    veterinario: Veterinario
  ): void {

    if (
      !veterinario.IdVeterinario
    ) {

      return;

    }


    const confirmar =
      confirm(
        `¿Desea eliminar al veterinario "${this.nombreCompleto(veterinario)}"?`
      );


    if (!confirmar) {

      return;

    }


    this.veterinariosService
      .eliminar(
        veterinario.IdVeterinario
      )
      .subscribe({

        next: () => {

          this.mensaje =
            'Veterinario eliminado correctamente.';

          this.cargarVeterinarios();

        },


        error: (error) => {

          console.error(
            'Error eliminando:',
            error
          );


          this.error =
            error.error?.mensaje ||
            'Error eliminando veterinario.';

        }

      });

  }

}