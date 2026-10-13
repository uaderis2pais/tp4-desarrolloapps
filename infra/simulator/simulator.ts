// ==============================================================================
// AGROPULSE - SIMULADOR IOT DE SENSORES Y CLIMA (§10, RF-08, RF-24, H4)
// Publica ticks telemétricos cada 3-8s en topics soil.moisture y weather.tick
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
  clientId: 'agropulse-iot-simulator',
  brokers: KAFKA_BROKERS,
  connectionTimeout: 1000,
  logLevel: logLevel.NOTHING,
  retry: {
    retries: 0,
  },
});

const producer = kafka.producer();

// Estaciones semilla de prueba (§14)
interface StationConfig {
  id: string;
  name: string;
  baseMoisture: number;
  baseTemp: number;
  enabled: boolean;
}

const STATIONS: StationConfig[] = [
  {
    id: 'c0000000-0000-0000-0000-000000000001',
    name: 'Estación Costa 1 (Cítricos - Óptimo)',
    baseMoisture: 35.0,
    baseTemp: 22.5,
    enabled: true,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000002',
    name: 'Estación Costa 2 (Cítricos - Seco para H1)',
    baseMoisture: 18.0,
    baseTemp: 24.5,
    enabled: true,
  },
  {
    id: 'c0000000-0000-0000-0000-000000000003',
    name: 'Estación Monte A (Soja - Para Stale H4)',
    baseMoisture: 28.0,
    baseTemp: 21.0,
    enabled: false, // Inicia deshabilitada o apagada para demostrar estado Stale (H4)
  },
];

async function startSimulator() {
  console.log('================================================================');
  console.log('🌱 [AgroPulse] INICIANDO SIMULADOR IOT DE TELEMETRÍA (§10)');
  console.log('================================================================');
  console.log(`Brokers: ${KAFKA_BROKERS.join(', ')}`);
  console.log(`Supabase URL: ${SUPABASE_URL}`);

  // Autenticar en Supabase para operaciones de inserción
  try {
    await supabase.auth.signInWithPassword({
      email: process.env.SIMULATOR_EMAIL || 'productor@agropulse.test',
      password: process.env.SIMULATOR_PASSWORD || 'AgroPulse2026!',
    });
  } catch (authErr) {
    // Modo anónimo fallback
  }

  let kafkaConnected = false;
  try {
    await producer.connect();
    kafkaConnected = true;
    console.log('✅ Conectado exitosamente al broker Redpanda/Kafka');
  } catch (err: any) {
    console.warn(`⚠️ Broker Redpanda no disponible. Operando en pipeline directo a Supabase.`);
  }

  // Bucle de telemetría cada 3 a 8 segundos (§10)
  const tick = async () => {
    for (const station of STATIONS) {
      if (!station.enabled) {
        console.log(`💤 [IoT Producer] Estación ${station.name} APAGADA (Simulando Sensor Caído H4)`);
        continue;
      }

      // Variación aleatoria con ruido (+/- 0.8% humedad, +/- 0.4°C)
      const noise = (Math.random() - 0.5) * 1.6;
      const moisturePct = Math.max(0, Math.min(100, Number((station.baseMoisture + noise).toFixed(2))));
      const tempC = Number((station.baseTemp + (Math.random() - 0.5) * 0.8).toFixed(1));
      const rainMm = Math.random() > 0.95 ? Number((Math.random() * 2).toFixed(1)) : 0.0;
      const ts = new Date().toISOString();

      const soilPayload = {
        station_id: station.id,
        moisture_pct: moisturePct,
        temp_c: tempC,
        ts,
      };

      const weatherPayload = {
        station_id: station.id,
        rain_mm: rainMm,
        ts,
      };

      // 1. Enviar a Redpanda si está conectado
      if (kafkaConnected) {
        try {
          await producer.send({
            topic: 'soil.moisture',
            messages: [{ key: station.id, value: JSON.stringify(soilPayload) }],
          });

          await producer.send({
            topic: 'weather.tick',
            messages: [{ key: station.id, value: JSON.stringify(weatherPayload) }],
          });

          console.log(
            `📡 [produced] Topic 'soil.moisture': ${station.name} -> Humedad: ${moisturePct}% | Temp: ${tempC}°C (RF-24)`
          );
        } catch (kafkaErr: any) {
          console.warn(`[IoT Producer] Error publicando en Kafka: ${kafkaErr.message}`);
        }
      } else {
        console.log(
          `📡 [produced] Evento IoT: ${station.name} -> Humedad: ${moisturePct}% | Temp: ${tempC}°C (RF-24)`
        );
      }

      // 2. Persistir directamente en Supabase si se ejecuta en modo standalone
      try {
        const { error: rpcError } = await supabase.rpc('record_telemetry_reading', {
          p_station_id: station.id,
          p_moisture_pct: moisturePct,
          p_temp_c: tempC,
          p_rain_mm: rainMm,
        });

        if (!rpcError) {
          console.log(`💾 [upsert reading] Supabase (RPC): ${station.name} -> ${moisturePct}% (RF-24)`);
        } else {
          // Fallback a insert directo si la RPC no fue creada aún
          const { error } = await supabase.from('readings').insert({
            station_id: station.id,
            moisture_pct: moisturePct,
            temp_c: tempC,
            rain_mm: rainMm,
            source: 'sensor',
            measured_at: ts,
          });

          if (!error) {
            console.log(`💾 [upsert reading] Supabase: ${station.name} -> ${moisturePct}% (RF-24)`);
          }
        }
      } catch (dbErr) {
        // Fallback silencioso
      }
    }

    // Intervalo aleatorio entre 3 y 8 segundos
    const nextInterval = 3000 + Math.random() * 5000;
    setTimeout(tick, nextInterval);
  };

  // Iniciar primer tick
  tick();
}

startSimulator().catch((e) => {
  console.error('[Simulador Fatal Error]:', e);
});
