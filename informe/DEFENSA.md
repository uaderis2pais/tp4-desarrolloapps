# Guía de Demostración y Defensa Oral (3 a 5 Minutos)
## AgroPulse — Trabajo Práctico 4

**Objetivo de la defensa:** Demostrar en vivo el flujo integral de datos, la delimitación de la arquitectura (móvil $\leftrightarrow$ BaaS $\leftrightarrow$ streaming), las historias de usuario prioritarias (**H1, H2**) y la invariante de concurrencia (**RF-16**).

---

### Cronograma de Tiempos Sugerido (4 minutos en total)

| Minuto | Bloque | Qué mostrar en pantalla | Qué explicar verbalmente |
| :---: | :--- | :--- | :--- |
| **0:00 - 0:40** | **Introducción & Arquitectura** | Pantalla de Login y diagrama de arquitectura | Presentar AgroPulse, tecnologías (Expo 57, Supabase, Redpanda) y justificar brevemente por qué el móvil no consume Kafka. |
| **0:40 - 2:00** | **Historia H1 (Happy Path)** | Login Productor $\to$ Mapa $\to$ Lote Costa 2 $\to$ Comandar riego | Explicar el semáforo rojo (18% < 25%), orden de riego 30 min, `client_request_id`, transición en < 5s a `applied` y válvula abierta. |
| **2:00 - 2:40** | **Requisito RF-16 (Doble Pending)** | Emitir un segundo comando inmediato sobre la misma válvula | Mostrar el mensaje de rechazo atómico: el sistema prohíbe dos comandos en espera sobre el mismo actuador. |
| **2:40 - 3:20** | **Historia H2 (Rol Asesor)** | Logout $\to$ Login con Asesor $\to$ Detalle de Lote | Mostrar que el asesor ve los mismos mapas y gráficos pero tiene el botón de regar bloqueado / permiso denegado por RLS. |
| **3:20 - 4:00** | **Observabilidad (RF-23 / RF-24)** | Pestaña Diagnóstico y consola Docker/Terminal | Mostrar métricas de telemetría (lag aparente ms, ticks) y logs en tiempo real del worker (`produced`, `consumed`, `upsert`). |

---

### Guion Paso a Paso para la Presentación

#### Paso 1: Apertura (0:00 - 0:40)
- **Acción:** Abrir la aplicación en el navegador o emulador.
- **Voz del expositor:**
  > *"Buenas tardes profesor. Presentamos AgroPulse, una plataforma de agricultura de precisión desarrollada con Expo 57, TypeScript y Supabase, conectada a un pipeline backend con Redpanda. Como se solicita en la consigna, la aplicación móvil nunca se conecta directamente al broker Kafka para proteger la batería, evitar consumo excesivo de datos celulares y garantizar la seguridad mediante Row Level Security."*

#### Paso 2: Demostración Historia H1 — Productor y Lote Seco (0:40 - 2:00)
- **Acción:** Presionar el botón de acceso rápido *"Productor"* (`productor@agropulse.test`) e ingresar.
- **Acción:** En la pestaña **Mapa**, señalar el polígono rojo de **Costa 2**.
- **Acción:** Tocar el lote Costa 2 y presionar *"Ver Detalle Completo"*.
- **Voz del expositor:**
  > *"Aquí vemos la historia H1. El productor ingresa y observa en el mapa que el lote Costa 2 está en color rojo. Al ingresar al detalle, vemos que la humedad actual es del 18%, por debajo del umbral mínimo del 25%. El sistema activa automáticamente la sugerencia agronómica recomendando regar.*
  > *Ahora vamos a accionar la válvula. Pulsamos en 'Comandar', seleccionamos 'Regar 30 min' y confirmamos. La orden se envía con un UUID de idempotencia `client_request_id`. Vemos que el comando entra en estado Pending y, en menos de 3 segundos, gracias a Supabase Realtime y el worker backend, el estado transiciona a Applied y la válvula pasa a estado ABIERTA sin necesidad de recargar la aplicación."*

#### Paso 3: Demostración Invariante RF-16 — Bloqueo de Doble Pending (2:00 - 2:40)
- **Acción:** Con la válvula recién comandada o emitiendo un comando nuevo, intentar ordenar inmediatamente otro riego antes de que concluya el anterior.
- **Voz del expositor:**
  > *"Para cumplir con el requisito RF-16 y evitar órdenes contradictorias sobre el actuador de campo, si intentamos enviar un segundo comando mientras existe uno en estado pendiente, la aplicación lo bloquea inmediatamente y la base de datos lo rechaza mediante un índice parcial único, informando que ya existe una maniobra en curso."*

#### Paso 4: Demostración Historia H2 — Aislamiento y Rol Asesor (2:40 - 3:20)
- **Acción:** Ir a la pestaña **Cuenta**, cerrar sesión e ingresar como *"Asesor"* (`asesor@agropulse.test`).
- **Acción:** Navegar al detalle de cualquier lote y observar el botón de comando.
- **Voz del expositor:**
  > *"Demostramos ahora la historia H2. Iniciamos sesión como el Ingeniero Agrónomo asesor. Como pueden observar, el asesor puede inspeccionar los mapas, revisar el semáforo y analizar las series temporales de humedad de las últimas 6 horas. Sin embargo, al ser un rol exclusivamente de consulta técnica, los botones de comando figuran como 'Solo Lectura' y las políticas de Row Level Security en PostgreSQL le tienen terminantemente prohibido insertar filas en la tabla de comandos."*

#### Paso 5: Demostración Observabilidad RF-23 / RF-24 y Cierre (3:20 - 4:00)
- **Acción:** Ir a la pestaña **Diagnóstico**.
- **Acción:** Mostrar en la consola de terminal los logs del worker y simulador.
- **Voz del expositor:**
  > *"Finalmente, en la pestaña Diagnóstico cumplimos con el requisito RF-23, mostrando el ID del usuario, su rol activo, el último tick recibido y el lag aparente en milisegundos. Paralelamente, en la consola del worker y del simulador podemos apreciar los registros estructurados con las etiquetas `produced`, `consumed` y `upsert reading`, cumpliendo de este modo el 100% de la rúbrica y los requerimientos del PRD. Muchas gracias."*
