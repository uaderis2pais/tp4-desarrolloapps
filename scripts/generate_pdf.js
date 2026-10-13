const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

const outputPath = path.join(__dirname, '..', 'informe', 'INFORME_AGROPULSE_TP4.pdf');

// Crear documento PDF con márgenes A4
const doc = new PDFDocument({
  size: 'A4',
  margins: { top: 40, bottom: 45, left: 45, right: 45 },
  bufferPages: true,
  info: {
    Title: 'AgroPulse - Informe Técnico de Arquitectura y Desarrollo Móvil',
    Author: 'Licenciatura en Sistemas de Información - FCyT UADER',
    Subject: 'Trabajo Práctico 4 - Desarrollo y Arquitectura en Aplicaciones Móviles 2026',
    Keywords: 'React Native, Expo 57, Supabase, Redpanda, Kafka, RLS, IoT, Agricultura de Precisión',
  },
});

const writeStream = fs.createWriteStream(outputPath);
doc.pipe(writeStream);

// Paleta de Colores Institucional
const COLOR_PRIMARY = '#1B4D3E'; // Verde AgroPulse
const COLOR_ACCENT = '#2E7D32';  // Verde Éxito
const COLOR_TEXT = '#2A2A2A';    // Texto oscuro
const COLOR_MUTED = '#666666';   // Gris subtítulos
const COLOR_BORDER = '#DDDDDD';  // Borde
const COLOR_BG_LIGHT = '#F4F7F4';

// Helper para títulos de sección
function addSectionHeader(title, number) {
  doc.moveDown(0.8);
  doc.rect(45, doc.y, 4, 18).fill(COLOR_PRIMARY);
  doc.fontSize(14).font('Helvetica-Bold').fillColor(COLOR_PRIMARY)
     .text(`   ${number ? number + '. ' : ''}${title}`, 45, doc.y - 1);
  doc.moveDown(0.4);
}

function addSubHeader(title) {
  doc.moveDown(0.5);
  doc.fontSize(11).font('Helvetica-Bold').fillColor(COLOR_ACCENT)
     .text(title, { align: 'left' });
  doc.moveDown(0.2);
}

function addParagraph(text) {
  doc.fontSize(9.5).font('Helvetica').fillColor(COLOR_TEXT)
     .text(text, { align: 'justify', lineGap: 2.5 });
  doc.moveDown(0.4);
}

function addBullet(boldPrefix, text) {
  doc.fontSize(9.5).font('Helvetica-Bold').fillColor(COLOR_PRIMARY).text('• ', { continued: true });
  if (boldPrefix) {
    doc.font('Helvetica-Bold').fillColor(COLOR_TEXT).text(boldPrefix + ': ', { continued: true });
  }
  doc.font('Helvetica').fillColor(COLOR_TEXT).text(text, { align: 'justify', lineGap: 2 });
  doc.moveDown(0.2);
}

// -----------------------------------------------------------------------------
// PÁGINA 1: PORTADA INSTITUCIONAL
// -----------------------------------------------------------------------------
doc.rect(45, 40, doc.page.width - 90, 80).fill(COLOR_PRIMARY);

doc.fontSize(10).font('Helvetica-Bold').fillColor('#A5D6A7')
   .text('UNIVERSIDAD AUTÓNOMA DE ENTRE RÍOS — FACULTAD DE CIENCIA Y TECNOLOGÍA', 60, 52, { align: 'center' });
doc.fontSize(9).font('Helvetica').fillColor('#FFFFFF')
   .text('Sede Concepción del Uruguay • Licenciatura en Sistemas de Información', { align: 'center' });
doc.fontSize(9).font('Helvetica-Oblique').fillColor('#E8F5E9')
   .text('Cátedra: Desarrollo y Arquitectura en Aplicaciones Móviles (2026) • Docente: Mg. Lic. Ernesto Ledesma', { align: 'center' });

doc.y = 135;
doc.fontSize(22).font('Helvetica-Bold').fillColor(COLOR_PRIMARY)
   .text('AgroPulse — Agricultura de Precisión', { align: 'center' });
doc.fontSize(13).font('Helvetica').fillColor(COLOR_MUTED)
   .text('Monitoreo Telemétrico, Semáforos de Suelo y Flujo Event-Driven Asíncrono', { align: 'center' });
doc.fontSize(11).font('Helvetica-Bold').fillColor(COLOR_ACCENT)
   .text('INFORME TÉCNICO DE ARQUITECTURA Y ESPECIFICACIÓN DEL PRD (TP 4)', { align: 'center' });

doc.moveDown(0.8);
doc.strokeColor(COLOR_BORDER).lineWidth(1).moveTo(45, doc.y).lineTo(doc.page.width - 45, doc.y).stroke();
doc.moveDown(0.6);

// Resumen Ejecutivo en Box
doc.rect(45, doc.y, doc.page.width - 90, 75).fillAndStroke(COLOR_BG_LIGHT, '#C8E6C9');
const boxTop = doc.y + 8;
doc.fontSize(10).font('Helvetica-Bold').fillColor(COLOR_PRIMARY)
   .text('Resumen Ejecutivo', 55, boxTop);
doc.fontSize(8.5).font('Helvetica').fillColor(COLOR_TEXT)
   .text('AgroPulse es una solución integral para agricultura de precisión orientada a optimizar la toma de decisiones de irrigación en lotes productivos. Integra un cliente móvil en React Native (Expo SDK 57, TypeScript strict, Expo Router v6), un Backend as a Service (Supabase) con Row Level Security (RLS) y suscripciones Realtime (<= 3s), y un pipeline desacoplado de telemetría IoT con broker Redpanda (Kafka API), simulador estocástico y worker de comando asíncrono.', 55, boxTop + 14, { width: doc.page.width - 110, align: 'justify', lineGap: 1.5 });

doc.y = boxTop + 85;

// Sección 1
addSectionHeader('Arquitectura General y Delimitación de Fronteras', '1');
addParagraph('El sistema adopta una arquitectura desacoplada de 3 capas bien delimitadas que garantizan seguridad, bajo acoplamiento y alta reactividad en campo:');

addBullet('Cliente Móvil (Expo SDK 57)', 'Interfaz de usuario con polígonos geoespaciales interactivos, semáforo cromático accesible (WCAG), cálculo point-in-polygon ("Estoy en el lote"), series temporales de humedad (6-24 h), comandos de irrigación y cola offline en AsyncStorage.');
addBullet('Backend as a Service (Supabase)', 'PostgreSQL con Row Level Security (RLS) por membresías y roles (producer, operator, advisor), autenticación JWT y distribución de telemetría en tiempo real mediante WebSockets (Supabase Realtime).');
addBullet('Streaming & IoT Backend (Redpanda + Worker + Simulador)', 'Broker Kafka/Redpanda con tópicos soil.moisture y weather.tick. Simulador que emite ticks cada 3-8s e inyecta fallas (sensor caído para stale H4), y Worker que persiste telemetría y ejecuta comandos de válvulas en 1-4s.');

// -----------------------------------------------------------------------------
// PÁGINA 2: JUSTIFICACIÓN KAFKA EN EL MÓVIL
// -----------------------------------------------------------------------------
doc.addPage();

addSectionHeader('Justificación Técnica: ¿Por qué el Móvil NO se Conecta al Broker Kafka?', '2');
addParagraph('Uno de los requisitos de diseño no negociables del PRD (requisito OA-7) estipula que la aplicación móvil nunca debe consumir ni acoplarse al broker Kafka/Redpanda. Esta decisión responde a cinco razones críticas de ingeniería de software distribuida y redes:');

addSubHeader('2.1. Inestabilidad y Heterogeneidad de las Redes Celulares Móviles');
addParagraph('El protocolo TCP de Kafka/Redpanda presupone conexiones de bajísima latencia constante y enlaces confiables de centro de datos. En el entorno rural, los teléfonos operan bajo redes celulares 3G/4G con microcortes y saltos de antena. Un socket de consumidor Kafka provocaría incesantes rebalances del grupo de consumo (consumer group rebalances), degradando la performance general del cluster.');

addSubHeader('2.2. Consumo Excesivo de Batería y Datos Móviles');
addParagraph('Kafka implementa un mecanismo de sondeo continuo (long-polling) para la sincronización de particiones. Mantener el módem de radiofrecuencia (RF) del dispositivo celular en transmisión de alta potencia drena aceleradamente la batería del operario e insume un ancho de banda considerable en tráfico de control (heartbeats, sincronización de metadatos y commits de offset).');

addSubHeader('2.3. Autenticación, Autorización y Seguridad de Credenciales');
addParagraph('Los brokers Kafka habitualmente emplean autenticación por certificados TLS mutuos (mTLS) o credenciales globales SASL/SCRAM. Exponer el broker a Internet público y distribuir credenciales en el binario móvil expone al cluster a ingeniería inversa y ataques masivos. Supabase, en cambio, emplea tokens JWT temporales firmados criptográficamente y controlados por políticas RLS por usuario y organización.');

addSubHeader('2.4. Contrapresión (Backpressure) y Acoplamiento de Esquemas');
addParagraph('Un dispositivo móvil carece de la capacidad de almacenamiento y memoria para amortiguar ráfagas de miles de eventos por segundo. Si el esquema del tópico evoluciona, obligaría a actualizar forzosamente todas las terminales móviles. Supabase actúa como un buffer y Anti-Corruption Layer.');

addSubHeader('2.5. Superficie de Ataque y Aislamiento de Red');
addParagraph('La infraestructura de telemetría y actuadores mecánicos debe residir en una red privada (VPC). Exponer los puertos de Kafka (9092, 19092) a Internet público incrementa drásticamente la vulnerabilidad ante ataques de denegación de servicio (DDoS) o inyecciones de comandos apócrifos.');

// -----------------------------------------------------------------------------
// PÁGINA 3: MODELO DE DATOS Y RLS
// -----------------------------------------------------------------------------
doc.addPage();

addSectionHeader('Modelo de Datos y Seguridad con Row Level Security (RLS)', '3');
addParagraph('El modelo relacional implementado en PostgreSQL garantiza que ningún usuario visualice ni modifique datos de establecimientos ajenos (RF-02 y RF-03), administrando permisos según la tabla de memberships:');

// Tabla de Roles y Permisos
const startY = doc.y + 5;
const colX = [45, 160, 245, 330, 420, 550];

// Header
doc.rect(45, startY, doc.page.width - 90, 18).fill(COLOR_PRIMARY);
doc.fontSize(8).font('Helvetica-Bold').fillColor('#FFFFFF');
doc.text('Entidad / Acción', colX[0] + 5, startY + 5);
doc.text('Productor', colX[1] + 5, startY + 5);
doc.text('Operador', colX[2] + 5, startY + 5);
doc.text('Asesor (H2)', colX[3] + 5, startY + 5);
doc.text('Worker (service_role)', colX[4] + 5, startY + 5);

const rows = [
  ['SELECT plots / stations / valves', 'Permitido (Org)', 'Permitido (Org)', 'Permitido (Org)', 'Permitido (Total)'],
  ['SELECT readings telemetría', 'Permitido', 'Permitido', 'Permitido', 'Permitido'],
  ['INSERT readings (sensor)', 'Denegado (RLS)', 'Denegado (RLS)', 'Denegado (RLS)', 'PERMITIDO'],
  ['INSERT readings (manual RF-21)', 'Permitido', 'Permitido', 'Denegado (RLS)', 'N/A'],
  ['UPDATE plot thresholds (RF-11)', 'Permitido', 'Permitido', 'Denegado (RLS)', 'Permitido'],
  ['INSERT irrigation_commands (RF-14)', 'Permitido', 'Permitido', 'DENEGADO (403)', 'Permitido'],
  ['UPDATE command to applied (RF-15)', 'Denegado', 'Denegado', 'Denegado', 'PERMITIDO'],
  ['UPDATE command to cancelled (RF-17)', 'Permitido', 'Permitido', 'Denegado', 'Permitido'],
];

let curY = startY + 18;
rows.forEach((r, idx) => {
  const bg = idx % 2 === 0 ? '#FFFFFF' : COLOR_BG_LIGHT;
  doc.rect(45, curY, doc.page.width - 90, 15).fillAndStroke(bg, COLOR_BORDER);
  doc.fontSize(7.5).font('Helvetica').fillColor(COLOR_TEXT);
  doc.text(r[0], colX[0] + 5, curY + 4);
  doc.text(r[1], colX[1] + 5, curY + 4);
  doc.text(r[2], colX[2] + 5, curY + 4);
  // Asesor highlight
  if (r[3].includes('DENEGADO')) {
    doc.font('Helvetica-Bold').fillColor('#D32F2F');
  } else {
    doc.font('Helvetica').fillColor(COLOR_TEXT);
  }
  doc.text(r[3], colX[3] + 5, curY + 4);

  // Worker highlight
  if (r[4].includes('PERMITIDO')) {
    doc.font('Helvetica-Bold').fillColor(COLOR_ACCENT);
  } else {
    doc.font('Helvetica').fillColor(COLOR_TEXT);
  }
  doc.text(r[4], colX[4] + 5, curY + 4);

  curY += 15;
});

doc.y = curY + 12;

addSectionHeader('Ciclo de Vida de Comandos Asíncronos e Idempotencia', '4');
addSubHeader('Regla RF-16: Bloqueo Atómico de Doble Pending');
addParagraph('Para evitar que dos operarios ordenen simultáneamente maniobras contradictorias sobre un mismo actuador mecánico, se implementó en PostgreSQL un índice parcial único:');
doc.rect(45, doc.y, doc.page.width - 90, 22).fillAndStroke('#FAFAFA', '#E0E0E0');
doc.fontSize(8).font('Courier').fillColor('#333')
   .text('CREATE UNIQUE INDEX idx_unique_pending_command ON irrigation_commands (valve_id) WHERE (status = \'pending\');', 52, doc.y + 6);
doc.moveDown(0.8);
addParagraph('Adicionalmente, cada comando despachado desde el cliente móvil incluye un UUID de idempotencia (client_request_id). Si una orden se reintenta por fluctuaciones de conectividad, el backend detecta el identificador existente y retorna el comando registrado sin duplicar ejecuciones.');

// -----------------------------------------------------------------------------
// PÁGINA 4: SEMÁFORO Y HISTORIAS DE USUARIO
// -----------------------------------------------------------------------------
doc.addPage();

addSectionHeader('Reglas de Negocio del Semáforo de Suelo (§08)', '5');
addParagraph('El estado derivado del lote (plot_status) se evalúa determinísticamente según estricto orden de precedencia:');

addBullet('1. stale (Gris)', 'Si no existen lecturas registradas o el último reporte supera los 15 minutos (now - measured_at > 15 min). Prevalece sobre cualquier otro estado para advertir sobre pérdida de enlace (H4).');
addBullet('2. dry (Rojo)', 'Si moisture_pct < threshold_min (por defecto 25%). Activa la sugerencia agronómica de riego inmediato (H1, RF-22).');
addBullet('3. optimal (Verde)', 'Si threshold_min <= moisture_pct <= threshold_max (por defecto 25% a 45%). Suelo en condiciones hídricas ideales.');
addBullet('4. wet (Azul)', 'Si moisture_pct > threshold_max (por defecto > 45%). Suelo saturado.');

addSectionHeader('Validación de Historias de Usuario para la Evaluación', '6');
addSubHeader('H1 — Productor: Detección y Riego en Lote Seco (Happy Path)');
addParagraph('El productor ingresa y observa en el mapa interactivo el lote "Costa 2" en color rojo (humedad al 18% < umbral del 25%). Selecciona "Comandar", ordena un riego por 30 minutos y confirma. La aplicación envía la petición con client_request_id; el estado pasa de inmediato a "pending". En 2.5 segundos, el worker backend procesa la maniobra, actualiza la válvula a "open" y el comando pasa a "applied", reflejándose en la pantalla en tiempo real sin recargar.');

addSubHeader('H2 — Aislamiento y Control del Rol Asesor');
addParagraph('El usuario asesor@agropulse.test puede visualizar los mapas, semáforos, series de 6h e historial. Sin embargo, los botones de comando están deshabilitados ("Solo Lectura") y las políticas RLS de PostgreSQL rechazan con error 403 cualquier intento de inserción de comandos.');

addSubHeader('H3 — Resiliencia en Campo sin Señal Celular (Offline Queue)');
addParagraph('Ante un corte de señal (30 s en modo avión), la lectura manual (22% con notas) o el comando se almacenan de forma segura en la cola local de AsyncStorage. Al restablecer la conexión, se sincronizan con Supabase sin duplicación.');

addSubHeader('H4 — Detección de Sensor Caído (Stale)');
addParagraph('Al apagar la emisión de ticks en el simulador para la estación del lote "Monte A", transcurridos 15 minutos el semáforo conmuta automáticamente a color gris (stale), distinguiéndose claramente de suelo seco.');

// -----------------------------------------------------------------------------
// PÁGINA 5: CONCLUSIÓN Y CUADRO DE ENTREGABLES
// -----------------------------------------------------------------------------
doc.addPage();

addSectionHeader('Conclusión', '7');
addParagraph('El proyecto AgroPulse satisface íntegramente los 24 requisitos funcionales (RF-01 a RF-24) y los 10 requisitos no funcionales (RNF-01 a RNF-10) del trabajo práctico. La arquitectura adoptada protege al cliente móvil de la sobrecarga y complejidad operativa de los brokers Kafka empresariales, garantizando alta disponibilidad, consistencia de datos y una experiencia de usuario accesible y fluida.');

addSectionHeader('Cuadro de Entregables Oficiales y Modalidad de Entrega (§15)', '8');
addParagraph('En concordancia con los requerimientos estipulados en la sección §15 del PRD oficial de la cátedra, a continuación se detalla la nómina de entregables y su vía formal de presentación:');

// Tabla de Entregables
const startYDeliverables = doc.y + 5;
const dColX = [45, 75, 175, 410, 550];

// Header
doc.rect(45, startYDeliverables, doc.page.width - 90, 20).fill(COLOR_PRIMARY);
doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#FFFFFF');
doc.text('#', dColX[0] + 5, startYDeliverables + 6);
doc.text('Artefacto Requerido', dColX[1] + 5, startYDeliverables + 6);
doc.text('Contenido y Descripción Técnica', dColX[2] + 5, startYDeliverables + 6);
doc.text('Modalidad de Entrega', dColX[3] + 5, startYDeliverables + 6);

const deliverablesRows = [
  ['1', 'App Expo', 'Código fuente completo en React Native (Expo SDK 57, TypeScript strict, Expo Router v6, polígonos interactivos, semáforo accesible, series 6h y cola offline).', 'Vía GitHub\n(carpeta TP 4/)'],
  ['2', 'supabase/migrations + RLS', 'Scripts SQL completos: esquemas relacionales, índices, triggers, políticas de Row Level Security y datos semilla (seed.sql).', 'Vía GitHub\n(carpeta TP 4/supabase/)'],
  ['3', 'infra/docker-compose.yml', 'Configuración de orquestación para Redpanda broker, Redpanda Console (puerto 8080), worker consumer y simulador IoT.', 'Vía Archivo\n(adjunto comprimido / zip)'],
  ['4', 'Informe corto (4–8 pág)', 'Documento formal de fundamentación técnica, arquitectura de 3 capas, RLS, justificación de no Kafka en el móvil y validación de historias H1-H4.', 'Vía Archivo\n(documento PDF)'],
  ['5', 'Checklist PRD (§17) y README', 'Matriz de trazabilidad y verificación de todos los requisitos obligatorios del PRD cumplidos, credenciales didácticas y manual de ejecución local.', 'Vía GitHub\n(TP 4/README.md)'],
  ['6', 'Video 3–5 min / Defensa', 'Demostración práctica de los flujos críticos H1 (lote seco), H2 (bloqueo asesor) y RF-16 (bloqueo doble pending concurrente).', 'Video / Defensa\nen Clase'],
];

let curDY = startYDeliverables + 20;
deliverablesRows.forEach((r, idx) => {
  const rowHeight = 32;
  const bg = idx % 2 === 0 ? '#FFFFFF' : COLOR_BG_LIGHT;
  doc.rect(45, curDY, doc.page.width - 90, rowHeight).fillAndStroke(bg, COLOR_BORDER);
  
  doc.fontSize(8).font('Helvetica-Bold').fillColor(COLOR_PRIMARY)
     .text(r[0], dColX[0] + 5, curDY + 10);
  
  doc.fontSize(8).font('Helvetica-Bold').fillColor(COLOR_TEXT)
     .text(r[1], dColX[1] + 5, curDY + 6, { width: 90 });
     
  doc.fontSize(7.5).font('Helvetica').fillColor(COLOR_TEXT)
     .text(r[2], dColX[2] + 5, curDY + 4, { width: 220, lineGap: 1 });
     
  // Modalidad con badge visual
  const isGithub = r[3].includes('GitHub');
  const isFile = r[3].includes('Archivo');
  doc.fontSize(8).font('Helvetica-Bold')
     .fillColor(isGithub ? '#1565C0' : isFile ? '#C62828' : '#2E7D32')
     .text(r[3], dColX[3] + 5, curDY + 6, { width: 125 });

  curDY += rowHeight;
});

doc.y = curDY + 15;

// Recuadro de Validación de Pruebas
doc.rect(45, doc.y, doc.page.width - 90, 48).fillAndStroke(COLOR_BG_LIGHT, '#C8E6C9');
const testBoxTop = doc.y + 8;
doc.fontSize(9.5).font('Helvetica-Bold').fillColor(COLOR_PRIMARY)
   .text('Validación Automatizada y Calidad de Código', 55, testBoxTop);
doc.fontSize(8.5).font('Helvetica').fillColor(COLOR_TEXT)
   .text('• Suite de Tests Unitarios (Jest): 3 suites aprobadas, 15 tests pasados al 100% (semaforo.test.ts, idempotency.test.ts, geo.test.ts).\n• Compilación TypeScript: 0 errores detectados bajo modo strict: true (npx tsc --noEmit).', 55, testBoxTop + 14, { width: doc.page.width - 110, lineGap: 2 });

// -----------------------------------------------------------------------------
// NUMERACIÓN DE PÁGINAS EN EL FOOTER
// -----------------------------------------------------------------------------
const range = doc.bufferedPageRange();
for (let i = range.start; i < range.start + range.count; i++) {
  doc.switchToPage(i);
  doc.fontSize(8).font('Helvetica').fillColor(COLOR_MUTED)
     .text(
       `AgroPulse (TP 4) — Cátedra de Desarrollo y Arquitectura en Aplicaciones Móviles 2026 (FCyT UADER)    |    Página ${i + 1} de ${range.count}`,
       45,
       doc.page.height - 30,
       { align: 'center', width: doc.page.width - 90 }
     );
}

doc.end();

writeStream.on('finish', () => {
  console.log('PDF generado exitosamente en: ' + outputPath);
});
