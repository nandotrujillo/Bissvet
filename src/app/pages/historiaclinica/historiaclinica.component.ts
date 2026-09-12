import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MascotasService } from '../../Services/mascotas.service';
import { VeterinariosService } from '../../Services/veterinarios.service';
import { HistoriasClinicasService } from '../../Services/historiasclinicas.service';
import { AntecedentesService } from '../../Services/antecedentes.service';
import { SignosVitalesService } from '../../Services/signosvitales.service';
import { ExamenFisicoService } from '../../Services/examenfisico.service';
import { DiagnosticosService } from '../../Services/diagnosticos.service';
import { TratamientosService } from '../../Services/tratamientos.service';
import { RecetasService } from '../../Services/recetas.service';
import { DetalleRecetasService } from '../../Services/detallerecetas.service';
import { ProcedimientosService } from '../../Services/procedimientos.service';
import { CirugiasService } from '../../Services/cirugias.service';
import { ControlesService } from '../../Services/controles.service';
import { ArchivosService } from '../../Services/archivos.service';
import { Mascota } from '../../Models/mascota';
import { Veterinario } from '../../Models/veterinario';
import { HistoriaClinica } from '../../Models/historia-clinica';
import { Antecedente } from '../../Models/antecedente';
import { SignosVitales } from '../../Models/signos-vitales';
import { ExamenFisico } from '../../Models/examen-fisico';
import { Diagnostico } from '../../Models/diagnostico';
import { Tratamiento } from '../../Models/tratamiento';
import { DetalleReceta } from '../../Models/receta';
import { Procedimiento } from '../../Models/procedimiento';
import { Cirugia } from '../../Models/cirugia';
import { Control } from '../../Models/control';

@Component({
  selector: 'app-historiaclinica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './historiaclinica.component.html',
  styleUrls: ['./historiaclinica.component.css']
})
export class HistoriaClinicaComponent implements OnInit {

  // =====================================================
  // SECCION ACTIVA
  // =====================================================
  seccionActiva = 'informacion';

  // =====================================================
  // DATOS DEL SELECTOR DE MASCOTA
  // =====================================================
  mascotas: Mascota[] = [];
  mascotasFiltradas: Mascota[] = [];
  textoBusqueda = '';
  mascotaSeleccionada: Mascota | null = null;

  // =====================================================
  // DATOS DE HISTORIA CLINICA
  // =====================================================
  historias: HistoriaClinica[] = [];
  historiaActual: HistoriaClinica | null = null;
  historiaSeleccionadaId: number | null = null;
  nuevaHistoria: any = this.crearNuevaHistoria();

  // =====================================================
  // DATOS DE ATENCION
  // =====================================================
  veterinarios: Veterinario[] = [];

  // =====================================================
  // SECCION ANTECEDENTES
  // =====================================================
  antecedentes: Antecedente = this.crearNuevosAntecedentes();

  // =====================================================
  // SECCION SIGNOS VITALES
  // =====================================================
  signosVitales: SignosVitales = this.crearNuevosSignosVitales();

  // =====================================================
  // SECCION EXAMEN FISICO
  // =====================================================
  examenFisico: ExamenFisico = this.crearNuevoExamenFisico();

  // =====================================================
  // SECCION DIAGNOSTICOS
  // =====================================================
  diagnosticos: Diagnostico[] = [];
  nuevoDiagnostico: Diagnostico = this.crearNuevoDiagnostico();

  // =====================================================
  // SECCION TRATAMIENTOS
  // =====================================================
  tratamientos: Tratamiento[] = [];
  nuevoTratamiento: Tratamiento = this.crearNuevoTratamiento();

  // =====================================================
  // SECCION RECETAS
  // =====================================================
  recetas: any[] = [];
  mostrarFormularioReceta = false;
  nuevaReceta: any = {
    IdHistoriaClinica: 0,
    IdVeterinario: 0,
    Observaciones: '',
    IndicacionesGenerales: '',
    detalle: [] as DetalleReceta[]
  };
  medicamentoActual: DetalleReceta = this.crearNuevoMedicamento();

  // =====================================================
  // SECCION PROCEDIMIENTOS
  // =====================================================
  procedimientos: Procedimiento[] = [];
  nuevoProcedimiento: Procedimiento = this.crearNuevoProcedimiento();
  mostrarFormularioProcedimiento = false;

  // =====================================================
  // SECCION CIRUGIAS
  // =====================================================
  cirugias: Cirugia[] = [];
  nuevaCirugia: Cirugia = this.crearNuevaCirugia();
  mostrarFormularioCirugia = false;

  // =====================================================
  // SECCION CONTROLES
  // =====================================================
  controles: Control[] = [];
  nuevoControl: Control = this.crearNuevoControl();
  mostrarFormularioControl = false;

  // =====================================================
  // SECCION ARCHIVOS
  // =====================================================
  archivos: any[] = [];
  archivoSeleccionado: File | null = null;
  tipoArchivoNuevo = 'Documento';
  descripcionArchivoNueva = '';
  subiendoArchivo = false;

  // =====================================================
  // UI STATE
  // =====================================================
  cargando = false;
  mensaje = '';
  error = '';

  constructor(
    private route: ActivatedRoute,
    private mascotasService: MascotasService,
    private veterinariosService: VeterinariosService,
    private historiasService: HistoriasClinicasService,
    private antecedentesService: AntecedentesService,
    private signosService: SignosVitalesService,
    private examenService: ExamenFisicoService,
    private diagnosticosService: DiagnosticosService,
    private tratamientosService: TratamientosService,
    private recetasService: RecetasService,
    private detalleRecetasService: DetalleRecetasService,
    private procedimientosService: ProcedimientosService,
    private cirugiasService: CirugiasService,
    private controlesService: ControlesService,
    private archivosService: ArchivosService
  ) {}

  ngOnInit(): void {
    this.cargarMascotas();
    this.cargarVeterinarios();

    this.route.params.subscribe(params => {
      const idMascota = params['idMascota'];
      if (idMascota) {
        this.cargarMascotaPorId(idMascota);
      }
      const idHistoria = params['idHistoria'];
      if (idHistoria) {
        this.historiaSeleccionadaId = Number(idHistoria);
        this.cargarDatosHistoria(Number(idHistoria));
      }
    });
  }

  // =====================================================
  // SELECCIONAR SECCION
  // =====================================================
  seleccionarSeccion(seccion: string): void {
    this.seccionActiva = seccion;
    this.limpiarMensajes();
  }

  // =====================================================
  // CREAR OBJETOS NUEVOS
  // =====================================================
  crearNuevaHistoria(): any {
    return {
      IdCita: null,
      IdMascota: 0,
      IdVeterinario: 0,
      FechaAtencion: new Date().toISOString().slice(0, 16),
      MotivoConsulta: '',
      EnfermedadActual: '',
      Observaciones: '',
      Estado: 'Abierta'
    };
  }

  crearNuevosAntecedentes(): Antecedente {
    return {
      IdMascota: 0,
      EnfermedadesAnteriores: '',
      CirugiasAnteriores: '',
      Alergias: '',
      Vacunacion: '',
      Desparasitacion: '',
      MedicamentosActuales: '',
      TratamientosAnteriores: '',
      AntecedentesHereditarios: '',
      Alimentacion: '',
      Habitos: '',
      Observaciones: ''
    };
  }

  crearNuevosSignosVitales(): SignosVitales {
    return {
      IdHistoriaClinica: 0,
      Peso: null,
      Temperatura: null,
      FrecuenciaCardiaca: null,
      FrecuenciaRespiratoria: null,
      EstadoHidratacion: '',
      CondicionCorporal: '',
      Mucosas: '',
      TiempoLlenadoCapilar: null,
      Observaciones: ''
    };
  }

  crearNuevoExamenFisico(): ExamenFisico {
    return {
      IdHistoriaClinica: 0,
      EstadoGeneral: '', Cabeza: '', Ojos: '', Oidos: '', Nariz: '', Boca: '', Cuello: '',
      SistemaRespiratorio: '', SistemaCardiovascular: '', Abdomen: '',
      SistemaDigestivo: '', SistemaUrinario: '', SistemaReproductivo: '',
      SistemaMusculoesqueletico: '', PielYPelaje: '', SistemaNeurologico: '',
      Ganglios: '', OtrosHallazgos: '', ObservacionesGenerales: ''
    };
  }

  crearNuevoDiagnostico(): Diagnostico {
    return {
      IdHistoriaClinica: 0,
      Diagnostico: '',
      CodigoDiagnostico: '',
      TipoDiagnostico: 'Presuntivo',
      Observaciones: ''
    };
  }

  crearNuevoTratamiento(): Tratamiento {
    return {
      IdHistoriaClinica: 0,
      NombreTratamiento: '',
      Descripcion: '',
      FechaInicio: '',
      FechaFin: '',
      Indicaciones: '',
      Observaciones: '',
      Estado: 'Activo'
    };
  }

  crearNuevoMedicamento(): DetalleReceta {
    return {
      IdReceta: 0,
      Medicamento: '',
      Concentracion: '',
      FormaFarmaceutica: '',
      Dosis: '',
      UnidadDosis: '',
      Frecuencia: '',
      ViaAdministracion: '',
      Duracion: '',
      Cantidad: null,
      Indicaciones: '',
      Observaciones: ''
    };
  }

  crearNuevoProcedimiento(): Procedimiento {
    return {
      IdHistoriaClinica: 0,
      NombreProcedimiento: '',
      Fecha: new Date().toISOString().slice(0, 16),
      Descripcion: '',
      Resultado: '',
      Observaciones: ''
    };
  }

  crearNuevaCirugia(): Cirugia {
    return {
      IdHistoriaClinica: 0,
      IdMascota: 0,
      IdVeterinario: 0,
      FechaProgramacion: '',
      FechaCirugia: new Date().toISOString().slice(0, 16),
      TipoCirugia: '',
      Motivo: '',
      DiagnosticoPreoperatorio: '',
      DiagnosticoPostoperatorio: '',
      ProcedimientoRealizado: '',
      TipoAnestesia: '',
      Observaciones: '',
      Estado: 'Programada'
    };
  }

  crearNuevoControl(): Control {
    return {
      IdHistoriaClinica: 0,
      IdMascota: 0,
      IdVeterinario: 0,
      FechaControl: new Date().toISOString().slice(0, 16),
      Motivo: '',
      Evolucion: '',
      Peso: null,
      SignosVitales: '',
      Observaciones: '',
      Recomendaciones: '',
      ProximoControl: ''
    };
  }

  // =====================================================
  // CARGAR DATOS BASE
  // =====================================================
  cargarMascotas(): void {
    this.mascotasService.listar().subscribe({
      next: (respuesta: any) => {
        this.mascotas = respuesta.datos || [];
        this.mascotasFiltradas = [...this.mascotas];
      },
      error: (err: any) => {
        console.error('Error cargando mascotas:', err);
        this.error = 'No fue posible cargar las mascotas.';
      }
    });
  }

  cargarVeterinarios(): void {
    this.veterinariosService.listar().subscribe({
      next: (respuesta: any) => {
        this.veterinarios = respuesta.datos || [];
      },
      error: (err: any) => {
        console.error('Error cargando veterinarios:', err);
        this.error = 'No fue posible cargar los veterinarios.';
      }
    });
  }

  cargarMascotaPorId(idMascota: number): void {
    this.mascotasService.obtener(idMascota).subscribe({
      next: (respuesta: any) => {
        this.mascotaSeleccionada = respuesta.datos;
        this.nuevaHistoria.IdMascota = idMascota;
        this.cargarHistoriasPorMascota(idMascota);
      },
      error: (err: any) => {
        console.error('Error cargando mascota:', err);
        this.error = 'No fue posible cargar la mascota.';
      }
    });
  }

  // =====================================================
  // BUSCAR Y SELECCIONAR MASCOTA
  // =====================================================
  buscar(): void {
    const texto = this.textoBusqueda.trim().toLowerCase();
    if (!texto) {
      this.mascotasFiltradas = [...this.mascotas];
      return;
    }
    this.mascotasFiltradas = this.mascotas.filter(m =>
      (m.Nombre || '').toLowerCase().includes(texto) ||
      (m.Especie || '').toLowerCase().includes(texto) ||
      (m.Raza || '').toLowerCase().includes(texto)
    );
  }

  seleccionarMascota(mascota: Mascota): void {
    if (!mascota.IdMascota) return;
    this.mascotaSeleccionada = mascota;
    this.textoBusqueda = mascota.Nombre;
    this.nuevaHistoria.IdMascota = mascota.IdMascota;
    this.antecedentes.IdMascota = mascota.IdMascota;
    this.cargarHistoriasPorMascota(mascota.IdMascota);
    this.cargarAntecedentesPorMascota(mascota.IdMascota);
    this.cargarCirugiasPorMascota(mascota.IdMascota);
    this.cargarControlesPorMascota(mascota.IdMascota);
    this.mensaje = '';
    this.error = '';
  }

  // =====================================================
  // HISTORIAS CLINICAS
  // =====================================================
  cargarHistoriasPorMascota(idMascota: number): void {
    this.cargando = true;
    this.historiasService.listarPorMascota(idMascota).subscribe({
      next: (respuesta: any) => {
        this.historias = respuesta.datos || [];
        this.cargando = false;
      },
      error: (err: any) => {
        console.error('Error cargando historias:', err);
        this.error = 'No fue posible cargar las historias clínicas.';
        this.cargando = false;
      }
    });
  }

  abrirHistoria(historia: HistoriaClinica): void {
    if (!historia.IdHistoriaClinica) return;
    this.historiaActual = historia;
    this.historiaSeleccionadaId = historia.IdHistoriaClinica;
    this.cargarDatosHistoria(historia.IdHistoriaClinica);
  }

  cargarDatosHistoria(idHistoria: number): void {
    this.cargando = true;
    this.cargarDiagnosticos(idHistoria);
    this.cargarTratamientos(idHistoria);
    this.cargarSignosVitales(idHistoria);
    this.cargarExamenFisico(idHistoria);
    this.cargarRecetas(idHistoria);
    this.cargarProcedimientos(idHistoria);
    this.cargarCirugiasPorHistoria(idHistoria);
    this.cargarControlesPorHistoria(idHistoria);
    this.cargarArchivos(idHistoria);
    this.nuevaReceta.IdHistoriaClinica = idHistoria;
    this.nuevoDiagnostico.IdHistoriaClinica = idHistoria;
    this.nuevoTratamiento.IdHistoriaClinica = idHistoria;
    this.nuevoProcedimiento.IdHistoriaClinica = idHistoria;
    this.nuevaCirugia.IdHistoriaClinica = idHistoria;
    this.nuevoControl.IdHistoriaClinica = idHistoria;
    this.seccionActiva = 'consulta';
    this.cargando = false;
  }

  crearHistoria(): void {
    this.error = '';
    this.mensaje = '';

    if (!this.nuevaHistoria.IdMascota) {
      this.error = 'Debe seleccionar una mascota.';
      return;
    }
    if (!this.nuevaHistoria.IdVeterinario) {
      this.error = 'Debe seleccionar un veterinario.';
      return;
    }
    if (!this.nuevaHistoria.MotivoConsulta?.trim()) {
      this.error = 'El motivo de consulta es obligatorio.';
      return;
    }

    this.nuevaHistoria.UsuarioIdCreacion = this.getUsuarioId();

    this.historiasService.crear(this.nuevaHistoria).subscribe({
      next: (respuesta: any) => {
        this.mensaje = 'Atención creada correctamente.';
        this.historiaSeleccionadaId = respuesta.IdHistoriaClinica;
        this.seccionActiva = 'consulta';
        if (this.mascotaSeleccionada?.IdMascota) {
          this.cargarHistoriasPorMascota(this.mascotaSeleccionada.IdMascota);
        }
        this.historiaActual = {
          IdHistoriaClinica: respuesta.IdHistoriaClinica,
          IdMascota: this.nuevaHistoria.IdMascota,
          IdVeterinario: this.nuevaHistoria.IdVeterinario,
          FechaAtencion: this.nuevaHistoria.FechaAtencion,
          MotivoConsulta: this.nuevaHistoria.MotivoConsulta
        };
        this.cargarDatosHistoria(respuesta.IdHistoriaClinica);
      },
      error: (err: any) => {
        console.error(err);
        this.error = err.error?.mensaje || 'Error creando la atención.';
      }
    });
  }

  // =====================================================
  // ANTECEDENTES
  // =====================================================
  cargarAntecedentesPorMascota(idMascota: number): void {
    this.antecedentesService.obtenerPorMascota(idMascota).subscribe({
      next: (respuesta: any) => {
        if (respuesta.datos) {
          this.antecedentes = { ...this.antecedentes, ...respuesta.datos };
        }
      },
      error: (err: any) => {
        console.error('Error cargando antecedentes:', err);
      }
    });
  }

  guardarAntecedentes(): void {
    this.error = '';
    this.mensaje = '';
    if (!this.antecedentes.IdMascota) {
      this.error = 'Debe seleccionar una mascota.';
      return;
    }
    this.antecedentes.UsuarioIdCreacion = this.getUsuarioId();
    this.antecedentesService.crear(this.antecedentes).subscribe({
      next: (respuesta: any) => {
        this.mensaje = 'Antecedentes guardados correctamente.';
      },
      error: (err: any) => {
        console.error(err);
        this.error = err.error?.mensaje || 'Error guardando antecedentes.';
      }
    });
  }

  // =====================================================
  // SIGNOS VITALES
  // =====================================================
  cargarSignosVitales(idHistoria: number): void {
    this.signosService.obtenerPorHistoria(idHistoria).subscribe({
      next: (respuesta: any) => {
        if (respuesta.datos) {
          this.signosVitales = respuesta.datos;
        } else {
          this.signosVitales = this.crearNuevosSignosVitales();
          this.signosVitales.IdHistoriaClinica = idHistoria;
        }
      },
      error: (err: any) => {
        console.error('Error cargando signos vitales:', err);
        this.signosVitales = this.crearNuevosSignosVitales();
        this.signosVitales.IdHistoriaClinica = idHistoria;
      }
    });
  }

  guardarSignosVitales(): void {
    this.error = '';
    this.mensaje = '';
    if (!this.signosVitales.IdHistoriaClinica) {
      this.error = 'Debe abrir una historia clínica.';
      return;
    }
    if (this.signosVitales.IdSignosVitales) {
      this.signosService.actualizar(this.signosVitales.IdSignosVitales, this.signosVitales).subscribe({
        next: () => { this.mensaje = 'Signos vitales actualizados.'; },
        error: (err: any) => { this.error = err.error?.mensaje || 'Error.'; }
      });
    } else {
      this.signosService.crear(this.signosVitales).subscribe({
        next: () => { this.mensaje = 'Signos vitales guardados.'; },
        error: (err: any) => { this.error = err.error?.mensaje || 'Error.'; }
      });
    }
  }

  // =====================================================
  // EXAMEN FISICO
  // =====================================================
  cargarExamenFisico(idHistoria: number): void {
    this.examenService.obtenerPorHistoria(idHistoria).subscribe({
      next: (respuesta: any) => {
        if (respuesta.datos) {
          this.examenFisico = respuesta.datos;
        } else {
          this.examenFisico = this.crearNuevoExamenFisico();
          this.examenFisico.IdHistoriaClinica = idHistoria;
        }
      },
      error: (err: any) => {
        console.error('Error cargando examen físico:', err);
        this.examenFisico = this.crearNuevoExamenFisico();
        this.examenFisico.IdHistoriaClinica = idHistoria;
      }
    });
  }

  guardarExamenFisico(): void {
    this.error = '';
    this.mensaje = '';
    if (!this.examenFisico.IdHistoriaClinica) {
      this.error = 'Debe abrir una historia clínica.';
      return;
    }
    if (this.examenFisico.IdExamenFisico) {
      this.examenService.actualizar(this.examenFisico.IdExamenFisico, this.examenFisico).subscribe({
        next: () => { this.mensaje = 'Examen físico actualizado.'; },
        error: (err: any) => { this.error = err.error?.mensaje || 'Error.'; }
      });
    } else {
      this.examenService.crear(this.examenFisico).subscribe({
        next: () => { this.mensaje = 'Examen físico guardado.'; },
        error: (err: any) => { this.error = err.error?.mensaje || 'Error.'; }
      });
    }
  }

  // =====================================================
  // DIAGNOSTICOS
  // =====================================================
  cargarDiagnosticos(idHistoria: number): void {
    this.diagnosticosService.listarPorHistoria(idHistoria).subscribe({
      next: (respuesta: any) => {
        this.diagnosticos = respuesta.datos || [];
      },
      error: (err: any) => {
        console.error('Error cargando diagnósticos:', err);
      }
    });
  }

  agregarDiagnostico(): void {
    this.error = '';
    if (!this.nuevoDiagnostico.IdHistoriaClinica) {
      this.error = 'Debe abrir una historia clínica.';
      return;
    }
    if (!this.nuevoDiagnostico.Diagnostico?.trim()) {
      this.error = 'El diagnóstico es obligatorio.';
      return;
    }
    this.nuevoDiagnostico.UsuarioIdCreacion = this.getUsuarioId();
    this.diagnosticosService.crear(this.nuevoDiagnostico).subscribe({
      next: () => {
        this.mensaje = 'Diagnóstico agregado.';
        this.nuevoDiagnostico = this.crearNuevoDiagnostico();
        this.nuevoDiagnostico.IdHistoriaClinica = this.historiaSeleccionadaId || 0;
        if (this.historiaSeleccionadaId) {
          this.cargarDiagnosticos(this.historiaSeleccionadaId);
        }
      },
      error: (err: any) => { this.error = err.error?.mensaje || 'Error.'; }
    });
  }

  eliminarDiagnostico(id?: number): void {
    if (!id) return;
    if (!confirm('¿Eliminar este diagnóstico?')) return;
    this.diagnosticosService.eliminar(id).subscribe({
      next: () => {
        this.mensaje = 'Diagnóstico eliminado.';
        if (this.historiaSeleccionadaId) {
          this.cargarDiagnosticos(this.historiaSeleccionadaId);
        }
      },
      error: (err: any) => { this.error = err.error?.mensaje || 'Error.'; }
    });
  }

  // =====================================================
  // TRATAMIENTOS
  // =====================================================
  cargarTratamientos(idHistoria: number): void {
    this.tratamientosService.listarPorHistoria(idHistoria).subscribe({
      next: (respuesta: any) => {
        this.tratamientos = respuesta.datos || [];
      },
      error: (err: any) => { console.error('Error:', err); }
    });
  }

  agregarTratamiento(): void {
    this.error = '';
    if (!this.nuevoTratamiento.IdHistoriaClinica) {
      this.error = 'Debe abrir una historia clínica.';
      return;
    }
    if (!this.nuevoTratamiento.NombreTratamiento?.trim()) {
      this.error = 'El nombre del tratamiento es obligatorio.';
      return;
    }
    this.nuevoTratamiento.UsuarioIdCreacion = this.getUsuarioId();
    this.tratamientosService.crear(this.nuevoTratamiento).subscribe({
      next: () => {
        this.mensaje = 'Tratamiento agregado.';
        this.nuevoTratamiento = this.crearNuevoTratamiento();
        this.nuevoTratamiento.IdHistoriaClinica = this.historiaSeleccionadaId || 0;
        if (this.historiaSeleccionadaId) {
          this.cargarTratamientos(this.historiaSeleccionadaId);
        }
      },
      error: (err: any) => { this.error = err.error?.mensaje || 'Error.'; }
    });
  }

  finalizarTratamiento(tratamiento: Tratamiento): void {
    if (!tratamiento.IdTratamiento) return;
    if (!confirm('¿Finalizar este tratamiento?')) return;
    this.tratamientosService.finalizar(tratamiento.IdTratamiento, this.getUsuarioId()).subscribe({
      next: () => {
        this.mensaje = 'Tratamiento finalizado.';
        if (this.historiaSeleccionadaId) {
          this.cargarTratamientos(this.historiaSeleccionadaId);
        }
      },
      error: (err: any) => { this.error = err.error?.mensaje || 'Error.'; }
    });
  }

  // =====================================================
  // RECETAS
  // =====================================================
  cargarRecetas(idHistoria: number): void {
    this.recetasService.listarPorHistoria(idHistoria).subscribe({
      next: (respuesta: any) => {
        this.recetas = respuesta.datos || [];
      },
      error: (err: any) => { console.error('Error:', err); }
    });
  }

  abrirFormularioReceta(): void {
    this.mostrarFormularioReceta = true;
    this.nuevaReceta = {
      IdHistoriaClinica: this.historiaSeleccionadaId || 0,
      IdVeterinario: this.nuevaHistoria.IdVeterinario || 0,
      Observaciones: '',
      IndicacionesGenerales: '',
      detalle: [] as DetalleReceta[]
    };
  }

  cerrarFormularioReceta(): void {
    this.mostrarFormularioReceta = false;
  }

  agregarMedicamento(): void {
    if (!this.medicamentoActual.Medicamento?.trim()) {
      this.error = 'El medicamento es obligatorio.';
      return;
    }
    this.nuevaReceta.detalle.push({ ...this.medicamentoActual });
    this.medicamentoActual = this.crearNuevoMedicamento();
  }

  eliminarMedicamento(index: number): void {
    this.nuevaReceta.detalle.splice(index, 1);
  }

  guardarReceta(): void {
    this.error = '';
    if (!this.nuevaReceta.IdHistoriaClinica) {
      this.error = 'Debe abrir una historia clínica.';
      return;
    }
    if (!this.nuevaReceta.IdVeterinario) {
      this.error = 'Debe seleccionar un veterinario.';
      return;
    }
    if (this.nuevaReceta.detalle.length === 0) {
      this.error = 'Debe agregar al menos un medicamento.';
      return;
    }
    this.nuevaReceta.UsuarioIdCreacion = this.getUsuarioId();
    this.recetasService.crear(this.nuevaReceta).subscribe({
      next: () => {
        this.mensaje = 'Receta creada correctamente.';
        this.mostrarFormularioReceta = false;
        if (this.historiaSeleccionadaId) {
          this.cargarRecetas(this.historiaSeleccionadaId);
        }
      },
      error: (err: any) => { this.error = err.error?.mensaje || 'Error creando receta.'; }
    });
  }

  cancelarReceta(receta: any): void {
    if (!receta.IdReceta) return;
    if (!confirm('¿Cancelar esta receta?')) return;
    this.recetasService.cancelar(receta.IdReceta).subscribe({
      next: () => {
        this.mensaje = 'Receta cancelada.';
        if (this.historiaSeleccionadaId) {
          this.cargarRecetas(this.historiaSeleccionadaId);
        }
      },
      error: (err: any) => { this.error = err.error?.mensaje || 'Error.'; }
    });
  }

  // =====================================================
  // PROCEDIMIENTOS
  // =====================================================
  cargarProcedimientos(idHistoria: number): void {
    this.procedimientosService.listarPorHistoria(idHistoria).subscribe({
      next: (respuesta: any) => {
        this.procedimientos = respuesta.datos || [];
      },
      error: (err: any) => { console.error('Error:', err); }
    });
  }

  mostrarFormularioNuevoProcedimiento(): void {
    this.mostrarFormularioProcedimiento = true;
    this.nuevoProcedimiento = this.crearNuevoProcedimiento();
    this.nuevoProcedimiento.IdHistoriaClinica = this.historiaSeleccionadaId || 0;
  }

  guardarProcedimiento(): void {
    this.error = '';
    if (!this.nuevoProcedimiento.IdHistoriaClinica) {
      this.error = 'Debe abrir una historia clínica.';
      return;
    }
    if (!this.nuevoProcedimiento.NombreProcedimiento?.trim()) {
      this.error = 'El nombre del procedimiento es obligatorio.';
      return;
    }
    this.nuevoProcedimiento.UsuarioIdCreacion = this.getUsuarioId();
    this.procedimientosService.crear(this.nuevoProcedimiento).subscribe({
      next: () => {
        this.mensaje = 'Procedimiento registrado.';
        this.mostrarFormularioProcedimiento = false;
        if (this.historiaSeleccionadaId) {
          this.cargarProcedimientos(this.historiaSeleccionadaId);
        }
      },
      error: (err: any) => { this.error = err.error?.mensaje || 'Error.'; }
    });
  }

  // =====================================================
  // CIRUGIAS
  // =====================================================
  cargarCirugiasPorMascota(idMascota: number): void {
    this.cirugiasService.listarPorMascota(idMascota).subscribe({
      next: (respuesta: any) => {
        this.cirugias = respuesta.datos || [];
      },
      error: (err: any) => { console.error('Error:', err); }
    });
  }

  cargarCirugiasPorHistoria(idHistoria: number): void {
    this.cirugiasService.listarPorHistoria(idHistoria).subscribe({
      next: (respuesta: any) => {
        this.cirugias = respuesta.datos || [];
      },
      error: (err: any) => { console.error('Error:', err); }
    });
  }

  mostrarFormularioNuevaCirugia(): void {
    this.mostrarFormularioCirugia = true;
    this.nuevaCirugia = this.crearNuevaCirugia();
    this.nuevaCirugia.IdHistoriaClinica = this.historiaSeleccionadaId || null;
    this.nuevaCirugia.IdMascota = this.mascotaSeleccionada?.IdMascota || 0;
  }

  guardarCirugia(): void {
    this.error = '';
    if (!this.nuevaCirugia.IdMascota) {
      this.error = 'Debe seleccionar una mascota.';
      return;
    }
    if (!this.nuevaCirugia.IdVeterinario) {
      this.error = 'Debe seleccionar un veterinario.';
      return;
    }
    if (!this.nuevaCirugia.TipoCirugia?.trim()) {
      this.error = 'El tipo de cirugía es obligatorio.';
      return;
    }
    this.nuevaCirugia.UsuarioIdCreacion = this.getUsuarioId();
    this.cirugiasService.crear(this.nuevaCirugia).subscribe({
      next: () => {
        this.mensaje = 'Cirugía registrada.';
        this.mostrarFormularioCirugia = false;
        if (this.mascotaSeleccionada?.IdMascota) {
          this.cargarCirugiasPorMascota(this.mascotaSeleccionada.IdMascota);
        }
        if (this.historiaSeleccionadaId) {
          this.cargarCirugiasPorHistoria(this.historiaSeleccionadaId);
        }
      },
      error: (err: any) => { this.error = err.error?.mensaje || 'Error.'; }
    });
  }

  // =====================================================
  // CONTROLES
  // =====================================================
  cargarControlesPorMascota(idMascota: number): void {
    this.controlesService.listarPorMascota(idMascota).subscribe({
      next: (respuesta: any) => {
        this.controles = respuesta.datos || [];
      },
      error: (err: any) => { console.error('Error:', err); }
    });
  }

  cargarControlesPorHistoria(idHistoria: number): void {
    this.controlesService.listarPorHistoria(idHistoria).subscribe({
      next: (respuesta: any) => {
        this.controles = respuesta.datos || [];
      },
      error: (err: any) => { console.error('Error:', err); }
    });
  }

  mostrarFormularioNuevoControl(): void {
    this.mostrarFormularioControl = true;
    this.nuevoControl = this.crearNuevoControl();
    this.nuevoControl.IdHistoriaClinica = this.historiaSeleccionadaId || null;
    this.nuevoControl.IdMascota = this.mascotaSeleccionada?.IdMascota || 0;
  }

  guardarControl(): void {
    this.error = '';
    if (!this.nuevoControl.IdMascota) {
      this.error = 'Debe seleccionar una mascota.';
      return;
    }
    if (!this.nuevoControl.IdVeterinario) {
      this.error = 'Debe seleccionar un veterinario.';
      return;
    }
    this.nuevoControl.UsuarioIdCreacion = this.getUsuarioId();
    this.controlesService.crear(this.nuevoControl).subscribe({
      next: () => {
        this.mensaje = 'Control registrado.';
        this.mostrarFormularioControl = false;
        if (this.mascotaSeleccionada?.IdMascota) {
          this.cargarControlesPorMascota(this.mascotaSeleccionada.IdMascota);
        }
        if (this.historiaSeleccionadaId) {
          this.cargarControlesPorHistoria(this.historiaSeleccionadaId);
        }
      },
      error: (err: any) => { this.error = err.error?.mensaje || 'Error.'; }
    });
  }

  // =====================================================
  // ARCHIVOS
  // =====================================================
  cargarArchivos(idHistoria: number): void {
    this.archivosService.listarPorHistoria(idHistoria).subscribe({
      next: (respuesta: any) => {
        this.archivos = respuesta.datos || [];
      },
      error: (err: any) => { console.error('Error:', err); }
    });
  }

  onArchivoSeleccionado(event: any): void {
    const file = event.target?.files?.[0];
    this.archivoSeleccionado = file || null;
    if (file) {
      this.tipoArchivoNuevo = this.detectarTipoArchivo(file.type, file.name);
    }
  }

  detectarTipoArchivo(mime: string, nombre: string): string {
    const ext = (nombre.split('.').pop() || '').toLowerCase();
    const tiposImagen = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/bmp'];
    if (tiposImagen.includes(mime) || ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(ext)) return 'Imagen';
    if (mime === 'application/pdf' || ext === 'pdf') return 'PDF';
    if (['doc', 'docx'].includes(ext)) return 'Documento';
    if (['xls', 'xlsx', 'csv'].includes(ext)) return 'Hoja de cálculo';
    return 'Documento';
  }

  subirArchivo(): void {
    this.error = '';
    this.mensaje = '';

    if (!this.historiaSeleccionadaId) {
      this.error = 'Debe abrir una historia clínica.';
      return;
    }
    if (!this.archivoSeleccionado) {
      this.error = 'Debe seleccionar un archivo.';
      return;
    }

    this.subiendoArchivo = true;
    this.archivosService
      .subirArchivo(
        this.historiaSeleccionadaId,
        this.archivoSeleccionado,
        this.tipoArchivoNuevo,
        this.descripcionArchivoNueva
      )
      .subscribe({
        next: () => {
          this.mensaje = 'Archivo subido correctamente.';
          this.archivoSeleccionado = null;
          this.descripcionArchivoNueva = '';
          this.tipoArchivoNuevo = 'Documento';
          this.subiendoArchivo = false;
          this.cargarArchivos(this.historiaSeleccionadaId!);
        },
        error: (err: any) => {
          console.error('Error subiendo archivo:', err);
          this.error = err.error?.mensaje || 'Error subiendo el archivo.';
          this.subiendoArchivo = false;
        }
      });
  }

  descargarArchivo(archivo: any): void {
    if (!archivo.IdArchivo) return;
    this.archivosService.descargar(archivo.IdArchivo).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = archivo.NombreArchivo || 'archivo';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: (err: any) => {
        console.error('Error descargando archivo:', err);
        this.error = 'No fue posible descargar el archivo.';
      }
    });
  }

  eliminarArchivo(archivo: any): void {
    if (!archivo.IdArchivo) return;
    if (!confirm(`¿Eliminar el archivo "${archivo.NombreArchivo}"?`)) return;
    this.archivosService.eliminar(archivo.IdArchivo).subscribe({
      next: () => {
        this.mensaje = 'Archivo eliminado correctamente.';
        if (this.historiaSeleccionadaId) {
          this.cargarArchivos(this.historiaSeleccionadaId);
        }
      },
      error: (err: any) => {
        console.error('Error eliminando archivo:', err);
        this.error = err.error?.mensaje || 'Error eliminando el archivo.';
      }
    });
  }

  formatearTamano(bytes: any): string {
    if (!bytes) return '';
    const b = Number(bytes);
    if (b < 1024) return `${b} B`;
    if (b < 1024 * 1024) return `${(b / 1024).toFixed(1)} KB`;
    return `${(b / (1024 * 1024)).toFixed(2)} MB`;
  }

  // =====================================================
  // UTILIDADES
  // =====================================================
  getUsuarioId(): number {
    const usuario = localStorage.getItem('usuario');
    if (usuario) {
      try {
        const parsed = JSON.parse(usuario);
        return parsed.UsuarioId || 0;
      } catch {
        return 0;
      }
    }
    return 0;
  }

  limpiarMensajes(): void {
    this.mensaje = '';
    this.error = '';
  }

  nombreCompletoVeterinario(v: Veterinario): string {
    return [v.PrimerNombre, v.SegundoNombre, v.PrimerApellido, v.SegundoApellido]
      .filter(x => x)
      .join(' ');
  }

  calcularEdad(mascota: Mascota | null): string {
    if (!mascota?.FechaNacimiento) return '';
    const nacimiento = new Date(mascota.FechaNacimiento);
    const hoy = new Date();
    let anos = hoy.getFullYear() - nacimiento.getFullYear();
    let meses = hoy.getMonth() - nacimiento.getMonth();
    if (meses < 0) { anos--; meses += 12; }
    if (anos > 0) return `${anos} año(s) ${meses} mes(es)`;
    return `${meses} mes(es)`;
  }

  // =====================================================
  // IMPRIMIR / EXPORTAR PDF DE LA HISTORIA CLINICA
  // =====================================================
  imprimirPDF(): void {
    if (!this.historiaSeleccionadaId) {
      this.error = 'Debe abrir una historia clínica para imprimir.';
      return;
    }
    this.mensaje = '';
    this.error = '';

    const token = localStorage.getItem('token');
    fetch(this.historiasService.imprimirPDF(this.historiaSeleccionadaId), {
      headers: token ? { Authorization: `Bearer ${token}` } : {}
    })
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}`);
        }
        return res.blob();
      })
      .then((blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historia_clinica_${this.historiaSeleccionadaId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        this.mensaje = 'Historia clínica descargada en PDF.';
      })
      .catch((err: any) => {
        console.error('Error generando PDF:', err);
        this.error = 'No fue posible generar el PDF. Verifique sus permisos.';
      });
  }
}
