// Cuentas de demo («Probar sin registrarse»): cada visitante tiene la suya y se borra a las 24 h.
// `.invalid` es un dominio reservado: nunca será un correo real. Compartido entre cliente y servidor.
export const DEMO_EMAIL_DOMAIN = "demo.comicverse.invalid";
export const DEMO_TTL_MS = 24 * 60 * 60 * 1000;

export function isDemoEmail(email: string) {
  return email.endsWith(`@${DEMO_EMAIL_DOMAIN}`);
}
