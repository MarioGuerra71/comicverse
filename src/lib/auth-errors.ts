// Mensajes en español para los errores de Better Auth (que llegan en inglés).
const MESSAGES: Record<string, string> = {
  INVALID_EMAIL_OR_PASSWORD: "El correo o la contraseña no son correctos.",
  INVALID_EMAIL: "Ese correo electrónico no es válido.",
  INVALID_PASSWORD: "La contraseña no es correcta.",
  PASSWORD_TOO_SHORT: "La contraseña es demasiado corta (mínimo 8 caracteres).",
  PASSWORD_TOO_LONG: "La contraseña es demasiado larga.",
  USER_ALREADY_EXISTS: "Ya existe una cuenta con ese correo.",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: "Ya existe una cuenta con ese correo.",
};

/** Traduce el error del cliente de Better Auth; si no lo conocemos, un mensaje genérico. */
export function authErrorMessage(error: { code?: string; status?: number }, fallback: string) {
  if (error.status === 429) return "Demasiados intentos. Espera un poco y vuelve a probar.";
  return (error.code && MESSAGES[error.code]) || fallback;
}
