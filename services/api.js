import AsyncStorage from '@react-native-async-storage/async-storage';
import { Config } from '../constants/config';

async function getAuthHeaders() {
  const token = await AsyncStorage.getItem('@trokaup_token');
  return token ? { 'Authorization': `Bearer ${token}` } : {};
}

/**
 * Busca produtos/anúncios disponíveis no feed com filtros opcionais.
 */
export async function getProducts(cidade, busca, categoria) {
  let url = `${Config.API_BASE_URL}/products?`;
  const params = [];
  if (cidade && cidade.trim()) params.push(`cidade=${encodeURIComponent(cidade.trim())}`);
  if (busca && busca.trim()) params.push(`busca=${encodeURIComponent(busca.trim())}`);
  if (categoria && categoria !== 'Todos') params.push(`categoria=${encodeURIComponent(categoria)}`);
  url += params.join('&');

  const response = await fetch(url);
  if (!response.ok) throw new Error(`Erro na API (${response.status})`);
  return response.json();
}

/**
 * Cria um novo anúncio de troca.
 */
export async function createProduct(product) {
  const payload = {
    titulo: product.name || product.titulo,
    descricao: product.description || product.descricao || '',
    quer_em_troca: product.price || product.quer_em_troca,
    imagem_url: product.image_url || product.imagem_url,
    cidade: product.cidade || '',
    usuario_id: String(product.usuario_id || '1'),
    categoria: product.category || product.categoria || 'Geral'
  };

  const response = await fetch(`${Config.API_BASE_URL}/products`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.detail || `Erro do servidor: ${response.status}`);
  }
  return response.json();
}

/**
 * Exclui um anúncio do usuário.
 */
export async function deleteProduct(productId) {
  const response = await fetch(`${Config.API_BASE_URL}/products/${productId}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Falha ao remover o anúncio');
  return response.json();
}

/**
 * Histórico de mensagens entre dois usuários para um produto.
 */
export async function getMessages(meuId, outroId, produtoId) {
  const url = `${Config.API_BASE_URL}/messages?remetente=${encodeURIComponent(meuId)}&destinatario=${encodeURIComponent(outroId)}${produtoId ? `&produto_id=${produtoId}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Falha ao buscar mensagens');
  return response.json();
}

/**
 * Envia uma mensagem no chat.
 */
export async function sendMessage(meuId, outroId, texto, produtoId) {
  const response = await fetch(`${Config.API_BASE_URL}/messages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      remetente_id: String(meuId),
      destinatario_id: String(outroId),
      texto: String(texto).trim(),
      produto_id: produtoId ? parseInt(produtoId, 10) : null
    })
  });
  if (!response.ok) throw new Error('Falha ao enviar mensagem');
  return response.json();
}

/**
 * Lista todas as conversas do usuário.
 */
export async function getConversations(userId) {
  const response = await fetch(`${Config.API_BASE_URL}/conversations/${encodeURIComponent(userId)}`);
  if (!response.ok) throw new Error('Falha ao buscar conversas');
  return response.json();
}

/**
 * Busca estatísticas de reputação e avaliações do usuário.
 */
export async function getUserRatings(userId) {
  const response = await fetch(`${Config.API_BASE_URL}/users/${encodeURIComponent(userId)}/ratings`);
  if (!response.ok) throw new Error('Falha ao buscar reputação');
  return response.json();
}

/**
 * Envia uma avaliação após negociação.
 */
export async function submitRating(ratingData) {
  const response = await fetch(`${Config.API_BASE_URL}/users/ratings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      avaliador_id: String(ratingData.avaliador_id),
      avaliado_id: String(ratingData.avaliado_id),
      estrelas: parseInt(ratingData.estrelas, 10),
      comentario: ratingData.comentario || ''
    })
  });
  if (!response.ok) throw new Error('Falha ao enviar avaliação');
  return response.json();
}

/**
 * Denúncia de anúncio ou usuário (Google Play Store UGC Compliance).
 */
export async function reportProduct({ produtoId, denuncianteId, denunciadoId, motivo, detalhes }) {
  const response = await fetch(`${Config.API_BASE_URL}/api/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      produto_id: produtoId ? parseInt(produtoId, 10) : null,
      denunciante_id: String(denuncianteId),
      denunciado_id: String(denunciadoId),
      motivo: String(motivo),
      detalhes: detalhes || ''
    })
  });
  if (!response.ok) throw new Error('Falha ao enviar denúncia');
  return response.json();
}

/**
 * Exclusão definitiva de conta do usuário (Google Play Store Compliance).
 */
export async function deleteAccount(userId) {
  const response = await fetch(`${Config.API_BASE_URL}/api/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE'
  });
  if (!response.ok) throw new Error('Falha ao excluir a conta');
  return response.json();
}
