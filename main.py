import os
import shutil
import uuid
import logging
from typing import Dict, List, Optional
from datetime import datetime

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, UploadFile, File, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel

from database_manager import get_db_cursor, init_db

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("TrokaUp-API")

app = FastAPI(
    title="TrokaUp API",
    description="Backend para a plataforma de trocas TrokaUp",
    version="1.0.0"
)

# Garantir diretório de uploads
UPLOAD_DIR = os.path.join("static", "images")
os.makedirs(UPLOAD_DIR, exist_ok=True)

# Servir arquivos estáticos (imagens)
app.mount("/static", StaticFiles(directory="static"), name="static")

# Configuração de CORS aberta para desenvolvimento e consumo mobile
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- GERENCIADOR DE WEBSOCKETS ---
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, user_id: str):
        await websocket.accept()
        if user_id not in self.active_connections:
            self.active_connections[user_id] = []
        self.active_connections[user_id].append(websocket)
        logger.info(f"WS CONNECT: Usuário {user_id} conectado. Conexões ativas: {len(self.active_connections[user_id])}")

    def disconnect(self, websocket: WebSocket, user_id: str):
        if user_id in self.active_connections:
            if websocket in self.active_connections[user_id]:
                self.active_connections[user_id].remove(websocket)
            if not self.active_connections[user_id]:
                del self.active_connections[user_id]
        logger.info(f"WS DISCONNECT: Conexão do usuário {user_id} encerrada.")

    async def send_personal_message(self, message: dict, user_id: str):
        if user_id in self.active_connections:
            for connection in list(self.active_connections[user_id]):
                try:
                    await connection.send_json(message)
                except Exception as e:
                    logger.warning(f"Erro ao enviar via WS para {user_id}: {e}")
                    self.disconnect(connection, user_id)

manager = ConnectionManager()

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await manager.connect(websocket, user_id)
    try:
        while True:
            data = await websocket.receive_text()
            # Resposta / Heartbeat
            if data == "ping":
                await websocket.send_text("pong")
    except WebSocketDisconnect:
        manager.disconnect(websocket, user_id)
    except Exception as e:
        logger.error(f"Erro no WebSocket ({user_id}): {e}")
        manager.disconnect(websocket, user_id)

# --- MODELOS PYDANTIC ---
class ProductCreate(BaseModel):
    titulo: str
    descricao: Optional[str] = ""
    quer_em_troca: str
    imagem_url: Optional[str] = None
    cidade: Optional[str] = None
    usuario_id: str
    categoria: Optional[str] = "Geral"

class MessageCreate(BaseModel):
    remetente_id: str
    destinatario_id: str
    texto: str
    produto_id: Optional[int] = None

class RatingCreate(BaseModel):
    avaliador_id: str
    avaliado_id: str
    estrelas: int
    comentario: Optional[str] = None

class ReportCreate(BaseModel):
    produto_id: Optional[int] = None
    denunciante_id: str
    denunciado_id: str
    motivo: str
    detalhes: Optional[str] = ""

class LoginRequest(BaseModel):
    email: str
    password: str

# --- ROTAS DE PRODUTOS ---

@app.get("/products")
def list_products(
    cidade: Optional[str] = None,
    busca: Optional[str] = None,
    categoria: Optional[str] = None
):
    try:
        with get_db_cursor() as (conn, cur):
            query = "SELECT * FROM public.products WHERE (ativo IS NULL OR ativo = TRUE)"
            params = []

            if cidade and cidade.strip():
                query += " AND cidade = %s"
                params.append(cidade.strip())

            if categoria and categoria != "Todos":
                query += " AND categoria = %s"
                params.append(categoria)

            if busca and busca.strip():
                search_term = f"%{busca.strip()}%"
                query += " AND (titulo ILIKE %s OR descricao ILIKE %s OR quer_em_troca ILIKE %s)"
                params.extend([search_term, search_term, search_term])

            query += " ORDER BY criado_em DESC"
            cur.execute(query, params)
            results = cur.fetchall()

            for r in results:
                if r.get("criado_em"):
                    r["criado_em"] = r["criado_em"].isoformat()
            return results
    except Exception as e:
        logger.error(f"Erro ao listar produtos: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/products")
def add_product(product: ProductCreate):
    try:
        with get_db_cursor() as (conn, cur):
            cur.execute(
                """
                INSERT INTO public.products 
                (titulo, descricao, quer_em_troca, imagem_url, cidade, usuario_id, categoria, ativo)
                VALUES (%s, %s, %s, %s, %s, %s, %s, TRUE)
                RETURNING *
                """,
                (
                    product.titulo,
                    product.descricao,
                    product.quer_em_troca,
                    product.imagem_url,
                    product.cidade,
                    product.usuario_id,
                    product.categoria
                )
            )
            new_product = dict(cur.fetchone()) if cur.rowcount > 0 else None
            if new_product and new_product.get("criado_em"):
                new_product["criado_em"] = new_product["criado_em"].isoformat()
            return new_product
    except Exception as e:
        logger.error(f"Erro ao criar produto: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/products/{product_id}")
def delete_product(product_id: int):
    try:
        with get_db_cursor() as (conn, cur):
            cur.execute("DELETE FROM public.products WHERE id = %s", (product_id,))
            return {"message": "Anúncio removido com sucesso", "product_id": product_id}
    except Exception as e:
        logger.error(f"Erro ao deletar produto: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- ROTA DE UPLOAD DE IMAGENS (SEGURO COM UUID) ---

@app.post("/upload")
async def upload_image(file: UploadFile = File(...)):
    try:
        ext = os.path.splitext(file.filename)[1].lower() or ".jpg"
        unique_filename = f"{uuid.uuid4().hex}{ext}"
        file_path = os.path.join(UPLOAD_DIR, unique_filename)

        with open(file_path, "wb+") as f:
            shutil.copyfileobj(file.file, f)

        logger.info(f"Upload bem sucedido: {unique_filename}")
        return {"url": f"/static/images/{unique_filename}"}
    except Exception as e:
        logger.error(f"Erro no upload de imagem: {e}")
        raise HTTPException(status_code=500, detail=f"Falha no upload: {str(e)}")

# --- ROTAS DE MENSAGENS & CHAT ---

@app.get("/messages")
def list_messages(remetente: str, destinatario: str, produto_id: Optional[int] = None):
    p_id = produto_id if produto_id is not None else 0
    try:
        with get_db_cursor() as (conn, cur):
            query = """
            SELECT * FROM public.mensagens
            WHERE ((remetente_id = %s AND destinatario_id = %s) OR (remetente_id = %s AND destinatario_id = %s))
            AND (COALESCE(produto_id, 0) = %s)
            ORDER BY criado_em ASC
            """
            cur.execute(query, [remetente, destinatario, destinatario, remetente, p_id])
            results = cur.fetchall()

            # Marcar mensagens recebidas como lidas
            cur.execute(
                """
                UPDATE public.mensagens SET lida = TRUE
                WHERE remetente_id = %s AND destinatario_id = %s
                AND lida = FALSE AND (COALESCE(produto_id, 0) = %s)
                """,
                [destinatario, remetente, p_id]
            )

            for r in results:
                if r.get("criado_em"):
                    r["criado_em"] = r["criado_em"].isoformat()
            return results
    except Exception as e:
        logger.error(f"Erro ao buscar mensagens: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/messages")
async def send_message(msg: MessageCreate):
    try:
        with get_db_cursor() as (conn, cur):
            cur.execute(
                """
                INSERT INTO public.mensagens (remetente_id, destinatario_id, texto, produto_id)
                VALUES (%s, %s, %s, %s)
                RETURNING *
                """,
                (msg.remetente_id, msg.destinatario_id, msg.texto, msg.produto_id)
            )
            new_msg = dict(cur.fetchone()) if cur.rowcount > 0 else None

            if new_msg and new_msg.get("criado_em"):
                new_msg["criado_em"] = new_msg["criado_em"].isoformat()

        # Disparar notificação em tempo real via WebSocket
        if new_msg:
            payload = {"type": "new_message", "data": new_msg}
            await manager.send_personal_message(payload, msg.destinatario_id)
            await manager.send_personal_message(payload, msg.remetente_id)

        return new_msg
    except Exception as e:
        logger.error(f"Erro ao enviar mensagem: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/conversations/{user_id}")
def list_conversations(user_id: str):
    try:
        with get_db_cursor() as (conn, cur):
            query = """
            SELECT DISTINCT ON (parceiro_id, m.produto_id)
                CASE WHEN m.remetente_id = %s THEN m.destinatario_id ELSE m.remetente_id END as parceiro_id,
                m.produto_id,
                p.titulo as produto_titulo,
                p.imagem_url as produto_imagem,
                m.texto as ultima_mensagem,
                m.lida,
                m.remetente_id as ultimo_remetente,
                m.criado_em
            FROM public.mensagens m
            LEFT JOIN public.products p ON m.produto_id = p.id
            WHERE m.remetente_id = %s OR m.destinatario_id = %s
            ORDER BY
                parceiro_id,
                m.produto_id,
                m.criado_em DESC
            """
            cur.execute(query, (user_id, user_id, user_id))
            results = cur.fetchall()

            return [{
                "usuario_id": r["parceiro_id"],
                "produto_id": r["produto_id"],
                "produto_titulo": r["produto_titulo"] or "Negociação em andamento",
                "produto_imagem": r["produto_imagem"],
                "ultima_mensagem": r["ultima_mensagem"],
                "lida": r["lida"],
                "ultimo_remetente": r["ultimo_remetente"],
                "criado_em": r["criado_em"].isoformat() if r["criado_em"] else None
            } for r in results]
    except Exception as e:
        logger.error(f"Erro ao listar conversas: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- ROTAS DE AVALIAÇÕES / REPUTAÇÃO ---

@app.post("/users/ratings")
def submit_rating(rating: RatingCreate):
    if rating.estrelas < 1 or rating.estrelas > 5:
        raise HTTPException(status_code=400, detail="Estrelas deve ser entre 1 e 5.")
    try:
        with get_db_cursor() as (conn, cur):
            cur.execute(
                """
                INSERT INTO public.ratings (avaliador_id, avaliado_id, estrelas, comentario)
                VALUES (%s, %s, %s, %s)
                RETURNING *
                """,
                (rating.avaliador_id, rating.avaliado_id, rating.estrelas, rating.comentario)
            )
            new_rating = dict(cur.fetchone()) if cur.rowcount > 0 else None
            if new_rating and new_rating.get("criado_em"):
                new_rating["criado_em"] = new_rating["criado_em"].isoformat()
            return new_rating
    except Exception as e:
        logger.error(f"Erro ao avaliar usuário: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/users/{user_id}/ratings")
def get_user_ratings(user_id: str):
    try:
        with get_db_cursor() as (conn, cur):
            cur.execute(
                "SELECT COALESCE(AVG(estrelas), 0.0) as media, COUNT(id) as total FROM public.ratings WHERE avaliado_id = %s",
                (user_id,)
            )
            stats = cur.fetchone()

            cur.execute(
                """
                SELECT r.*, u.nome as avaliador_nome 
                FROM public.ratings r 
                LEFT JOIN public.users u ON r.avaliador_id = u.email 
                WHERE r.avaliado_id = %s 
                ORDER BY r.criado_em DESC
                """,
                (user_id,)
            )
            comments = cur.fetchall()
            for c in comments:
                if c.get("criado_em"):
                    c["criado_em"] = c["criado_em"].isoformat()

            return {
                "media": float(stats["media"]) if stats else 0.0,
                "total": int(stats["total"]) if stats else 0,
                "comentarios": comments
            }
    except Exception as e:
        logger.error(f"Erro ao buscar reputação: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- ROTAS GOOGLE PLAY COMPLIANCE: DENÚNCIAS & EXCLUSÃO DE CONTA ---

@app.post("/api/reports")
def create_report(rep: ReportCreate):
    """Permite denunciar anúncios ou comportamentos abusivos (Obrigatório Google Play UGC)."""
    try:
        with get_db_cursor() as (conn, cur):
            cur.execute(
                """
                INSERT INTO public.reports (produto_id, denunciante_id, denunciado_id, motivo, detalhes)
                VALUES (%s, %s, %s, %s, %s)
                RETURNING *
                """,
                (rep.produto_id, rep.denunciante_id, rep.denunciado_id, rep.motivo, rep.detalhes)
            )
            new_report = dict(cur.fetchone()) if cur.rowcount > 0 else None
            return {"message": "Denúncia enviada para análise da moderação TrokaUp", "report": new_report}
    except Exception as e:
        logger.error(f"Erro ao registrar denúncia: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/api/users/{user_id}")
def delete_user_account(user_id: str):
    """Exclusão permanente de dados do usuário (Exigência estrita da Google Play Store)."""
    try:
        with get_db_cursor() as (conn, cur):
            # Excluir produtos do usuário
            cur.execute("DELETE FROM public.products WHERE usuario_id = %s", (user_id,))
            # Excluir mensagens vinculadas
            cur.execute("DELETE FROM public.mensagens WHERE remetente_id = %s OR destinatario_id = %s", (user_id, user_id))
            # Excluir avaliações
            cur.execute("DELETE FROM public.ratings WHERE avaliador_id = %s OR avaliado_id = %s", (user_id, user_id))
            # Excluir registro se cadastrado
            cur.execute("DELETE FROM public.users WHERE email = %s OR id::text = %s", (user_id, user_id))
            
            logger.info(f"Conta e dados do usuário {user_id} foram completamente excluídos.")
            return {"message": "Conta e todos os dados associados foram excluídos com sucesso."}
    except Exception as e:
        logger.error(f"Erro ao excluir conta: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- INICIALIZAÇÃO ---

@app.on_event("startup")
def startup_event():
    try:
        init_db()
        logger.info("TrokaUp API inicializada e conectada ao banco de dados com sucesso.")
    except Exception as e:
        logger.error(f"Aviso de inicialização do banco: {e}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
