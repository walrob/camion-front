import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// Los tests son de módulos puros (sin Nuxt): sólo hace falta resolver los
// alias `~/` y `@/` que usan esos módulos.
const raiz = fileURLToPath(new URL("./", import.meta.url));

export default defineConfig({
  resolve: {
    alias: { "~": raiz, "@": raiz },
  },
});
