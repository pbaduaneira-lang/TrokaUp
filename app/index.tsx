import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Platform,
  Image,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radius, Shadow, Gradients } from '../constants/theme';
import { Config } from '../constants/config';
import { getCity } from '../services/storage';
import LocationModal from '../components/LocationModal';
import BrandLogo from '../components/BrandLogo';

export default function WelcomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();

  const isDesktop = width > 768;
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [currentCity, setCurrentCity] = useState('');

  useEffect(() => {
    async function loadSavedLocation() {
      const city = await getCity();
      if (city) setCurrentCity(city);
    }
    loadSavedLocation();
  }, []);

  const handleStart = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      } catch (e) {}
    }
    router.replace('/(tabs)/feed');
  };

  const handleOpenLocation = () => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      } catch (e) {}
    }
    setShowLocationModal(true);
  };

  const handleSelectLocation = (selectedCity: string) => {
    setCurrentCity(selectedCity);
    router.replace('/(tabs)/feed');
  };

  const bottomInset = Math.max(insets.bottom, Platform.OS === 'ios' ? 24 : 16);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          isDesktop && styles.scrollContentDesktop,
          { paddingBottom: isDesktop ? 40 : 190 + bottomInset },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={[styles.mainWrapper, isDesktop && styles.mainWrapperDesktop]}>
          {/* Top Header / Branding com Logo Oficial com Seta UP */}
          <View style={[styles.brandHeader, isDesktop && styles.brandHeaderDesktop]}>
            <BrandLogo size={isDesktop ? 44 : 40} fontSize={isDesktop ? 26 : 22} />
            <View style={styles.badgeModern}>
              <Text style={styles.badgeModernText}>ESCAMBO MODERNO</Text>
            </View>
          </View>

          {/* Se for Desktop: Layout Lado a Lado Compacto e Próximo ao Cabeçalho */}
          <View style={[styles.heroRow, isDesktop && styles.heroRowDesktop]}>
            {/* Bloco de Texto Hero */}
            <View style={[styles.heroTextBlock, isDesktop && styles.heroTextBlockDesktop]}>
              <Text style={[styles.heroHeadline, isDesktop && styles.heroHeadlineDesktop]}>
                Transforme o que você tem no que você <Text style={styles.highlightText}>quer</Text>.
              </Text>
              <Text style={[styles.heroSubtitle, isDesktop && styles.heroSubtitleDesktop]}>
                A plataforma inteligente e 100% gratuita para trocar produtos, eletrônicos, instrumentos e muito mais com pessoas da sua região.
              </Text>

              {/* Botões de Ação no Desktop (Mesmo Tamanho e Proporção) */}
              {isDesktop && (
                <View style={styles.desktopButtonsCol}>
                  <TouchableOpacity
                    onPress={handleStart}
                    style={styles.desktopActionBtn}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={Gradients.primary}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.desktopActionGradient}
                    >
                      <Text style={styles.desktopActionBtnText}>COMEÇAR A TROCAR AGORA</Text>
                      <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleOpenLocation}
                    style={styles.desktopActionBtn}
                    activeOpacity={0.9}
                  >
                    <LinearGradient
                      colors={['#0EA5E9', '#0284C7']}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 0 }}
                      style={styles.desktopActionGradient}
                    >
                      <Ionicons name="location-sharp" size={20} color="#FFFFFF" />
                      <Text style={styles.desktopActionBtnText}>
                        {currentCity ? `LOCAL: ${currentCity.toUpperCase()}` : 'INFORME A LOCALIZAÇÃO'}
                      </Text>
                      <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                    </LinearGradient>
                  </TouchableOpacity>
                </View>
              )}
            </View>

            {/* Card com a Imagem 3D Hero */}
            <View style={[styles.heroImageContainer, isDesktop && styles.heroImageContainerDesktop]}>
              <View style={[styles.heroImageCard, isDesktop && styles.heroImageCardDesktop]}>
                <Image
                  source={require('../assets/images/welcome_hero.jpg')}
                  style={styles.heroImage}
                  resizeMode={isDesktop ? 'contain' : 'cover'}
                />
                <View style={styles.heroImageBadge}>
                  <Ionicons name="sparkles" size={14} color="#FFFFFF" />
                  <Text style={styles.heroImageBadgeText}>Trocas Diretas & Sustentáveis</Text>
                </View>
              </View>
            </View>
          </View>

          {/* 3 Pilares do TrokaUp (Grid no Desktop) */}
          <View style={[styles.featuresSection, isDesktop && styles.featuresSectionDesktop]}>
            {/* Card 1 */}
            <View style={[styles.featureCard, isDesktop && styles.featureCardDesktop]}>
              <View style={[styles.featureIconBox, { backgroundColor: Colors.light.primarySoft }]}>
                <Ionicons name="repeat" size={24} color={Colors.light.primary} />
              </View>
              <View style={styles.featureTextBox}>
                <Text style={styles.featureTitle}>Trocas Sem Dinheiro</Text>
                <Text style={styles.featureDesc}>
                  Anuncie seu item usado ou novo e defina o que deseja receber em permuta direta.
                </Text>
              </View>
            </View>

            {/* Card 2 */}
            <View style={[styles.featureCard, isDesktop && styles.featureCardDesktop]}>
              <View style={[styles.featureIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="location-sharp" size={24} color={Colors.light.success} />
              </View>
              <View style={styles.featureTextBox}>
                <Text style={styles.featureTitle}>Negociações Locais</Text>
                <Text style={styles.featureDesc}>
                  Descubra itens na sua cidade ou bairro para facilitar a retirada e a conferência.
                </Text>
              </View>
            </View>

            {/* Card 3 */}
            <View style={[styles.featureCard, isDesktop && styles.featureCardDesktop]}>
              <View style={[styles.featureIconBox, { backgroundColor: '#FFFBEB' }]}>
                <Ionicons name="shield-checkmark" size={24} color={Colors.light.warning} />
              </View>
              <View style={styles.featureTextBox}>
                <Text style={styles.featureTitle}>Chat & Reputação</Text>
                <Text style={styles.featureDesc}>
                  Converse em tempo real, combine a troca e avalie seu parceiro com estrelas.
                </Text>
              </View>
            </View>
          </View>

          {/* Selos de Confiança */}
          <View style={styles.trustBadgesRow}>
            <View style={styles.trustItem}>
              <Ionicons name="flash" size={16} color={Colors.light.primary} />
              <Text style={styles.trustText}>100% Gratuito</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Ionicons name="chatbubbles" size={16} color={Colors.light.primary} />
              <Text style={styles.trustText}>Chat Instantâneo</Text>
            </View>
            <View style={styles.trustDivider} />
            <View style={styles.trustItem}>
              <Ionicons name="star" size={16} color="#F59E0B" />
              <Text style={styles.trustText}>Reputação Real</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Barra Fixa no Rodapé para Mobile (Dois Botões de Mesmo Tamanho) */}
      {!isDesktop && (
        <View style={[styles.bottomBar, { paddingBottom: bottomInset }]}>
          {/* Botão 1: Começar / Iniciar Agora */}
          <TouchableOpacity
            onPress={handleStart}
            style={styles.actionBtnWrapper}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Text style={styles.actionBtnText}>COMEÇAR A TROCAR AGORA</Text>
              <View style={styles.actionIconCircle}>
                <Ionicons name="arrow-forward" size={16} color={Colors.light.primary} />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          {/* Botão 2: Informe a Localização (Azul Claro) */}
          <TouchableOpacity
            onPress={handleOpenLocation}
            style={[styles.actionBtnWrapper, { marginTop: 8 }]}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={['#0EA5E9', '#0284C7']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.actionGradient}
            >
              <Ionicons name="location-sharp" size={18} color="#FFFFFF" />
              <Text style={styles.actionBtnText}>
                {currentCity ? `LOCAL: ${currentCity.toUpperCase()}` : 'INFORME A LOCALIZAÇÃO'}
              </Text>
              <View style={[styles.actionIconCircle, { backgroundColor: '#E0F2FE' }]}>
                <Ionicons name="chevron-forward" size={16} color="#0284C7" />
              </View>
            </LinearGradient>
          </TouchableOpacity>

          <Text style={styles.bottomDisclaimer}>
            {Config.APP_NAME} • Sem taxas, sem comissões, direto entre pessoas.
          </Text>
        </View>
      )}

      {/* Modal de Localização */}
      <LocationModal
        visible={showLocationModal}
        currentCity={currentCity}
        onClose={() => setShowLocationModal(false)}
        onSelectCity={handleSelectLocation}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
  },
  scrollContentDesktop: {
    paddingHorizontal: Spacing.xl,
    paddingTop: 12,
    alignItems: 'center',
  },
  mainWrapper: {
    width: '100%',
  },
  mainWrapperDesktop: {
    maxWidth: 1080,
  },
  brandHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: Spacing.sm,
  },
  brandHeaderDesktop: {
    marginBottom: 4,
    paddingTop: 4,
  },
  badgeModern: {
    backgroundColor: Colors.light.primarySoft,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Radius.full,
    alignSelf: 'center',
  },
  badgeModernText: {
    fontSize: 9,
    fontWeight: '800',
    color: Colors.light.primary,
    letterSpacing: 0.8,
  },
  heroRow: {
    marginBottom: Spacing.md,
  },
  heroRowDesktop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 36,
    marginTop: 8,
    marginBottom: 16,
  },
  heroTextBlock: {
    marginBottom: Spacing.sm,
  },
  heroTextBlockDesktop: {
    flex: 1,
    marginBottom: 0,
  },
  heroHeadline: {
    fontSize: 28,
    fontWeight: '900',
    color: Colors.light.secondary,
    lineHeight: 34,
    letterSpacing: -0.8,
    marginBottom: Spacing.xs,
  },
  heroHeadlineDesktop: {
    fontSize: 38,
    lineHeight: 44,
    letterSpacing: -1,
    marginBottom: 8,
  },
  highlightText: {
    color: Colors.light.primary,
  },
  heroSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    fontWeight: '500',
  },
  heroSubtitleDesktop: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  desktopButtonsCol: {
    gap: 10,
    maxWidth: 420,
  },
  desktopActionBtn: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    ...Shadow.medium,
  },
  desktopActionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 14,
    paddingHorizontal: 22,
  },
  desktopActionBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  heroImageContainer: {
    width: '100%',
  },
  heroImageContainerDesktop: {
    flex: 1,
    maxWidth: 460,
    alignItems: 'center',
  },
  heroImageCard: {
    width: '100%',
    height: 220,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: Colors.light.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadow.card,
  },
  heroImageCardDesktop: {
    height: 340,
    borderRadius: Radius.xl,
  },
  heroImage: {
    width: '100%',
    height: '100%',
  },
  heroImageBadge: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  heroImageBadgeText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
  featuresSection: {
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  featuresSectionDesktop: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 8,
  },
  featureCard: {
    flexDirection: 'row',
    backgroundColor: Colors.light.surfaceSubtle,
    borderRadius: Radius.lg,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.light.border,
    alignItems: 'center',
    gap: 12,
    ...Shadow.soft,
  },
  featureCardDesktop: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: Spacing.md,
  },
  featureIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextBox: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.secondary,
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    lineHeight: 17,
    fontWeight: '500',
  },
  trustBadgesRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.md,
    ...Shadow.soft,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  trustText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.secondary,
  },
  trustDivider: {
    width: 1,
    height: 14,
    backgroundColor: Colors.light.border,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.96)',
    paddingHorizontal: Spacing.lg,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    ...Shadow.glow,
  },
  actionBtnWrapper: {
    borderRadius: Radius.full,
    overflow: 'hidden',
    ...Shadow.medium,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 15,
    gap: 10,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  actionIconCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomDisclaimer: {
    textAlign: 'center',
    fontSize: 10,
    color: Colors.light.muted,
    marginTop: 6,
    fontWeight: '600',
  },
});
