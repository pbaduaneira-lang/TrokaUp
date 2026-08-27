import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Image,
  RefreshControl,
  StatusBar,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { getConversations } from '../../services/api';
import { getOrCreateUserId, getUserProfile } from '../../services/user';
import { Colors, Spacing, Radius, Shadow } from '../../constants/theme';

interface ConversaItem {
  usuario_id: string | number;
  usuario_nome?: string;
  produto_id?: number | string | null;
  produto_titulo?: string;
  produto_imagem?: string;
  ultima_mensagem?: string;
  lida?: boolean;
  ultimo_remetente?: string;
  criado_em?: string | null;
}

export default function ExploreScreen() {
  const router = useRouter();
  const [meuId, setMeuId] = useState<string | null>(null);
  const [userName, setUserName] = useState<string>('');
  const [conversas, setConversas] = useState<ConversaItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [totalUnread, setTotalUnread] = useState(0);

  const loadData = useCallback(async (isSilent = false) => {
    const uid = await getOrCreateUserId();
    const profile = await getUserProfile();

    setMeuId(uid);
    if (profile && profile.nome) {
      setUserName(profile.nome);
    }

    if (!uid) {
      setLoading(false);
      return;
    }

    try {
      if (!isSilent && conversas.length === 0) setLoading(true);
      const data = await getConversations(uid);

      const sorted = ((data || []) as ConversaItem[]).sort(
        (a: ConversaItem, b: ConversaItem) =>
          new Date(b.criado_em || 0).getTime() - new Date(a.criado_em || 0).getTime()
      );
      setConversas(sorted);

      const unreadCount = sorted.filter((c: ConversaItem) => !c.lida && c.ultimo_remetente !== uid).length;
      setTotalUnread(unreadCount);
    } catch (error) {
      console.error('[TrokaUp] Erro ao carregar conversas:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [conversas.length]);

  useFocusEffect(
    useCallback(() => {
      loadData(true);
      const interval = setInterval(() => loadData(true), 6000);
      return () => clearInterval(interval);
    }, [loadData])
  );

  const onRefresh = () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
    }
    loadData(true);
  };

  const renderItem = ({ item }: { item: ConversaItem }) => {
    const enviadaPorMim = item.ultimo_remetente === meuId;
    const mostrarBadge = !item.lida && !enviadaPorMim;
    const productId = item.produto_id ? String(item.produto_id) : '0';

    return (
      <TouchableOpacity
        style={[styles.card, mostrarBadge && styles.cardUnread]}
        activeOpacity={0.7}
        onPress={() => {
          if (Platform.OS !== 'web') {
            try { Haptics.selectionAsync(); } catch (e) {}
          }
          router.push({
            pathname: '/chat',
            params: {
              usuario_id: String(item.usuario_id),
              titulo: item.produto_titulo || 'Negociação',
              product_id: productId,
              product_image: item.produto_imagem || '',
            },
          });
        }}
      >
        <View style={styles.cardContent}>
          {item.produto_imagem ? (
            <Image source={{ uri: item.produto_imagem }} style={styles.productThumb} resizeMode="cover" />
          ) : (
            <View style={[styles.productThumb, styles.placeholderThumb]}>
              <Ionicons name="chatbubbles" size={24} color={Colors.light.primary} />
            </View>
          )}

          <View style={styles.textContainer}>
            <View style={styles.cardHeader}>
              <Text style={styles.productTitle} numberOfLines={1}>
                {item.produto_titulo || 'Negociação de Troca'}
              </Text>
              <Text style={[styles.timeText, mostrarBadge && styles.timeTextUnread]}>
                {item.criado_em
                  ? new Date(item.criado_em).toLocaleDateString([], {
                      day: '2-digit',
                      month: '2-digit',
                    })
                  : ''}
              </Text>
            </View>

            <Text style={styles.partnerText} numberOfLines={1}>
              Negociando com: {item.usuario_nome || `Usuário #${String(item.usuario_id || '').substring(0, 6)}`}
            </Text>

            <View style={styles.msgRow}>
              <Text style={[styles.lastMsg, mostrarBadge && styles.unreadText]} numberOfLines={1}>
                {enviadaPorMim ? 'Você: ' : ''}
                {item.ultima_mensagem || 'Inicie a conversa...'}
              </Text>
              {mostrarBadge && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>1</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Minhas Conversas</Text>
          <Text style={styles.subtitle}>
            {userName ? `Conectado como ${userName}` : 'Suas negociações de troca em andamento'}
          </Text>
        </View>

        {totalUnread > 0 && (
          <View style={styles.unreadHeaderBadge}>
            <Ionicons name="notifications" size={14} color="#FFFFFF" />
            <Text style={styles.unreadHeaderBadgeText}>{totalUnread}</Text>
          </View>
        )}
      </View>

      {loading && !refreshing ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Carregando conversas... 💬</Text>
        </View>
      ) : (
        <FlatList
          data={conversas}
          keyExtractor={(item) => `${item.usuario_id}-${item.produto_id}`}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.light.primary}
              colors={[Colors.light.primary]}
            />
          }
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconBox}>
                <Ionicons name="chatbubbles-outline" size={48} color={Colors.light.primary} />
              </View>
              <Text style={styles.emptyTitle}>Nenhuma conversa iniciada</Text>
              <Text style={styles.emptyText}>
                Interaja nos anúncios do Feed para propor trocas e negociar com outros usuários!
              </Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => router.push('/(tabs)/feed')}
              >
                <Text style={styles.emptyBtnText}>Explorar Anúncios</Text>
              </TouchableOpacity>
            </View>
          }
          contentContainerStyle={styles.listContent}
        />
      )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    color: Colors.light.secondary,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 13,
    color: Colors.light.textSecondary,
    marginTop: 2,
    fontWeight: '500',
  },
  unreadHeaderBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Radius.full,
    ...Shadow.soft,
  },
  unreadHeaderBadgeText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 40,
    maxWidth: 760,
    width: '100%',
    alignSelf: 'center',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: Spacing.sm,
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    marginBottom: Spacing.sm,
    padding: 14,
    borderRadius: Radius.lg,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadow.soft,
  },
  cardUnread: {
    backgroundColor: Colors.light.primarySoft,
    borderColor: Colors.light.primaryLight,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  productThumb: {
    width: 54,
    height: 54,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  placeholderThumb: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.primarySoft,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  productTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.secondary,
    flex: 1,
    marginRight: 8,
  },
  timeText: {
    fontSize: 11,
    color: Colors.light.muted,
    fontWeight: '600',
  },
  timeTextUnread: {
    color: Colors.light.primary,
    fontWeight: '800',
  },
  partnerText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
    fontWeight: '500',
  },
  msgRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMsg: {
    fontSize: 13,
    color: Colors.light.muted,
    flex: 1,
    marginRight: 8,
  },
  unreadText: {
    color: Colors.light.secondary,
    fontWeight: '700',
  },
  badge: {
    backgroundColor: Colors.light.primary,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
  },
  empty: {
    padding: Spacing.xl,
    alignItems: 'center',
    marginTop: 60,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.secondary,
  },
  emptyText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  emptyBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.full,
    ...Shadow.medium,
  },
  emptyBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
