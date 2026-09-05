export interface Antecedente {
  IdAntecedente?: number;
  IdMascota: number;
  EnfermedadesAnteriores?: string | null;
  CirugiasAnteriores?: string | null;
  Alergias?: string | null;
  Vacunacion?: string | null;
  Desparasitacion?: string | null;
  MedicamentosActuales?: string | null;
  TratamientosAnteriores?: string | null;
  AntecedentesHereditarios?: string | null;
  Alimentacion?: string | null;
  Habitos?: string | null;
  Observaciones?: string | null;
  FechaCreacion?: string;
  UsuarioIdCreacion?: number | null;
  FechaModificacion?: string;
  UsuarioIdModificacion?: number | null;
  NombreMascota?: string;
}
