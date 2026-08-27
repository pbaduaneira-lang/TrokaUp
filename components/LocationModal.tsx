import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Colors, Spacing, Radius, Shadow } from '../constants/theme';
import { saveCity } from '../services/storage';

interface LocationModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectCity: (selectedCity: string) => void;
  currentCity?: string;
}

const POPULAR_CITIES = [
  'Todo o Brasil',
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
  'Goiânia - GO',
  'Manaus - AM',
];

export default function LocationModal({
  visible,
  onClose,
  onSelectCity,
  currentCity,
}: LocationModalProps) {
  const [searchText, setSearchText] = useState('');

  const filteredCities = searchText.trim().length > 0
    ? POPULAR_CITIES.filter((c) =>
        c.toLowerCase().includes(searchText.toLowerCase())
      )
    : POPULAR_CITIES;

  const handleSelect = async (city: string) => {
    if (Platform.OS !== 'web') {
      try {
        Haptics.selectionAsync();
      } catch (e) {}
    }
    const finalCity = city === 'Todo o Brasil' ? '' : city;
    await saveCity(finalCity);
    onSelectCity(finalCity);
    setSearchText('');
    onClose();
  };

  const handleCustomCity = async () => {
    if (!searchText.trim()) return;
    if (Platform.OS !== 'web') {
      try {
        Haptics.selectionAsync();
      } catch (e) {}
    }
    await saveCity(searchText.trim());
    onSelectCity(searchText.trim());
    setSearchText('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header do Modal */}
          <View style={styles.modalHeader}>
            <View style={styles.modalHeaderTitleRow}>
              <View style={styles.modalIconBox}>
                <Ionicons name="location-sharp" size={20} color={Colors.light.primary} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Informe sua Localização</Text>
                <Text style={styles.modalSubtitle}>
                  Encontre trocas no seu país, estado, município ou bairro
                </Text>
              </View>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Ionicons name="close" size={22} color={Colors.light.muted} />
            </TouchableOpacity>
          </View>

          {/* Campo de Busca / Digitação de Localização */}
          <View style={styles.searchBox}>
            <Ionicons name="search-outline" size={18} color={Colors.light.muted} style={{ marginRight: 8 }} />
            <TextInput
              value={searchText}
              onChangeText={setSearchText}
              placeholder="Digite sua cidade, estado ou bairro..."
              placeholderTextColor={Colors.light.muted}
              style={styles.searchInput}
              returnKeyType="done"
              onSubmitEditing={handleCustomCity}
            />
            {searchText.length > 0 && (
              <TouchableOpacity onPress={() => setSearchText('')} style={{ padding: 4 }}>
                <Ionicons name="close-circle" size={16} color={Colors.light.muted} />
              </TouchableOpacity>
            )}
          </View>

          {/* Botão de Usar Localização digitada se não estiver na lista */}
          {searchText.trim().length > 2 && !filteredCities.includes(searchText.trim()) && (
            <TouchableOpacity style={styles.useCustomBtn} onPress={handleCustomCity}>
              <Ionicons name="add-circle" size={18} color={Colors.light.primary} />
              <Text style={styles.useCustomText}>
                Buscar trocas em: <Text style={{ fontWeight: '800' }}>"{searchText.trim()}"</Text>
              </Text>
            </TouchableOpacity>
          )}

          {/* Lista de Cidades e Sugestões */}
          <Text style={styles.sectionLabel}>Cidades em Destaque</Text>
          <FlatList
            data={filteredCities}
            keyExtractor={(item) => item}
            showsVerticalScrollIndicator={false}
            style={styles.citiesList}
            renderItem={({ item }) => {
              const isSelected = (currentCity === item) || (!currentCity && item === 'Todo o Brasil');
              return (
                <TouchableOpacity
                  style={[styles.cityItem, isSelected && styles.cityItemSelected]}
                  onPress={() => handleSelect(item)}
                >
                  <Ionicons
                    name={item === 'Todo o Brasil' ? 'globe-outline' : 'pin-outline'}
                    size={18}
                    color={isSelected ? Colors.light.primary : Colors.light.muted}
                  />
                  <Text style={[styles.cityItemText, isSelected && styles.cityItemTextSelected]}>
                    {item}
                  </Text>
                  {isSelected && (
                    <Ionicons name="checkmark-circle" size={18} color={Colors.light.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
          />
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: Radius.xl,
    borderTopRightRadius: Radius.xl,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Platform.OS === 'ios' ? 40 : Spacing.xl,
    maxHeight: '85%',
    ...Shadow.glow,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  modalHeaderTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalIconBox: {
    width: 40,
    height: 40,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: Colors.light.secondary,
  },
  modalSubtitle: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginTop: 2,
    maxWidth: 240,
  },
  closeBtn: {
    padding: 6,
  },
  searchBox: {
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
  searchInput: {
    flex: 1,
    height: '100%',
    fontSize: 14,
    color: Colors.light.text,
    fontWeight: '600',
  },
  useCustomBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.light.primarySoft,
    padding: 12,
    borderRadius: Radius.md,
    marginBottom: Spacing.sm,
  },
  useCustomText: {
    fontSize: 13,
    color: Colors.light.primary,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '800',
    color: Colors.light.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginVertical: Spacing.xs,
  },
  citiesList: {
    maxHeight: 320,
  },
  cityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.surfaceSubtle,
    gap: 10,
  },
  cityItemSelected: {
    backgroundColor: Colors.light.primarySoft,
    borderRadius: Radius.md,
  },
  cityItemText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
  },
  cityItemTextSelected: {
    color: Colors.light.primary,
    fontWeight: '800',
  },
});
