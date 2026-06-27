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
  employmentStatus: string;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  photoKey?: string | null;
  notes?: string;
  certifications?: Certification[];
  assignments?: TruckAssignment[];
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
