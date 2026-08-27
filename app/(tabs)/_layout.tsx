import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { Colors, Shadow } from '../../constants/theme';

export default function TabsLayout() {
  const insets = useSafeAreaInsets();

  // Garante padding suficiente para os botões do sistema Android e barra do iOS
  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 16);
  const tabHeight = 56 + bottomInset;

  const handleTabPress = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {
        // Ignora caso haptics não esteja disponível no emulador
      }
    }
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.light.primary,
        tabBarInactiveTintColor: Colors.light.muted,
        tabBarHideOnKeyboard: true,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '700',
          marginTop: 2,
        },
        tabBarItemStyle: {
          paddingVertical: 6,
          justifyContent: 'center',
          alignItems: 'center',
        },
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: Colors.light.border,
          height: tabHeight,
          paddingBottom: bottomInset,
          paddingTop: 6,
          ...Shadow.card,
        },
      }}
    >
      <Tabs.Screen
        name="feed"
        listeners={{
          tabPress: handleTabPress,
        }}
        options={{
          title: 'Explorar',
          tabBarLabel: 'Explorar',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'sparkles' : 'sparkles-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="publish"
        listeners={{
          tabPress: handleTabPress,
        }}
        options={{
          title: 'Anunciar',
          tabBarLabel: 'Anunciar',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'add-circle' : 'add-circle-outline'}
              size={26}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="explore"
        listeners={{
          tabPress: handleTabPress,
        }}
        options={{
          title: 'Mensagens',
          tabBarLabel: 'Conversas',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'chatbubbles' : 'chatbubbles-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />

      <Tabs.Screen
        name="profile"
        listeners={{
          tabPress: handleTabPress,
        }}
        options={{
          title: 'Meu Perfil',
          tabBarLabel: 'Perfil',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons
              name={focused ? 'person' : 'person-outline'}
              size={22}
              color={color}
            />
          ),
        }}
      />
    </Tabs>
  );
}
