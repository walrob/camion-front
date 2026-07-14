# Manual de Usuario — Sistema de Gestión de Flota

> Guía práctica para operar el sistema día a día: qué hace cada rol, cómo se
> navega y cuál es el flujo completo de un viaje, desde el alta hasta la rendición.

> **Alcance de este documento.** Es una muestra de las funcionalidades ya
> desarrolladas, pensado para entender de un vistazo qué ofrece el sistema. No es
> un reglamento cerrado: los flujos y reglas de negocio concretos (por ejemplo, quién
> y cómo asigna un viaje, o los umbrales de las alertas) **quedan a definir y son
> adaptables**. El sistema está construido para que la empresa que lo adopte pueda
> **ajustarlo a sus propias necesidades**.

---

## 1. ¿Qué es el sistema?

Reemplaza el cuaderno del chofer y los grupos de WhatsApp por una plataforma web
**mobile-first**. Tiene **dos experiencias** sobre una misma aplicación:

| Experiencia | Para quién | Cómo se ve |
|-------------|------------|------------|
| **App del Chofer** | rol `DRIVER` | Pantalla de celular con barra de navegación inferior, botones grandes, dictado por voz y captura de fotos. Funciona sin señal (offline) y se sincroniza al recuperar conexión. |
| **Backoffice / Gerencial** | `ADMIN`, `MANAGER`, `DISPATCHER`, `MAINTENANCE`, `HR`, `AUDITOR` | Panel de escritorio con menú lateral (sidebar) organizado por secciones. |

Al iniciar sesión, el sistema redirige automáticamente: el chofer va a `/chofer`
y el resto al panel de administración. Cada usuario ve solo lo que su rol permite.

---

## 2. Roles y qué puede hacer cada uno

| Rol | Función | Accede principalmente a |
|-----|---------|-------------------------|
| **ADMIN** | Administrador del sistema | Todo: usuarios, flota, viajes, finanzas, configuración |
| **MANAGER** (Gerente) | Dirección / dueños | Panel, indicadores, lectura de toda la operación |
| **DISPATCHER** (Despachante) | Coordina la operación diaria | Alta de viajes, incidentes, alertas, mensajes, flota |
| **MAINTENANCE** (Taller) | Mantenimiento de unidades | Mantenimiento, órdenes de trabajo, documentos de camiones |
| **DRIVER** (Chofer) | Conductor en ruta | Sus viajes, bitácora, checklist, combustible, OEA, incidentes, mensajes |
| **HR** (RRHH) | Recursos Humanos | Legajos del personal, permisos/vencimientos, choferes |
| **AUDITOR** | Auditoría / contable | Lectura de bitácoras, rendiciones, indicadores, planillas OEA |

---

## 3. Menú del Backoffice

El menú lateral está agrupado por dominio de uso diario:

**Inicio**
- **Panel** — resumen gerencial.
- **Indicadores** — KPIs con filtros y exportación (`ADMIN`, `MANAGER`, `AUDITOR`).

**Operación**
- **Viajes** — alta y seguimiento de viajes.
- **Incidentes** — tablero de incidentes reportados por choferes.
- **Alertas** — bandeja priorizada de avisos automáticos.
- **Mensajes** — mensajería con los choferes.

**Flota**
- **Flota** — camiones y acoplados.
- **Mantenimiento** — planes preventivos y órdenes de trabajo.
- **Combustible** — tablero de consumos (km/l, gasto por camión/chofer).
- **Documentos** — centro documental con vencimientos.

**Personal**
- **RRHH** — legajos, permisos y habilitaciones del personal.
- **Choferes** — perfil operativo del chofer.

**Administración**
- **Rendiciones** — cierre de gastos por viaje.
- **Planillas OEA** — inspecciones de seguridad firmadas.

---

## 4. Flujo completo de un viaje

Este es el circuito central del sistema, paso a paso.

### Paso 0 — Preparación (una sola vez / según necesidad)

Antes de operar, deben existir los datos base. Los carga el backoffice:

1. **Flota** (`Flota`): dar de alta camiones (patente, número interno, km actual) y
   acoplados.
2. **Personal** (`RRHH`): cargar el legajo del empleado (datos personales, DNI/CUIL)
   y sus **permisos/habilitaciones** con fecha de vencimiento (carnet, LiNTI/CNRT,
   psicofísico, carga peligrosa, etc.).
3. **Choferes** (`Choferes`): habilitar al empleado como chofer (perfil operativo) y,
   si corresponde, darle acceso a la app.

### Paso 1 — Dar de alta el viaje  → *Despachante / Admin*

En **Viajes** → botón **Nuevo viaje**. Se completa:

- **Camión** * y **Chofer** * (obligatorios).
- **Acoplado** (opcional).
- **Origen** * y **Destino** *.
- **Carga** (descripción), **Salida planificada** y **Llegada planificada**.
- **Notas**.

El viaje queda en estado **Asignado** (`assigned`) y aparece automáticamente en la
app del chofer asignado.

### Paso 2 — El chofer recibe y prepara el viaje  → *Chofer*

En su celular (`/chofer` → "Mis viajes") el chofer ve el viaje asignado. Antes de
salir:

1. **Checklist pre-viaje**: desde el viaje, botón **Checklist**. Revisa cada ítem
   (luces, frenos, cubiertas, aceite, matafuego, documentación, acoplado…) marcando
   **OK / Falla / N/A**, puede adjuntar foto y **firma digital**. El resultado queda
   como *aprobado* o *rechazado*.
2. **Planilla OEA** (si aplica): desde `/chofer/oea`, inspección de seguridad de los
   7 puntos AFIP + precintos, con fotos por ítem, firma y resultado
   *conforme / no conforme*.

### Paso 3 — Iniciar el viaje  → *Chofer*

En el viaje, botón **Iniciar**. Se registra el **odómetro de salida** (el sistema
sugiere el km actual del camión) y se captura la **ubicación GPS** del celular. El
viaje pasa a **En curso** (`in_progress`).

### Paso 4 — Bitácora en ruta  → *Chofer*

Durante el viaje, el chofer registra todo lo que ocurre (botón **+** en la pantalla
del viaje). Cada movimiento tiene fecha, hora, autor y ubicación:

- **Tipos de carga en la bitácora**: combustible, peaje, gasto, **adelanto**
  (`cash_advance`), reparación, multa, viático, otros.
- Puede adjuntar el **comprobante** (foto del ticket) y usar **dictado por voz** para
  las observaciones.

> **Sobre el viático** *(a definir)*: el sistema soporta el viático como un tipo más
> de movimiento. Queda por definir en cada implementación **quién lo carga**: el
> chofer en la bitácora, o la administración al asignar el viaje (como monto fijo
> del viaje). Ambos caminos son posibles y se ajustan a la operatoria del cliente.
- **Combustible**: desde `/chofer/combustible`, carga litros + monto + km + foto del
  ticket (alimenta el tablero de consumos).

La pantalla del viaje muestra en vivo un **resumen**: total de gastos, total de
adelantos y la diferencia (**neto a rendir**).

> **Sin señal**: la bitácora, el checklist y los incidentes se guardan en el celular
> y se sincronizan solos al recuperar conexión. Un indicador muestra los registros
> pendientes.

### Paso 5 — Reportar incidentes (cuando ocurren)  → *Chofer*

Desde `/chofer/incidente/nuevo`: tipo (mecánico, accidente, faltante de caja,
demora, problema de carga/cliente, emergencia), descripción por voz, **fotos/audio/
video** y GPS. El despachante lo ve en el tablero de **Incidentes** y puede generar
una **Alerta** priorizada (roja/naranja/amarilla/verde).

### Paso 6 — Finalizar el viaje  → *Chofer*

Botón **Finalizar**. Se registra el **odómetro de llegada** y GPS. El sistema calcula
la distancia recorrida y el viaje pasa a **Finalizado** (`finished`). A partir de
aquí la bitácora queda cerrada para edición del chofer.

### Paso 7 — Rendición / liquidación  → *Admin / Manager / Auditor*

En **Rendiciones** → botón **Generar rendición**. Se elige un viaje **finalizado** y
el sistema **arma la rendición automáticamente** desde la bitácora:

```
Neto a rendir = Total de gastos rendidos  −  Total de adelantos
```

- La rendición nace en estado **Borrador** (`draft`): se puede revisar.
- Se puede **descargar el PDF** de la rendición.
- Con todo conforme, se **Cierra** (`closed`) y queda como comprobante definitivo.

> El sistema hoy solo **suma y resta** lo cargado en la bitácora; no calcula viáticos
> automáticos por convenio (queda preparado para agregarlos más adelante).

---

## 5. Estados a tener en cuenta

**Viaje:** `Asignado` → `En curso` → `Finalizado` (o `Cancelado`).

**Rendición:** `Borrador` → `Cerrada`.

**Alerta:** `Nueva` → `Vista` → `Reconocida` → `Resuelta`
(niveles: roja / naranja / amarilla / verde).

**Documentos y permisos:** `Vigente` → `Por vencer` → `Vencido` (el sistema avisa
automáticamente antes del vencimiento).

---

## 6. Módulos de apoyo

### Incidentes

El chofer reporta un problema desde la app (tipo, descripción por voz, fotos/audio/
video y GPS) y en el backoffice llega a un **tablero tipo kanban** con columnas por
estado: **Pendiente → En progreso → Resuelto**. Al abrir un incidente, el
despachante puede:

- **Asignar un responsable** (cualquier usuario del staff) para que se ocupe.
- Ajustar la **severidad** y cambiar el **estado** del incidente.
- Ver la **línea de tiempo** (historial de cambios) y **agregar comentarios**.

Se actualiza **en vivo** (websocket): un incidente nuevo aparece solo en el tablero.

### Alertas

Es una **bandeja priorizada** que el sistema **genera automáticamente** con un motor
de reglas —no se cargan a mano—. Cada alerta tiene un **nivel de color** según la
urgencia:

- 🔴 **Roja** — crítico (ej. accidente): atención inmediata.
- 🟠 **Naranja** — importante (ej. camión detenido demasiado tiempo).
- 🟡 **Amarilla** — a revisar (ej. gasto fuera del umbral esperado).
- 🟢 **Verde** — informativa (ej. documento próximo a vencer).

Llegan **en tiempo real** al centro de alertas del navbar (la campanita con
contador) y a la pantalla **Alertas**, que se puede **filtrar** por nivel, estado y
fechas. Sobre cada alerta se trabaja con un **flujo de estados** mediante botones:
**Visto → Atender → Resolver** (o *Desatender* para volver atrás). A diferencia de
los incidentes, **la alerta no se asigna a una persona**: se dirige por rol a quien
corresponda y cualquiera con acceso la gestiona. Reemplaza los cientos de mensajes
de WhatsApp por una lista ordenada por prioridad.

### Combustible

El chofer carga cada abastecimiento (litros, monto, km y foto del ticket). El
backoffice obtiene un tablero de **rendimiento por camión y por chofer** alineado con
los km: km/l, l/100km y costo/km, con gráficos y **exportación a Excel**.

### Mantenimiento

Organizado en tres pestañas: **Próximos**, **Planes** y **Órdenes**. Se definen
**planes preventivos** por km, horas o fecha, y el sistema **avisa cuando un camión
llega a su próximo servicio**. Cada intervención del taller se registra como una
**orden de trabajo** (ítems, costo, notas y adjuntos).

### Documentos (Centro Documental)

Repositorio de la documentación de **unidades, choferes y empresa** (seguro, VTV,
licencias, permisos, etc.), con **fechas de vencimiento**. Tiene una pestaña de
**Por vencer** y dispara alertas verdes automáticas antes de que algo caduque.

### Indicadores / Panel

Visión **gerencial en tiempo real**: KPIs operativos con **filtros** por flota,
camión y chofer, y **exportación a Excel**. El Panel de inicio resume el estado
general de la operación.

### Mensajes

**Canal directo chofer ↔ base**, con formato de chat (lista de conversaciones a un
lado y el hilo del otro). Reemplaza los grupos de WhatsApp para la comunicación
operativa del día a día.

---

## 7. Resumen del recorrido (de un vistazo)

```
BACKOFFICE                          CHOFER (celular)                 BACKOFFICE
──────────                          ────────────────                 ──────────
Alta de flota, personal
y choferes
        │
Alta de VIAJE  ───────────────►  Ve el viaje asignado
(Despachante)                          │
                                 Checklist + OEA (firma)
                                       │
                                 INICIAR (odómetro + GPS)
                                       │
                                 Bitácora en ruta
                                 (gastos, adelantos,
                                  combustible, fotos)
                                       │
                                 Incidentes  ──────────────►  Tablero + Alertas
                                       │
                                 FINALIZAR (odómetro + GPS)
                                       │
                                       └──────────────────►  RENDICIÓN
                                                             (gastos − adelantos)
                                                             Borrador → PDF → Cerrada
```

---

_Última actualización: 2026-07-07._
