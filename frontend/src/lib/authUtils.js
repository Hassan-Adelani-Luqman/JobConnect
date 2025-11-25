// Small auth-related utilities extracted from AuthContext to avoid
// recreating helper functions during Fast Refresh / HMR.

export function parseJwt(token) {
  try {
    const payload = token.split('.')[1]
    // Add padding if needed
    const padded = payload.padEnd(payload.length + (4 - (payload.length % 4)) % 4, '=')
    const decoded = atob(padded)
    return JSON.parse(decoded)
  } catch (err) {
    // Keep behavior consistent with previous implementation
    // caller should handle null return
    // Avoid console.error noise during harmless failures
    return null
  }
}
