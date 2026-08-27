import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  StatusBar,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getMessages, sendMessage, deleteProduct, submitRating, reportProduct } from '../services/api';
import { getOrCreateUserId, blockUser } from '../services/user';
import { Colors, Spacing, Radius, Shadow } from '../constants/theme';
import { Config } from '../constants/config';

const REPORT_REASONS = [
  'Conteúdo impróprio ou ofensivo',
  'Tentativa de golpe ou fraude',
  'Anúncio falso ou duplicado',
  'Comportamento abusivo no chat',
  'Outro motivo',
];

export default function ChatScreen() {
  const router = useRouter();
  const { usuario_id, titulo, product_id, product_image } = useLocalSearchParams();

  const [meuId, setMeuId] = useState(null);
  const [mensagens, setMensagens] = useState([]);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  // Modais de Ações
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

  // Estados de Avaliação
  const [estrelasSelected, setEstrelasSelected] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [enviandoRating, setEnviandoRating] = useState(false);

  // Estados de Denúncia
  const [selectedReason, setSelectedReason] = useState(REPORT_REASONS[0]);
  const [reportDetails, setReportDetails] = useState('');
  const [enviandoReport, setEnviandoReport] = useState(false);

  const flatListRef = useRef(null);
  const pId = !product_id || product_id === 'null' || product_id === '0' ? 0 : parseInt(product_id, 10);

  const carregarMensagens = useCallback(async () => {
    if (!meuId || !usuario_id) return;
    try {
      const data = await getMessages(meuId, usuario_id, pId);
      setMensagens(data || []);
    } catch (error) {
      console.error('[TrokaUp] Erro ao carregar mensagens:', error);
    } finally {
      setLoading(false);
    }
  }, [meuId, usuario_id, pId]);

  useEffect(() => {
    async function init() {
      const uid = await getOrCreateUserId();
      setMeuId(uid);
    }
    init();
  }, []);

  useEffect(() => {
    if (!meuId || !usuario_id) return;

    carregarMensagens();

    let socket = null;
    let reconnectTimer = null;

    function conectarWS() {
      const wsUri = `${Config.WS_BASE_URL}/${meuId}`;
      try {
        socket = new WebSocket(wsUri);

        socket.onopen = () => {
          console.log('[TrokaUp] WS conectado!');
          if (reconnectTimer) {
            clearInterval(reconnectTimer);
            reconnectTimer = null;
          }
        };

        socket.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'new_message') {
              const newMsg = payload.data;
              const pertenceAoChat =
                ((newMsg.remetente_id === meuId && newMsg.destinatario_id === usuario_id) ||
                  (newMsg.remetente_id === usuario_id && newMsg.destinatario_id === meuId)) &&
                (newMsg.produto_id || 0) === pId;

              if (pertenceAoChat) {
                setMensagens((prev) => {
                  if (prev.some((m) => m.id === newMsg.id)) return prev;
                  return [...prev, newMsg];
                });
                setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
              }
            }
          } catch (e) {
            console.error('[TrokaUp] Erro parse WS:', e);
          }
        };

        socket.onclose = () => {
          if (!reconnectTimer) {
            reconnectTimer = setInterval(() => {
              conectarWS();
            }, Config.WS_RECONNECT_INTERVAL_MS);
          }
        };
      } catch (err) {
        console.error('[TrokaUp] Falha ao criar conexão WS:', err);
      }
    }

    conectarWS();

    return () => {
      if (socket) socket.close();
      if (reconnectTimer) clearInterval(reconnectTimer);
    };
  }, [meuId, usuario_id, pId, carregarMensagens]);

  const handleEnviar = async () => {
    if (!texto.trim() || enviando) return;

    const mensagemTexto = texto.trim();
    setTexto('');
    setEnviando(true);

    if (Platform.OS !== 'web') {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
    }

    try {
      await sendMessage(meuId, usuario_id, mensagemTexto, pId);
      await carregarMensagens();
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error('[TrokaUp] Erro ao enviar:', error);
      Alert.alert('Erro', 'Não foi possível enviar a mensagem.');
      setTexto(mensagemTexto);
    } finally {
      setEnviando(false);
    }
  };

  const handleFinalizarTroca = async () => {
    setShowOptionsModal(false);
    setShowRatingModal(true);
  };

  const enviarAvaliacao = async () => {
    setEnviandoRating(true);
    try {
      await submitRating({
        avaliador_id: meuId,
        avaliado_id: usuario_id,
        estrelas: estrelasSelected,
        comentario: ratingComment.trim(),
      });

      if (pId > 0) {
        await deleteProduct(pId).catch(() => {});
      }

      setShowRatingModal(false);
      Alert.alert('Troca Concluída! 🤝', 'Obrigado por avaliar seu parceiro de troca no TrokaUp.');
      router.back();
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar avaliação.');
    } finally {
      setEnviandoRating(false);
    }
  };

  const handleDenunciar = async () => {
    setEnviandoReport(true);
    try {
      await reportProduct({
        produtoId: pId,
        denuncianteId: meuId,
        denunciadoId: usuario_id,
        motivo: selectedReason,
        detalhes: reportDetails.trim(),
      });

      setShowReportModal(false);
      Alert.alert(
        'Denúncia Enviada',
        'Recebemos sua denúncia. Nossa equipe de moderação analisará o caso em até 24 horas.'
      );
    } catch (error) {
      Alert.alert('Erro', 'Falha ao enviar a denúncia.');
    } finally {
      setEnviandoReport(false);
    }
  };

  const handleBloquear = async () => {
    setShowOptionsModal(false);
    Alert.alert(
      'Bloquear Usuário',
      'Você não receberá mais mensagens nem verá anúncios deste usuário.',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Bloquear',
          style: 'destructive',
          onPress: async () => {
            await blockUser(usuario_id);
            Alert.alert('Usuário Bloqueado', 'O usuário foi bloqueado com sucesso.');
            router.back();
          },
        },
      ]
    );
  };

  const renderMensagem = ({ item }) => {
    const souEu = item.remetente_id === meuId;
    const hora = item.criado_em
      ? new Date(item.criado_em).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      : '';

    return (
      <View style={[styles.bubbleContainer, souEu ? styles.bubbleRight : styles.bubbleLeft]}>
        <View style={[styles.bubble, souEu ? styles.bubbleMe : styles.bubbleOther]}>
          <Text style={[styles.msgText, souEu ? styles.msgTextMe : styles.msgTextOther]}>
            {item.texto}
          </Text>
          <Text style={[styles.msgTime, souEu ? styles.msgTimeMe : styles.msgTimeOther]}>
            {hora}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header do Chat */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="chevron-back" size={24} color={Colors.light.secondary} />
        </TouchableOpacity>

        <View style={styles.headerInfo}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {titulo || 'Chat de Troca'}
          </Text>
          <Text style={styles.headerStatus}>Negociação direta</Text>
        </View>

        <TouchableOpacity
          style={styles.moreBtn}
          onPress={() => setShowOptionsModal(true)}
        >
          <Ionicons name="ellipsis-vertical" size={20} color={Colors.light.secondary} />
        </TouchableOpacity>
      </View>

      {/* Mini Card do Item */}
      {pId > 0 && (
        <View style={styles.productBanner}>
          {product_image ? (
            <Image source={{ uri: product_image }} style={styles.productThumb} resizeMode="cover" />
          ) : (
            <View style={[styles.productThumb, styles.productThumbPlaceholder]}>
              <Ionicons name="swap-horizontal" size={18} color={Colors.light.primary} />
            </View>
          )}
          <View style={styles.productBannerInfo}>
            <Text style={styles.productBannerTitle} numberOfLines={1}>
              {titulo}
            </Text>
            <Text style={styles.productBannerSub}>Item em negociação</Text>
          </View>
          <TouchableOpacity
            style={styles.productBannerAction}
            onPress={() => router.push(`/product/${pId}`)}
          >
            <Text style={styles.productBannerActionText}>Ver Anúncio</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Lista de Mensagens */}
      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={mensagens}
          keyExtractor={(item, index) => String(item.id || index)}
          renderItem={renderMensagem}
          contentContainerStyle={styles.messagesList}
          showsVerticalScrollIndicator={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListEmptyComponent={
            <View style={styles.emptyMessages}>
              <Ionicons name="chatbubbles-outline" size={40} color={Colors.light.primaryLight} />
              <Text style={styles.emptyMessagesText}>
                Inicie a conversa! Proponha o que você gostaria de trocar por este item.
              </Text>
            </View>
          }
        />
      )}

      {/* Barra de Input */}
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={styles.inputContainer}>
          <TextInput
            value={texto}
            onChangeText={setTexto}
            placeholder="Digite uma mensagem..."
            placeholderTextColor={Colors.light.muted}
            style={styles.chatInput}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            onPress={handleEnviar}
            disabled={!texto.trim() || enviando}
            style={[
              styles.sendBtn,
              (!texto.trim() || enviando) && styles.sendBtnDisabled,
            ]}
          >
            {enviando ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Ionicons name="send" size={18} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Modal de Opções */}
      <Modal visible={showOptionsModal} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Opções da Negociação</Text>

            <TouchableOpacity style={styles.modalOption} onPress={handleFinalizarTroca}>
              <Ionicons name="checkmark-done-circle-outline" size={22} color={Colors.light.success} />
              <Text style={styles.modalOptionText}>Finalizar Troca e Avaliar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalOption}
              onPress={() => {
                setShowOptionsModal(false);
                setShowReportModal(true);
              }}
            >
              <Ionicons name="flag-outline" size={22} color={Colors.light.warning} />
              <Text style={styles.modalOptionText}>Denunciar Usuário / Conteúdo</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={handleBloquear}>
              <Ionicons name="ban-outline" size={22} color={Colors.light.error} />
              <Text style={[styles.modalOptionText, { color: Colors.light.error }]}>Bloquear Usuário</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancelBtn}
              onPress={() => setShowOptionsModal(false)}
            >
              <Text style={styles.modalCancelText}>Fechar</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Modal de Avaliação */}
      <Modal visible={showRatingModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.ratingModalBox}>
            <Text style={styles.ratingTitle}>Como foi a sua troca? 🤝</Text>
            <Text style={styles.ratingSubtitle}>Avalie seu parceiro de negociação no TrokaUp.</Text>

            <View style={styles.starsRow}>
              {[1, 2, 3, 4, 5].map((star) => (
                <TouchableOpacity
                  key={star}
                  onPress={() => {
                    setEstrelasSelected(star);
                    if (Platform.OS !== 'web') {
                      try { Haptics.selectionAsync(); } catch (e) {}
                    }
                  }}
                  style={styles.starBtn}
                >
                  <Ionicons
                    name={star <= estrelasSelected ? 'star' : 'star-outline'}
                    size={36}
                    color="#F59E0B"
                  />
                </TouchableOpacity>
              ))}
            </View>

            <TextInput
              value={ratingComment}
              onChangeText={setRatingComment}
              placeholder="Escreva um comentário sobre a pontualidade e o estado do item..."
              placeholderTextColor={Colors.light.muted}
              multiline
              numberOfLines={3}
              style={styles.ratingInput}
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowRatingModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.confirmBtn}
                onPress={enviarAvaliacao}
                disabled={enviandoRating}
              >
                {enviandoRating ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>Confirmar</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal de Denúncia (Google Play UGC Requirement) */}
      <Modal visible={showReportModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.reportModalBox}>
            <Text style={styles.ratingTitle}>Denunciar Conteúdo ou Usuário</Text>
            <Text style={styles.ratingSubtitle}>
              Selecione o motivo da denúncia para análise da moderação.
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
              placeholder="Descreva detalhes adicionais da ocorrência..."
              placeholderTextColor={Colors.light.muted}
              style={styles.reportInput}
              multiline
            />

            <View style={styles.modalActionsRow}>
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={() => setShowReportModal(false)}
              >
                <Text style={styles.cancelBtnText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.confirmBtn, { backgroundColor: Colors.light.error }]}
                onPress={handleDenunciar}
                disabled={enviandoReport}
              >
                {enviandoReport ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.confirmBtnText}>Enviar Denúncia</Text>
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
    backgroundColor: Colors.light.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  backBtn: {
    padding: 6,
    marginRight: 6,
  },
  headerInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.light.secondary,
  },
  headerStatus: {
    fontSize: 12,
    color: Colors.light.success,
    fontWeight: '600',
  },
  moreBtn: {
    padding: 6,
  },
  productBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  productThumb: {
    width: 42,
    height: 42,
    borderRadius: Radius.xs,
  },
  productThumbPlaceholder: {
    backgroundColor: Colors.light.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  productBannerInfo: {
    flex: 1,
    marginLeft: 10,
  },
  productBannerTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.secondary,
  },
  productBannerSub: {
    fontSize: 11,
    color: Colors.light.muted,
  },
  productBannerAction: {
    backgroundColor: Colors.light.primarySoft,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Radius.full,
  },
  productBannerActionText: {
    fontSize: 11,
    fontWeight: '800',
    color: Colors.light.primary,
  },
  messagesList: {
    padding: Spacing.md,
    paddingBottom: 20,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bubbleContainer: {
    marginVertical: 4,
    width: '100%',
    flexDirection: 'row',
  },
  bubbleLeft: {
    justifyContent: 'flex-start',
  },
  bubbleRight: {
    justifyContent: 'flex-end',
  },
  bubble: {
    maxWidth: '80%',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: Radius.lg,
  },
  bubbleMe: {
    backgroundColor: Colors.light.primary,
    borderBottomRightRadius: Radius.xs,
    ...Shadow.soft,
  },
  bubbleOther: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: Radius.xs,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadow.soft,
  },
  msgText: {
    fontSize: 14,
    lineHeight: 20,
  },
  msgTextMe: {
    color: '#FFFFFF',
    fontWeight: '500',
  },
  msgTextOther: {
    color: Colors.light.text,
    fontWeight: '500',
  },
  msgTime: {
    fontSize: 10,
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  msgTimeMe: {
    color: 'rgba(255, 255, 255, 0.75)',
  },
  msgTimeOther: {
    color: Colors.light.muted,
  },
  emptyMessages: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 100,
    paddingHorizontal: 40,
  },
  emptyMessagesText: {
    textAlign: 'center',
    color: Colors.light.textSecondary,
    fontSize: 13,
    marginTop: 12,
    lineHeight: 18,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: Colors.light.border,
    gap: 8,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  chatInput: {
    flex: 1,
    backgroundColor: Colors.light.surfaceSubtle,
    borderRadius: Radius.full,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.light.text,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  sendBtn: {
    backgroundColor: Colors.light.primary,
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.soft,
  },
  sendBtnDisabled: {
    backgroundColor: Colors.light.muted,
    opacity: 0.6,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: Colors.light.overlay,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.md,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 340,
    ...Shadow.medium,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.light.secondary,
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  modalOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.light.text,
  },
  modalCancelBtn: {
    marginTop: Spacing.md,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalCancelText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.muted,
  },
  ratingModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    ...Shadow.glow,
  },
  ratingTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: Colors.light.secondary,
    textAlign: 'center',
  },
  ratingSubtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.md,
  },
  starsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.md,
  },
  starBtn: {
    padding: 4,
  },
  ratingInput: {
    width: '100%',
    height: 80,
    backgroundColor: Colors.light.surfaceSubtle,
    borderRadius: Radius.md,
    padding: 12,
    fontSize: 13,
    color: Colors.light.text,
    textAlignVertical: 'top',
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.md,
  },
  reportModalBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.xl,
    padding: Spacing.lg,
    width: '100%',
    maxWidth: 360,
    ...Shadow.glow,
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
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceSubtle,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  confirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.primary,
    alignItems: 'center',
    ...Shadow.soft,
  },
  confirmBtnText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
