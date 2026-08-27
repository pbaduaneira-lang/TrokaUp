from database_manager import get_connection

def clear_messages():
    try:
        conn = get_connection()
        cur = conn.cursor()
        print("Apagando todas as mensagens...")
        cur.execute("DELETE FROM public.mensagens")
        conn.commit()
        print("Todas as mensagens foram apagadas com sucesso!")
        cur.close()
        conn.close()
    except Exception as e:
        print(f"Erro ao apagar mensagens: {e}")

if __name__ == "__main__":
    clear_messages()
