import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  StatusBar,
  Platform,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { getCity, saveCity } from '../../services/storage';
import { getUserProfile, saveUserProfile, getOrCreateUserId, clearAllData } from '../../services/user';
import { getConversations, deleteAccount } from '../../services/api';
import { Colors, Spacing, Radius, Shadow, Gradients } from '../../constants/theme';
import { Config } from '../../constants/config';
import BrandLogo from '../../components/BrandLogo';

const CITIES = [
  'Curitiba - PR',
  'São Paulo - SP',
  'Rio de Janeiro - RJ',
  'Belo Horizonte - MG',
  'Porto Alegre - RS',
  'Florianópolis - SC',
  'Campinas - SP',
  'Londrina - PR',
  'Maringá - PR',
  'Brasília - DF',
  'Salvador - BA',
  'Recife - PE',
  'Fortaleza - CE',
];

export default function ProfileScreen() {
  const router = useRouter();
  const [cityInput, setCityInput] = useState('');
  const [userName, setUserName] = useState('');
  const [userPhoto, setUserPhoto] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [hasUnread, setHasUnread] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [meuId, setMeuId] = useState(null);

  // Modal de Termos e Privacidade
  const [showTermsModal, setShowTermsModal] = useState(false);
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);

  const checkMessages = async (uid) => {
    if (!uid) return;
    try {
      const data = await getConversations(uid);
      const unread = (data || []).some((conv) => !conv.lida && conv.ultimo_remetente !== uid);
      setHasUnread(unread);
    } catch (error) {
      console.log('[TrokaUp] Checagem de mensagens:', error);
    }
  };

  useEffect(() => {
    async function loadData() {
      const savedCity = await getCity();
      const profile = await getUserProfile();
      const uid = await getOrCreateUserId();

      setMeuId(uid);
      if (savedCity) setCityInput(savedCity);
      if (profile.nome) setUserName(profile.nome);
      if (profile.foto) setUserPhoto(profile.foto);

      if (profile.nome && savedCity) {
        setIsLoggedIn(true);
      }
      setLoading(false);
    }
    loadData();
  }, []);

  useEffect(() => {
    if (!meuId || !isLoggedIn) return;

    checkMessages(meuId);
    const interval = setInterval(() => checkMessages(meuId), Config.POLLING_NOTIFICATION_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [meuId, isLoggedIn]);

  const pickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permissão Necessária', 'Precisamos de acesso às fotos para atualizar seu avatar.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const uri = result.assets[0].uri;
      setUserPhoto(uri);
      await saveUserProfile(undefined, uri);
      if (Platform.OS !== 'web') {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
      }
    }
  };

  const handleSaveProfile = async () => {
    if (!userName.trim()) {
      Alert.alert('Nome Obrigatório', 'Como podemos te chamar no TrokaUp? 😊');
      return;
    }
    if (!cityInput.trim()) {
      Alert.alert('Localização', 'Informe sua cidade para encontrar pessoas próximas para troca.');
      return;
    }

    await saveCity(cityInput.trim());
    await saveUserProfile(userName.trim(), userPhoto);
    setIsLoggedIn(true);

    if (Platform.OS !== 'web') {
      try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
    }

    Alert.alert('Perfil Salvo! ✨', 'Suas preferências foram atualizadas com sucesso.');
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Excluir Minha Conta e Dados',
      'Tem certeza de que deseja excluir permanentemente sua conta, seus anúncios e mensagens do TrokaUp? Esta ação não pode ser desfeita.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Excluir Permanentemente',
          style: 'destructive',
          onPress: async () => {
            try {
              if (meuId) {
                await deleteAccount(meuId).catch(() => {});
              }
              await clearAllData();
              setCityInput('');
              setUserName('');
              setUserPhoto(null);
              setIsLoggedIn(false);
              setHasUnread(false);
              const newUid = await getOrCreateUserId();
              setMeuId(newUid);
              Alert.alert('Conta Excluída', 'Sua conta e todos os dados vinculados foram removidos.');
            } catch (e) {
              Alert.alert('Erro', 'Falha ao processar exclusão de dados.');
            }
          },
        },
      ]
    );
  };

  const suggestions = cityInput.length
    ? CITIES.filter((c) => c.toLowerCase().includes(cityInput.toLowerCase()))
    : [];

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header */}
        <View style={styles.header}>
          <BrandLogo size={36} fontSize={22} />

          {isLoggedIn && (
            <TouchableOpacity
              style={styles.settingsBtn}
              onPress={() => {
                Alert.alert(
                  'Configurações da Conta',
                  'Escolha uma opção:',
                  [
                    { text: 'Termos de Uso', onPress: () => setShowTermsModal(true) },
                    { text: 'Política de Privacidade', onPress: () => setShowPrivacyModal(true) },
                    {
                      text: 'Desconectar',
                      style: 'destructive',
                      onPress: async () => {
                        await saveCity('');
                        await saveUserProfile('', null);
                        setCityInput('');
                        setUserName('');
                        setUserPhoto(null);
                        setIsLoggedIn(false);
                      },
                    },
                    { text: 'Fechar', style: 'cancel' },
                  ]
                );
              }}
            >
              <Ionicons name="ellipsis-horizontal-circle-outline" size={26} color={Colors.light.secondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Card do Perfil */}
        <View style={styles.profileCard}>
          <TouchableOpacity onPress={pickImage} style={styles.avatarWrapper} activeOpacity={0.8}>
            <View style={styles.avatarCircle}>
              {userPhoto ? (
                <Image source={{ uri: userPhoto }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={54} color={Colors.light.muted} />
                </View>
              )}
            </View>
            <View style={styles.cameraIconBox}>
              <Ionicons name="camera" size={14} color="#FFFFFF" />
            </View>
          </TouchableOpacity>

          <Text style={styles.profileName}>
            {isLoggedIn ? userName : 'Bem-vindo ao TrokaUp!'}
          </Text>
          <Text style={styles.profileSubtitle}>
            {isLoggedIn
              ? 'Conectando você a pessoas interessadas em escambo moderno.'
              : 'Complete seu cadastro rápido para começar a negociar.'}
          </Text>
        </View>

        {/* Formulário */}
        <View style={styles.formSection}>
          <Text style={styles.fieldLabel}>Seu Nome ou Apelido</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="person-outline" size={18} color={Colors.light.muted} style={styles.inputIcon} />
            <TextInput
              value={userName}
              onChangeText={setUserName}
              placeholder="Ex: João da Silva"
              placeholderTextColor={Colors.light.muted}
              style={styles.textInput}
            />
          </View>

          <Text style={styles.fieldLabel}>Sua Cidade (para trocas próximas)</Text>
          <View style={styles.inputContainer}>
            <Ionicons name="location-outline" size={18} color={Colors.light.muted} style={styles.inputIcon} />
            <TextInput
              value={cityInput}
              onChangeText={(txt) => {
                setCityInput(txt);
                setShowSuggestions(true);
              }}
              placeholder="Ex: Curitiba - PR"
              placeholderTextColor={Colors.light.muted}
              style={styles.textInput}
            />
          </View>

          {showSuggestions && suggestions.length > 0 && (
            <View style={styles.suggestionsDropdown}>
              {suggestions.map((s) => (
                <TouchableOpacity
                  key={s}
                  onPress={() => {
                    setCityInput(s);
                    setShowSuggestions(false);
                    if (Platform.OS !== 'web') {
                      try { Haptics.selectionAsync(); } catch (e) {}
                    }
                  }}
                  style={styles.suggestionItem}
                >
                  <Ionicons name="pin-outline" size={14} color={Colors.light.primary} />
                  <Text style={styles.suggestionText}>{s}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}

          <TouchableOpacity
            onPress={handleSaveProfile}
            style={styles.saveBtnWrapper}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.saveGradient}
            >
              <Text style={styles.saveBtnText}>
                {isLoggedIn ? 'SALVAR ALTERAÇÕES' : 'COMEÇAR AGORA'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Notificação de Mensagens Não Lidas */}
        {isLoggedIn && hasUnread && (
          <TouchableOpacity
            onPress={() => router.push('/(tabs)/explore')}
            style={styles.unreadBanner}
            activeOpacity={0.8}
          >
            <View style={styles.unreadBannerIcon}>
              <Ionicons name="chatbubbles" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.unreadBannerText}>Você possui novas mensagens no chat!</Text>
            <Ionicons name="chevron-forward" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        )}

        {/* Seção de Segurança e Privacidade (Google Play Store Compliance) */}
        <View style={styles.complianceCard}>
          <Text style={styles.complianceCardHeading}>Segurança & Privacidade</Text>

          <TouchableOpacity
            style={styles.complianceRow}
            onPress={() => setShowTermsModal(true)}
          >
            <View style={styles.complianceRowLeft}>
              <Ionicons name="document-text-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.complianceRowText}>Termos de Uso</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.light.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.complianceRow}
            onPress={() => setShowPrivacyModal(true)}
          >
            <View style={styles.complianceRowLeft}>
              <Ionicons name="shield-outline" size={20} color={Colors.light.primary} />
              <Text style={styles.complianceRowText}>Política de Privacidade</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.light.muted} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.complianceRow, { borderBottomWidth: 0 }]}
            onPress={handleDeleteAccount}
          >
            <View style={styles.complianceRowLeft}>
              <Ionicons name="trash-outline" size={20} color={Colors.light.error} />
              <Text style={[styles.complianceRowText, { color: Colors.light.error }]}>
                Excluir Minha Conta e Dados
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.light.error} />
          </TouchableOpacity>
        </View>

        {/* Versão do App */}
        <Text style={styles.versionFooter}>
          {Config.APP_NAME} v{Config.APP_VERSION} • Construído para a Google Play Store
        </Text>
      </ScrollView>

      {/* Modal Termos de Uso */}
      <Modal visible={showTermsModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.infoModalBox}>
            <Text style={styles.infoModalTitle}>Termos de Uso do TrokaUp</Text>
            <ScrollView style={styles.infoModalScroll}>
              <Text style={styles.infoModalText}>
                1. O TrokaUp é uma plataforma colaborativa que visa facilitar trocas voluntárias de produtos entre pessoas de uma mesma região geográfica.{'\n\n'}
                2. Não é permitida a publicação de itens ilegais, substâncias controladas, armas, produtos falsificados ou conteúdo impróprio.{'\n\n'}
                3. A negociação e a troca física dos itens são de inteira responsabilidade dos usuários envolvidos.{'\n\n'}
                4. O TrokaUp oferece ferramentas de moderação e avaliação mútua para manter um ambiente seguro e de respeito mútuo.
              </Text>
            </ScrollView>
            <TouchableOpacity style={styles.infoModalCloseBtn} onPress={() => setShowTermsModal(false)}>
              <Text style={styles.infoModalCloseText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal Política de Privacidade */}
      <Modal visible={showPrivacyModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.infoModalBox}>
            <Text style={styles.infoModalTitle}>Política de Privacidade</Text>
            <ScrollView style={styles.infoModalScroll}>
              <Text style={styles.infoModalText}>
                1. O TrokaUp respeita sua privacidade e protege seus dados em conformidade rigorosa com a LGPD e as Políticas do Google Play.{'\n\n'}
                2. Coleta de dados: Nome/apelido voluntário, localização (cidade) para filtros regionais, fotos de produtos cadastrados para troca e mensagens do chat interno.{'\n\n'}
                3. Não vendemos e não compartilhamos seus dados pessoais com parceiros de marketing ou terceiros.{'\n\n'}
                4. Câmera e Galeria de Fotos são solicitadas exclusivamente para inclusão de fotos em anúncios e avatar.{'\n\n'}
                5. Exclusão: Você pode excluir sua conta e todos os dados associados a qualquer momento no botão "Excluir Minha Conta e Dados" nesta mesma tela.
              </Text>
            </ScrollView>
            <View style={{ gap: 8 }}>
              <TouchableOpacity
                style={[styles.infoModalCloseBtn, { backgroundColor: '#EEF2FF', borderWidth: 1, borderColor: Colors.light.primary }]}
                onPress={() => {
                  setShowPrivacyModal(false);
                  router.push('/privacy');
                }}
              >
                <Text style={[styles.infoModalCloseText, { color: Colors.light.primary }]}>Ver Política Completa</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.infoModalCloseBtn} onPress={() => setShowPrivacyModal(false)}>
                <Text style={styles.infoModalCloseText}>Fechar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 40,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.soft,
  },
  logoText: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.light.secondary,
    letterSpacing: -0.5,
  },
  settingsBtn: {
    padding: 4,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  avatarCircle: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: Colors.light.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: Colors.light.primary,
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarPlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraIconBox: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: Colors.light.primary,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Shadow.soft,
  },
  profileName: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.light.secondary,
    textAlign: 'center',
  },
  profileSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    lineHeight: 18,
    maxWidth: 280,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.secondary,
    marginBottom: 6,
    marginTop: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceSubtle,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.sm,
  },
  inputIcon: {
    marginRight: 8,
  },
  textInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
  },
  suggestionsDropdown: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginTop: -Spacing.xs,
    marginBottom: Spacing.md,
    ...Shadow.medium,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surfaceSubtle,
  },
  suggestionText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
  },
  saveBtnWrapper: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    marginTop: Spacing.xs,
    ...Shadow.medium,
  },
  saveGradient: {
    paddingVertical: 15,
    alignItems: 'center',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  unreadBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.secondary,
    padding: 12,
    borderRadius: Radius.lg,
    marginBottom: Spacing.md,
    gap: 10,
    ...Shadow.medium,
  },
  unreadBannerIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  unreadBannerText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  complianceCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.md,
    ...Shadow.card,
  },
  complianceCardHeading: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.secondary,
    marginBottom: Spacing.sm,
  },
  complianceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  complianceRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  complianceRowText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  versionFooter: {
    textAlign: 'center',
    color: Colors.light.muted,
    fontSize: 12,
    marginTop: Spacing.sm,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  infoModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 360,
    maxHeight: '80%',
    ...Shadow.glow,
  },
  infoModalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.light.secondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  infoModalScroll: {
    marginBottom: Spacing.md,
  },
  infoModalText: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    lineHeight: 20,
  },
  infoModalCloseBtn: {
    backgroundColor: Colors.light.primary,
    paddingVertical: 12,
    borderRadius: Radius.md,
    alignItems: 'center',
  },
  infoModalCloseText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
