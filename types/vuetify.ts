export interface CalendarTimestamp {
  date: string;
  time?: string;
  year: number;
  month: number;
  day: number;
  weekday: number;
  hour?: number;
  minute?: number;
  second?: number;
  hasDay: boolean;
  hasTime: boolean;
  past: boolean;
  present: boolean;
  future: boolean;
}

export interface CalendarRangeChange {
  start: CalendarTimestamp;
  end: CalendarTimestamp;
}

export interface CalendarEvent<T = unknown> {
  id: string;
  name: string;
  start: string;
  end?: string;
  category?: string;
  raw: T;
  timed?: boolean;
}

export interface CalendarCategory {
  [key: string]: any;
  name?: string;
  categoryName?: string;
}

export type CalendarType =
  | "week"
  | "day"
  | "month"
  | "category"
  | "4day"
  | "custom-daily"
  | "custom-weekly";
