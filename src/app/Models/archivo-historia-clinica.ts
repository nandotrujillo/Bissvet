export interface ArchivoHistoriaClinica {
  IdArchivo?: number;
  IdHistoriaClinica: number;
  TipoArchivo?: string;
  NombreArchivo: string;
  Descripcion?: string | null;
  RutaArchivo: string;
  TamanoBytes?: number | null;
  TipoMIME?: string | null;
  FechaCreacion?: string;
  UsuarioIdCreacion?: number | null;
}
