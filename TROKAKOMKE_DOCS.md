# 🚀 TROKAKOMKE - Documentação do Projeto

Este documento serve como a **"memória central"** do projeto para garantir continuidade e precisão em futuras implementações. Ele resume a arquitetura, a stack tecnológica, a estrutura de dados e as funcionalidades ativas do sistema.

---

## 📝 Visão Geral
O **TROKAKOMKE** é uma plataforma mobile de **troca de produtos** (escambo moderno) entre usuários de uma mesma região geográfica. O foco principal não é a venda monetária, mas sim a facilitação de negociações de itens de interesse mútuo.

---

## 🛠️ Stack Tecnológica

### Frontend (Mobile)
- **Framework**: React Native + Expo (SDK 54+).
- **Navegação**: Expo Router (File-based routing nas abas `Perfil`, `Explorar`, `Anunciar` e `Chat`).
- **Estilização**: StyleSheet nativo com Design System baseado em Tokens (`constants/theme.ts`).
- **Paleta de Cores**: Indigo (#4F46E5) e Slate (#1E293B) - Estilo Premium/Moderno.
- **Conectividade em Tempo Real**: Conexão nativa `WebSocket` bidirecional e persistente para a tela de chat individual, incluindo mecanismo de auto-reconexão robusta a cada 5 segundos.

### Backend (API)
- **Linguagem**: Python 3.x.
- **Framework**: FastAPI (Rápido, assíncrono e moderno).
- **Protocolo de Comunicação**: REST (JSON) + WebSockets (gerenciado via classe assíncrona `ConnectionManager`).
- **Dependência Crítica**: `websockets` (necessária no ambiente Python para habilitar o protocolo WebSocket no servidor Uvicorn).
- **Banco de Dados**: PostgreSQL local.
- **Gestão de Imagens**: Armazenamento local na pasta `/static/images/`.

---

## 🗄️ Arquitetura de Dados (PostgreSQL)

### Tabelas Principais
1. **`products`**:
   - `id` (SERIAL PRIMARY KEY), `titulo` (TEXT), `descricao` (TEXT), `quer_em_troca` (TEXT), `imagem_url` (TEXT), `cidade` (TEXT), `usuario_id` (TEXT), `categoria` (TEXT DEFAULT 'Geral'), `criado_em` (TIMESTAMP).
2. **`mensagens`**:
   - `id` (SERIAL PRIMARY KEY), `remetente_id` (TEXT), `destinatario_id` (TEXT), `texto` (TEXT), `lida` (BOOLEAN DEFAULT FALSE), `produto_id` (INTEGER), `criado_em` (TIMESTAMP).
3. **`users`**:
   - `id` (SERIAL PRIMARY KEY), `nome` (TEXT), `email` (TEXT UNIQUE), `senha` (TEXT), `cidade` (TEXT), `role` (TEXT DEFAULT 'user'), `criado_em` (TIMESTAMP).
4. **`ratings`**:
   - `id` (SERIAL PRIMARY KEY), `avaliador_id` (TEXT), `avaliado_id` (TEXT), `estrelas` (INTEGER CHECK 1-5), `comentario` (TEXT), `criado_em` (TIMESTAMP).

---

## ⚙️ Configurações Atuais
- **IP de Rede Local**: Configurado como `192.168.100.47` (Porta `8000`).
- **Arquivos de Configuração**:
  - `services/api.js`: URL base da API REST e WebSockets.
  - `services/uploadImages.js`: URL base para upload de fotos.
  - `database_manager.py`: Credenciais e estrutura do banco PostgreSQL.

---

## 🎯 Status das Funcionalidades

- [x] **Branding & Identidade Visual**: Nome do app ajustado para **TROKAKOMKE**, com paleta Indigo/Slate, ícones Ionicons e layouts adaptados para evitar conflitos com rodapés nativos.
- [x] **Limpeza de Legados**: Removidos completamente os códigos de e-commerce e carrinho (`carrinho.js` e `CartContext.js`) da aplicação.
- [x] **Feed com Busca & Categorias**:
  - Filtro automático com base na cidade cadastrada no perfil.
  - **Barra de Busca** textual em tempo real no feed.
  - **Chips horizontais de categorias** ("Todos", "Geral", "Eletrônicos", "Roupas", "Livros", "Esportes", "Outros") integrados com requisições dinâmicas e combinadas ao backend.
- [x] **Publicação Simplificada**: Cadastro de itens com até 3 fotos da galeria, título, o que deseja em troca, descrição e seleção de categoria via chips de formulário.
- [x] **Chat reativo via WebSockets**:
  - Mensagens instantâneas com lag zero e sem consumo indevido de requisições HTTP repetitivas (polling).
  - Verificador silencioso de novas propostas rodando a cada 8 segundos em segundo plano a partir do perfil com banner global de alerta.
- [x] **Sistema de Reputação (Avaliação)**:
  - Detalhe do produto exibe a média de estrelas e o total de avaliações do anunciante (ex: `⭐ 4.8 (12 avaliações)`).
  - Ao finalizar com sucesso uma negociação de chat, a aplicação abre automaticamente um **Modal de Avaliação** convidando o usuário a classificar o parceiro com 1 a 5 estrelas e adicionar um feedback de texto.

---

## 💻 Comandos e Inicialização

### 1. Inicializar/Migrar o Banco de Dados
Caso precise recriar as tabelas ou garantir que a estrutura está atualizada:
```cmd
python database_manager.py init
```

### 2. Rodar o Backend API (FastAPI)
```cmd
python main.py
```

### 3. Rodar o Aplicativo Mobile (Expo)
```cmd
npm start
```
*Abra o aplicativo **Expo Go** no celular na mesma rede Wi-Fi e escaneie o QR Code gerado pelo terminal.*

---
**Última Atualização**: 26 de Maio de 2026.
