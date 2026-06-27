import { defineStore } from "pinia";
import { useGeneralStore } from "@/stores/general";
import type { Employee, Certification, TruckAssignment } from "~/types/hr";
import type { Truck } from "~/types/fleet";

export const useHrStore = defineStore("hr", {
  state: () => ({
    employees: [] as Employee[],
    employee: null as Employee | null,
    certifications: [] as Certification[],
    assignments: [] as TruckAssignment[],
    truckOptions: [] as Truck[],

    loading: false,
    loadingDetail: false,
    search: "",
    filterPosition: "" as string,
    filterStatus: "" as string,
    pagination: {
      totalItems: 0,
      itemCount: 0,
      itemsPerPage: 10,
      totalPages: 0,
      currentPage: 1,
    },
  }),

  actions: {
    // ───────── Empleados ─────────
    async getEmployees() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loading = true;
      return await $api
        .get("hr/employees/", {
          params: {
            page: this.pagination.currentPage,
            limit: this.pagination.itemsPerPage,
            search: this.search || undefined,
            position: this.filterPosition || undefined,
            employmentStatus: this.filterStatus || undefined,
          },
        })
        .then((resp) => {
          this.employees = resp.data.items;
          this.pagination = resp.data.meta;
        })
        .catch((e) => general.setErrorSnackbar(e))
        .finally(() => (this.loading = false));
    },

    async getEmployee(id: string) {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      this.loadingDetail = true;
      return await $api
        .get(`hr/employees/${id}/`)
        .then((resp) => {
          this.employee = resp.data;
          this.certifications = resp.data.certifications ?? [];
          this.assignments = resp.data.assignments ?? [];
          return resp.data;
        })
        .catch((e) => general.setErrorSnackbar(e))
        .finally(() => (this.loadingDetail = false));
    },

    async createEmployee(payload: Partial<Employee>) {
      return this.mutate("post", "hr/employees/", payload, "Empleado creado", () =>
        this.getEmployees(),
      );
    },

    async updateEmployee(id: string, payload: Partial<Employee>) {
      return this.mutate(
        "patch",
        `hr/employees/${id}/`,
        payload,
        "Empleado actualizado",
        () => this.getEmployee(id),
      );
    },

    async deleteEmployee(id: string) {
      return this.mutate("delete", `hr/employees/${id}/`, null, "Empleado eliminado", () =>
        this.getEmployees(),
      );
    },

    // ───────── Certificaciones ─────────
    async createCertification(payload: Partial<Certification>) {
      return this.mutate(
        "post",
        "hr/certifications/",
        payload,
        "Permiso agregado",
        () => this.getEmployee(payload.employeeId as string),
      );
    },

    async updateCertification(id: string, employeeId: string, payload: Partial<Certification>) {
      return this.mutate(
        "patch",
        `hr/certifications/${id}/`,
        payload,
        "Permiso actualizado",
        () => this.getEmployee(employeeId),
      );
    },

    async deleteCertification(id: string, employeeId: string) {
      return this.mutate(
        "delete",
        `hr/certifications/${id}/`,
        null,
        "Permiso eliminado",
        () => this.getEmployee(employeeId),
      );
    },

    // ───────── Asignaciones ─────────
    async assignTruck(payload: { employeeId: string; truckId: string; isPrimary?: boolean; notes?: string }) {
      return this.mutate(
        "post",
        "hr/assignments/",
        payload,
        "Camión asignado",
        () => this.getEmployee(payload.employeeId),
      );
    },

    async unassign(id: string, employeeId: string) {
      return this.mutate(
        "delete",
        `hr/assignments/${id}/`,
        null,
        "Asignación finalizada",
        () => this.getEmployee(employeeId),
      );
    },

    async getTruckOptions() {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      return await $api
        .get("trucks/", { params: { limit: 100, page: 1 } })
        .then((resp) => (this.truckOptions = resp.data.items))
        .catch((e) => general.setErrorSnackbar(e));
    },

    // Helper genérico de mutación con snackbar + refresco.
    async mutate(
      method: "post" | "patch" | "delete",
      url: string,
      payload: any,
      successMsg: string,
      refresh: () => Promise<any>,
    ): Promise<boolean> {
      const { $api } = useNuxtApp();
      const general = useGeneralStore();
      try {
        if (method === "delete") await $api.delete(url);
        else await ($api as any)[method](url, payload);
        general.setSuccessSnackbar(successMsg);
        await refresh();
        return true;
      } catch (e) {
        general.setErrorSnackbar(e);
        return false;
      }
    },
  },
});
