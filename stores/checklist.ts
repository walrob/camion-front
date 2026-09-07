import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";

/** Lo que el chofer contesta, antes de interpretarlo. */
export type ChecklistAnswer = "yes" | "no" | "na";

/**
 * Qué clase de punto es. No todo lo que hay en una planilla es una inspección:
 * hay declaraciones que se aceptan, fotos que se piden siempre y texto libre.
 */
export type ChecklistItemType = "condition" | "ack" | "photo" | "text";

export interface ChecklistItem {
  id: string;
  key: string;
  label: string;
  status: string;
  notes?: string;
  order?: number;
  /** Bloque de la planilla: «Estado del tractor», «Estado del equipo de frío». */
  section?: string | null;
  /** Advertencia o instrucción que la empresa quiere a la vista del chofer. */
  helpText?: string | null;
  type?: ChecklistItemType;
  /**
   * La respuesta que indica que está todo bien. «¿Tiene pérdidas?» espera NO:
   * por eso el sí/no se dibuja contra esto y no contra un OK/Falla fijo.
   */
  expectedAnswer?: ChecklistAnswer;
  answer?: ChecklistAnswer | null;
  /** Copiados de la plantilla de la empresa al crear el checklist. */
  isCritical?: boolean;
  requiresPhotoOnFail?: boolean;
  requiresPhoto?: boolean;
  minPhotos?: number;
  maxPhotos?: number | null;
  requiresValidationOnFail?: boolean;
}

export interface ChecklistCompanion {
  id: string;
  /** Legajo, cuando la persona ya está en el sistema. */
  employeeId?: string | null;
  /** Si al declararlo su DNI ya estaba cargado: entonces no hay que adjuntarlo. */
  idDocumentOnFile?: boolean;
  fullName: string;
  document?: string | null;
  relationship?: string | null;
  insuranceRequested: boolean;
  notes?: string | null;
}

/** Alguien del sistema que se puede declarar como acompañante. */
export interface CompanionCandidate {
  id: string;
  fullName: string;
  position: string;
  hasIdDocument: boolean;
}

export interface Checklist {
  id: string;
  tripId: string;
  truckId: string;
  trailerId?: string | null;
  driverId: string;
  result: string;
  /** Identidad del formulario con el que se emitió: «RIP 06 09 01» «REV.04». */
  templateCode?: string | null;
  templateRevision?: string | null;
  hasCompanion?: boolean | null;
  notes?: string | null;
  lat?: number | null;
  lng?: number | null;
  signatureKey?: string | null;
  signedAt?: string | null;
  validatedBy?: string | null;
  validatedAt?: string | null;
  validationNotes?: string | null;
  items: ChecklistItem[];
  companions?: ChecklistCompanion[];
}

/** Un bloque de la planilla, con los puntos que le corresponden. */
export interface ChecklistSection {
  name: string | null;
  items: ChecklistItem[];
}

export const useChecklistStore = defineStore("checklist", {
  state: () => ({
    checklist: null as Checklist | null,
    /** Cuántas fotos tiene cada punto que exige alguna. Clave: id del ítem. */
    photoCounts: {} as Record<string, number>,
    /** Bandeja de Tráfico: planillas firmadas que esperan que alguien libere. */
    pendientes: [] as Checklist[],
    loading: false,
    saving: false,
  }),

  getters: {
    isApproved: (state) => state.checklist?.result === "approved",
    /**
     * Firmado, sin importar el resultado. Un checklist con una falla en un
     * punto crítico queda **rechazado**: sigue firmado y no se puede volver a
     * firmar, así que la pantalla tiene que mirar esto y no `isApproved`.
     */
    isSigned: (state) => !!state.checklist?.signedAt,
    isRejected: (state) => state.checklist?.result === "rejected",
    /**
     * Firmada pero sin liberar: la unidad NO se dirige al cliente hasta que
     * Tráfico la valide. Es un estado distinto de aprobado y de rechazado, y
     * la pantalla del chofer tiene que decirlo con todas las letras.
     */
    isPendingValidation: (state) =>
      state.checklist?.result === "pending_validation",

    /**
     * Los puntos agrupados por bloque, en el orden de la plantilla.
     *
     * Una planilla con tres bloques —tractor, equipo de frío, furgón— leída
     * como una lista corrida de quince preguntas es otra planilla: el chofer
     * pierde de vista qué está mirando.
     */
    secciones(state): ChecklistSection[] {
      const items = [...(state.checklist?.items ?? [])].sort(
        (a, b) => (a.order ?? 0) - (b.order ?? 0),
      );
      const orden: (string | null)[] = [];
      const porSeccion = new Map<string | null, ChecklistItem[]>();
      for (const item of items) {
        const nombre = item.section || null;
        if (!porSeccion.has(nombre)) {
          porSeccion.set(nombre, []);
          orden.push(nombre);
        }
        porSeccion.get(nombre)!.push(item);
      }
      return orden.map((name) => ({ name, items: porSeccion.get(name)! }));
    },

    /** Los puntos que se cuentan como "revisados" en la barra de avance. */
    itemsQueSeContestan(state): ChecklistItem[] {
      return (state.checklist?.items ?? []).filter(
        (i) => (i.type ?? "condition") === "condition" || i.type === "ack",
      );
    },
  },

  actions: {
    async load(tripId: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      try {
        const resp = await $api.get(`checklists/trip/${tripId}/`);
        this.checklist = resp.data;
        await this.loadPhotoCounts();
      } catch (e) {
        general.setErrorSnackbar(e);
      } finally {
        this.loading = false;
      }
    },

    /**
     * Cuántas fotos tiene ya cada punto que exige alguna.
     *
     * Se consulta sólo por esos puntos y no por todos: en una planilla de
     * quince ítems, pedir los adjuntos de cada uno son quince llamadas para
     * responder algo que casi siempre es cero.
     */
    async loadPhotoCounts() {
      const { $api } = useNuxtApp();
      const conFoto = (this.checklist?.items ?? []).filter(
        (i) => i.requiresPhoto || i.requiresPhotoOnFail || i.maxPhotos != null,
      );
      if (!conFoto.length) return;
      const counts: Record<string, number> = {};
      await Promise.all(
        conFoto.map(async (item) => {
          try {
            const { data } = await $api.get("attachments/", {
              params: { entityType: "checklist_item", entityId: item.id },
            });
            counts[item.id] = Array.isArray(data) ? data.length : 0;
          } catch {
            // Sin conexión no se sabe cuántas hay. Cero es el supuesto seguro:
            // la pantalla pide la foto y, si ya estaba, el back no se queja.
            counts[item.id] = 0;
          }
        }),
      );
      this.photoCounts = { ...this.photoCounts, ...counts };
    },

    fotosDe(itemId: string): number {
      return this.photoCounts[itemId] ?? 0;
    },

    /** Crea el checklist del viaje si aún no existe. */
    async ensure(payload: {
      tripId: string;
      truckId: string;
      driverId: string;
      trailerId?: string | null;
    }) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      try {
        if (!this.checklist) {
          const body: Record<string, unknown> = {
            tripId: payload.tripId,
            truckId: payload.truckId,
            driverId: payload.driverId,
          };
          if (payload.trailerId) body.trailerId = payload.trailerId;
          const resp = await $api.post("checklists/", body);
          this.checklist = resp.data;
          await this.loadPhotoCounts();
        }
      } catch (e) {
        general.setErrorSnackbar(e);
      } finally {
        this.loading = false;
      }
    },

    /** Cabecera: furgón, acompañante declarado, observación general, ubicación. */
    async updateHeader(payload: {
      trailerId?: string | null;
      hasCompanion?: boolean;
      notes?: string;
      lat?: number;
      lng?: number;
    }) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      if (!this.checklist) return false;
      try {
        const { data } = await $api.patch(
          `checklists/${this.checklist.id}/`,
          payload,
        );
        this.checklist = { ...this.checklist, ...data };
        return true;
      } catch (e) {
        general.setErrorSnackbar(e);
        return false;
      }
    },

    async updateItem(
      itemId: string,
      payload: { answer?: ChecklistAnswer; status?: string; notes?: string },
      file?: File | null,
    ) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        if (Object.keys(payload).length) {
          await $api.patch(`checklists/items/${itemId}/`, payload);
        }
        if (file) {
          await this.uploadAttachment("checklist_item", itemId, file);
          this.photoCounts[itemId] = (this.photoCounts[itemId] ?? 0) + 1;
        }
        if (this.checklist) {
          const resp = await $api.get(`checklists/trip/${this.checklist.tripId}/`);
          this.checklist = resp.data;
        }
        return true;
      } catch (e) {
        general.setErrorSnackbar(e);
        return false;
      }
    },

    // ───────── Acompañantes ─────────

    /**
     * Las personas del sistema que se pueden declarar como acompañantes.
     *
     * No trae el número de documento a propósito: el chofer necesita elegir a
     * alguien, no leer los datos personales de sus compañeros. Lo completa el
     * servidor al guardar.
     */
    async getCompanionCandidates(search?: string): Promise<CompanionCandidate[]> {
      const { $api } = useNuxtApp();
      try {
        const { data } = await $api.get("checklists/companion-candidates/", {
          params: search ? { search } : {},
        });
        return data;
      } catch {
        // Sin señal no se puede elegir del sistema, pero sí cargar a mano: el
        // buscador vacío no puede dejar al chofer sin poder declarar a nadie.
        return [];
      }
    },

    async addCompanion(payload: {
      employeeId?: string;
      fullName?: string;
      document?: string;
      relationship?: string;
      insuranceRequested?: boolean;
      notes?: string;
    }) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      if (!this.checklist) return false;
      try {
        await $api.post(`checklists/${this.checklist.id}/companions/`, payload);
        await this.load(this.checklist.tripId);
        return true;
      } catch (e) {
        general.setErrorSnackbar(e);
        return false;
      }
    },

    async removeCompanion(companionId: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      if (!this.checklist) return false;
      try {
        await $api.delete(`checklists/companions/${companionId}/`);
        await this.load(this.checklist.tripId);
        return true;
      } catch (e) {
        general.setErrorSnackbar(e);
        return false;
      }
    },

    /** La foto del DNI del acompañante, por el módulo de adjuntos. */
    async uploadCompanionDocument(companionId: string, file: File) {
      const general = useGeneralStore();
      try {
        await this.uploadAttachment("checklist_companion", companionId, file);
        general.setSuccessSnackbar("Documento adjuntado.");
        return true;
      } catch (e) {
        general.setErrorSnackbar(e);
        return false;
      }
    },

    // ───────── Firma ─────────

    async sign(signatureBlob: Blob, geo?: { lat: number; lng: number } | null) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      if (!this.checklist) return false;
      this.saving = true;
      try {
        const file = new File([signatureBlob], "firma.png", { type: "image/png" });
        const att = await this.uploadAttachment(
          "checklist_signature",
          this.checklist.id,
          file,
        );
        const body: Record<string, unknown> = { signatureKey: att.s3Key };
        if (geo) {
          body.lat = geo.lat;
          body.lng = geo.lng;
        }
        await $api.post(`checklists/${this.checklist.id}/sign/`, body);
        await this.load(this.checklist.tripId);
        // El mensaje depende de cómo quedó: decir "aprobado" cuando la unidad
        // no está liberada es exactamente el malentendido que hay que evitar.
        general.setSuccessSnackbar(
          this.isPendingValidation
            ? "Planilla firmada. Queda esperando la validación de Tráfico."
            : this.isRejected
              ? "Planilla firmada. Quedó rechazada: avisá a tráfico."
              : "Checklist firmado y aprobado",
        );
        return true;
      } catch (e) {
        general.setErrorSnackbar(e);
        return false;
      } finally {
        this.saving = false;
      }
    },

    // ───────── Validación de Tráfico (backoffice) ─────────

    async getPendientes() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      try {
        const { data } = await $api.get("checklists/pending-validation/");
        this.pendientes = data;
      } catch (e) {
        general.setErrorSnackbar(e);
      } finally {
        this.loading = false;
      }
    },

    async validate(id: string, payload: { approved: boolean; notes?: string }) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.saving = true;
      try {
        await $api.post(`checklists/${id}/validate/`, payload);
        general.setSuccessSnackbar(
          payload.approved
            ? "Unidad liberada."
            : "Planilla rechazada. La unidad no sale.",
        );
        await this.getPendientes();
        return true;
      } catch (e) {
        general.setErrorSnackbar(e);
        return false;
      } finally {
        this.saving = false;
      }
    },

    async uploadAttachment(entityType: string, entityId: string, file: File) {
      const { $api } = useNuxtApp();
      const form = new FormData();
      form.append("file", file);
      form.append("entityType", entityType);
      form.append("entityId", entityId);
      const resp = await $api.post("attachments/upload/", form);
      return resp.data;
    },
  },
});
