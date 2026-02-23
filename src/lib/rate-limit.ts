const rateMap = new Map<string, { count: number; resetTime: number }>();

export function rateLimit(key: string, maxRequests = 100, windowMs = 60000): { success: boolean } {
  const now = Date.now();
  const entry = rateMap.get(key);

  if (!entry || now > entry.resetTime) {
    rateMap.set(key, { count: 1, resetTime: now + windowMs });
    return { success: true };
  }

  if (entry.count >= maxRequests) {
    return { success: false };
  }

  entry.count++;
  return { success: true };
}

// Clean up expired entries periodically
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateMap.entries()) {
    if (now > entry.resetTime) rateMap.delete(key);
  }
}, 60000);
