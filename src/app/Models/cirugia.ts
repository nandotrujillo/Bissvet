export interface RegistroPreoperatorio {
  IdRegistroPreoperatorio?: number;
  IdCirugia: number;
  Peso?: number | null;
  Temperatura?: number | null;
  FrecuenciaCardiaca?: number | null;
  FrecuenciaRespiratoria?: number | null;
  EstadoGeneral?: string | null;
  ExamenesPrequirurgicos?: string | null;
  RiesgoAnestesico?: string | null;
  Ayuno?: string | null;
  Observaciones?: string | null;
}

export interface RegistroAnestesico {
  IdRegistroAnestesico?: number;
  IdCirugia: number;
  MedicamentosAnestesicos?: string | null;
  Dosis?: string | null;
  HoraAdministracion?: string | null;
  ViaAdministracion?: string | null;
  HoraInicio?: string | null;
  HoraFin?: string | null;
  SignosVitales?: string | null;
  Observaciones?: string | null;
  Complicaciones?: string | null;
}

export interface RegistroPostoperatorio {
  IdRegistroPostoperatorio?: number;
  IdCirugia: number;
  EstadoPostoperatorio?: string | null;
  Medicamentos?: string | null;
  Tratamiento?: string | null;
  Recomendaciones?: string | null;
  Alimentacion?: string | null;
  Restricciones?: string | null;
  Cuidados?: string | null;
  SignosDeAlarma?: string | null;
  FechaControl?: string | null;
  Observaciones?: string | null;
}

export interface Cirugia {
  IdCirugia?: number;
  IdHistoriaClinica?: number | null;
  IdMascota: number;
  IdVeterinario: number;
  FechaProgramacion?: string | null;
  FechaCirugia?: string | null;
  TipoCirugia: string;
  Motivo?: string | null;
  DiagnosticoPreoperatorio?: string | null;
  DiagnosticoPostoperatorio?: string | null;
  ProcedimientoRealizado?: string | null;
  TipoAnestesia?: string | null;
  Observaciones?: string | null;
  Estado?: string;
  FechaCreacion?: string;
  UsuarioIdCreacion?: number | null;
  NombreMascota?: string;
  NombreVeterinario?: string;
  preoperatorio?: RegistroPreoperatorio | null;
  anestesico?: RegistroAnestesico | null;
  postoperatorio?: RegistroPostoperatorio | null;
}
