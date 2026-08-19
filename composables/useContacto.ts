/**
 * Datos de contacto públicos de NorthAr Consulting.
 *
 * Viven en un solo lugar porque aparecen repartidos entre la landing, el pie
 * de página y los dos documentos legales: si mañana cambia el número o la
 * casilla, no puede quedar una versión vieja escondida en un `mailto:`.
 */
export const CONTACTO = {
  /** Casilla única de contacto: comercial, legales y privacidad. */
  email: "info@northar.com.ar",
  /** Número en formato internacional, sin `+` ni separadores. */
  whatsapp: "543624569542",
  /** Se muestra al usuario; el link siempre usa `whatsappUrl`. */
  whatsappVisible: "+54 362 456-9542",
  /**
   * `api.whatsapp.com` en vez de `wa.me`: abre WhatsApp Web en escritorio y la
   * app en el celular, que es lo que se espera de un botón de contacto.
   */
  whatsappUrl:
    "https://api.whatsapp.com/send/?phone=543624569542&text&type=phone_number&app_absent=0",
  linkedin: "https://www.linkedin.com/company/northar-consulting/",
  instagram: "https://www.instagram.com/northar.consulting/",
} as const;
