import { Platform } from 'react-native';

/**
 * TrokaUp - Centralized Environment & App Configuration
 * Gerencia URLs de API, WebSockets e constantes do sistema com suporte dinâmico a Web e Mobile.
 */

// IP padrão para desenvolvimento no celular (Expo Go / Emulador)
const DEFAULT_MOBILE_HOST = '192.168.100.47';
const DEV_PORT = '8000';

function getApiHost(): string {
  // Se estiver rodando no navegador Web, usa o próprio hostname (ex: localhost ou IP da máquina)
  if (Platform.OS === 'web' && typeof window !== 'undefined' && window.location) {
    return window.location.hostname || 'localhost';
  }
  return DEFAULT_MOBILE_HOST;
}

const IS_PROD = false;
const PROD_API_URL = 'https://api.trokaup.com';
const PROD_WS_URL = 'wss://api.trokaup.com/ws';

export const Config = {
  APP_NAME: 'TrokaUp',
  APP_TAGLINE: 'Trocas inteligentes na sua região',
  APP_VERSION: '1.0.0',
  PACKAGE_ID: 'com.trokaup.app',

  // Getters dinâmicos para suportar tanto Web (localhost) quanto Mobile (IP da rede)
  get API_BASE_URL(): string {
    if (IS_PROD) return PROD_API_URL;
    return `http://${getApiHost()}:${DEV_PORT}`;
  },

  get WS_BASE_URL(): string {
    if (IS_PROD) return PROD_WS_URL;
    const wsProtocol = (Platform.OS === 'web' && typeof window !== 'undefined' && window.location?.protocol === 'https:') ? 'wss:' : 'ws:';
    return `${wsProtocol}//${getApiHost()}:${DEV_PORT}/ws`;
  },

  // Limites e Regras de Negócio
  MAX_PRODUCT_IMAGES: 3,
  MAX_IMAGE_SIZE_MB: 5,
  WS_RECONNECT_INTERVAL_MS: 5000,
  POLLING_NOTIFICATION_INTERVAL_MS: 8000,

  // Links de Suporte e Políticas
  PRIVACY_POLICY_URL: 'https://trokaup.com/privacidade',
  TERMS_OF_USE_URL: 'https://trokaup.com/termos',
  SUPPORT_EMAIL: 'suporte@trokaup.com',
};

export default Config;
