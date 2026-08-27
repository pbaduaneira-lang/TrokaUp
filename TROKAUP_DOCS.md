# 🚀 TrokaUp - Documentação do Projeto

Este documento serve como a **"memória central"** e guia técnico do **TrokaUp**, estruturado para desenvolvimento contínuo e publicação na **Google Play Store**.

---

## 📝 Visão Geral
O **TrokaUp** é uma plataforma mobile de **escambo moderno** (troca colaborativa de produtos) entre usuários de uma mesma região geográfica. A missão do aplicativo é facilitar negociações diretas de itens de interesse mútuo, com segurança, chat em tempo real e sistema de reputação comunitária.

---

## 🛠️ Stack Tecnológica

### Frontend (Mobile)
- **Framework**: React Native + Expo (SDK 54+).
- **Identificador Android (Google Play)**: `com.trokaup.app` (versionCode: 1).
- **Roteamento**: Expo Router v6 (File-based navigation: `Explorar`, `Anunciar`, `Conversas`, `Perfil`, `Product Details` e `Chat`).
- **Estilização**: StyleSheet nativo com Tokens centralizados (`constants/theme.ts`).
- **Paleta de Cores**: Indigo (`#4F46E5`), Slate (`#0F172A`) e Ciano (`#06B6D4`).
- **Conectividade em Tempo Real**: WebSocket bidirecional com auto-reconexão e polling inteligente.
- **Configuração Centralizada**: `constants/config.ts` (chaveamento dinâmico entre IP local de desenvolvimento e URL de produção HTTPS/WSS).

### Backend (API & Realtime)
- **Linguagem**: Python 3.x.
- **Framework**: FastAPI assíncrono com Uvicorn.
- **Banco de Dados**: PostgreSQL com *Connection Pooling* (`psycopg2.pool.ThreadedConnectionPool`).
- **Upload Seguro**: Nomes de arquivo únicos gerados com `UUID v4` e persistência em `/static/images/`.
- **Moderação e Conformidade**: Endpoints dedicados para denúncia de conteúdo (`/api/reports`) e exclusão de conta/dados (`DELETE /api/users/{user_id}`).

---

## 🗄️ Estrutura do Banco de Dados (PostgreSQL)

1. **`products`**:
   - `id`, `titulo`, `descricao`, `quer_em_troca`, `imagem_url`, `cidade`, `usuario_id`, `categoria`, `ativo`, `criado_em`.
2. **`mensagens`**:
   - `id`, `remetente_id`, `destinatario_id`, `texto`, `lida`, `produto_id`, `criado_em`.
3. **`users`**:
   - `id`, `nome`, `email`, `senha`, `cidade`, `role`, `criado_em`.
4. **`ratings`**:
   - `id`, `avaliador_id`, `avaliado_id`, `estrelas` (1 a 5), `comentario`, `criado_em`.
5. **`reports` (Moderação Google Play UGC)**:
   - `id`, `produto_id`, `denunciante_id`, `denunciado_id`, `motivo`, `detalhes`, `status`, `criado_em`.

---

## 📋 Checklist de Publicação na Google Play Store

- [x] Nome oficial configurado: **TrokaUp**
- [x] Package Name Android definido: `com.trokaup.app`
- [x] Permissões declaradas: `CAMERA`, `READ_MEDIA_IMAGES`, `READ_EXTERNAL_STORAGE`, `VIBRATE`
- [x] Moderação de Conteúdo (UGC): Botão de denúncia no anúncio e no chat
- [x] Bloqueio de Usuários: Ação de bloqueio no chat
- [x] Exclusão de Conta: Botão "Excluir Minha Conta e Dados" na tela de perfil
- [x] Termos de Uso e Política de Privacidade acessíveis no app
- [x] Design System unificado sem telas com cores legadas
- [x] Uploads seguros com UUID para evitar conflitos de arquivos

---

## 💻 Comandos de Inicialização

### 1. Inicializar/Atualizar Banco de Dados
```cmd
python database_manager.py
```

### 2. Rodar a API FastAPI
```cmd
python main.py
```

### 3. Rodar o App Mobile (Expo)
```cmd
npm start
```

---
**Atualizado em**: Agosto de 2026 • Versão 1.0.0
