// ==============================================================================
// AGROPULSE - COLA LOCAL DE SINCRONIZACIÓN OFFLINE (OA-6, RF-21, RNF-07)
// Permite registrar comandos y lecturas manuales en modo degradado o sin señal
// y sincronizarlos automáticamente al recuperar la red sin duplicación.
// ==============================================================================

import AsyncStorage from '@react-native-async-storage/async-storage';
import { SupabaseClient } from '@supabase/supabase-js';

const STORAGE_QUEUE_KEY = '@agropulse_offline_queue_v1';

export type QueueItemType = 'command' | 'manual_reading';

export interface OfflineQueueItem {
  id: string; // client_request_id (UUID)
  type: QueueItemType;
  payload: any;
  createdAt: string;
  attempts: number;
  lastError?: string;
}

/**
 * Obtiene la lista actual de elementos encolados localmente
 */
export async function getOfflineQueue(): Promise<OfflineQueueItem[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_QUEUE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (error) {
    console.error('[OfflineQueue] Error al leer cola local:', error);
    return [];
  }
}

/**
 * Encola un nuevo comando o lectura manual para procesamiento posterior
 */
export async function enqueueOfflineItem(
  type: QueueItemType,
  id: string,
  payload: any
): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    // Evitar duplicados del mismo client_request_id
    if (queue.some((item) => item.id === id)) {
      return;
    }

    const newItem: OfflineQueueItem = {
      id,
      type,
      payload,
      createdAt: new Date().toISOString(),
      attempts: 0,
    };

    queue.push(newItem);
    await AsyncStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(queue));
    console.log(`[OfflineQueue] Encolado elemento ${type} con ID: ${id}`);
  } catch (error) {
    console.error('[OfflineQueue] Error al guardar en cola local:', error);
  }
}

/**
 * Remueve un elemento sincronizado con éxito de la cola local
 */
export async function removeOfflineItem(id: string): Promise<void> {
  try {
    const queue = await getOfflineQueue();
    const filtered = queue.filter((item) => item.id !== id);
    await AsyncStorage.setItem(STORAGE_QUEUE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('[OfflineQueue] Error al remover elemento de la cola:', error);
  }
}

/**
 * Intenta procesar y sincronizar todos los elementos pendientes con Supabase
 */
export async function processOfflineQueue(
  supabase: SupabaseClient
): Promise<{ processed: number; errors: number; remaining: number }> {
  const queue = await getOfflineQueue();
  if (queue.length === 0) {
    return { processed: 0, errors: 0, remaining: 0 };
  }

  let processed = 0;
  let errors = 0;

  for (const item of queue) {
    try {
      if (item.type === 'command') {
        const { valveId, action, durationMin, requestedBy } = item.payload;
        // Intenta la llamada RPC idempotente
        const { error } = await supabase.rpc('issue_irrigation_command', {
          p_valve_id: valveId,
          p_action: action,
          p_duration_min: durationMin || null,
          p_client_request_id: item.id,
        });

        if (error) {
          // Si el error es duplicado o ya procesado, se considera resuelto
          if (error.message?.includes('previamente registrado') || error.message?.includes('duplicate key')) {
            await removeOfflineItem(item.id);
            processed++;
          } else {
            console.warn('[OfflineQueue] Error al reintentar comando:', error.message);
            item.attempts++;
            item.lastError = error.message;
            errors++;
          }
        } else {
          await removeOfflineItem(item.id);
          processed++;
        }
      } else if (item.type === 'manual_reading') {
        const { stationId, moisturePct, tempC, notes } = item.payload;
        const { error } = await supabase.from('readings').insert({
          station_id: stationId,
          moisture_pct: moisturePct,
          temp_c: tempC,
          source: 'manual',
          notes: notes ? `[Offline Sync] ${notes}` : '[Offline Sync]',
          measured_at: item.createdAt,
        });

        if (error) {
          console.warn('[OfflineQueue] Error al sincronizar lectura manual:', error.message);
          item.attempts++;
          item.lastError = error.message;
          errors++;
        } else {
          await removeOfflineItem(item.id);
          processed++;
        }
      }
    } catch (e: any) {
      console.error('[OfflineQueue] Excepción sincronizando elemento:', e);
      item.attempts++;
      item.lastError = e.message;
      errors++;
    }
  }

  const remainingQueue = await getOfflineQueue();
  return { processed, errors, remaining: remainingQueue.length };
}
