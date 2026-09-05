export interface ExamenFisico {
  IdExamenFisico?: number;
  IdHistoriaClinica: number;
  EstadoGeneral?: string | null;
  Cabeza?: string | null;
  Ojos?: string | null;
  Oidos?: string | null;
  Nariz?: string | null;
  Boca?: string | null;
  Cuello?: string | null;
  SistemaRespiratorio?: string | null;
  SistemaCardiovascular?: string | null;
  Abdomen?: string | null;
  SistemaDigestivo?: string | null;
  SistemaUrinario?: string | null;
  SistemaReproductivo?: string | null;
  SistemaMusculoesqueletico?: string | null;
  PielYPelaje?: string | null;
  SistemaNeurologico?: string | null;
  Ganglios?: string | null;
  OtrosHallazgos?: string | null;
  ObservacionesGenerales?: string | null;
  FechaCreacion?: string;
}
