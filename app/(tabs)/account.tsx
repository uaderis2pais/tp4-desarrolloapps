// ==============================================================================
// AGROPULSE - PANTALLA DE CUENTA Y SELECTOR DE ESTABLECIMIENTO (RF-02, RF-03)
// ==============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';

export default function AccountTabScreen() {
  const router = useRouter();
  const {
    user,
    memberships,
    activeOrganization,
    currentRole,
    setActiveOrganizationId,
    signOut,
  } = useAuth();

  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  const confirmLogout = async () => {
    setLoggingOut(true);
    try {
      await signOut();
      setShowLogoutModal(false);
      router.replace('/(auth)/login');
    } catch (err) {
      console.warn('[Account] Error en logout:', err);
    } finally {
      setLoggingOut(false);
    }
  };

  const getRoleDisplayName = (role: string | null) => {
    if (role === 'producer') return 'Productor / Dueño';
    if (role === 'operator') return 'Operador de Irrigación';
    if (role === 'advisor') return 'Ingeniero Agrónomo Asesor';
    return 'Usuario General';
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Tarjeta de Perfil de Usuario */}
      <View style={styles.profileCard}>
        <View style={styles.avatarCircle}>
          <Ionicons name="person" size={36} color="#1B4D3E" />
        </View>

        <View style={styles.profileDetails}>
          <Text style={styles.userEmail}>{user?.email || 'usuario@agropulse.test'}</Text>
          <Text style={styles.userRole}>{getRoleDisplayName(currentRole)}</Text>
          <Text style={styles.sessionType}>Sesión Activa Persistente (RF-01)</Text>
        </View>
      </View>

      {/* Selector de Establecimiento Activo (RF-03) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="business-outline" size={20} color="#1B4D3E" />
          <Text style={styles.sectionTitle}>Establecimientos Asignados (RF-02 / RF-03)</Text>
        </View>
        <Text style={styles.sectionSubtitle}>
          El usuario solo visualiza los lotes del establecimiento seleccionado.
        </Text>

        {memberships.map((membership) => {
          const org = membership.organizations;
          if (!org) return null;
          const isActive = org.id === activeOrganization?.id;

          return (
            <TouchableOpacity
              key={membership.id}
              style={[styles.orgItem, isActive && styles.orgItemActive]}
              onPress={() => setActiveOrganizationId(org.id)}
            >
              <View style={styles.orgInfo}>
                <Text style={[styles.orgName, isActive && styles.orgNameActive]}>
                  {org.name}
                </Text>
                <Text style={styles.orgRegion}>
                  {org.region} • Rol: <Text style={{ fontWeight: 'bold' }}>{membership.role}</Text>
                </Text>
              </View>

              <View style={styles.checkIndicator}>
                {isActive ? (
                  <Ionicons name="radio-button-on" size={22} color="#1B4D3E" />
                ) : (
                  <Ionicons name="radio-button-off" size={22} color="#AAA" />
                )}
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Permisos según el Rol (§05) */}
      <View style={styles.sectionCard}>
        <View style={styles.sectionHeader}>
          <Ionicons name="shield-checkmark-outline" size={20} color="#1B4D3E" />
          <Text style={styles.sectionTitle}>Permisos de tu Rol (§05)</Text>
        </View>

        <View style={styles.permList}>
          <View style={styles.permItem}>
            <Ionicons name="checkmark-circle" size={16} color="#2E7D32" />
            <Text style={styles.permText}>Visualizar mapas, semáforos y series temporales</Text>
          </View>

          <View style={styles.permItem}>
            <Ionicons
              name={currentRole === 'advisor' ? 'close-circle' : 'checkmark-circle'}
              size={16}
              color={currentRole === 'advisor' ? '#D32F2F' : '#2E7D32'}
            />
            <Text style={styles.permText}>
              Emitir comandos de apertura/cierre de válvulas (H2)
            </Text>
          </View>

          <View style={styles.permItem}>
            <Ionicons
              name={currentRole === 'producer' ? 'checkmark-circle' : 'close-circle'}
              size={16}
              color={currentRole === 'producer' ? '#2E7D32' : '#D32F2F'}
            />
            <Text style={styles.permText}>Modificar umbrales mínimos de irrigación</Text>
          </View>
        </View>
      </View>

      {/* Botón de Logout */}
      <TouchableOpacity
        style={styles.logoutButton}
        onPress={() => setShowLogoutModal(true)}
      >
        <Ionicons name="log-out-outline" size={20} color="#D32F2F" />
        <Text style={styles.logoutText}>Cerrar Sesión</Text>
      </TouchableOpacity>

      {/* Modal de Confirmación de Logout compatible con Web, iOS y Android */}
      <Modal
        visible={showLogoutModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLogoutModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalIconCircle}>
              <Ionicons name="log-out-outline" size={32} color="#D32F2F" />
            </View>
            <Text style={styles.modalTitle}>¿Cerrar Sesión?</Text>
            <Text style={styles.modalSubtitle}>
              Saldrás de AgroPulse y deberás ingresar nuevamente tus credenciales.
            </Text>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelButton}
                onPress={() => setShowLogoutModal(false)}
                disabled={loggingOut}
              >
                <Text style={styles.modalCancelText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmButton}
                onPress={confirmLogout}
                disabled={loggingOut}
              >
                {loggingOut ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalConfirmText}>Salir</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7F5',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  avatarCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#E8F5E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  profileDetails: {
    flex: 1,
  },
  userEmail: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
  },
  userRole: {
    fontSize: 13,
    color: '#1B4D3E',
    fontWeight: '600',
    marginTop: 2,
  },
  sessionType: {
    fontSize: 11,
    color: '#777',
    marginTop: 4,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1B4D3E',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 12,
  },
  orgItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FAFAFA',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#DDD',
    marginBottom: 8,
  },
  orgItemActive: {
    backgroundColor: '#E8F5E9',
    borderColor: '#2E7D32',
  },
  orgInfo: {
    flex: 1,
  },
  orgName: {
    fontSize: 14,
    fontWeight: '700',
    color: '#333',
  },
  orgNameActive: {
    color: '#1B4D3E',
  },
  orgRegion: {
    fontSize: 12,
    color: '#666',
    marginTop: 2,
  },
  checkIndicator: {
    marginLeft: 8,
  },
  permList: {
    gap: 8,
  },
  permItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  permText: {
    fontSize: 13,
    color: '#444',
  },
  logoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    paddingVertical: 14,
    borderRadius: 10,
    gap: 8,
    borderWidth: 1,
    borderColor: '#FFCDD2',
    marginTop: 10,
  },
  logoutText: {
    color: '#D32F2F',
    fontWeight: '700',
    fontSize: 15,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  modalIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 18,
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  modalCancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalCancelText: {
    color: '#555',
    fontWeight: '600',
    fontSize: 14,
  },
  modalConfirmButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#D32F2F',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
});
