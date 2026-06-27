export const formatDateLocal = (dateString: string | null): string => {
  // RETORNA 30/02/2020
  if (!dateString) return "";
  let date = null;
  if (dateString.includes("T")) {
    date = new Date(dateString);
  } else {
    const [year, month, day] = dateString.split("-").map(Number);
    date = new Date(year, month - 1, day);
  }
  const options: Intl.DateTimeFormatOptions = {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  };
  return date.toLocaleDateString("es-ES", options);
};

export const formatDateSmallLocal = (dateString: string | null): string => {
  // RETORNA 30/02
  if (!dateString) return "";
  let date = null;
  if (dateString.includes("T")) {
    date = new Date(dateString);
  } else {
    const [year, month, day] = dateString.split("-").map(Number);
    date = new Date(year, month - 1, day);
  }
  const options: Intl.DateTimeFormatOptions = {
    month: "2-digit",
    day: "2-digit",
  };
  return date.toLocaleDateString("es-ES", options);
};

export const formatHourLocal = (dateString: Date | string | null): string => {
  // RETORNA 20:15
  if (!dateString) return "";
  let date = null;
  if (typeof dateString !== "string") {
    date = dateString;
  } else {
    date = new Date(dateString);
  }
  const options: Intl.DateTimeFormatOptions = {
    hour: "numeric",
    minute: "2-digit",
    hour12: false,
  };
  return date.toLocaleTimeString("es-ES", options);
};

export const formatDateLocalLarge = (
  dateString: Date | string | null,
): string => {
  // RETORNA fecha en texto
  if (!dateString) return "";
  let date = null;
  if (typeof dateString !== "string") {
    date = dateString;
  } else if (dateString.includes("T")) {
    date = new Date(dateString);
  } else {
    const [year, month, day] = dateString.split("-").map(Number);
    date = new Date(year, month - 1, day);
  }
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  };
  // Capitaliza la primera letra
  const formatted = date.toLocaleDateString("es-ES", options);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export const formatDateLocalLargeWithTime = (
  date: Date | string | null,
): string => {
  // RETORNA "Sábado, 29 de junio de 2025, 14:35"
  if (!date) return "";
  let d = null;
  if (typeof date !== "string") {
    d = date;
  } else if (date.includes("T")) {
    d = new Date(date);
  } else {
    const [year, month, day] = date.split("-").map(Number);
    d = new Date(year, month - 1, day);
  }
  const options: Intl.DateTimeFormatOptions = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  };
  const formatted = d.toLocaleDateString("es-ES", options);
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export const formatDateInput = (date: Date | string): string => {
  // RETORNA 2020-02-30
  if (!date) return "";
  const d = typeof date === "string" ? new Date(date) : date;
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0"); // dos dígitos
  const day = String(d.getDate()).padStart(2, "0"); // dos dígitos
  return `${year}-${month}-${day}`;
};

export const formatStartDate = (date: Date): string => {
  // RETORNA 2025-07-05T00:00:00.000Z
  if (!date) return "";
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};

export const formatEndtDate = (date: Date): string => {
  // RETORNA 2025-07-05T00:00:00.000Z
  if (!date) return "";
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
};

export const formatTime = (date: Date): string => {
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
};

export const isSameDayOrInRange = (
  dateStr: string | Date,
  from: Date,
  to: Date,
) => {
  const d = new Date(dateStr);
  // Ignora la hora
  d.setHours(0, 0, 0, 0);
  const f = new Date(from);
  f.setHours(0, 0, 0, 0);
  const t = new Date(to);
  t.setHours(0, 0, 0, 0);
  return d >= f && d <= t;
};

export const generarHorasIntervalo = (
  horaDesde: string,
  horaHasta: string,
  durationConsultation: number,
): string[] => {
  const resultado: string[] = [];
  const [desdeHora, desdeMin] = horaDesde.split(":").map(Number);
  const [hastaHora, hastaMin] = horaHasta.split(":").map(Number);
  const inicio = new Date();
  inicio.setHours(desdeHora, desdeMin, 0, 0);
  const fin = new Date();
  fin.setHours(hastaHora, hastaMin, 0, 0);
  const actual = new Date(inicio);
  while (actual <= fin) {
    const horaFormateada: string = actual.toLocaleTimeString("es-AR", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    resultado.push(horaFormateada);
    actual.setMinutes(actual.getMinutes() + durationConsultation);
  }
  return resultado;
};

const config = useRuntimeConfig();

export const returnUrlImg = (value: string | undefined) => {
  if (!value) return undefined;
  return config.public.apiFilesUrl + value;
};

export function isImage(url?: string): boolean {
  return !!url && /\.(jpeg|jpg|png|gif|webp)$/i.test(url);
}

export function joinNonEmpty(values: Array<string | null | undefined>) {
  return values
    .filter((v): v is string => v !== undefined && v !== null && v !== "")
    .join(" - ");
}

export const formatCurrencyARS = (amount: number | string | null): string => {
  if (amount === null) return "";
  const value =
    typeof amount === "string" ? parseFloat(amount.replace(/,/g, ".")) : amount;
  if (isNaN(value)) return "";

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
};

export const formatCurrencySmallARS = (
  amount: number | string | null,
): string => {
  if (amount === null) return "";

  // Convertir string → number
  const num = typeof amount === "string" ? Number(amount) : amount;

  // Validar que sea un número válido
  if (isNaN(num)) return "";

  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(num);
};

export function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}

export function gcdArray(arr: number[]): number {
  return arr.reduce((acc, val) => gcd(acc, val));
}

export function stringToHash(str: string): number {
  let hash = 5381;
  for (let i = 0; i < str.length; i++) {
    hash = (hash * 33) ^ str.charCodeAt(i); // ^ = XOR
  }
  return Math.abs(hash);
}

export function getAge(birthDate: string): number {
  // birthDate en formato "YYYY-MM-DD"
  const birth = new Date(birthDate);
  const today = new Date();

  let age = today.getFullYear() - birth.getFullYear();
  const monthDiff = today.getMonth() - birth.getMonth();
  const dayDiff = today.getDate() - birth.getDate();

  // Si todavía no cumplió años este año, restamos 1
  if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
    age--;
  }
  return age;
}

export const addMinutes = (date: Date, minutes: number) => {
  return new Date(date.getTime() + minutes * 60 * 1000);
};

export const parseTime = (time?: string): [number, number] => {
  if (!time) return [0, 0];
  const [h, m] = time.split(":").map(Number);
  return [h ?? 0, m ?? 0];
};

export const buildLocalDate = (date: string, time: string): Date => {
  const [year, month, day] = date.split("-").map(Number);
  const [hour, minute] = parseTime(time);

  return new Date(year, month - 1, day, hour, minute);
};

export function rnd(a: number, b: number) {
  return Math.floor((b - a + 1) * Math.random()) + a;
}
