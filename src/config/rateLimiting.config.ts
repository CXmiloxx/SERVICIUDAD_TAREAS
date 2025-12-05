export const rateLimitingConfig = {
  batchSize: 8,
  delayBetweenBatches: 5000,
  delayBetweenRequests: 1200,
  delayBetweenPages: 800,
  maxConsecutiveErrors: 3,
  pauseOnMaxErrors: 45000,
  requestTimeout: 20000,
  retry: {
    attempts: 4,
    initialDelay: 3000,
    maxDelay: 20000,
    exponentialBackoff: true
  }
};

