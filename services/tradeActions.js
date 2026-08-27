// services/tradeActions.js
import { Alert } from 'react-native';

/**
 * Inicia uma troca a partir de um item do feed.
 * Versão de teste visual (Alert), para confirmar o clique.
 */
export function iniciarTroca(item) {
  if (!item) {
    Alert.alert('Erro', 'Item não encontrado');
    return;
  }

  Alert.alert(
    'Iniciar troca',
    `Item: ${item.title}`
  );
}
