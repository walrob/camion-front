// Utilidades puras para interpretar errores de Axios/NestJS de forma homogénea.

/** Mensaje legible para el usuario a partir de cualquier error de la API. */
export function extractErrorMessage(error: any): string {
  // Sin respuesta del servidor (red caída / timeout).
  if (error && !error.response) {
    if (error.code === "ERR_NETWORK") return "Sin conexión con el servidor";
    if (error.code === "ECONNABORTED") return "La solicitud tardó demasiado";
  }

  const data = error?.response?.data;
  const msg = data?.message ?? data?.error;
  if (Array.isArray(msg)) return msg.join(" · ");
  if (typeof msg === "string" && msg.trim()) return msg;

  const status = error?.response?.status;
  if (status === 401) return "Tu sesión expiró o no estás autorizado";
  if (status === 403) return "No tenés permisos para esta acción";
  if (status === 404) return "No se encontró el recurso solicitado";
  if (status >= 500) return "Error del servidor. Intentá nuevamente en unos minutos";

  return "Ocurrió un error inesperado";
}

/**
 * Mapea errores de validación (422/400) a sus campos.
 * Soporta el formato de NestJS `class-validator` (`message: string[]` con el
 * nombre del campo al inicio) y el formato `{ errors: { campo: [...] } }`.
 */
export function extractFieldErrors(error: any): Record<string, string> {
  const data = error?.response?.data;
  const out: Record<string, string> = {};

  const msg = data?.message;
  const arr = Array.isArray(msg) ? msg : typeof msg === "string" ? [msg] : [];
  for (const m of arr) {
    const text = String(m).trim();
    // class-validator emite "<campo> <regla>" (ej: "plate should not be empty").
    const field = text.split(/\s+/)[0];
    if (field && !out[field]) out[field] = text;
  }

  const errObj = data?.errors;
  if (errObj && typeof errObj === "object") {
    for (const [k, v] of Object.entries(errObj)) {
      out[k] = Array.isArray(v) ? String(v[0]) : String(v);
    }
  }

  return out;
}
