import AsyncStorage from '@react-native-async-storage/async-storage';

const USER_ID_KEY = '@trokaup_user_id';
const USER_NAME_KEY = '@trokaup_user_name';
const USER_PHOTO_KEY = '@trokaup_user_photo';
const BLOCKED_USERS_KEY = '@trokaup_blocked_users';

function generateId() {
  return 'user_' + Math.random().toString(36).substring(2, 9) + Date.now().toString(36);
}

export async function getOrCreateUserId() {
  try {
    let userId = await AsyncStorage.getItem(USER_ID_KEY);
    if (!userId) {
      userId = generateId();
      await AsyncStorage.setItem(USER_ID_KEY, userId);
    }
    return userId;
  } catch (e) {
    console.error('Erro ao recuperar userId:', e);
    return null;
  }
}

export async function getUserProfile() {
  try {
    const nome = await AsyncStorage.getItem(USER_NAME_KEY);
    const foto = await AsyncStorage.getItem(USER_PHOTO_KEY);
    return { nome: nome || '', foto: foto || null };
  } catch (e) {
    return { nome: '', foto: null };
  }
}

export async function saveUserProfile(nome, foto) {
  try {
    if (nome !== undefined) await AsyncStorage.setItem(USER_NAME_KEY, nome);
    if (foto !== undefined && foto !== null) await AsyncStorage.setItem(USER_PHOTO_KEY, foto);
  } catch (e) {
    console.error('Erro ao salvar perfil:', e);
  }
}

export async function blockUser(userIdToBlock) {
  try {
    const raw = await AsyncStorage.getItem(BLOCKED_USERS_KEY);
    const blockedList = raw ? JSON.parse(raw) : [];
    if (!blockedList.includes(userIdToBlock)) {
      blockedList.push(userIdToBlock);
      await AsyncStorage.setItem(BLOCKED_USERS_KEY, JSON.stringify(blockedList));
    }
  } catch (e) {
    console.error('Erro ao bloquear usuário:', e);
  }
}

export async function getBlockedUsers() {
  try {
    const raw = await AsyncStorage.getItem(BLOCKED_USERS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    return [];
  }
}

export async function clearAllData() {
  try {
    await AsyncStorage.clear();
  } catch (e) {
    console.error('Erro ao limpar dados locais:', e);
  }
}
