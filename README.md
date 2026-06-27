# 🚀 Instalación & Ejecución Rápida

## 1️⃣ Requisitos Previos

```bash
# Node.js (v18 o superior)
node --version

# NPM (v9 o superior)
npm --version
```

## 2️⃣ Instalación de Dependencias

```bash
# En la carpeta del proyecto
npm install
```

## 3️⃣ Iniciar Servidor de Desarrollo

```bash
npm run dev
```

📍 Accede a: **http://localhost:3000**

---

## 🎯 Primera Ejecución

1. El navegador abrirá automáticamente `http://localhost:3000`
2. Verás la página principal del e-commerce

---

## 📋 Comandos Útiles

```bash
# Desarrollo (hot reload)
npm run dev

# Build para producción
npm run build

# Preview de producción
npm run preview

# Verificar tipos TypeScript
npm run type-check

# Ejecutar linter
npm run lint

# Ejecutar tests (si están configurados)
npm run test
```

---

## 🛠️ Troubleshooting

### Error: "Port 3000 already in use"

```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :3000
kill -9 <PID>
```

### Error: "Module not found"

```bash
# Limpiar e reinstalar
rm -rf node_modules package-lock.json
npm install
```

### Error: "Cannot find python"

```bash
npm install --build-from-source
```

---
