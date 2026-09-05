module.exports = {
  apps: [
    {
      name: "camionex-front",
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

      // `env` y no `env_production`: con `env_production` la configuración sólo
      // se aplica si alguien se acuerda de pasar `--env production`, y si se
      // olvida el proceso arranca sin PORT —Nitro cae al 3000— y sin
      // NODE_ENV. Un arranque que depende de un flag es un arranque que
      // tarde o temprano se hace mal, y el síntoma (el puerto equivocado) no
      // se parece en nada a la causa.
      env: {
        NODE_ENV: "production",
        PORT: 3006,
        NITRO_HOST: "127.0.0.1",
        NITRO_PORT: 3006,
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

      // Reinicio preventivo semanal (limpia memory leaks menores).
      // Domingo 3:10 y no 3:00 en punto: el EC2 es compartido y las horas
      // redondas son donde se amontonan las tareas de los demás sistemas.
      cron_restart: "10 3 * * 0",
    },
  ],
};
