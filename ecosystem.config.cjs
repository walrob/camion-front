module.exports = {
  apps: [
    {
      name: "frontNatu",
      script: ".output/server/index.mjs",
      // __dirname = directorio donde vive este archivo en el servidor.
      // Sin esto, PM2 resuelve rutas relativas desde donde fue ejecutado,
      // lo que puede variar y causar "Cannot find module".
      cwd: __dirname,

      // fork: un solo proceso. Cluster no aporta con 1 CPU y duplica RAM.
      exec_mode: "fork",
      instances: 1,

      // Reinicio automático si supera 250MB (previene OOM silencioso)
      max_memory_restart: "250M",

      env_production: {
        NODE_ENV: "production",
        PORT: 3002,
        NITRO_HOST: "0.0.0.0",
        NITRO_PORT: 3002,
        // Limitar heap de Node a 200MB. Deja margen para el SO y otras apps.
        NODE_OPTIONS: "--max-old-space-size=200",
      },

      kill_timeout: 5000,

      // Reintentos ante crash con backoff
      restart_delay: 4000,
      max_restarts: 10,
      min_uptime: "20s",

      // Nunca usar watch en producción
      watch: false,

      // Reinicio preventivo semanal (limpia memory leaks menores)
      cron_restart: "0 3 * * 0",
    },
  ],
};
