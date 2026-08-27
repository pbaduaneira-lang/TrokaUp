import React from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { Colors, Radius, Shadow } from '../constants/theme';

interface BrandLogoProps {
  size?: number;
  showText?: boolean;
  fontSize?: number;
}

export default function BrandLogo({ size = 36, showText = true, fontSize = 22 }: BrandLogoProps) {
  return (
    <View style={styles.container}>
      <View style={[styles.logoBox, { width: size, height: size, borderRadius: size * 0.28 }]}>
        <Image
          source={require('../assets/images/trokaup_logo.jpg')}
          style={styles.logoImage}
          resizeMode="cover"
        />
      </View>
      {showText && (
        <Text style={[styles.brandText, { fontSize }]}>
          Troka<Text style={{ color: Colors.light.primary }}>Up</Text>
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBox: {
    overflow: 'hidden',
    backgroundColor: Colors.light.primary,
    ...Shadow.soft,
  },
  logoImage: {
    width: '100%',
    height: '100%',
  },
  brandText: {
    fontWeight: '900',
    color: Colors.light.secondary,
    letterSpacing: -0.5,
  },
});
