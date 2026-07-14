// Attaches the logged-in student's JWT (manual login or Firebase) to a request.
// Matches the token keys AuthContext writes to localStorage.
export function authHeaders() {
  const token = localStorage.getItem('jwt_token') || localStorage.getItem('firebase_jwt')
  return token ? { Authorization: `Bearer ${token}` } : {}
}
