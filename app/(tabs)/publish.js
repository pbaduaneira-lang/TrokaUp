import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  KeyboardAvoidingView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { createProduct } from '../../services/api';
import { getCity } from '../../services/storage';
import { uploadImages } from '../../services/uploadImages';
import { getOrCreateUserId } from '../../services/user';
import { Colors, Spacing, Radius, Shadow, Gradients } from '../../constants/theme';
import { Config } from '../../constants/config';

const CATEGORIES = ['Geral', 'Eletrônicos', 'Roupas', 'Livros', 'Esportes', 'Outros'];

export default function PublishScreen() {
  const router = useRouter();
  const [city, setCity] = useState('');
  const [userId, setUserId] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [want, setWant] = useState('');
  const [images, setImages] = useState([]);
  const [category, setCategory] = useState('Geral');
  const [loading, setLoading] = useState(false);

  const [userName, setUserName] = useState('');

  useEffect(() => {
    async function loadContext() {
      const savedCity = await getCity();
      const uid = await getOrCreateUserId();
      const { getUserProfile } = require('../../services/user');
      const profile = await getUserProfile();
      if (savedCity) setCity(savedCity);
      if (uid) setUserId(uid);
      if (profile && profile.nome) setUserName(profile.nome);
    }
    loadContext();
  }, []);

  const pickImage = async () => {
    if (images.length >= Config.MAX_PRODUCT_IMAGES) {
      Alert.alert('Limite de Fotos', `Você pode adicionar no máximo ${Config.MAX_PRODUCT_IMAGES} fotos.`);
      return;
    }

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Permissão Necessária',
        'Precisamos de permissão para acessar sua galeria de fotos e selecionar a imagem do item.'
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: Config.MAX_PRODUCT_IMAGES - images.length,
      quality: 0.7,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newImages = result.assets.map((a) => a.uri);
      setImages((prev) => [...prev, ...newImages].slice(0, Config.MAX_PRODUCT_IMAGES));
      if (Platform.OS !== 'web') {
        try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
      }
    }
  };

  const removeImage = (index) => {
    setImages((prev) => prev.filter((_, i) => i !== index));
    if (Platform.OS !== 'web') {
      try { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); } catch (e) {}
    }
  };

  const handlePublish = async () => {
    if (!userName || !city) {
      Alert.alert(
        'Complete seu Perfil 👋',
        'Para criar anúncios no TrokaUp e receber propostas de troca, preencha seu nome e cidade no seu Perfil. Leva apenas 30 segundos!',
        [
          { text: 'Agora não', style: 'cancel' },
          { text: 'Preencher Perfil', onPress: () => router.push('/(tabs)/profile') }
        ]
      );
      return;
    }

    if (!title.trim() || !want.trim()) {
      Alert.alert('Campos Obrigatórios', 'Informe o que você está oferecendo e o que deseja em troca.');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Foto Obrigatória', 'Adicione pelo menos 1 foto do item para aumentar as chances de troca.');
      return;
    }

    setLoading(true);

    try {
      const imageUrls = await uploadImages({ images, userId });

      await createProduct({
        name: title.trim(),
        description: description.trim(),
        price: want.trim(),
        category: category,
        image_url: imageUrls.length > 0 ? imageUrls[0] : null,
        cidade: city,
        usuario_id: userId,
      });

      if (Platform.OS !== 'web') {
        try { Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success); } catch (e) {}
      }

      Alert.alert('Publicado com Sucesso! 🎉', 'Seu anúncio já está disponível para outros usuários trocarem com você.', [
        {
          text: 'Ver no Feed',
          onPress: () => {
            setTitle('');
            setDescription('');
            setWant('');
            setImages([]);
            setCategory('Geral');
            router.replace('/(tabs)/feed');
          },
        },
      ]);
    } catch (e) {
      console.error('[TrokaUp] Erro ao publicar anúncio:', e);
      Alert.alert('Falha na Publicação', e.message || 'Verifique sua conexão e tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Novo Anúncio</Text>
            <Text style={styles.headerSubtitle}>
              Descreva seu item e encontre alguém interessado em trocar com você.
            </Text>
          </View>

          {/* Fotos do Item */}
          <View style={styles.cardSection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="images-outline" size={18} color={Colors.light.primary} />
              <Text style={styles.sectionTitle}>
                Fotos do Item <Text style={styles.sectionSubtitle}>(máx. 3)</Text>
              </Text>
            </View>

            <View style={styles.imageGrid}>
              {images.map((uri, index) => (
                <View key={index} style={styles.imageWrapper}>
                  <Image source={{ uri }} style={styles.imageThumb} resizeMode="cover" />
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => removeImage(index)}
                    activeOpacity={0.8}
                  >
                    <Ionicons name="close" size={14} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ))}

              {images.length < Config.MAX_PRODUCT_IMAGES && (
                <TouchableOpacity
                  onPress={pickImage}
                  style={styles.addPhotoBox}
                  activeOpacity={0.7}
                >
                  <Ionicons name="camera-outline" size={28} color={Colors.light.primary} />
                  <Text style={styles.addPhotoLabel}>Adicionar Foto</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          {/* Formulário de Informações */}
          <View style={styles.cardSection}>
            <Text style={styles.inputLabel}>O que você está oferecendo? *</Text>
            <TextInput
              value={title}
              onChangeText={setTitle}
              placeholder="Ex: Violão Yamaha, Smartphone, Tênis Nike..."
              placeholderTextColor={Colors.light.muted}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>O que você quer em troca? *</Text>
            <TextInput
              value={want}
              onChangeText={setWant}
              placeholder="Ex: Teclado musical, Smartwatch, Outro item..."
              placeholderTextColor={Colors.light.muted}
              style={styles.input}
            />

            <Text style={styles.inputLabel}>Detalhes e estado de conservação</Text>
            <TextInput
              value={description}
              onChangeText={setDescription}
              placeholder="Ex: Pouco tempo de uso, acompanha caixa e nota fiscal, sem marcas de arranhão."
              placeholderTextColor={Colors.light.muted}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              style={[styles.input, styles.textArea]}
            />
          </View>

          {/* Categoria */}
          <View style={styles.cardSection}>
            <Text style={styles.inputLabel}>Selecione a Categoria</Text>
            <View style={styles.categoryChipsContainer}>
              {CATEGORIES.map((cat) => {
                const isSelected = category === cat;
                return (
                  <TouchableOpacity
                    key={cat}
                    onPress={() => {
                      setCategory(cat);
                      if (Platform.OS !== 'web') {
                        try { Haptics.selectionAsync(); } catch (e) {}
                      }
                    }}
                    style={[
                      styles.categoryChip,
                      isSelected && styles.categoryChipSelected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        isSelected && styles.categoryChipTextSelected,
                      ]}
                    >
                      {cat}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Localização da Troca */}
          <View style={styles.locationBanner}>
            <Ionicons name="location-sharp" size={18} color={Colors.light.primary} />
            <Text style={styles.locationBannerText}>
              Publicando para trocas em <Text style={{ fontWeight: '800' }}>{city || 'sua região'}</Text>
            </Text>
          </View>

          {/* Botão de Publicação */}
          <TouchableOpacity
            onPress={handlePublish}
            disabled={loading}
            style={styles.publishBtnWrapper}
            activeOpacity={0.9}
          >
            <LinearGradient
              colors={Gradients.primary}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.publishGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <View style={styles.publishBtnContent}>
                  <Ionicons name="rocket-outline" size={20} color="#FFFFFF" />
                  <Text style={styles.publishBtnText}>PUBLICAR ANÚNCIO</Text>
                </View>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  scrollContent: {
    padding: Spacing.md,
    paddingBottom: 50,
    maxWidth: 720,
    width: '100%',
    alignSelf: 'center',
  },
  header: {
    marginBottom: Spacing.md,
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: '900',
    color: Colors.light.secondary,
    letterSpacing: -0.5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    marginTop: 4,
    lineHeight: 20,
  },
  cardSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: Radius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
    ...Shadow.card,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.light.secondary,
  },
  sectionSubtitle: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.light.muted,
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 4,
  },
  imageWrapper: {
    position: 'relative',
    width: 96,
    height: 96,
  },
  imageThumb: {
    width: '100%',
    height: '100%',
    borderRadius: Radius.md,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  removePhotoBtn: {
    position: 'absolute',
    top: -6,
    right: -6,
    backgroundColor: Colors.light.error,
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    ...Shadow.soft,
  },
  addPhotoBox: {
    width: 96,
    height: 96,
    borderRadius: Radius.md,
    borderWidth: 1.5,
    borderColor: Colors.light.primary,
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.primarySoft,
  },
  addPhotoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.light.primary,
    marginTop: 4,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '800',
    color: Colors.light.secondary,
    marginBottom: 6,
    marginTop: 6,
  },
  input: {
    backgroundColor: Colors.light.surfaceSubtle,
    borderRadius: Radius.md,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.light.text,
    borderWidth: 1,
    borderColor: Colors.light.border,
    marginBottom: Spacing.sm,
    fontWeight: '600',
  },
  textArea: {
    height: 90,
    paddingTop: 12,
  },
  categoryChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  categoryChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Radius.full,
    backgroundColor: Colors.light.surfaceSubtle,
    borderWidth: 1,
    borderColor: Colors.light.border,
  },
  categoryChipSelected: {
    backgroundColor: Colors.light.primary,
    borderColor: Colors.light.primary,
    ...Shadow.soft,
  },
  categoryChipText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.light.textSecondary,
  },
  categoryChipTextSelected: {
    color: '#FFFFFF',
  },
  locationBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.primarySoft,
    padding: 12,
    borderRadius: Radius.md,
    marginBottom: Spacing.md,
  },
  locationBannerText: {
    fontSize: 13,
    color: Colors.light.primary,
    fontWeight: '600',
  },
  publishBtnWrapper: {
    borderRadius: Radius.lg,
    overflow: 'hidden',
    ...Shadow.medium,
    marginTop: 4,
  },
  publishGradient: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  publishBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  publishBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
});
