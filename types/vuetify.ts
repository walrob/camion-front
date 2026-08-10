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

/**
 * Tipos de gráfico que acepta ApexCharts.
 *
 * Se declara acá porque las props de los componentes de gráfico estaban
 * tipadas como `string`, lo que dejaba pasar valores que la librería rechaza
 * recién en tiempo de ejecución.
 */
export type ApexChartType =
  | 'line'
  | 'area'
  | 'bar'
  | 'pie'
  | 'donut'
  | 'radialBar'
  | 'scatter'
  | 'bubble'
  | 'heatmap'
  | 'candlestick'
  | 'boxPlot'
  | 'violin'
  | 'radar'
  | 'polarArea'
  | 'rangeBar'
  | 'rangeArea'
  | 'treemap';
