// ==============================================================================
// AGROPULSE - COMPONENTE SEMÁFORO ACCESIBLE (WCAG - §08, RF-12)
// Cumple con la exigencia de accesibilidad: no depender únicamente del color,
// combinando color cromático, icono diferenciado y texto descriptivo.
// ==============================================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PlotStatus } from '../types/database';
import { getSemaforoMeta } from '../utils/semaforo';

interface SemaforoBadgeProps {
  status: PlotStatus;
  size?: 'small' | 'medium' | 'large';
  showDescription?: boolean;
}

export const SemaforoBadge: React.FC<SemaforoBadgeProps> = ({
  status,
  size = 'medium',
  showDescription = false,
}) => {
  const meta = getSemaforoMeta(status);

  const iconSizes = {
    small: 14,
    medium: 18,
    large: 24,
  };

  const textSizes = {
    small: 12,
    medium: 14,
    large: 16,
  };

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.badge,
          {
            backgroundColor: meta.backgroundColor,
            borderColor: meta.borderColor,
            paddingVertical: size === 'small' ? 3 : size === 'large' ? 8 : 6,
            paddingHorizontal: size === 'small' ? 8 : size === 'large' ? 14 : 10,
          },
        ]}
      >
        <Ionicons
          name={meta.icon as any}
          size={iconSizes[size]}
          color={meta.color}
          style={styles.icon}
        />
        <Text
          style={[
            styles.label,
            {
              color: meta.color,
              fontSize: textSizes[size],
            },
          ]}
        >
          {meta.label}
        </Text>
      </View>

      {showDescription && (
        <Text style={styles.descriptionText}>{meta.description}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-start',
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1.5,
  },
  icon: {
    marginRight: 6,
  },
  label: {
    fontWeight: '700',
    letterSpacing: 0.3,
  },
  descriptionText: {
    marginTop: 6,
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
});
