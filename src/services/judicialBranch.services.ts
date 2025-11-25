import axios from 'axios';
import { config } from '../config/config';
import { retry } from '../utils/retry';

const BASE_URL =
  config.ramaJudicialUrl ||
  'https://consultaprocesos.ramajudicial.gov.co:448/api/v2';

export class JudicialBranchServices {
  
  /** Obtiene el idProceso usando el numero de radicado */
  async obtenerIdProceso(nroRadicado: string): Promise<string> {
    return retry(async () => {
      const url = `${BASE_URL}/Procesos/Consulta/NumeroRadicacion?numero=${nroRadicado}&SoloActivos=false&pagina=1`;
      const { data } = await axios.get(url, { timeout: 10000 });

      if (!data?.procesos?.length) {
        throw new Error(`No se encontró el proceso para ${nroRadicado}`);
      }

      return data.procesos[0].idProceso;
    });
  }

  /** Obtiene todas las actuaciones de un proceso */
  async obtenerActuaciones(idProceso: string): Promise<any[]> {
    try {
      const urlPrimera = `${BASE_URL}/Proceso/Actuaciones/${idProceso}?pagina=1`;
      const { data } = await axios.get(urlPrimera, { timeout: 1000 });

      if (!data?.actuaciones) return [];

      const totalPaginas = data.paginacion?.cantidadPaginas || 1;
      let actuaciones = Array.isArray(data.actuaciones)
        ? [...data.actuaciones]
        : [data.actuaciones];

      // Si hay más páginas, recorrerlas
      if (totalPaginas > 1) {
        for (let pagina = 2; pagina <= totalPaginas; pagina++) {
          const { data: extra } = await axios.get(
            `${BASE_URL}/Proceso/Actuaciones/${idProceso}?pagina=${pagina}`,
          );


          if (Array.isArray(extra?.actuaciones)) {
            actuaciones = actuaciones.concat(extra.actuaciones);
          }
        }
      }

      return actuaciones;
    } catch (error: any) {
      throw new Error(error.message || 'Error al obtener las actuaciones');
    }
  }
}
