# 🚀 TrokaUp - Documentação Técnica Oficial & Registro de Produção

Documento central de engenharia, arquitetura, infraestrutura em nuvem e publicação do projeto **TrokaUp**.

---

## 📌 1. Identidade & Registro Oficial

| Item | Valor Oficial |
| :--- | :--- |
| **Nome da Plataforma** | **TrokaUp** |
| **Slogan Oficial** | *Transforme o que você tem no que você quer. Escambo moderno & sustentável.* |
| **Identificador do Pacote Android** | `com.trokaup.app` |
| **Versão Atual / Próximo Build** | `1.0.0` (Target `versionCode 3 / 4`) |
| **EAS Project ID (Expo)** | `c034a9d3-bdc5-4116-8a7e-1d07aed5bce0` |
| **Conta Expo EAS** | `edmiltondefacio` (`pbaduaneira@gmail.com`) |
| **Repositório Oficial no GitHub** | [https://github.com/pbaduaneira-lang/TrokaUp](https://github.com/pbaduaneira-lang/TrokaUp) |
| **Ambiente Web / Vercel** | [https://trokaup.vercel.app](https://trokaup.vercel.app) *(DNS configurado)* |
| **URL Oficial da Política de Privacidade** | `https://trokaup.vercel.app/privacy` *(ou `https://trokaup.com/privacidade`)* |

---

## 🗄️ 2. Infraestrutura de Banco de Dados (Supabase PostgreSQL)

O banco de dados foi migrado de ambiente local para a nuvem da AWS (São Paulo) no Supabase, com suporte a pooling de conexões (*Connection Pooling* na porta 6543) e SSL.

- **Projeto Supabase:** `xfwvkjxpomynvoyylxhx` (São Paulo - `sa-east-1`)
- **String de Conexão Oficial:**
  `postgresql://postgres.xfwvkjxpomynvoyylxhx:trokaupedju1016@aws-0-sa-east-1.pooler.supabase.com:6543/postgres`

### Esquema de Tabelas Criadas:
1. **`public.products`**: Anúncios de itens para troca (título, descrição, quer_em_troca, imagem_url, cidade, usuario_id, categoria, ativo, criado_em).
2. **`public.mensagens`**: Mensagens de texto trocadas em tempo real via chat (remetente_id, destinatario_id, texto, lida, produto_id, criado_em).
3. **`public.users`**: Perfis de usuários e cidades registradas.
4. **`public.ratings`**: Avaliações de 1 a 5 estrelas e comentários entre parceiros de troca.
5. **`public.reports`**: Sistema de denúncia de anúncios e usuários para moderação de conteúdo (Google Play UGC Compliance).

---

## 📱 3. Recursos de UI/UX e Estrutura Frontend

### Arquitetura de Telas (Expo Router):
- **`app/index.tsx`**: Landing Page de Apresentação (Hero 3D, 3 pilares, botões principais e **Links Oficiais de Política de Privacidade e Termos de Uso** visíveis no rodapé mobile e desktop).
- **`app/privacy.tsx`**: **[NOVO]** Tela nativa dedicada de Política de Privacidade com conformidade total à LGPD e Google Play Data Safety.
- **`app/(tabs)/feed.js`**: Feed dinâmico de trocas com busca em tempo real, chips de categorias e seletor de localização (`LocationModal`).
- **`app/(tabs)/publish.js`**: Criação de novo anúncio com upload de fotos e validação de perfil.
- **`app/(tabs)/explore.tsx`**: Painel de conversas e mensagens com ordenação e badge de não lidas.
- **`app/(tabs)/profile.js`**: Gerenciamento de perfil, cidade, avatar, modal de termos e botão com rota para política de privacidade completa e exclusão permanente de conta e dados.
- **`app/product/[id].js`**: Detalhes completos do item para troca, reputação do anunciante, proposta de troca e denúncia.
- **`app/chat.js`**: Negociação em tempo real com avaliação por estrelas ao concluir a troca.

### Componentes Chave:
- **`components/BrandLogo.tsx`**: Logotipo oficial com a seta UP e elo circular com gradiente azul/ciano.
- **`components/LocationModal.tsx`**: Modal com busca por País, Estado, Município ou Bairro e cidades em destaque.
- **`components/TradeCard.js`**: Card responsivo (horizontal no desktop web e vertical no mobile).

---

## 🛡️ 4. Políticas de Segurança, LGPD e Google Play Store

1. **Correção da Rejeição do Google Play ("Política de Privacidade Inválida"):**
   - **Causa da Rejeição:** URL não cadastrada ou inacessível no Google Play Console na seção *Conteúdo do app*.
   - **Solução Implementada:**
     * Criada página web pública completa em `static/privacy.html` servida via `https://trokaup.vercel.app/privacy` e FastAPI (`/privacy` e `/privacidade`).
     * Inseridos botões clicáveis na Landing Page (`app/index.tsx`) e na aba de Perfil.
     * Criada tela interna no aplicativo (`app/privacy.tsx`).

2. **Cadastro Progressivo (Navegação Livre):**
   - Usuários podem navegar, pesquisar e ver detalhes de todos os produtos sem cadastro prévio.
   - Ao tentar **Propor Troca** ou **Publicar**, o app exibe modal convidando a preencher Nome e Cidade.

3. **Conformidade UGC & Exclusão de Dados (Google Play Requirement):**
   - Modais de denúncia em anúncios e chat (`/api/reports`).
   - Rota e botão no app para exclusão permanente de conta e histórico de dados (`DELETE /api/users/{user_id}`).

4. **Assets Oficiais da Loja:**
   - Ícone do App: `assets/images/playstore_icon_512.png` (512x512 px).
   - Banner de Destaque: `assets/images/playstore_feature_graphic.png` (1024x500 px).

---

## 📋 5. Guia de Ação para a Virada do Mês (Próxima Sessão)

1. **No Google Play Console (Imediato):**
   - Ir em: **Política e programas ➡️ Conteúdo do app ➡️ Política de privacidade**.
   - Inserir a URL: `https://trokaup.vercel.app/privacy` e Salvar.

2. **Gerar novo pacote `.aab` (Assim que resetar o EAS em 01/09/2026):**
   - Executar no terminal:
     ```powershell
     $env:EAS_BUILD_NO_EXPO_GO_WARNING="true"; npx eas-cli build --platform android --profile production --non-interactive
     ```
   - O EAS incrementará automaticamente o código para a versão `3` ou `4` e gerará o link direto de download do novo `.aab`.
   - Fazer o upload do novo `.aab` na aba **Produção** do Google Play Console e submeter para revisão.

---

*Documento gerado e mantido por Antigravity (Gravi) em parceria com Edmilton.*
