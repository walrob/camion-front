import { ref } from "vue";
import { extractFieldErrors } from "~/composables/useApiError";

/**
 * Maneja errores de validación del servidor a nivel de campo en un formulario.
 *
 * Uso:
 *   const fe = useFormErrors();
 *   try { await store.createX(payload) }
 *   catch (e) { fe.setFromError(e) }
 *   // en el template:  :error-messages="fe.messages('plate')"
 */
export function useFormErrors() {
  const errors = ref<Record<string, string>>({});

  const setFromError = (error: any) => {
    errors.value = extractFieldErrors(error);
  };

  const clear = () => {
    errors.value = {};
  };

  const clearField = (field: string) => {
    if (errors.value[field]) {
      const next = { ...errors.value };
      delete next[field];
      errors.value = next;
    }
  };

  const messages = (field: string): string[] =>
    errors.value[field] ? [errors.value[field]] : [];

  return { errors, setFromError, clear, clearField, messages };
}
