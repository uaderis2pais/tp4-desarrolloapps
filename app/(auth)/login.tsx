// ==============================================================================
// AGROPULSE - PANTALLA DE LOGIN (RF-01, §14)
// Autenticación con Supabase Auth y accesos rápidos a roles de la cátedra
// ==============================================================================

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/context/AuthContext';
import { supabase } from '../../src/lib/supabase';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const defaultPassword = process.env.EXPO_PUBLIC_DEMO_PASSWORD || 'AgroPulse2026!';

  const handleLogin = async (customEmail?: string) => {
    const targetEmail = customEmail || email;
    const targetPassword = password || defaultPassword;

    if (!targetEmail.trim()) {
      setErrorMessage('Por favor ingrese un correo electrónico.');
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    // 1. Intentar inicio de sesión
    const { error } = await signIn(targetEmail.trim(), targetPassword);

    if (error) {
      // Si el usuario no existe en la base remota, registrarlo automáticamente para la demo
      if (
        error.message?.includes('Invalid login credentials') ||
        error.message?.includes('Email not confirmed') ||
        error.message?.includes('user not found')
      ) {
        try {
          const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
            email: targetEmail.trim(),
            password: targetPassword,
          });

          if (!signUpError && signUpData.session) {
            setLoading(false);
            router.replace('/(tabs)/map');
            return;
          }
        } catch (signErr) {
          console.warn('[Login] Fallo auto-registro demo:', signErr);
        }
      }

      setErrorMessage(error.message || 'Credenciales inválidas o error de conexión');
      setLoading(false);
      return;
    }

    setLoading(false);
    router.replace('/(tabs)/map');
  };

  const setDemoUser = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword(defaultPassword);
    setErrorMessage(null);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={styles.keyboardContainer}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Cabecera */}
        <View style={styles.header}>
          <View style={styles.logoCircle}>
            <Ionicons name="leaf" size={44} color="#FFFFFF" />
          </View>
          <Text style={styles.title}>AgroPulse</Text>
          <Text style={styles.subtitle}>Agricultura de Precisión • Entre Ríos</Text>
        </View>

        {/* Tarjeta de Formulario */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Iniciar Sesión</Text>

          {errorMessage && (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle" size={18} color="#D32F2F" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          )}

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Correo Electrónico</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color="#777" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="usuario@agropulse.test"
                autoCapitalize="none"
                keyboardType="email-address"
                value={email}
                onChangeText={setEmail}
                editable={!loading}
              />
            </View>
          </View>

          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>Contraseña</Text>
            <View style={styles.inputContainer}>
              <Ionicons name="lock-closed-outline" size={20} color="#777" style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                editable={!loading}
              />
            </View>
          </View>

          <TouchableOpacity
            style={[styles.loginButton, loading && styles.loginButtonDisabled]}
            onPress={() => handleLogin()}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <>
                <Text style={styles.loginButtonText}>Ingresar al Establecimiento</Text>
                <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Botones Didácticos de la Cátedra (§14) */}
          <View style={styles.demoSection}>
            <Text style={styles.demoSectionTitle}>Perfiles Didácticos de Evaluación (§14):</Text>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => {
                setDemoUser('productor@agropulse.test');
                handleLogin('productor@agropulse.test');
              }}
              disabled={loading}
            >
              <View style={[styles.roleBadge, { backgroundColor: '#E8F5E9' }]}>
                <Ionicons name="shield-checkmark" size={16} color="#2E7D32" />
                <Text style={[styles.roleBadgeText, { color: '#2E7D32' }]}>Productor</Text>
              </View>
              <Text style={styles.demoEmail}>productor@agropulse.test</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => {
                setDemoUser('operador@agropulse.test');
                handleLogin('operador@agropulse.test');
              }}
              disabled={loading}
            >
              <View style={[styles.roleBadge, { backgroundColor: '#E3F2FD' }]}>
                <Ionicons name="water" size={16} color="#1565C0" />
                <Text style={[styles.roleBadgeText, { color: '#1565C0' }]}>Operador</Text>
              </View>
              <Text style={styles.demoEmail}>operador@agropulse.test</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.demoButton}
              onPress={() => {
                setDemoUser('asesor@agropulse.test');
                handleLogin('asesor@agropulse.test');
              }}
              disabled={loading}
            >
              <View style={[styles.roleBadge, { backgroundColor: '#FFF3E0' }]}>
                <Ionicons name="eye" size={16} color="#E65100" />
                <Text style={[styles.roleBadgeText, { color: '#E65100' }]}>Asesor (Solo Lectura)</Text>
              </View>
              <Text style={styles.demoEmail}>asesor@agropulse.test</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nota Ética y de Dominio (RNF-10) */}
        <Text style={styles.ethicalNotice}>
          Nota Académica (RNF-10): Los valores de humedad, polígonos GPS y sensores son simulados
          con fines didácticos para la cátedra de Desarrollo Móvil 2026.
        </Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#1B4D3E',
  },
  scrollContent: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  logoCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 13,
    color: '#A5D6A7',
    marginTop: 4,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 440,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1B4D3E',
    marginBottom: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 10,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  errorText: {
    fontSize: 12,
    color: '#D32F2F',
    flex: 1,
  },
  fieldGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#444',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D0D0D0',
    borderRadius: 8,
    backgroundColor: '#FBFBFB',
    paddingHorizontal: 12,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: '#222',
  },
  loginButton: {
    backgroundColor: '#1B4D3E',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 8,
    gap: 8,
    marginTop: 10,
  },
  loginButtonDisabled: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  demoSection: {
    marginTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    paddingTop: 16,
  },
  demoSectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#666',
    marginBottom: 10,
  },
  demoButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F9FBF9',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    gap: 4,
  },
  roleBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  demoEmail: {
    fontSize: 12,
    color: '#555',
    fontFamily: 'monospace',
  },
  ethicalNotice: {
    marginTop: 20,
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    maxWidth: 400,
    lineHeight: 16,
  },
});
