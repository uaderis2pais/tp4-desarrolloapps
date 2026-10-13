// ==============================================================================
// AGROPULSE - HISTORIAL DE COMANDOS DE RIEGO (RF-17, RF-18)
// Muestra los últimos 20 comandos emitidos, estado de transición y botón de cancelación
// ==============================================================================

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IrrigationCommand, CommandStatus } from '../types/database';
import { useRealtime } from '../context/RealtimeContext';
import { useAuth } from '../context/AuthContext';

interface CommandHistoryListProps {
  commands: IrrigationCommand[];
}

export const CommandHistoryList: React.FC<CommandHistoryListProps> = ({ commands }) => {
  const { cancelIrrigationCommand } = useRealtime();
  const { currentRole } = useAuth();

  const getStatusBadge = (status: CommandStatus) => {
    switch (status) {
      case 'applied':
        return { label: 'Aplicado', bg: '#E8F5E9', color: '#2E7D32', icon: 'checkmark-circle' };
      case 'failed':
        return { label: 'Fallido', bg: '#FFEBEE', color: '#D32F2F', icon: 'close-circle' };
      case 'cancelled':
        return { label: 'Cancelado', bg: '#F5F5F5', color: '#757575', icon: 'ban' };
      case 'pending':
      default:
        return { label: 'En espera (Pending)', bg: '#FFF8E1', color: '#F57F17', icon: 'time' };
    }
  };

  const getActionLabel = (action: string, duration?: number | null) => {
    if (action === 'open') return 'Apertura de válvula';
    if (action === 'close') return 'Cierre de válvula';
    return `Riego por ${duration || 30} min`;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Historial de Comandos de Irrigación ({commands.length})</Text>

      {commands.length === 0 ? (
        <Text style={styles.emptyText}>No hay comandos recientes registrados.</Text>
      ) : (
        commands.slice(0, 20).map((cmd) => {
          const badge = getStatusBadge(cmd.status);
          const isPending = cmd.status === 'pending';
          const canCancel = isPending && currentRole !== 'advisor';

          return (
            <View key={cmd.id} style={styles.card}>
              <View style={styles.cardTop}>
                <View style={styles.actionInfo}>
                  <Text style={styles.actionText}>{getActionLabel(cmd.action, cmd.duration_min)}</Text>
                  <Text style={styles.dateText}>
                    {new Date(cmd.created_at).toLocaleString([], {
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                      second: '2-digit',
                    })}
                  </Text>
                </View>

                <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                  <Ionicons name={badge.icon as any} size={14} color={badge.color} />
                  <Text style={[styles.badgeText, { color: badge.color }]}>{badge.label}</Text>
                </View>
              </View>

              {cmd.error_reason && (
                <Text style={styles.errorText}>Motivo de fallo: {cmd.error_reason}</Text>
              )}

              {cmd.client_request_id && (
                <Text style={styles.requestId}>ID: {cmd.client_request_id}</Text>
              )}

              {canCancel && (
                <TouchableOpacity
                  style={styles.cancelButton}
                  onPress={() => cancelIrrigationCommand(cmd.id)}
                >
                  <Ionicons name="trash-outline" size={14} color="#D32F2F" />
                  <Text style={styles.cancelButtonText}>Cancelar comando pendiente</Text>
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B4D3E',
    marginBottom: 10,
  },
  emptyText: {
    color: '#888',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  actionInfo: {
    flex: 1,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  dateText: {
    fontSize: 11,
    color: '#777',
    marginTop: 2,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  errorText: {
    fontSize: 11,
    color: '#D32F2F',
    marginTop: 6,
  },
  requestId: {
    fontSize: 10,
    color: '#999',
    marginTop: 4,
    fontFamily: 'monospace',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 4,
    alignSelf: 'flex-end',
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  cancelButtonText: {
    fontSize: 11,
    color: '#D32F2F',
    fontWeight: '600',
  },
});
