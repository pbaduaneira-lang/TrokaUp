import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  Linking,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, Radius, Shadow } from '../constants/theme';
import { Config } from '../constants/config';
import BrandLogo from '../components/BrandLogo';

export default function PrivacyPolicyScreen() {
  const router = useRouter();

  const handleOpenExternal = () => {
    Linking.openURL(Config.PRIVACY_POLICY_URL).catch(() => {
      // Fallback
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={Colors.light.secondary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>Política de Privacidade</Text>
        </View>
        <TouchableOpacity
          style={styles.externalButton}
          onPress={handleOpenExternal}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="open-outline" size={20} color={Colors.light.primary} />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.mainWrapper}>
          <View style={styles.badgeRow}>
            <BrandLogo size={32} fontSize={18} />
            <View style={styles.dateBadge}>
              <Text style={styles.dateBadgeText}>Atualizado em Agosto/2026</Text>
            </View>
          </View>

          <Text style={styles.title}>Política de Privacidade do {Config.APP_NAME}</Text>

          <View style={styles.introBox}>
            <Ionicons name="shield-checkmark" size={22} color={Colors.light.primary} style={styles.introIcon} />
            <Text style={styles.introText}>
              O <Text style={{ fontWeight: '800' }}>{Config.APP_NAME}</Text> está em total conformidade com a LGPD (Lei 13.709/2018) e com os requisitos de Segurança de Dados da Google Play Store.
            </Text>
          </View>

          {/* Seções */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>1. Coleta de Informações</Text>
            <Text style={styles.paragraph}>
              Coletamos apenas os dados fundamentais para viabilizar as trocas entre usuários na sua região:
            </Text>
            <View style={styles.bulletItem}>
              <Ionicons name="person-outline" size={16} color={Colors.light.primary} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Perfil:</Text> Nome ou apelido informado voluntariamente e foto de avatar opcional.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="location-outline" size={16} color={Colors.light.primary} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Localização:</Text> A cidade selecionada para filtrar e exibir produtos da mesma região geográfica.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="images-outline" size={16} color={Colors.light.primary} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Fotos de Produtos:</Text> Fotografias e descrições dos produtos que você anuncia para troca.
              </Text>
            </View>
            <View style={styles.bulletItem}>
              <Ionicons name="chatbubble-ellipses-outline" size={16} color={Colors.light.primary} style={styles.bulletIcon} />
              <Text style={styles.bulletText}>
                <Text style={styles.boldText}>Chat Interno:</Text> Mensagens trocadas no chat do app para combinar detalhes e local da troca.
              </Text>
            </View>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>2. Finalidade e Não Compartilhamento</Text>
            <Text style={styles.paragraph}>
              Seus dados são utilizados exclusivamente para permitir a postagem de anúncios e a conversa entre negociadores.
            </Text>
            <Text style={[styles.paragraph, { fontWeight: '700', color: Colors.light.secondary }]}>
              NUNCA vendemos ou transferimos dados de usuários para empresas de marketing ou terceiros.
            </Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>3. Permissões de Dispositivo</Text>
            <Text style={styles.paragraph}>
              O aplicativo solicita permissão de <Text style={styles.boldText}>Câmera</Text> e <Text style={styles.boldText}>Galeria de Fotos</Text> unicamente quando você escolhe tirar ou selecionar uma imagem para seu anúncio ou perfil.
            </Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>4. Exclusão de Conta e Dados</Text>
            <Text style={styles.paragraph}>
              Respeitamos seu controle total sobre seus dados. Você pode excluir sua conta, anúncios e histórico de mensagens a qualquer instante diretamente no app acessando <Text style={styles.boldText}>Perfil &gt; Excluir Minha Conta e Dados</Text>.
            </Text>
          </View>

          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>5. Contato e Suporte</Text>
            <Text style={styles.paragraph}>
              Para dúvidas sobre privacidade, envie um e-mail para:
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL(`mailto:${Config.SUPPORT_EMAIL}`)}>
              <Text style={styles.emailLink}>{Config.SUPPORT_EMAIL}</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.footerContainer}>
            <Text style={styles.footerText}>
              {Config.APP_NAME} • Pacote: {Config.PACKAGE_ID}
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  backButton: {
    padding: 6,
  },
  externalButton: {
    padding: 6,
  },
  headerTitleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.secondary,
  },
  scrollContent: {
    padding: Spacing.lg,
    paddingBottom: 40,
    alignItems: 'center',
  },
  mainWrapper: {
    width: '100%',
    maxWidth: 680,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  dateBadge: {
    backgroundColor: Colors.light.surfaceSubtle,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.light.textSecondary,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.light.secondary,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  },
  introBox: {
    flexDirection: 'row',
    backgroundColor: '#EEF2FF',
    padding: Spacing.md,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
    borderLeftWidth: 4,
    borderLeftColor: Colors.light.primary,
    alignItems: 'center',
    gap: 12,
  },
  introIcon: {
    marginTop: 2,
  },
  introText: {
    flex: 1,
    fontSize: 13,
    color: '#312E81',
    lineHeight: 19,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.secondary,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
    marginBottom: 8,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 6,
    gap: 8,
  },
  bulletIcon: {
    marginTop: 2,
  },
  bulletText: {
    flex: 1,
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 19,
  },
  boldText: {
    fontWeight: '700',
    color: Colors.light.text,
  },
  emailLink: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.primary,
    marginTop: 4,
  },
  footerContainer: {
    alignItems: 'center',
    marginTop: Spacing.lg,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
  },
  footerText: {
    fontSize: 12,
    color: Colors.light.muted,
    fontWeight: '600',
  },
});
