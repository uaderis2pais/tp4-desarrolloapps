// ==============================================================================
// AGROPULSE - LISTADO Y CONTROL DE VÁLVULAS (RF-13, RF-14)
// ==============================================================================

import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Valve } from '../types/database';
import { IrrigationModal } from './IrrigationModal';
import { useAuth } from '../context/AuthContext';

interface ValvesListProps {
  valves: Valve[];
  plotName: string;
}

export const ValvesList: React.FC<ValvesListProps> = ({ valves, plotName }) => {
  const { currentRole } = useAuth();
  const [selectedValve, setSelectedValve] = useState<Valve | null>(null);
  const [modalVisible, setModalVisible] = useState<boolean>(false);

  const isAdvisor = currentRole === 'advisor';

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Válvulas y Actuadores ({valves.length})</Text>

      {valves.length === 0 ? (
        <Text style={styles.emptyText}>No hay válvulas registradas para este lote.</Text>
      ) : (
        valves.map((valve) => {
          const isOpen = valve.status === 'open';

          return (
            <View key={valve.id} style={styles.valveCard}>
              <View style={styles.valveInfo}>
                <View
                  style={[
                    styles.statusIndicator,
                    { backgroundColor: isOpen ? '#2E7D32' : '#9E9E9E' },
                  ]}
                />
                <View>
                  <Text style={styles.valveName}>{valve.name}</Text>
                  <Text style={styles.valveStatus}>
                    Estado: <Text style={{ fontWeight: 'bold' }}>{isOpen ? 'Abierta' : 'Cerrada'}</Text>
                  </Text>
                </View>
              </View>

              <TouchableOpacity
                style={[
                  styles.commandButton,
                  isAdvisor && styles.commandButtonDisabled,
                ]}
                onPress={() => {
                  setSelectedValve(valve);
                  setModalVisible(true);
                }}
                disabled={isAdvisor}
              >
                <Ionicons
                  name={isAdvisor ? 'lock-closed-outline' : 'water-outline'}
                  size={16}
                  color={isAdvisor ? '#888' : '#1B4D3E'}
                />
                <Text
                  style={[
                    styles.commandButtonText,
                    isAdvisor && styles.commandButtonTextDisabled,
                  ]}
                >
                  {isAdvisor ? 'Solo Lectura' : 'Comandar'}
                </Text>
              </TouchableOpacity>
            </View>
          );
        })
      )}

      <IrrigationModal
        visible={modalVisible}
        valve={selectedValve}
        plotName={plotName}
        onClose={() => {
          setModalVisible(false);
          setSelectedValve(null);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
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
  valveCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  valveInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 10,
  },
  valveName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  valveStatus: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  commandButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#C8E6C9',
    gap: 4,
  },
  commandButtonDisabled: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  commandButtonText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1B4D3E',
  },
  commandButtonTextDisabled: {
    color: '#888',
  },
});
