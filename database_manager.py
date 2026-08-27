import os
import psycopg2
from psycopg2.extras import RealDictCursor
from psycopg2.pool import ThreadedConnectionPool
from contextlib import contextmanager
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TrokaUp-DB")

# Suporte dinâmico para Supabase / PostgreSQL em Nuvem
SUPABASE_DEFAULT_URL = "postgresql://postgres.xfwvkjxpomynvoyylxhx:trokaupedju1016@aws-0-sa-east-1.pooler.supabase.com:6543/postgres"
DATABASE_URL = os.environ.get("DATABASE_URL", SUPABASE_DEFAULT_URL)

DB_CONFIG = {
    "dbname": os.environ.get("DB_NAME", "postgres"),
    "user": os.environ.get("DB_USER", "postgres.xfwvkjxpomynvoyylxhx"),
    "password": os.environ.get("DB_PASSWORD", "trokaupedju1016"),
    "host": os.environ.get("DB_HOST", "aws-0-sa-east-1.pooler.supabase.com"),
    "port": os.environ.get("DB_PORT", "6543")
}

# Pool de conexões para suportar requisições concorrentes e estabilidade
_pool = None

def get_pool():
    global _pool
    if _pool is None or _pool.closed:
        try:
            if DATABASE_URL:
                _pool = ThreadedConnectionPool(
                    minconn=2,
                    maxconn=20,
                    dsn=DATABASE_URL,
                    cursor_factory=RealDictCursor
                )
                logger.info("Pool de conexões inicializado via DATABASE_URL (Supabase/Cloud).")
            else:
                _pool = ThreadedConnectionPool(
                    minconn=2,
                    maxconn=20,
                    **DB_CONFIG,
                    cursor_factory=RealDictCursor
                )
                logger.info("Pool de conexões PostgreSQL local inicializado.")
        except Exception as e:
            logger.error(f"Erro ao inicializar pool de conexões: {e}")
            raise
    return _pool

@contextmanager
def get_db_cursor():
    """Gerenciador de contexto para conexão e cursor com retorno automático ao pool."""
    pool = get_pool()
    conn = pool.getconn()
    try:
        cur = conn.cursor()
        yield conn, cur
        conn.commit()
    except Exception as e:
        conn.rollback()
        logger.error(f"Erro na transação do banco: {e}")
        raise
    finally:
        cur.close()
        pool.putconn(conn)

def get_connection():
    """Retorna uma conexão direta (para compatibilidade legada)."""
    if DATABASE_URL:
        return psycopg2.connect(DATABASE_URL, cursor_factory=RealDictCursor)
    return psycopg2.connect(**DB_CONFIG, cursor_factory=RealDictCursor)

def init_db():
    """Cria e atualiza todas as tabelas necessárias para o TrokaUp."""
    try:
        conn = get_connection()
        cur = conn.cursor()
        
        # 1. Tabela de Produtos / Itens de Troca
        cur.execute("""
            CREATE TABLE IF NOT EXISTS public.products (
                id SERIAL PRIMARY KEY,
                titulo TEXT NOT NULL,
                descricao TEXT,
                quer_em_troca TEXT NOT NULL,
                imagem_url TEXT,
                cidade TEXT,
                usuario_id TEXT NOT NULL,
                categoria TEXT DEFAULT 'Geral',
                ativo BOOLEAN DEFAULT TRUE,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 2. Tabela de Mensagens do Chat
        cur.execute("""
            CREATE TABLE IF NOT EXISTS public.mensagens (
                id SERIAL PRIMARY KEY,
                remetente_id TEXT NOT NULL,
                destinatario_id TEXT NOT NULL,
                texto TEXT NOT NULL,
                lida BOOLEAN DEFAULT FALSE,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                produto_id INTEGER
            );
        """)

        # 3. Tabela de Usuários
        cur.execute("""
            CREATE TABLE IF NOT EXISTS public.users (
                id SERIAL PRIMARY KEY,
                nome TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                senha TEXT NOT NULL,
                cidade TEXT,
                role TEXT DEFAULT 'user',
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 4. Tabela de Avaliações / Reputação
        cur.execute("""
            CREATE TABLE IF NOT EXISTS public.ratings (
                id SERIAL PRIMARY KEY,
                avaliador_id TEXT NOT NULL,
                avaliado_id TEXT NOT NULL,
                estrelas INTEGER NOT NULL CHECK (estrelas >= 1 AND estrelas <= 5),
                comentario TEXT,
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # 5. Tabela de Denúncias e Moderação (Obrigatório Google Play UGC)
        cur.execute("""
            CREATE TABLE IF NOT EXISTS public.reports (
                id SERIAL PRIMARY KEY,
                produto_id INTEGER REFERENCES public.products(id) ON DELETE SET NULL,
                denunciante_id TEXT NOT NULL,
                denunciado_id TEXT NOT NULL,
                motivo TEXT NOT NULL,
                detalhes TEXT,
                status TEXT DEFAULT 'pendente',
                criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        # Garantir colunas essenciais
        cur.execute("ALTER TABLE public.products ADD COLUMN IF NOT EXISTS categoria TEXT DEFAULT 'Geral'")
        cur.execute("ALTER TABLE public.products ADD COLUMN IF NOT EXISTS ativo BOOLEAN DEFAULT TRUE")
        cur.execute("ALTER TABLE public.mensagens ADD COLUMN IF NOT EXISTS produto_id INTEGER")

        # Inserir administrador padrão se não existir
        cur.execute("""
            INSERT INTO public.users (nome, email, senha, role, cidade)
            VALUES ('Administrador TrokaUp', 'admin@trokaup.com', 'admin123', 'admin', 'São Paulo - SP')
            ON CONFLICT (email) DO NOTHING;
        """)

        conn.commit()
        cur.close()
        conn.close()
        logger.info("Banco de dados TrokaUp inicializado com sucesso (Tabelas: products, mensagens, users, ratings, reports).")
    except Exception as e:
        logger.error(f"Falha na inicialização do banco: {e}")
        raise

if __name__ == "__main__":
    init_db()
