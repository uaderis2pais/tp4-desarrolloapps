// ==============================================================================
// AGROPULSE - MODAL DE CONFIRMACIÓN DE COMANDO DE IRRIGACIÓN (RF-14, RF-16)
// Permite ordenar apertura, cierre o riego temporizado (1-120 min)
// mostrando resumen técnico y client_request_id garantizando idempotencia.
// ==============================================================================

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Valve, CommandAction } from '../types/database';
import { useRealtime } from '../context/RealtimeContext';

interface IrrigationModalProps {
  visible: boolean;
  valve: Valve | null;
  plotName: string;
  onClose: () => void;
}

export const IrrigationModal: React.FC<IrrigationModalProps> = ({
  visible,
  valve,
  plotName,
  onClose,
}) => {
  const { issueIrrigationCommand } = useRealtime();
  const [action, setAction] = useState<CommandAction>('irrigate_duration');
  const [durationMin, setDurationMin] = useState<string>('30');
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  if (!valve) return null;

  const handleConfirm = async () => {
    setLoading(true);
    setFeedback(null);

    const parsedDuration = action === 'irrigate_duration' ? parseInt(durationMin, 10) || 30 : undefined;

    const res = await issueIrrigationCommand(valve.id, action, parsedDuration);
    setLoading(false);

    if (res.success) {
      setFeedback({ type: 'success', message: res.message });
      setTimeout(() => {
        setFeedback(null);
        onClose();
      }, 1600);
    } else {
      setFeedback({ type: 'error', message: res.message });
    }
  };

  const clientRequestIdPreview = 'UUID v4 (Idempotencia)';

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="water-outline" size={24} color="#1B4D3E" />
              <Text style={styles.title}>Comando de Irrigación</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          {/* Resumen del comando */}
          <View style={styles.summaryBox}>
            <Text style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Lote: </Text>
              {plotName}
            </Text>
            <Text style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Válvula: </Text>
              {valve.name}
            </Text>
            <Text style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Estado actual: </Text>
              <Text
                style={{
                  fontWeight: 'bold',
                  color: valve.status === 'open' ? '#2E7D32' : '#757575',
                }}
              >
                {valve.status === 'open' ? 'Abierta' : 'Cerrada'}
              </Text>
            </Text>
            <Text style={styles.summaryLine}>
              <Text style={styles.summaryLabel}>Idempotency ID: </Text>
              <Text style={styles.requestIdCode}>{clientRequestIdPreview}</Text>
            </Text>
          </View>

          {/* Selector de Acción */}
          <Text style={styles.sectionLabel}>Seleccione la acción:</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={[
                styles.actionChip,
                action === 'irrigate_duration' && styles.actionChipActive,
              ]}
              onPress={() => setAction('irrigate_duration')}
              disabled={loading}
            >
              <Text
                style={[
                  styles.actionChipText,
                  action === 'irrigate_duration' && styles.actionChipTextActive,
                ]}
              >
                Regar N min
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionChip, action === 'open' && styles.actionChipActive]}
              onPress={() => setAction('open')}
              disabled={loading}
            >
              <Text
                style={[
                  styles.actionChipText,
                  action === 'open' && styles.actionChipTextActive,
                ]}
              >
                Abrir Válvula
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionChip, action === 'close' && styles.actionChipActive]}
              onPress={() => setAction('close')}
              disabled={loading}
            >
              <Text
                style={[
                  styles.actionChipText,
                  action === 'close' && styles.actionChipTextActive,
                ]}
              >
                Cerrar Válvula
              </Text>
            </TouchableOpacity>
          </View>

          {/* Parámetro de Duración (1 a 120 min) */}
          {action === 'irrigate_duration' && (
            <View style={styles.durationContainer}>
              <Text style={styles.sectionLabel}>Duración de irrigación (1–120 minutos):</Text>
              <View style={styles.presetsRow}>
                {['15', '30', '45', '60'].map((val) => (
                  <TouchableOpacity
                    key={val}
                    style={[
                      styles.presetButton,
                      durationMin === val && styles.presetButtonActive,
                    ]}
                    onPress={() => setDurationMin(val)}
                  >
                    <Text
                      style={[
                        styles.presetText,
                        durationMin === val && styles.presetTextActive,
                      ]}
                    >
                      {val} min
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={styles.inputRow}>
                <TextInput
                  style={styles.durationInput}
                  keyboardType="numeric"
                  value={durationMin}
                  onChangeText={setDurationMin}
                  maxLength={3}
                  editable={!loading}
                />
                <Text style={styles.inputUnit}>minutos</Text>
              </View>
            </View>
          )}

          {/* Mensajes de Feedback o Error */}
          {feedback && (
            <View
              style={[
                styles.feedbackBox,
                feedback.type === 'success'
                  ? styles.feedbackSuccess
                  : styles.feedbackError,
              ]}
            >
              <Ionicons
                name={
                  feedback.type === 'success'
                    ? 'checkmark-circle-outline'
                    : 'alert-circle-outline'
                }
                size={20}
                color={feedback.type === 'success' ? '#2E7D32' : '#D32F2F'}
              />
              <Text
                style={[
                  styles.feedbackText,
                  { color: feedback.type === 'success' ? '#2E7D32' : '#D32F2F' },
                ]}
              >
                {feedback.message}
              </Text>
            </View>
          )}

          {/* Botón Confirmar */}
          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitButtonDisabled]}
            onPress={handleConfirm}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitButtonText}>Confirmar y Enviar Comando</Text>
                <Ionicons name="send" size={16} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 450,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1B4D3E',
  },
  summaryBox: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  summaryLine: {
    fontSize: 13,
    color: '#333',
    marginBottom: 4,
  },
  summaryLabel: {
    fontWeight: '600',
    color: '#555',
  },
  requestIdCode: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#666',
  },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  actionChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F0F0F0',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  actionChipActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
  },
  actionChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  actionChipTextActive: {
    color: '#2E7D32',
    fontWeight: '700',
  },
  durationContainer: {
    marginBottom: 16,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  presetButton: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 6,
    backgroundColor: '#FAFAFA',
    borderWidth: 1,
    borderColor: '#DDD',
    alignItems: 'center',
  },
  presetButtonActive: {
    backgroundColor: '#1B4D3E',
    borderColor: '#1B4D3E',
  },
  presetText: {
    fontSize: 12,
    color: '#555',
  },
  presetTextActive: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  durationInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 80,
    fontSize: 16,
    textAlign: 'center',
  },
  inputUnit: {
    fontSize: 14,
    color: '#666',
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  feedbackSuccess: {
    backgroundColor: '#E8F5E9',
  },
  feedbackError: {
    backgroundColor: '#FFEBEE',
  },
  feedbackText: {
    fontSize: 12,
    flex: 1,
    fontWeight: '600',
  },
  submitButton: {
    backgroundColor: '#1B4D3E',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
