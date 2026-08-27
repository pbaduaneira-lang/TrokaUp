import React from 'react';
import { View, Text, Pressable, Image, StyleSheet, useWindowDimensions } from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../constants/theme';

export default function TradeCard({ item }) {
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 640;

  if (!item) return null;

  const itemTitle = item.titulo || item.name || 'Item para Troca';
  const wantText = item.quer_em_troca || item.price || 'A combinar';
  const category = item.categoria || 'Geral';
  const city = item.cidade || 'Brasil';
  const imageUrl = item.imagem_url;

  return (
    <Pressable
      onPress={() => router.push(`/product/${item.id}`)}
      style={({ pressed }) => [
        styles.card,
        isDesktop && styles.cardDesktop,
        pressed && { transform: [{ scale: 0.99 }], opacity: 0.95 }
      ]}
    >
      <View style={[styles.imageContainer, isDesktop && styles.imageContainerDesktop]}>
        {imageUrl ? (
          <Image
            source={{ uri: imageUrl }}
            style={styles.image}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.placeholder}>
            <Ionicons name="swap-horizontal" size={36} color={Colors.light.primaryLight} />
            <Text style={styles.placeholderText}>Foto não informada</Text>
          </View>
        )}

        <View style={styles.badgesRow}>
          <View style={styles.cityBadge}>
            <Ionicons name="location-sharp" size={10} color={Colors.light.primary} />
            <Text style={styles.cityText} numberOfLines={1}>{city}</Text>
          </View>

          {category && (
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{category}</Text>
            </View>
          )}
        </View>
      </View>

      <View style={[styles.infoContainer, isDesktop && styles.infoContainerDesktop]}>
        <Text style={styles.title} numberOfLines={2}>{itemTitle}</Text>

        <View style={styles.tradeBox}>
          <View style={styles.tradeHeader}>
            <Ionicons name="repeat" size={12} color={Colors.light.primary} />
            <Text style={styles.tradeLabel}>QUER EM TROCA</Text>
          </View>
          <Text style={styles.wantText} numberOfLines={2}>{wantText}</Text>
        </View>

        <View style={styles.footer}>
          <View style={styles.userSection}>
            <Ionicons name="shield-checkmark" size={14} color={Colors.light.success} />
            <Text style={styles.username}>Anúncio Ativo</Text>
          </View>

          <Pressable
            onPress={async (e) => {
              e.stopPropagation();
              const { getUserProfile } = require('../services/user');
              const profile = await getUserProfile();
              const { getCity } = require('../services/storage');
              const citySaved = await getCity();

              if (!profile.nome || !citySaved) {
                const { Alert } = require('react-native');
                Alert.alert(
                  'Bem-vindo ao TrokaUp! 👋',
                  'Para propor uma troca com este anunciante, complete seu perfil com seu nome e cidade. Leva menos de 30 segundos!',
                  [
                    { text: 'Agora não', style: 'cancel' },
                    { text: 'Preencher Perfil', onPress: () => router.push('/(tabs)/profile') }
                  ]
                );
                return;
              }

              router.push({
                pathname: '/chat',
                params: {
                  usuario_id: item.usuario_id || 'vendedor',
                  titulo: itemTitle,
                  product_id: item.id,
                  product_image: imageUrl || ''
                }
              });
            }}
            style={({ pressed }) => [
              styles.chatBtn,
              pressed && { backgroundColor: Colors.light.primaryDark }
            ]}
          >
            <Ionicons name="chatbubble-ellipses" size={16} color="#FFFFFF" />
            <Text style={styles.chatBtnText}>Propor</Text>
          </Pressable>
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadow.card,
  },
  cardDesktop: {
    flexDirection: 'row',
    alignItems: 'stretch',
    minHeight: 180,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#F1F5F9',
    position: 'relative',
  },
  imageContainerDesktop: {
    width: 220,
    height: '100%',
    minHeight: 180,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.primarySoft,
  },
  placeholderText: {
    fontSize: 12,
    color: Colors.light.muted,
    fontWeight: '600',
  },
  badgesRow: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    ...Shadow.soft,
    maxWidth: '60%',
  },
  cityText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.light.secondary,
    textTransform: 'uppercase',
  },
  categoryBadge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
    ...Shadow.soft,
  },
  categoryText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoContainer: {
    padding: Spacing.md,
  },
  infoContainerDesktop: {
    flex: 1,
    justifyContent: 'space-between',
    padding: Spacing.lg,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: Colors.light.secondary,
    marginBottom: Spacing.sm,
    lineHeight: 22,
  },
  tradeBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.sm,
  },
  tradeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginBottom: 4,
  },
  tradeLabel: {
    fontSize: 10,
    color: Colors.light.primary,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  wantText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.text,
    lineHeight: 18,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    paddingTop: 4,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  username: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  chatBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    ...Shadow.soft,
  },
  chatBtnText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
});
