export function parseAllowedOrigins(env?: string): string[] {
  return (env || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean)
}
