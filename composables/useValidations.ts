export const useValidations = () => {
  return {
    isRequired: (v: unknown): true | string => !!v || "Requerido",

    isRequieredRadioTrue: (v: unknown): true | string =>
      v != null || "Requerido",

    isRequieredArray: (v: unknown): true | string =>
      (Array.isArray(v) && v.length > 0) || "Requerido",

    isEmail: (v: string): true | string =>
      !v || /.+@.+\..+/.test(v) || "E-mail inválido",

    isPhone: (v: string): true | string =>
      !v || /^[\d\-\(\)\s]+$/.test(v) || "Teléfono inválido",
    // !v || /\([0-9]{3}\)\.[0-9]{3}\.[0-9]{4}/.test(v) || "Teléfono inválido",

    isNumber: (v: string): true | string =>
      !v || /^\d+$/.test(v) || "Número inválido",

    isNumberDecimal: (v: string): true | string =>
      !v || /^\d+(\.\d{1,4})?$/.test(v) || "Número inválido",

    // Validación genérica: mayor a un valor mínimo
    isGreaterThan:
      (min: number) =>
      (v: string): true | string =>
        !v || Number(v) >= min || `Debe ser mayor a ${min}`,

    isPassword: (v: string): true | string =>
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*[0-9])(?=.{6,})/.test(v) ||
      "La contraseña debe tener al menos 6 caracteres, una mayúscula, una minúscula y un número",

    // lower: (v: string): boolean => /[a-z]/.test(v),
    // upper: (v: string): boolean => /[A-Z]/.test(v),
    // numbers: (v: string): boolean => !v ||/[0-9]/.test(v),

    // isValidHour: (v: string): true | string =>
    //   !v || /^([01]\d|2[0-3]):([0-5]\d)$/.test(v) || "Formato inválido (24Hs)",

    isValidHour: (v: string): true | string => {
      if (!v) return true;
      if (!/^([01]\d|2[0-3]):([0-5]\d)$/.test(v))
        return "Formato inválido (24Hs)";

      const minute = Number(v.split(":")[1]);
      return (
        minute === 0 || minute === 30 || "Solo se permiten minutos 00 o 30"
      );
    },

    // r.maxFileSize(5)
    maxFileSize:
      (maxMB: number) =>
      (file: File | undefined): true | string => {
        if (!file) return true; // No hay archivo aún
        const sizeInMB = file.size / 1024 / 1024;
        return sizeInMB <= maxMB || `El archivo no puede superar ${maxMB} MB`;
      },

    // r.allowedExtensions(['.png','.jpg','.pdf'])
    allowedExtensions:
      (extensions: string[]) =>
      (file: File | undefined): true | string => {
        if (!file) return true;
        const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
        return (
          extensions.includes(ext) ||
          `Solo se permiten: ${extensions.join(", ")}`
        );
      },
  };
};
