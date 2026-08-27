import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  StatusBar,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import TradeCard from '../../components/TradeCard';
import LocationModal from '../../components/LocationModal';
import BrandLogo from '../../components/BrandLogo';
import { getProducts } from '../../services/api';
import { getCity } from '../../services/storage';
import { Colors, Spacing, Radius, Shadow } from '../../constants/theme';

const FEED_CATEGORIES = ['Todos', 'Geral', 'Eletrônicos', 'Roupas', 'Livros', 'Esportes', 'Outros'];

export default function FeedScreen() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [city, setCity] = useState('');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [showLocationModal, setShowLocationModal] = useState(false);

  const loadFeed = async (cat = selectedCategory, search = searchText, isPullRefresh = false) => {
    try {
      if (!isPullRefresh && products.length === 0) setLoading(true);
      setError(false);
      const savedCity = await getCity();
      setCity(savedCity || '');

      const data = await getProducts(savedCity, search, cat);
      setProducts(data || []);
    } catch (e) {
      console.error('[TrokaUp] Erro ao carregar feed:', e);
      setError(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadFeed();
  }, []);

  useFocusEffect(
    useCallback(() => {
      loadFeed(selectedCategory, searchText, true);
    }, [selectedCategory, searchText])
  );

  const onRefresh = () => {
    setRefreshing(true);
    if (Platform.OS !== 'web') {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
    }
    loadFeed(selectedCategory, searchText, true);
  };

  const handleCategorySelect = (cat) => {
    if (Platform.OS !== 'web') {
      try { Haptics.selectionAsync(); } catch (e) {}
    }
    setSelectedCategory(cat);
    loadFeed(cat, searchText);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header Principal */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <BrandLogo size={34} fontSize={20} />

          <TouchableOpacity
            style={styles.citySelector}
            onPress={() => setShowLocationModal(true)}
          >
            <Ionicons name="location-sharp" size={14} color={Colors.light.primary} />
            <Text style={styles.citySelectorText} numberOfLines={1}>
              {city || 'Brasil'}
            </Text>
            <Ionicons name="chevron-down" size={12} color={Colors.light.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* Barra de Pesquisa com Design Moderno */}
        <View style={styles.searchContainer}>
          <Ionicons name="search-outline" size={20} color={Colors.light.muted} style={styles.searchIcon} />
          <TextInput
            placeholder="O que você está procurando para trocar?"
            value={searchText}
            onChangeText={(txt) => {
              setSearchText(txt);
              loadFeed(selectedCategory, txt);
            }}
            placeholderTextColor={Colors.light.muted}
            style={styles.searchInput}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchText('');
                loadFeed(selectedCategory, '');
              }}
              style={styles.clearSearchBtn}
            >
              <Ionicons name="close-circle" size={18} color={Colors.light.muted} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Categorias Horizontais */}
      <View style={styles.categoriesSection}>
        <FlatList
          horizontal
          data={FEED_CATEGORIES}
          keyExtractor={(item) => item}
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
          renderItem={({ item }) => {
            const isSelected = selectedCategory === item;
            return (
              <TouchableOpacity
                onPress={() => handleCategorySelect(item)}
                style={[
                  styles.categoryPill,
                  isSelected && styles.categoryPillActive,
                ]}
              >
                <Text
                  style={[
                    styles.categoryPillText,
                    isSelected && styles.categoryPillTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Listagem de Anúncios */}
      {loading && products.length === 0 ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.light.primary} />
          <Text style={styles.loadingText}>Buscando as melhores trocas para você... ✨</Text>
        </View>
      ) : error ? (
        <View style={styles.centerContainer}>
          <View style={styles.errorIconBox}>
            <Ionicons name="cloud-offline-outline" size={48} color={Colors.light.error} />
          </View>
          <Text style={styles.errorTitle}>Não foi possível conectar</Text>
          <Text style={styles.errorSubtitle}>Verifique sua conexão ou tente recarregar.</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={() => loadFeed(selectedCategory, searchText)}>
            <Text style={styles.retryBtnText}>Tentar Novamente</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.light.primary}
              colors={[Colors.light.primary]}
            />
          }
          renderItem={({ item }) => <TradeCard item={item} />}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <View style={styles.emptyIconCircle}>
                <Ionicons name="sparkles" size={42} color={Colors.light.primary} />
              </View>
              <Text style={styles.emptyTitle}>Nenhuma troca encontrada</Text>
              <Text style={styles.emptySubtitle}>
                {searchText
                  ? `Não encontramos resultados para "${searchText}".`
                  : 'Seja o primeiro a anunciar um item para troca na sua região!'}
              </Text>
              <TouchableOpacity
                style={styles.emptyActionBtn}
                onPress={() => router.push('/(tabs)/publish')}
              >
                <Ionicons name="add-circle" size={18} color="#FFFFFF" />
                <Text style={styles.emptyActionText}>Criar Anúncio de Troca</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      {/* Modal de Localização */}
      <LocationModal
        visible={showLocationModal}
        currentCity={city}
        onClose={() => setShowLocationModal(false)}
        onSelectCity={(selectedCity) => {
          setCity(selectedCity);
          loadFeed(selectedCategory, searchText);
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  header: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconWrapper: {
    width: 34,
    height: 34,
    borderRadius: Radius.sm,
    backgroundColor: Colors.light.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...Shadow.soft,
  },
  brandTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: Colors.light.secondary,
    letterSpacing: -0.5,
  },
  citySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: Colors.light.primarySoft,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Radius.full,
    maxWidth: 160,
  },
  citySelectorText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.primary,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.light.surfaceSubtle,
    borderRadius: Radius.md,
    paddingHorizontal: 12,
    height: 48,
    borderWidth: 1,
    borderColor: Colors.light.border,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
  },
  clearSearchBtn: {
    padding: 4,
  },
  categoriesSection: {
    backgroundColor: '#FFFFFF',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.border,
  },
  categoriesContent: {
    paddingHorizontal: Spacing.md,
    gap: 8,
    maxWidth: 960,
    alignSelf: 'center',
  },
  categoryPill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryPillActive: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
    ...Shadow.soft,
  },
  categoryPillText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  categoryPillTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: Spacing.md,
    paddingBottom: 40,
    maxWidth: 960,
    width: '100%',
    alignSelf: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  loadingText: {
    marginTop: Spacing.md,
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '600',
  },
  errorIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.light.errorSoft,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: Colors.light.secondary,
    marginBottom: 4,
  },
  errorSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  retryBtn: {
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: Radius.md,
    ...Shadow.soft,
  },
  retryBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
  emptyContainer: {
    alignItems: 'center',
    marginTop: 60,
    paddingHorizontal: Spacing.xl,
  },
  emptyIconCircle: {
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
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    marginTop: 6,
    marginBottom: Spacing.lg,
    lineHeight: 20,
  },
  emptyActionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: Radius.full,
    ...Shadow.medium,
  },
  emptyActionText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});
