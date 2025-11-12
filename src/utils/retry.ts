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
