import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Image,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
  Share,
  Alert,
  Modal,
  TextInput,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { getProducts, getUserRatings, reportProduct } from '../../services/api';
import { getOrCreateUserId } from '../../services/user';
import { Colors, Spacing, Radius, Shadow, Gradients } from '../../constants/theme';

const REPORT_REASONS = [
  'Item proibido ou ilegal',
  'Foto inadequada ou ofensiva',
  'Anúncio enganoso / Fraude',
  'Item não disponível ou já trocado',
  'Outro problema',
];

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isDesktop = width > 768;

  const [product, setProduct] = useState(null);
  const [ratingStats, setRatingStats] = useState({ media: 0.0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [myUserId, setMyUserId] = useState(null);

  // Modal de denúncia
  const [showReportModal, setShowReportModal] = useState(false);
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState('');
  const [sendingReport, setSendingReport] = useState(false);

  useEffect(() => {
    async function loadData() {
      const uid = await getOrCreateUserId();
      setMyUserId(uid);

      try {
        const data = await getProducts();
        const found = data.find((p) => String(p.id) === String(id));
        setProduct(found);

        if (found && found.usuario_id) {
          try {
            const ratings = await getUserRatings(found.usuario_id);
            setRatingStats({ media: ratings.media, total: ratings.total });
          } catch (rErr) {
            console.log('[TrokaUp] Aviso reputação:', rErr);
          }
        }
      } catch (error) {
        console.error('[TrokaUp] Erro ao carregar anúncio:', error);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [id]);

  const handleShare = async () => {
    if (!product) return;
    try {
      await Share.share({
        message: `Confira este item para troca no TrokaUp: "${product.titulo || product.name}"! O que o anunciante quer em troca: "${product.quer_em_troca || product.price}". Baixe o TrokaUp para negociar!`,
      });
    } catch (e) {
      console.log('Erro ao compartilhar:', e);
    }
  };

  const handleSendReport = async () => {
    setSendingReport(true);
    try {
      await reportProduct({
        produtoId: product.id,
        denuncianteId: myUserId,
        denunciadoId: product.usuario_id || 'vendedor',
        motivo: selectedReason,
        detalhes: reportDetails.trim(),
      });

      setShowReportModal(false);
      Alert.alert(
        'Denúncia Recebida',
        'Agradecemos por nos ajudar a manter a comunidade do TrokaUp segura. Avaliaremos este anúncio com prioridade.'
      );
    } catch (e) {
      Alert.alert('Erro', 'Falha ao registrar a denúncia.');
    } finally {
      setSendingReport(false);
    }
  };

  const navigateToChat = async () => {
    const { getUserProfile } = require('../../services/user');
    const profile = await getUserProfile();
    const { getCity } = require('../../services/storage');
    const citySaved = await getCity();

    if (!profile.nome || !citySaved) {
      Alert.alert(
        'Bem-vindo ao TrokaUp! 👋',
        'Para propor uma troca ou enviar mensagens para este anunciante, complete seu perfil com seu nome e cidade. Leva menos de 30 segundos!',
        [
          { text: 'Depois', style: 'cancel' },
          { text: 'Preencher Perfil', onPress: () => router.push('/(tabs)/profile') }
        ]
      );
      return;
    }

    if (Platform.OS !== 'web') {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); } catch (e) {}
    }
    router.push({
      pathname: '/chat',
      params: {
        usuario_id: product.usuario_id || 'vendedor',
        titulo: product.titulo || product.name,
        product_id: product.id,
        product_image: product.imagem_url || '',
      },
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.centerContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={Colors.light.muted} />
        <Text style={styles.errorTitle}>Anúncio não encontrado</Text>
        <Text style={styles.errorSubtitle}>Este item pode ter sido trocado ou removido pelo anunciante.</Text>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>Voltar ao Feed</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const itemTitle = product.titulo || product.name || 'Item para Troca';
  const wantText = product.quer_em_troca || product.price || 'A combinar';
  const category = product.categoria || 'Geral';
  const city = product.cidade || 'Brasil';

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" />

      {/* Header Superior */}
      <View style={[styles.floatingHeader, isDesktop && styles.floatingHeaderDesktop]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.floatingIconBtn}>
          <Ionicons name="chevron-back" size={24} color={Colors.light.secondary} />
        </TouchableOpacity>

        <View style={styles.floatingRightBtns}>
          <TouchableOpacity onPress={handleShare} style={styles.floatingIconBtn}>
            <Ionicons name="share-social-outline" size={22} color={Colors.light.secondary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setShowReportModal(true)}
            style={[styles.floatingIconBtn, { marginLeft: 8 }]}
          >
            <Ionicons name="flag-outline" size={20} color={Colors.light.error} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scrollContent, isDesktop && styles.scrollContentDesktop]}
      >
        <View style={[styles.mainLayout, isDesktop && styles.mainLayoutDesktop]}>
          {/* Coluna da Imagem (Esquerda no Desktop) */}
          <View style={[styles.imageWrapper, isDesktop && styles.imageWrapperDesktop]}>
            {product.imagem_url ? (
              <Image
                source={{ uri: product.imagem_url }}
                style={styles.productImage}
                resizeMode={isDesktop ? 'contain' : 'cover'}
              />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="swap-horizontal" size={72} color={Colors.light.primaryLight} />
                <Text style={styles.imagePlaceholderText}>Foto do item não informada</Text>
              </View>
            )}
          </View>

          {/* Coluna de Informações (Direita no Desktop) */}
          <View style={[styles.contentBody, isDesktop && styles.contentBodyDesktop]}>
            <View style={styles.tagsRow}>
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryBadgeText}>{category}</Text>
              </View>
              <View style={styles.statusBadge}>
                <Ionicons name="checkmark-circle" size={14} color={Colors.light.success} />
                <Text style={styles.statusBadgeText}>Disponível para Troca</Text>
              </View>
            </View>

            <Text style={[styles.productTitle, isDesktop && styles.productTitleDesktop]}>
              {itemTitle}
            </Text>

            {/* Reputação do Anunciante */}
            <View style={styles.reputationCard}>
              <View style={styles.reputationLeft}>
                <Ionicons name="star" size={18} color="#F59E0B" />
                <Text style={styles.reputationScore}>
                  {ratingStats.total > 0 ? ratingStats.media.toFixed(1) : 'Novo'}
                </Text>
                <Text style={styles.reputationTotal}>
                  ({ratingStats.total} {ratingStats.total === 1 ? 'avaliação' : 'avaliações'})
                </Text>
              </View>
              <View style={styles.reputationBadge}>
                <Ionicons name="shield-checkmark-outline" size={14} color={Colors.light.primary} />
                <Text style={styles.reputationBadgeText}>Usuário Verificado</Text>
              </View>
            </View>

            {/* O que o Anunciante Quer em Troca */}
            <View style={styles.tradeOfferCard}>
              <View style={styles.tradeOfferHeader}>
                <Ionicons name="repeat" size={16} color={Colors.light.primary} />
                <Text style={styles.tradeOfferHeaderTitle}>O QUE O ANUNCIANTE QUER EM TROCA</Text>
              </View>
              <Text style={styles.tradeOfferText}>{wantText}</Text>
            </View>

            {/* Descrição do Item */}
            <View style={styles.sectionCard}>
              <Text style={styles.sectionHeading}>Detalhes do Item</Text>
              <Text style={styles.descriptionText}>
                {product.descricao || 'Nenhuma observação adicional foi fornecida para este item.'}
              </Text>
            </View>

            {/* Localização */}
            <View style={styles.locationCard}>
              <Ionicons name="location-sharp" size={20} color={Colors.light.primary} />
              <View style={{ flex: 1 }}>
                <Text style={styles.locationTitle}>Localização da Troca</Text>
                <Text style={styles.locationSubtitle}>{city}</Text>
              </View>
            </View>

            {/* Botões de Ação para Desktop */}
            {isDesktop && (
              <View style={styles.desktopActionRow}>
                <TouchableOpacity style={styles.secondaryActionBtn} onPress={navigateToChat}>
                  <Ionicons name="chatbubbles-outline" size={22} color={Colors.light.primary} />
                  <Text style={styles.secondaryActionText}>Mensagem</Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.primaryActionBtn} onPress={navigateToChat} activeOpacity={0.9}>
                  <LinearGradient
                    colors={Gradients.primary}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.primaryActionGradient}
                  >
                    <Ionicons name="swap-horizontal" size={20} color="#FFFFFF" />
                    <Text style={styles.primaryActionText}>PROPOR TROCA AGORA</Text>
                  </LinearGradient>
                </TouchableOpacity>
              </View>
            )}
          </View>
        </View>
      </ScrollView>

      {/* Footer Fixo de Ação no Mobile */}
      {!isDesktop && (
        <View style={styles.bottomBar}>
          <TouchableOpacity style={styles.secondaryActionBtn} onPress={navigateToChat}>
            <Ionicons name="chatbubbles-outline" size={22} color={Colors.light.primary} />
            <Text style={styles.secondaryActionText}>Mensagem</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.primaryActionBtn} onPress={navigateToChat} activeOpacity={0.9}>
            <LinearGradient
              colors={Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.primaryActionGradient}
            >
              <Ionicons name="swap-horizontal" size={20} color="#FFFFFF" />
              <Text style={styles.primaryActionText}>PROPOR TROCA</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}

      {/* Modal de Denúncia */}
      <Modal visible={showReportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.reportModalBox}>
            <Text style={styles.modalTitle}>Denunciar Anúncio</Text>
            <Text style={styles.modalSubtitle}>
              Ajude a manter o TrokaUp seguro informando o motivo desta denúncia:
            </Text>

            {REPORT_REASONS.map((reason) => (
              <TouchableOpacity
                key={reason}
                style={[
                  styles.reasonItem,
                  selectedReason === reason && styles.reasonItemSelected,
                ]}
                onPress={() => setSelectedReason(reason)}
              >
                <Ionicons
                  name={selectedReason === reason ? 'radio-button-on' : 'radio-button-off'}
                  size={18}
                  color={selectedReason === reason ? Colors.light.primary : Colors.light.muted}
                />
                <Text style={styles.reasonText}>{reason}</Text>
              </TouchableOpacity>
            ))}

            <TextInput
              value={reportDetails}
              onChangeText={setReportDetails}
              placeholder="Descreva detalhes ou observações adicionais..."
              placeholderTextColor={Colors.light.muted}
              style={styles.reportInput}
              multiline
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={styles.modalCancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalSubmitBtn}
                onPress={handleSendReport}
                disabled={sendingReport}
              >
                {sendingReport ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.modalSubmitBtnText}>Enviar Denúncia</Text>
                )}
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
    backgroundColor: '#FFFFFF',
  },
  floatingHeader: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  floatingHeaderDesktop: {
    maxWidth: 1080,
    width: '100%',
    alignSelf: 'center',
    borderBottomWidth: 0,
    paddingTop: Spacing.md,
  },
  floatingIconBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.light.surfaceSubtle,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.soft,
  },
  floatingRightBtns: {
    flexDirection: 'row',
  },
  scrollContent: {
    paddingBottom: 100,
  },
  scrollContentDesktop: {
    alignItems: 'center',
    paddingBottom: 40,
  },
  mainLayout: {
    width: '100%',
  },
  mainLayoutDesktop: {
    maxWidth: 1080,
    flexDirection: 'row',
    gap: 36,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.md,
  },
  imageWrapper: {
    width: '100%',
    height: 360,
    backgroundColor: Colors.light.surfaceSubtle,
  },
  imageWrapperDesktop: {
    flex: 1,
    height: 460,
    borderRadius: Radius.xl,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  imagePlaceholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  imagePlaceholderText: {
    color: Colors.light.muted,
    fontWeight: '600',
    fontSize: 13,
  },
  contentBody: {
    padding: Spacing.lg,
    backgroundColor: '#FFFFFF',
  },
  contentBodyDesktop: {
    flex: 1.2,
    padding: 0,
  },
  tagsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: Spacing.sm,
  },
  categoryBadge: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.successSoft,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Radius.full,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: Colors.light.success,
  },
  productTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.light.secondary,
    lineHeight: 30,
    marginBottom: Spacing.md,
  },
  productTitleDesktop: {
    fontSize: 32,
    lineHeight: 38,
  },
  reputationCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceSubtle,
    padding: 12,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  reputationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  reputationScore: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.secondary,
  },
  reputationTotal: {
    fontSize: 13,
    color: Colors.light.textSecondary,
  },
  reputationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reputationBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  tradeOfferCard: {
    backgroundColor: Colors.light.primarySoft,
    padding: 16,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.borderFocus,
    marginBottom: Spacing.md,
  },
  tradeOfferHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  tradeOfferHeaderTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: Colors.light.primary,
    letterSpacing: 0.5,
  },
  tradeOfferText: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.secondary,
    lineHeight: 24,
  },
  sectionCard: {
    marginBottom: Spacing.md,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.secondary,
    marginBottom: 6,
  },
  descriptionText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 22,
  },
  locationCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceSubtle,
    marginTop: 6,
  },
  locationTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.muted,
  },
  locationSubtitle: {
    fontSize: 14,
    fontWeight: '800',
    color: Colors.light.secondary,
  },
  desktopActionRow: {
    flexDirection: 'row',
    gap: 12,
    marginTop: Spacing.lg,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 10,
    ...Shadow.medium,
  },
  secondaryActionBtn: {
    width: 80,
    height: 52,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  secondaryActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.light.primary,
    marginTop: 2,
  },
  primaryActionBtn: {
    flex: 1,
    height: 52,
    borderRadius: Radius.md,
    overflow: 'hidden',
    ...Shadow.soft,
  },
  primaryActionGradient: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.secondary,
    marginTop: 12,
  },
  errorSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.lg,
  },
  backBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Radius.md,
  },
  backBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  reportModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 360,
    ...Shadow.glow,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.light.secondary,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  reasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: Radius.sm,
  },
  reasonItemSelected: {
    backgroundColor: Colors.light.primarySoft,
  },
  reasonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.light.text,
    flex: 1,
  },
  reportInput: {
    height: 70,
    backgroundColor: Colors.light.surfaceSubtle,
    borderRadius: Radius.md,
    padding: 10,
    fontSize: 13,
    color: Colors.light.text,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  modalActionsRow: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceSubtle,
    alignItems: 'center',
  },
  modalCancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  modalSubmitBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.error,
    alignItems: 'center',
    ...Shadow.soft,
  },
  modalSubmitBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
