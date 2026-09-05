export interface Diagnostico {
  IdDiagnostico?: number;
  IdHistoriaClinica: number;
  Diagnostico: string;
  CodigoDiagnostico?: string | null;
  TipoDiagnostico?: string;
  Observaciones?: string | null;
  FechaCreacion?: string;
  UsuarioIdCreacion?: number | null;
}
