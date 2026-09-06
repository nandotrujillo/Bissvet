import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CitasService, Cita } from '../../Services/citas.service';
import { HistoriasClinicasService } from '../../Services/historiasclinicas.service';
import { MascotasService } from '../../Services/mascotas.service';
import { Mascota } from '../../Models/mascota';
import { VentasService } from '../../Services/ventas.service';
import { BodegaService } from '../../Services/Bodega.service';
import { TipoPagoService } from '../../Services/tipo-pago.service';
import { SeguridadService } from '../../Services/seguridad.service';
import { Veterinario } from '../../Models/veterinario';
import { VeterinariosService } from '../../Services/veterinarios.service';
import { Modulo } from '../../Models/modulo';

import {
  CategoriasServicioService
} from '../../Services/categorias-servicio.service';

import {
  CategoriaServicio
} from '../../Models/categoria-servicio';

import {
  ServiciosService
} from '../../Services/servicios.service';

import {
  Servicio
} from '../../Models/servicio';

import {
  ModulosService
} from '../../Services/modulos.service';


@Component({
  selector: 'app-citas',
  standalone: true,

  imports: [
    CommonModule,
    FormsModule
  ],

  templateUrl: './citas.component.html',
  styleUrl: './citas.component.css'
})
export class CitasComponent implements OnInit {

  // =====================================================
  // LISTAS
  // =====================================================


  veterinarios: Veterinario[] = [];

  citas: Cita[] = [];

  mascotas: Mascota[] = [];

  modulos: Modulo[] = [];

  categorias: CategoriaServicio[] = [];

servicios: Servicio[] = [];

serviciosFiltrados: Servicio[] = [];

private readonly ID_CATEGORIA_CITAS = 1;


  // =====================================================
  // ESTADO
  // =====================================================

  cargando = false;

  mostrarFormulario = false;

  modoEdicion = false;

  error = '';

  mensaje = '';

  // ¿El usuario autenticado puede facturar servicios desde citas?
  puedeFacturarServicios = false;


  // =====================================================
  // CITA
  // =====================================================

  cita: Cita = this.nuevaCitaModelo();

  constructor(

    private citasService: CitasService,

    private mascotasService: MascotasService,

    private serviciosService:      ServiciosService,

    private veterinariosService: VeterinariosService,

    private historiasService: HistoriasClinicasService,

    private ventasService: VentasService,

    private bodegaService: BodegaService,

    private tipoPagoService: TipoPagoService,

    private seguridadService: SeguridadService,

    private router: Router

      

  ) {}


  // =====================================================
  // INICIO
  // =====================================================

  ngOnInit(): void {

  this.cargarCitas();

  this.cargarMascotas();

  this.cargarServiciosCitas();

  this.cargarVeterinarios();


  this.cargarPermisosFacturacion();

  }


  cargarPermisosFacturacion(): void {

    const permisos =
      this.seguridadService.obtenerPermisosLocal();

    this.puedeFacturarServicios =
      permisos.includes('FACTURACION.SERVICIOS');

  }


cargarVeterinarios(): void {

  this.veterinariosService.listar().subscribe({
    next: (respuesta:any) => {

      this.veterinarios =
        respuesta.datos ||
        respuesta.data ||
        [];

    },
    error: (error) => {

      console.error(
        'Error cargando veterinarios:',
        error
      );

      this.error =
        'No fue posible cargar los veterinarios.';
    }
  });

}

cambiarServicio(): void {

  const servicio =
    this.serviciosFiltrados.find(
      s =>
        s.IdServicio === this.cita.IdServicio
    );

  if (servicio) {

    this.cita.Precio =
      servicio.Precio ?? 0;

  } else {

    this.cita.Precio = 0;

  }

}

  // =====================================================
  // NUEVA CITA
  // =====================================================

  nuevaCita(): void {

    //  this.IdVeterinario=  undefined;

    this.cita = this.nuevaCitaModelo();

    this.modoEdicion = false;

    this.mostrarFormulario = true;

    this.error = '';

    this.mensaje = '';

    //this.serviciosFiltrados = [];

  }


   // AQUÍ puede ir el método
  nombreCompletoVeterinario(
    veterinario: Veterinario
  ): string {

    return [
      veterinario.PrimerNombre,
      veterinario.SegundoNombre,
      veterinario.PrimerApellido,
      veterinario.SegundoApellido
    ]
    .filter(x => x)
    .join(' ');
  }

  nuevaCitaModelo(): Cita {

    return {

      IdMascota: 0,

      IdServicio: 0,
      
      IdVeterinario :0,
FechaCita: '',

      HoraCita: '',

      Precio: 0,

      Estado: 'Pendiente',

      MotivoConsulta: '',

      Observaciones: '',

      FechaModificacion: '',
      
      UsuarioIdModificacion: 3

    };

  }


  // =====================================================
  // CARGAR CITAS
  // =====================================================

  cargarCitas(): void {

    this.cargando = true;

    this.error = '';

    this.citasService.listar().subscribe({

      next: (respuesta:any) => {

        this.citas =
          respuesta.data ||
          respuesta.datos ||
          [];

        this.cargando = false;

      },

      error: (error:any) => {

        console.error(
          'Error cargando citas:',
          error
        );

        this.error =
          'No fue posible cargar las citas.';

        this.cargando = false;

      }

    });

  }

  // =====================================================
  // CARGAR MASCOTAS
  // =====================================================

  cargarMascotas(): void {

    this.mascotasService.listar().subscribe({

      next: (respuesta:any) => {

        this.mascotas = respuesta.datos || [];
      },

      error: (error:any) => {

        console.error(
          'Error cargando mascotas:',
          error
        );

      }

    });

  }


  // =====================================================
  // CARGAR SERVICIOS
  // =====================================================

  cargarServicios(): void {

    this.serviciosService.listar().subscribe({

      next: (respuesta:any) => {

        this.servicios =
          respuesta.datos ||
          respuesta.data ||
          [];

      },

      error: (error:any) => {

        console.error(
          'Error cargando servicios:',
          error
        );

      }

    });

  }




  // =====================================================
  // CAMBIO DE CATEGORÍA
  // =====================================================

  cambioCategoria(): void {

    const idCategoria =
      Number(
        1
      );
    this.serviciosFiltrados =
      this.servicios.filter(
        servicio =>
          Number(
            servicio.IdCategoriaServicio
          ) === idCategoria &&
          servicio.Activo !== 0
      );

    this.cita.IdServicio = 0;

    this.cita.Precio = 0;

  }


  // =====================================================
  // CAMBIO DE SERVICIO
  // =====================================================

  cambioServicio(): void {

    const idServicio =
      Number(
        this.cita.IdServicio
      );

    const servicio =
      this.servicios.find(
        s =>
          Number(s.IdServicio) ===
          idServicio
      );

    if (servicio) {

      this.cita.Precio =
        Number(servicio.Precio);

    } else {

      this.cita.Precio = 0;

    }

  }


  // =====================================================
  // NOMBRE MASCOTA
  // =====================================================

  nombreMascota(id: number): string {

    const mascota =
      this.mascotas.find(
        m =>
          Number(m.IdMascota) ===
          Number(id)
      );

    return mascota?.Nombre || '-';

  }


  // =====================================================
  // NOMBRE SERVICIO
  // =====================================================

  nombreServicio(id: number): string {

    const servicio =
      this.servicios.find(
        s =>
          Number(s.IdServicio) ===
          Number(id)
      );

    return servicio?.Nombre || '-';

  }


  // =====================================================
  // EDITAR
  // =====================================================

  editar(cita: Cita): void {

    this.cita = {
      ...cita
    };

    this.modoEdicion = true;

    this.mostrarFormulario = true;

    this.error = '';

    this.mensaje = '';

    this.cambioCategoria();

    this.cita.IdServicio =
      cita.IdServicio;

    this.cambioServicio();

  }


  // =====================================================
  // GUARDAR
  // =====================================================

  guardar(): void {

    this.error = '';

    this.mensaje = '';


    if (!this.cita.IdMascota) {

      this.error =
        'Debe seleccionar una mascota.';

      return;

    }




    if (!this.cita.IdServicio) {

      this.error =
        'Debe seleccionar un servicio.';

      return;

    }


    if (!this.cita.FechaCita) {

      this.error =
        'Debe seleccionar la fecha.';

      return;

    }


    if (!this.cita.HoraCita) {

      this.error =
        'Debe seleccionar la hora.';

      return;

    }


    const usuarioId =
      Number(
        localStorage.getItem('UsuarioId')
      );


    if (usuarioId) {

      this.cita.UsuarioIdCreacion =
        usuarioId;

    }


    // =================================================
    // ACTUALIZAR
    // =================================================

    if (
      this.modoEdicion &&
      this.cita.IdCita
    ) {

      this.citasService
        .actualizar(
          this.cita.IdCita,
          this.cita
        )
        .subscribe({

          next: () => {

            this.mensaje =
              'Cita actualizada correctamente.';

            this.mostrarFormulario =
              false;

            this.cargarCitas();

          },

          error: (error:any) => {

            console.error(error);

            this.error =
              error.error?.mensaje ||
              'No fue posible actualizar la cita.';

          }

        });

      return;

    }


    // =================================================
    // CREAR
    // =================================================
    this.cita.UsuarioIdCreacion = usuarioId;
    this.cita.FechaModificacion = new Date().toISOString();
    this.cita.UsuarioIdModificacion = usuarioId;
    this.citasService
      .crear(this.cita)
      .subscribe({

        next: () => {

          this.mensaje =
            'Cita creada correctamente.';

          this.mostrarFormulario =
            false;

          this.cargarCitas();

        },

        error: (error:any) => {

          console.error(error);

          this.error =
            error.error?.mensaje ||
            'No fue posible crear la cita.';

        }

      });

  }


cargarServiciosCitas(): void {

  this.serviciosService.listar().subscribe({

    next: (respuesta) => {

      this.servicios =
        respuesta.datos ||
        respuesta.data ||
        [];

      this.serviciosFiltrados =
        this.servicios.filter(
          servicio =>
            Number(servicio.IdCategoriaServicio) === 1 &&
            servicio.Activo !== 0
        );

    },

    error: (error) => {

      console.error(
        'ERROR cargando servicios:',
        error
      );

    }

  });

}


  // =====================================================
  // ELIMINAR
  // =====================================================

  eliminar(id: number): void {

    if (
      !confirm(
        '¿Desea cancelar esta cita?'
      )
    ) {

      return;

    }


    this.citasService
      .eliminar(id)
      .subscribe({

        next: () => {

          this.mensaje =
            'Cita cancelada correctamente.';

          this.cargarCitas();

        },

        error: (error:any) => {

          console.error(error);

          this.error =
            error.error?.mensaje ||
            'No fue posible cancelar la cita.';

        }

      });

  }


  // =====================================================
  // HISTORIA CLÍNICA DESDE CITA (solo consulta)
  // =====================================================

  esConsulta(cita: Cita): boolean {
    return Number(cita.IdCategoriaServicio) === this.ID_CATEGORIA_CITAS;
  }

  puedeCrearHistoria(cita: Cita): boolean {
    return this.esConsulta(cita)
      && cita.Estado !== 'Atendida'
      && cita.Estado !== 'Cancelada';
  }

  crearHistoriaClinica(cita: Cita): void {

    if (!cita.IdCita) {
      this.error = 'La cita no tiene identificador válido.';
      return;
    }

    if (!confirm(
      '¿Crear la historia clínica para esta consulta?\n' +
      'La cita quedará marcada como "Atendida".'
    )) {
      return;
    }

    this.error = '';
    this.mensaje = '';

    const usuarioId =
      Number(localStorage.getItem('UsuarioId'));

    const hora =
      cita.HoraCita &&
      cita.HoraCita.trim().length === 5
        ? cita.HoraCita + ':00'
        : (cita.HoraCita || '00:00');

    const fecha =
      (cita.FechaCita || '').substring(0, 10);

    const historia = {
      IdCita: cita.IdCita,
      IdMascota: cita.IdMascota,
      IdVeterinario: cita.IdVeterinario,
      FechaAtencion: `${fecha}T${hora}`,
      MotivoConsulta:
        (cita.MotivoConsulta || '').trim() ||
        (cita.Observaciones || '').trim() ||
        'Consulta veterinaria',
      Observaciones: cita.Observaciones || null,
      EnfermedadActual: null,
      Estado: 'Abierta',
      UsuarioIdCreacion: usuarioId || null
    };

    this.historiasService.crear(historia).subscribe({
      next: (respuesta: any) => {
        this.mensaje =
          'Historia clínica creada correctamente.';
        const idHistoria =
          respuesta.IdHistoriaClinica;
        this.router.navigate([
          '/dashboard/historiaclinica',
          cita.IdMascota,
          idHistoria
        ]);
      },
      error: (error: any) => {
        console.error(error);
        this.error =
          error.error?.mensaje ||
          'No fue posible crear la historia clínica.';
      }
    });

  }


  // =====================================================
  // FACTURAR SERVICIO DE LA CITA
  // =====================================================

  puedeFacturar(cita: Cita): boolean {
    return this.puedeFacturarServicios
      && Number(cita.Precio || 0) > 0
      && !!cita.IdServicio
      && cita.Estado !== 'Cancelada'
      && cita.Estado !== 'Facturada';
  }

  facturarServicio(cita: Cita): void {

    const precio = Number(cita.Precio || 0);

    if (precio <= 0) {
      this.error = 'La cita no tiene un valor para facturar.';
      return;
    }

    if (!confirm(
      `¿Facturar el servicio "${this.nombreServicio(cita.IdServicio)}" por $${precio.toLocaleString('es-CO')}?\n` +
      'Se generará la venta y la factura al cliente.'
    )) {
      return;
    }

    this.error = '';
    this.mensaje = '';

    // Cliente del dueño de la mascota
    const mascota = this.mascotas.find(
      m => Number(m.IdMascota) === Number(cita.IdMascota)
    );

    const IdCliente = mascota?.ClienteId;

    if (!IdCliente) {
      this.error = 'La mascota de esta cita no tiene un cliente asociado.';
      return;
    }

    this.cargando = true;

    // Bodega por defecto (primera de la empresa) y tipo de pago por defecto
    this.bodegaService.listar().subscribe({
      next: (bRes: any) => {
        const bodegas = bRes.datos || bRes.data || [];
        if (!bodegas.length) {
          this.cargando = false;
          this.error = 'No hay bodegas disponibles para facturar.';
          return;
        }
        const IdBodega = Number(bodegas[0].Id);
        this.tipoPagoService.listar(true).subscribe({
          next: (tRes: any) => {
            const tipos = tRes.datos || tRes.data || [];
            const tipo = (tipos.find((t: any) => String(t.Nombre).trim().toUpperCase() === 'EFECTIVO') || tipos[0]);
            const TipoPago = tipo?.Nombre || 'EFECTIVO';

            const UsuarioId = Number(localStorage.getItem('UsuarioId')) || null;

            const body: any = {
              IdCliente,
              IdVendedor: UsuarioId || cita.IdVeterinario || 0,
              TipoPago,
              IdBodega,
              Observaciones:
                `Facturación de cita del servicio: ${this.nombreServicio(cita.IdServicio)}` +
                (cita.IdCita ? ` (IdCita ${cita.IdCita})` : ''),
              Detalle: [{
                IdServicio: cita.IdServicio,
                Cantidad: 1,
                PrecioUnitario: precio
              }]
            };

            this.ventasService.crear(body).subscribe({
              next: (cRes: any) => {
                const IdVenta = cRes.IdVenta;
                this.cargando = false;
                this.mensaje =
                  `Venta ${cRes.NumeroVenta || ''} generada. Confirmando facturación...`;
                this.confirmarFactura(cita, IdVenta);
              },
              error: (cEr: any) => {
                this.cargando = false;
                this.error =
                  cEr.error?.mensaje ||
                  'No fue posible generar la venta del servicio.';
              }
            });
          },
          error: () => {
            this.cargando = false;
            this.error = 'No fue posible cargar los tipos de pago.';
          }
        });
      },
      error: () => {
        this.cargando = false;
        this.error = 'No fue posible cargar las bodegas.';
      }
    });

  }

  private confirmarFactura(cita: Cita, IdVenta: number): void {

    const UsuarioId =
      Number(localStorage.getItem('UsuarioId')) || null;

    this.ventasService.confirmar(IdVenta, {
      UsuarioIdConfirmacion: UsuarioId
    }).subscribe({
      next: () => {
        this.mensaje =
          'Servicio facturado correctamente. La cita queda marcada como atendida.';

        // Marcar la cita como Facturada
        cita.Estado = 'Facturada';
        if (cita.IdCita) {
          this.citasService.actualizar(cita.IdCita, {
            ...cita,
            UsuarioIdModificacion: UsuarioId || 0
          }).subscribe({
            error: () => { /* la factura ya quedó, el marca no es crítico */ }
          });
        }
        this.cargarCitas();
      },
      error: (e: any) => {
        this.error =
          e.error?.mensaje ||
          'La venta se generó pero no fue posible confirmar la facturación.';
      }
    });

  }


  // =====================================================
  // CERRAR
  // =====================================================

  cerrarFormulario(): void {

    this.mostrarFormulario = false;

    this.modoEdicion = false;

  }

}