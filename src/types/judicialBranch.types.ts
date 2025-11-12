export interface Pagination {
  cantidadRegistros: number;
  registrosPagina: number;
  cantidadPaginas: number;
  pagina: number;
  paginas: number;
}
export interface ProcesoData {
  idProceso: string;
  idConexion: number;
  llaveProceso: string;
  fechaProceso: string;
  fechaUltimaActuacion: string;
  despacho: string;
  departamento: string;
  sujetosProcesales: string;
  esPrivado: boolean;
  cantFilas: number;
}
[];

export interface Actuations {
  idRegActuacion: number;
  llaveProceso: string;
  consActuacion: number;
  fechaActuacion: Date;
  actuacion: string;
  anotacion: string;
  fechaInicial?: string;
  fechaFinal?: string;
  fechaRegistro?: string;
  codRegla: string;
  conDocumentos: boolean;
  cant: number;
}
[];

export interface Actuaciones {
  actuaciones: Actuations[]
  paginacion: Pagination
}