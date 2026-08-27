import AsyncStorage from '@react-native-async-storage/async-storage';

const CITY_KEY = '@trocaapp_city';

export async function saveCity(city) {
  try {
    await AsyncStorage.setItem(CITY_KEY, city);
  } catch (e) {
    // erro silencioso
  }
}

export async function getCity() {
  try {
    return await AsyncStorage.getItem(CITY_KEY);
  } catch (e) {
    return null;
  }
}

export async function clearCity() {
  try {
    await AsyncStorage.removeItem(CITY_KEY);
  } catch (e) {}
}
