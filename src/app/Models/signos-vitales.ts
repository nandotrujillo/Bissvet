export interface SignosVitales {
  IdSignosVitales?: number;
  IdHistoriaClinica: number;
  Peso?: number | null;
  Temperatura?: number | null;
  FrecuenciaCardiaca?: number | null;
  FrecuenciaRespiratoria?: number | null;
  EstadoHidratacion?: string | null;
  CondicionCorporal?: string | null;
  Mucosas?: string | null;
  TiempoLlenadoCapilar?: number | null;
  Observaciones?: string | null;
  FechaCreacion?: string;
}
