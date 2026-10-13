// ==============================================================================
// AGROPULSE - MODAL DE LECTURA MANUAL EN CAMPO (RF-21, OA-6)
// Soporta registro offline automático si no hay señal celular
// ==============================================================================

import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRealtime } from '../context/RealtimeContext';

interface ManualReadingModalProps {
  visible: boolean;
  stationId: string;
  plotId: string;
  plotName: string;
  onClose: () => void;
}

export const ManualReadingModal: React.FC<ManualReadingModalProps> = ({
  visible,
  stationId,
  plotId,
  plotName,
  onClose,
}) => {
  const { submitManualReading } = useRealtime();
  const [moisture, setMoisture] = useState<string>('24.0');
  const [temp, setTemp] = useState<string>('23.5');
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const handleSubmit = async () => {
    const moistureVal = parseFloat(moisture);
    const tempVal = parseFloat(temp);

    if (isNaN(moistureVal) || moistureVal < 0 || moistureVal > 100) {
      setFeedback('Ingrese un porcentaje válido de humedad (0 - 100%)');
      return;
    }

    setLoading(true);
    setFeedback(null);

    const res = await submitManualReading(
      stationId,
      plotId,
      moistureVal,
      isNaN(tempVal) ? 22 : tempVal,
      notes
    );

    setLoading(false);
    setFeedback(res.message);

    setTimeout(() => {
      setFeedback(null);
      onClose();
    }, 1500);
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          <View style={styles.header}>
            <View style={styles.titleRow}>
              <Ionicons name="create-outline" size={24} color="#1B4D3E" />
              <Text style={styles.title}>Lectura Manual en Campo</Text>
            </View>
            <TouchableOpacity onPress={onClose} disabled={loading}>
              <Ionicons name="close" size={24} color="#666" />
            </TouchableOpacity>
          </View>

          <Text style={styles.subtitle}>
            Lote: <Text style={{ fontWeight: 'bold' }}>{plotName}</Text>
          </Text>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Humedad Estimada (%) *</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={moisture}
              onChangeText={setMoisture}
              placeholder="Ej: 22.5"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Temperatura (°C)</Text>
            <TextInput
              style={styles.input}
              keyboardType="numeric"
              value={temp}
              onChangeText={setTemp}
              placeholder="Ej: 24.0"
            />
          </View>

          <View style={styles.formGroup}>
            <Text style={styles.label}>Notas u Observaciones agronómicas</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              multiline
              numberOfLines={3}
              value={notes}
              onChangeText={setNotes}
              placeholder="Ej: Suelo seco a 10cm de profundidad en surco 3"
            />
          </View>

          {feedback && (
            <View style={styles.feedbackBox}>
              <Ionicons name="information-circle" size={18} color="#1B4D3E" />
              <Text style={styles.feedbackText}>{feedback}</Text>
            </View>
          )}

          <TouchableOpacity
            style={[styles.submitButton, loading && styles.submitDisabled]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.submitText}>Guardar Lectura (Soporta Offline)</Text>
                <Ionicons name="cloud-upload-outline" size={16} color="#FFFFFF" />
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
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
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
  subtitle: {
    fontSize: 13,
    color: '#555',
    marginBottom: 16,
  },
  formGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#333',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CCC',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    backgroundColor: '#FAFAFA',
  },
  textArea: {
    height: 70,
    textAlignVertical: 'top',
  },
  feedbackBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    padding: 10,
    borderRadius: 8,
    marginBottom: 14,
    gap: 8,
  },
  feedbackText: {
    fontSize: 12,
    color: '#1B4D3E',
    flex: 1,
  },
  submitButton: {
    backgroundColor: '#1B4D3E',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
    marginTop: 4,
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
