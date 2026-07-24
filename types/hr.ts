import type { Audit, Truck } from "~/types/fleet";

export interface Employee extends Audit {
  userId?: string | null;
  firstName: string;
  lastName: string;
  documentId: string;
  birthDate?: string | null;
  position: string;
  hireDate?: string | null;
  terminationDate?: string | null;
  // Derivado y de solo lectura: lo recalcula el backend a partir del historial
  // de movimientos. Ya no se edita desde el formulario.
  employmentStatus: string;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  photoKey?: string | null;
  notes?: string;
  certifications?: Certification[];
  assignments?: TruckAssignment[];
  movements?: EmploymentMovement[];
}

// Payload de alta de empleado. `hireDate` genera automáticamente el movimiento
// de ingreso; el backend ya no acepta `employmentStatus` ni `terminationDate`.
export interface EmployeeCreatePayload
  extends Partial<Omit<Employee, "employmentStatus" | "terminationDate">> {
  email?: string;
  password?: string;
  role?: string;
}

// Payload de edición: además de lo anterior, tampoco acepta `hireDate` (para
// corregir el ingreso hay que editar el movimiento `hire` del historial).
export type EmployeeUpdatePayload = Partial<
  Omit<Employee, "employmentStatus" | "terminationDate" | "hireDate">
>;

export type EmploymentMovementType =
  | "hire" // ingreso
  | "leave" // licencia
  | "suspension" // suspensión
  | "reinstatement" // reincorporación
  | "termination"; // baja

export type LeaveType =
  | "vacation"
  | "sick"
  | "work_accident"
  | "parental"
  | "unpaid"
  | "study"
  | "bereavement"
  | "other";

export interface EmploymentMovement extends Audit {
  employeeId: string;
  employee?: Employee;
  type: EmploymentMovementType;
  leaveType: LeaveType | null; // solo cuando type === 'leave'
  startDate: string; // 'YYYY-MM-DD'
  endDate: string | null; // solo leave/suspension; null = período abierto
  resultingStatus: "active" | "on_leave" | "suspended" | "terminated";
  reason: string | null;
  fileKey: string | null;
  notes: string | null;
  createdBy?: string | null;
}

export interface Certification extends Audit {
  employeeId: string;
  type: string;
  class?: string;
  number?: string;
  issuedBy?: string;
  issueDate?: string | null;
  expiryDate?: string | null;
  fileKey?: string | null;
  status: string;
  notes?: string;
}

export interface TruckAssignment extends Audit {
  employeeId: string;
  truckId: string;
  truck?: Truck;
  assignedAt?: string;
  unassignedAt?: string | null;
  isPrimary: boolean;
  notes?: string;
}
