interface RetryOptions {
  retries?: number;
  initialDelay?: number;
  maxDelay?: number;
  exponentialBackoff?: boolean;
  shouldRetry?: (error: any) => boolean;
}

export async function retry<T>(
  fn: () => Promise<T>,
  retries = 2,
  delay = 2000
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    if (retries <= 0) throw error;
    console.log(`🔁 Reintentando... (${retries} intentos restantes)`);
    await new Promise((r) => setTimeout(r, delay));
    return retry(fn, retries - 1, delay);
  }
}

export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    retries = 3,
    initialDelay = 1000,
    maxDelay = 10000,
    exponentialBackoff = true,
    shouldRetry = (error: any) => {
      const status = error?.response?.status;
      return status === 403 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504;
    }
  } = options;

  let lastError: any;
  let currentDelay = initialDelay;

  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (error: any) {
      lastError = error;

      if (attempt === retries || !shouldRetry(error)) {
        throw error;
      }

      const status = error?.response?.status || 'desconocido';
      console.log(`🔁 Reintentando (${attempt + 1}/${retries}) tras error ${status}... Esperando ${currentDelay}ms`);

      await new Promise((r) => setTimeout(r, currentDelay));

      if (exponentialBackoff) {
        currentDelay = Math.min(currentDelay * 2, maxDelay);
      }
    }
  }

  throw lastError;
}
