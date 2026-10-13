# AgroPulse — Trabajo Práctico 4 (PRD 2026)
### Licenciatura en Sistemas de Información — Desarrollo y Arquitectura en Aplicaciones Móviles
**Docente:** Mg. Lic. Ernesto Ledesma  
**Institución:** Facultad de Ciencia y Tecnología (FCyT), Sede Concepción del Uruguay — UADER  

---

## 🌾 Descripción del Proyecto
**AgroPulse** es una aplicación móvil de agricultura de precisión desarrollada con **React Native (Expo SDK 57)**, **Expo Router v6**, **TypeScript strict** y **Supabase** como BaaS con **Row Level Security (RLS)** y **Realtime WebSockets**, integrada con una arquitectura distribuida de telemetría IoT con **Redpanda (Kafka API)** y worker de procesamiento.

---

## 📋 Checklist de Cumplimiento del PRD (§17)

| # | Requisito / Entregable | Estado | Evidencia de Implementación |
| :---: | :--- | :---: | :--- |
| **OA-1** | Dominio con roles y aislamiento RLS | ✅ Cumplido | `memberships` con roles `producer`, `operator`, `advisor` y RLS en `supabase/migrations/` |
| **OA-2** | Mapas y geometría de lotes | ✅ Cumplido | Polígonos SVG con semáforo interactivo en `src/components/PlotPolygonMap.tsx` |
| **OA-3** | Series temporales en UI (6-24 h) | ✅ Cumplido | Gráfico SVG interactivo con >= 12 puntos y umbrales en `src/components/MoistureChart.tsx` |
| **OA-4** | Arquitectura event-driven | ✅ Cumplido | Streaming con tópicos `soil.moisture` y `weather.tick` hacia Supabase Realtime |
| **OA-5** | Comandos asíncronos (`pending \to applied`) | ✅ Cumplido | Válvulas con comandos asíncronos y transición en $\le 5\text{ s}$ en `infra/worker/worker.ts` |
| **OA-6** | Degradación por red / Cola offline | ✅ Cumplido | Cola persistente en `AsyncStorage` con reintento automático en `src/utils/offlineQueue.ts` |
| **OA-7** | No acoplar el móvil al broker | ✅ Cumplido | **Ningún cliente Kafka en React Native**; el móvil consume únicamente Supabase BaaS |
| **RF-01** | Login / logout con sesión persistente | ✅ Cumplido | Supabase Auth con sesión persistente en `src/context/AuthContext.tsx` y `app/(auth)/login.tsx` |
| **RF-02** | Aislamiento multi-organización | ✅ Cumplido | RLS estricto; usuarios no visualizan lotes de otros establecimientos |
| **RF-03** | Selector de establecimiento | ✅ Cumplido | Selector interactivo en `app/(tabs)/account.tsx` con recálculo dinámico de lotes |
| **RF-04** | Listar lotes (al menos 3 en semilla) | ✅ Cumplido | Costa 1 (óptimo), Costa 2 (seco), Monte A (stale) en `supabase/seed.sql` |
| **RF-05** | Tap en polígono abre detalle de lote | ✅ Cumplido | Navegación directa desde el mapa a `app/plot/[id].tsx` |
| **RF-06** | "Estoy en el lote" (GPS Point-in-Polygon) | ✅ Cumplido | Algoritmo de ray-casting en `src/utils/geo.ts` con manejo seguro sin permisos |
| **RF-07** | Alta/edición simplificada de lote | ✅ Cumplido | Modal de creación de lote con 4 vértices en `app/(tabs)/plots.tsx` |
| **RF-08** | $\ge 1$ estación por lote con telemetría | ✅ Cumplido | Estaciones S-01, S-02, S-03 con humedad, temperatura y lluvia |
| **RF-09** | Antigüedad de lectura (stale si > 15 min) | ✅ Cumplido | Formato relativo ("hace 12 s") y transición automática a gris stale |
| **RF-10** | Gráfico de humedad reactivo | ✅ Cumplido | Gráfico actualizado en tiempo real con Supabase Realtime y pull-to-refresh |
| **RF-11** | Umbral mínimo configurable | ✅ Cumplido | Editor de umbral persistido en PostgreSQL en `app/plot/[id].tsx` |
| **RF-12** | Semáforo según reglas §8 | ✅ Cumplido | Lógica pura en `src/utils/semaforo.ts` (stale, dry, optimal, wet) |
| **RF-13** | Listar válvulas del lote | ✅ Cumplido | Válvulas con estado en vivo (open/closed) en `src/components/ValvesList.tsx` |
| **RF-14** | Emitir comando (abrir, cerrar, N min) | ✅ Cumplido | Modal `src/components/IrrigationModal.tsx` con duración 1-120 min |
| **RF-15** | Transición a applied/failed en $\le 5\text{ s}$ | ✅ Cumplido | Worker backend procesa y aplica la maniobra en 1 a 4 segundos |
| **RF-16** | Bloqueo de segundo comando pending | ✅ Cumplido | Índice parcial único en PostgreSQL y validación en app (`__tests__/idempotency.test.ts`) |
| **RF-17** | Cancelar comando pending | ✅ Cumplido | Botón de cancelación inmediata en `src/components/CommandHistoryList.tsx` |
| **RF-18** | Historial de últimos 20 comandos | ✅ Cumplido | Tarjetas con fecha, actor, duración y estado en `src/components/CommandHistoryList.tsx` |
| **RF-19** | Alerta in-app de suelo seco | ✅ Cumplido | Bandeja de entrada y notificaciones en `app/(tabs)/alerts.tsx` |
| **RF-20** | Alerta in-app de estación stale | ✅ Cumplido | Distinción explícita de sensor caído sin ticks en `app/(tabs)/alerts.tsx` |
| **RF-21** | Lectura manual de campo offline | ✅ Cumplido | Formulario modal con encolado local en `src/components/ManualReadingModal.tsx` |
| **RF-22** | Sugerencia agronómica de regla fija | ✅ Cumplido | Banner automático: *"Humedad bajo umbral: considerar riego"* |
| **RF-23** | Pantalla de Diagnóstico y Lag | ✅ Cumplido | Observabilidad académica completa en `app/(tabs)/diagnostics.tsx` |
| **RF-24** | Logs de worker visibles en consola | ✅ Cumplido | Registros estructurados `produced`, `consumed`, `upsert reading` en worker |
| **RNF-01** | Stack Expo SDK 57 + TypeScript strict | ✅ Cumplido | Expo 57, Expo Router v6, TypeScript configurado |
| **RNF-02** | Anon key pública; sin service_role en móvil | ✅ Cumplido | Móvil usa solo `anon_key`; `service_role` restringido al worker backend |
| **RNF-08** | Tests unitarios automatizados | ✅ Cumplido | Suite de Jest en `__tests__/` para semáforo, idempotencia y point-in-polygon |

---

## 👥 Usuarios y Credenciales Didácticas (§14)

Contraseña global para todos los usuarios de prueba: **`AgroPulse2026!`**

| Rol Didáctico | Correo Electrónico | Permisos en la Aplicación |
| :--- | :--- | :--- |
| **Productor** | `productor@agropulse.test` | Ver todo, editar umbrales mínimos, comandar válvulas (Demuestra H1). |
| **Operador** | `operador@agropulse.test` | Visualizar lotes, emitir y cancelar comandos de irrigación. |
| **Asesor** | `asesor@agropulse.test` | **Solo lectura**. Botón de riego deshabilitado / rechazo RLS (Demuestra H2). |

*(La pantalla de Login incluye botones de acceso directo para ingresar con cada uno con un solo clic).*

---

## 🚀 Guía de Instalación y Ejecución Local

### 1. Instalación de dependencias del cliente móvil
```bash
npm install
```

### 2. Configurar variables de entorno
El archivo `.env` ya se encuentra preconfigurado en la raíz de `TP 4/`:
```env
EXPO_PUBLIC_SUPABASE_URL=https://iwjkpmmwjvnthgiepzyt.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1...
EXPO_PUBLIC_DEMO_PASSWORD=AgroPulse2026!
```

### 3. Ejecutar la aplicación móvil (Expo 57)
```bash
npx expo start
```
- Presionar `w` para abrir en versión **Web** en tu navegador.
- O escanear el código QR con **Expo Go** en tu dispositivo físico Android / iOS.
- Presionar `a` para emulador Android.

### 4. Ejecutar la suite de pruebas unitarias automatizadas (RNF-08)
```bash
npm test
```
Ejecutará los tests de:
- `semaforo.test.ts`: Las 4 condiciones de §08 (stale, dry, optimal, wet) y precedencias.
- `idempotency.test.ts`: Idempotencia de `client_request_id` y bloqueo de doble pending (RF-16).
- `geo.test.ts`: Algoritmo geoespacial *Point-in-Polygon* (RF-06).

### 5. Servicios de Streaming Backend (Docker Compose o Standalone)

#### Opción A: Con Docker Compose (Redpanda + Console + Worker + Simulador)
```bash
cd infra
docker compose up
```
- **Redpanda Console:** Disponible en `http://localhost:8080` para visualizar tópicos y particiones.

#### Opción B: Modo Standalone directo con Node.js (Si no tienes Docker instalado)
El simulador y el worker cuentan con modo dual autónomo:
```bash
# Terminal 1: Iniciar el worker de procesamiento y comandos
npm run worker

# Terminal 2: Iniciar el simulador IoT de telemetría de suelo y clima
npm run simulator
```

---

## 📁 Cuadro de Entregables Oficiales y Modalidad de Entrega (§15)

| # | Artefacto Requerido | Contenido / Descripción | Modalidad de Entrega |
| :---: | :--- | :--- | :---: |
| **1** | **App Expo** | Código fuente completo en React Native (Expo SDK 57, TypeScript strict, Expo Router v6, componentes de mapas, semáforos y gráficos). | **Vía GitHub** (carpeta `TP 4/`) |
| **2** | **supabase/migrations + RLS** | Scripts SQL con esquemas, índices, triggers, políticas de Row Level Security y datos semilla (`seed.sql`). | **Vía GitHub** (carpeta `TP 4/supabase/`) |
| **3** | **infra/docker-compose.yml** | Configuración de orquestación de Redpanda broker, Redpanda Console (puerto 8080), worker consumer y simulador IoT. | **Vía Archivo** (adjunto comprimido / zip) |
| **4** | **Informe corto (4–8 páginas)** | Documento formal de fundamentación técnica, arquitectura de 3 capas, RLS, justificación de no Kafka en el móvil y validación de historias H1-H4. | **Vía Archivo** (documento PDF `INFORME_AGROPULSE_TP4.pdf`) |
| **5** | **Checklist PRD (§17) y README** | Matriz de trazabilidad y verificación de todos los requisitos obligatorios del PRD cumplidos, credenciales didácticas y manual de ejecución. | **Vía GitHub** (`TP 4/README.md`) |
| **6** | **Video 3–5 min / Defensa** | Demostración práctica de los flujos críticos H1 (lote seco), H2 (bloqueo asesor) y RF-16 (bloqueo doble pending concurrente). | **Video / Defensa en Clase** ([`informe/DEFENSA.md`](file:///d:/Archivos%20Personales/Desktop/UNIVERSIDAD/Visual%20studio%20Code/Desarrollo%20app%20mobile/TP%204/informe/DEFENSA.md)) |

