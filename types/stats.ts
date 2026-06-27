import type { CashFlowType, PaymentMethod } from "./enums";

export type NumberAssistance = Record<string, number>;

export interface Series {
  name: string;
  data: number[];
}

export type Timeline = {
  start: Date | string | null;
  end: Date | string | null;
  title: string;
  subtitle: string;
  boldtext: boolean;
  description: string;
  url: string;
  id: string;
};

export type PaymentStats = {
  byMethod: StatsMethods[];
  total: {
    ingreso: number;
    egreso: number;
  };
};

export type StatsMethods = {
  method: PaymentMethod;
  type: CashFlowType;
  total: number;
  count: number;
};

export type StatsAlert = {
  activeHospitalizations: number;
  expiringLots: number;
  lowStockMedicines: number;
  todaySurgeries: number;
};
