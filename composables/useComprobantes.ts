import { useGeneralStore } from "~/stores/general";
import { unwrapBlobError } from "~/composables/useApiError";

/**
 * Comprobantes (facturas) de los períodos del abono.
 *
 * El sistema no emite la factura: la administración la sube al período y de acá
 * la baja el cliente. Las dos pantallas que la tocan —`/estado-plan` para la
 * empresa y `/superadmin/empresas/[id]` para la plataforma— usan el mismo
 * composable para que el manejo del PDF y de los errores sea uno solo.
 */
export const useComprobantes = () => {
  const general = useGeneralStore();

  /**
   * Abre el comprobante en una pestaña nueva.
   *
   * Se abre en vez de descargar —como la hoja de ruta y la orden de taller— por
   * lo que la gente hace con una factura: mirarla o imprimirla, no archivarla.
   */
  const abrir = async (url: string): Promise<boolean> => {
    const { $api } = useNuxtApp();
    try {
      const resp = await $api.get(url, { responseType: "blob" });
      const blobUrl = window.URL.createObjectURL(
        new Blob([resp.data], { type: "application/pdf" }),
      );
      window.open(blobUrl, "_blank");
      return true;
    } catch (e) {
      general.setErrorSnackbar(await unwrapBlobError(e));
      return false;
    }
  };

  /** El comprobante de un período, visto por la empresa dueña. */
  const abrirMio = (subscriptionId: string) =>
    abrir(`billing/subscriptions/${subscriptionId}/invoice/`);

  /** El mismo comprobante, visto desde el panel de la plataforma. */
  const abrirDeEmpresa = (companyId: string, subscriptionId: string) =>
    abrir(`superadmin/companies/${companyId}/billing/${subscriptionId}/invoice/`);

  /**
   * Sube el comprobante de un período (sólo superadmin).
   *
   * El número de comprobante va en el mismo `FormData` que el archivo: es lo
   * que el cliente cita cuando reclama una factura, así que cargarlo después
   * en otra pantalla sería una invitación a dejarlo vacío.
   */
  const subir = async (
    companyId: string,
    subscriptionId: string,
    file: File,
    invoiceNumber?: string,
  ): Promise<boolean> => {
    const { $api } = useNuxtApp();
    const form = new FormData();
    form.append("file", file);
    if (invoiceNumber) form.append("invoiceNumber", invoiceNumber);
    try {
      await $api.post(
        `superadmin/companies/${companyId}/billing/${subscriptionId}/invoice/`,
        form,
        { headers: { "Content-Type": "multipart/form-data" } },
      );
      general.setSuccessSnackbar("Comprobante cargado");
      return true;
    } catch (e) {
      general.setErrorSnackbar(e);
      return false;
    }
  };

  /**
   * Da de baja el comprobante de un período (sólo superadmin).
   *
   * El archivo no se borra de S3: se corta el vínculo, así que el cliente deja
   * de verlo y se puede subir el correcto.
   */
  const quitar = async (
    companyId: string,
    subscriptionId: string,
  ): Promise<boolean> => {
    const { $api } = useNuxtApp();
    try {
      await $api.delete(
        `superadmin/companies/${companyId}/billing/${subscriptionId}/invoice/`,
      );
      general.setSuccessSnackbar("Comprobante dado de baja");
      return true;
    } catch (e) {
      general.setErrorSnackbar(e);
      return false;
    }
  };

  return { abrirMio, abrirDeEmpresa, subir, quitar };
};

/** Sólo PDF: es lo que el backend acepta y lo que el cliente espera abrir. */
export const COMPROBANTE_ACCEPT = "application/pdf,.pdf";
