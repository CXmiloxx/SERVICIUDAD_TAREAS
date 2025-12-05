import axios, { AxiosError } from 'axios';
import { config } from '../config/config';
import { rateLimitingConfig } from '../config/rateLimiting.config';
import { retryWithBackoff } from '../utils/retry';

const BASE_URL =
  config.ramaJudicialUrl ||
  'https://consultaprocesos.ramajudicial.gov.co:448/api/v2';

export class JudicialBranchServices {

  /** Obtiene el idProceso usando el numero de radicado */
  async obtenerIdProceso(nroRadicado: string): Promise<string> {
    return retryWithBackoff(async () => {
      const url = `${BASE_URL}/Procesos/Consulta/NumeroRadicacion?numero=${nroRadicado}&SoloActivos=false&pagina=1`;
      const { data } = await axios.get(url, {
        timeout: rateLimitingConfig.requestTimeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });

      if (!data?.procesos?.length) {
        throw new Error(`No se encontró el proceso para ${nroRadicado}`);
      }

      return data.procesos[0].idProceso;
    }, {
      retries: rateLimitingConfig.retry.attempts,
      initialDelay: rateLimitingConfig.retry.initialDelay,
      maxDelay: rateLimitingConfig.retry.maxDelay,
      exponentialBackoff: rateLimitingConfig.retry.exponentialBackoff
    });
  }

  /** Obtiene todas las actuaciones de un proceso */
  async obtenerActuaciones(idProceso: string): Promise<any[]> {
    return retryWithBackoff(async () => {
      const urlPrimera = `${BASE_URL}/Proceso/Actuaciones/${idProceso}?pagina=1`;
      const { data } = await axios.get(urlPrimera, {
        timeout: rateLimitingConfig.requestTimeout,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept': 'application/json'
        }
      });

      if (!data?.actuaciones) return [];

      const totalPaginas = data.paginacion?.cantidadPaginas || 1;
      let actuaciones = Array.isArray(data.actuaciones)
        ? [...data.actuaciones]
        : [data.actuaciones];

      // Si hay más páginas, recorrerlas
      if (totalPaginas > 1) {
        for (let pagina = 2; pagina <= totalPaginas; pagina++) {
          await new Promise(resolve => setTimeout(resolve, rateLimitingConfig.delayBetweenPages));

          const { data: extra } = await axios.get(
            `${BASE_URL}/Proceso/Actuaciones/${idProceso}?pagina=${pagina}`,
            {
              timeout: rateLimitingConfig.requestTimeout,
              headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
                'Accept': 'application/json'
              }
            }
          );

          if (Array.isArray(extra?.actuaciones)) {
            actuaciones = actuaciones.concat(extra.actuaciones);
          }
        }
      }

      return actuaciones;
    }, {
      retries: rateLimitingConfig.retry.attempts,
      initialDelay: rateLimitingConfig.retry.initialDelay,
      maxDelay: rateLimitingConfig.retry.maxDelay,
      exponentialBackoff: rateLimitingConfig.retry.exponentialBackoff
    });
  }
}
