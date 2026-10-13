// ==============================================================================
// AGROPULSE - BANDEJA DE ALERTAS IN-APP (RF-19, RF-20)
// ==============================================================================

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRealtime } from '../../src/context/RealtimeContext';
import { Alert } from '../../src/types/database';
import { supabase } from '../../src/lib/supabase';

export default function AlertsTabScreen() {
  const { alerts, plots, refreshData } = useRealtime();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refreshData();
    setRefreshing(false);
  };

  const markAsRead = async (alertId: string) => {
    try {
      await supabase
        .from('alerts')
        .update({ read_at: new Date().toISOString() })
        .eq('id', alertId);
      await refreshData();
    } catch (err) {
      console.warn('[Alerts] Error marcando leída:', err);
    }
  };

  const getAlertMeta = (type: string) => {
    switch (type) {
      case 'dry':
        return {
          title: 'Alerta de Lote Seco (RF-19)',
          icon: 'alert-circle',
          color: '#D32F2F',
          bg: '#FFEBEE',
        };
      case 'stale':
        return {
          title: 'Estación Sin Reportar > 15 min (RF-20)',
          icon: 'time-outline',
          color: '#616161',
          bg: '#F5F5F5',
        };
      case 'failed_command':
      default:
        return {
          title: 'Fallo de Comando en Válvula',
          icon: 'warning-outline',
          color: '#E65100',
          bg: '#FFF3E0',
        };
    }
  };

  const renderAlertCard = ({ item }: { item: Alert }) => {
    const meta = getAlertMeta(item.type);
    const plot = plots.find((p) => p.id === item.plot_id);
    const isUnread = !item.read_at;

    return (
      <View style={[styles.alertCard, isUnread && styles.alertCardUnread]}>
        <View style={styles.cardHeader}>
          <View style={[styles.iconCircle, { backgroundColor: meta.bg }]}>
            <Ionicons name={meta.icon as any} size={20} color={meta.color} />
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.alertTitle}>{meta.title}</Text>
            <Text style={styles.alertPlot}>Lote: {plot?.name || 'Lote del establecimiento'}</Text>
          </View>

          {isUnread && (
            <TouchableOpacity onPress={() => markAsRead(item.id)} style={styles.readButton}>
              <Ionicons name="checkmark-done" size={18} color="#1B4D3E" />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.alertMessage}>
          {item.payload?.message || 'Se ha detectado una anomalía en las lecturas de telemetría.'}
        </Text>

        <Text style={styles.timestamp}>
          {new Date(item.created_at).toLocaleString([], {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={alerts}
        keyExtractor={(item) => item.id}
        renderItem={renderAlertCard}
        contentContainerStyle={styles.listContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Ionicons name="notifications-off-outline" size={48} color="#AAA" />
            <Text style={styles.emptyTitle}>Bandeja de alertas al día</Text>
            <Text style={styles.emptySubtitle}>
              No existen alertas críticas de suelo seco ni estaciones en estado stale.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F5',
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  alertCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  alertCardUnread: {
    borderColor: '#D32F2F',
    borderLeftWidth: 4,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  headerInfo: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  alertPlot: {
    fontSize: 12,
    color: '#666',
  },
  readButton: {
    padding: 6,
  },
  alertMessage: {
    fontSize: 13,
    color: '#444',
    lineHeight: 18,
    marginBottom: 8,
  },
  timestamp: {
    fontSize: 11,
    color: '#888',
    alignSelf: 'flex-end',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
    marginTop: 40,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#444',
    marginTop: 12,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#777',
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 280,
  },
});
