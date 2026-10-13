// ==============================================================================
// AGROPULSE - WORKER CONSUMER DE STREAMING Y CONTROL DE VÁLVULAS (RF-15, RF-24, §10)
// Consume eventos de Redpanda, persiste en Supabase y ejecuta comandos de riego
// ==============================================================================

import { Kafka, logLevel } from 'kafkajs';
import { createClient } from '@supabase/supabase-js';

const KAFKA_BROKERS = (process.env.KAFKA_BROKERS || 'localhost:9092').split(',');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://yltezwfpnrwlzgxvdpqn.supabase.co';
const SUPABASE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlsdGV6d2ZwbnJ3bHpneHZkcHFuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAxNzQ2OTYsImV4cCI6MjEwNTc1MDY5Nn0.evEkI-5Vw4qli9XgCcDXr8TT7nxsDZ02ph1YKj6lIIo';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const kafka = new Kafka({
  clientId: 'agropulse-worker-consumer',
  brokers: KAFKA_BROKERS,
  connectionTimeout: 1000,
  logLevel: logLevel.NOTHING,
  retry: {
    retries: 0,
  },
});

const consumer = kafka.consumer({ groupId: 'agropulse-ingest-group' });

async function startWorker() {
  console.log('================================================================');
  console.log('⚙️ [AgroPulse] INICIANDO WORKER CONSUMER Y GESTOR DE COMANDOS (RF-24)');
  console.log('================================================================');
  console.log(`Brokers: ${KAFKA_BROKERS.join(', ')}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);

  // Autenticar en Supabase para obtener permisos RLS de lectura y escritura
  try {
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
      email: process.env.WORKER_EMAIL || 'productor@agropulse.test',
      password: process.env.WORKER_PASSWORD || 'AgroPulse2026!',
    });
    if (!authErr && authData.session) {
      console.log(`🔐 [Worker Auth] Sesión autenticada como ${authData.user.email} (Permisos RLS concedidos)`);
    } else {
      console.warn(`⚠️ [Worker Auth] Error autenticando: ${authErr?.message}`);
    }
  } catch (authEx: any) {
    console.warn(`⚠️ [Worker Auth] Excepción en login: ${authEx.message}`);
  }

  let kafkaAvailable = false;

  try {
    await consumer.connect();
    await consumer.subscribe({ topics: ['soil.moisture', 'weather.tick'], fromBeginning: false });
    kafkaAvailable = true;
    console.log('✅ Conectado a Redpanda. Suscripto a [soil.moisture, weather.tick]');

    // Bucle de consumo de streaming (§10, RF-24)
    consumer.run({
      eachMessage: async ({ topic, partition, message }) => {
        try {
          const rawValue = message.value?.toString();
          if (!rawValue) return;

          const data = JSON.parse(rawValue);
          console.log(`📥 [consumed] Topic '${topic}' (part ${partition}): Estación ${data.station_id}`);

          if (topic === 'soil.moisture') {
            const { error } = await supabase.from('readings').insert({
              station_id: data.station_id,
              moisture_pct: data.moisture_pct,
              temp_c: data.temp_c,
              rain_mm: 0,
              source: 'sensor',
              measured_at: data.ts,
            });

            if (!error) {
              console.log(
                `💾 [upsert reading] Guardada lectura: ${data.moisture_pct}% en estación ${data.station_id}`
              );
            }
          }
        } catch (msgErr: any) {
          console.error(`[Worker] Error procesando mensaje de Kafka: ${msgErr.message}`);
        }
      },
    });
  } catch (err: any) {
    console.warn(`⚠️ Broker Redpanda no disponible (${err.message}). Worker operando como despachador de comandos Supabase.`);
  }

  // ----------------------------------------------------------------------------
  // DESPACHADOR DE COMANDOS DE RIEGO ASÍNCRONOS (RF-14, RF-15, §07 H1, §08)
  // Espera 1-4s y transiciona el comando a 'applied' o 'failed' (10% fallos académicos)
  // ----------------------------------------------------------------------------
  console.log('⚡ Iniciando listener de comandos de irrigación (polling 1.5s)...');

  let isProcessing = false;

  setInterval(async () => {
    if (isProcessing) return;
    isProcessing = true;

    try {
      const { data: pendingCommands, error } = await supabase
        .from('irrigation_commands')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: true })
        .limit(5);

      if (error || !pendingCommands || pendingCommands.length === 0) {
        return;
      }

      for (const cmd of pendingCommands) {
        console.log(`⏳ [Procesando comando] ID: ${cmd.id} para válvula: ${cmd.valve_id} (Acción: ${cmd.action})`);

        // Simular tiempo de respuesta de campo 1 a 4 segundos (§08, RF-15)
        const delayMs = 1000 + Math.floor(Math.random() * 3000);
        await new Promise((resolve) => setTimeout(resolve, delayMs));

        // Simulación de fallos académicos solo si se activa explícitamente (§08 punto 7)
        const simulateFailure = process.env.SIMULATE_FAILURE === 'true';

        if (simulateFailure) {
          const { error: rpcErr } = await supabase.rpc('apply_irrigation_command', {
            p_command_id: cmd.id,
            p_status: 'failed',
            p_error_reason: 'valve_timeout',
          });

          if (rpcErr) {
            await supabase
              .from('irrigation_commands')
              .update({
                status: 'failed',
                error_reason: 'valve_timeout',
                applied_at: new Date().toISOString(),
              })
              .eq('id', cmd.id);
          }

          console.log(`❌ [command failed] Comando ${cmd.id} marcado como 'failed' por valve_timeout`);
        } else {
          // Aplicar comando mediante RPC atómico
          const { error: rpcErr } = await supabase.rpc('apply_irrigation_command', {
            p_command_id: cmd.id,
            p_status: 'applied',
          });

          if (rpcErr) {
            const newStatus = cmd.action === 'close' ? 'closed' : 'open';
            await supabase
              .from('valves')
              .update({ status: newStatus, updated_at: new Date().toISOString() })
              .eq('id', cmd.valve_id);

            await supabase
              .from('irrigation_commands')
              .update({ status: 'applied', applied_at: new Date().toISOString() })
              .eq('id', cmd.id);
          }

          console.log(
            `✅ [command applied] Comando ${cmd.id} APLICADO con éxito (RF-15)`
          );
        }
      }
    } catch (cmdLoopErr: any) {
      console.error('[Worker Command Loop Error]:', cmdLoopErr.message);
    } finally {
      isProcessing = false;
    }
  }, 1500);
}

startWorker().catch((e) => {
  console.error('[Worker Fatal Error]:', e);
});
