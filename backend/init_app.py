"""
Módulo para inicialização da aplicação Flask
Responsável por criar e configurar a instância do Flask
"""
from flask import Flask
import os

def get_app():
    """
    Cria e configura a instância do Flask
    Retorna: Aplicação Flask configurada
    """
    # Verifica se estamos em ambiente de desenvolvimento ou produção
    is_dev = os.environ.get('FLASK_ENV') == 'development'
    
    # Determina o diretório estático - na produção os arquivos front-end estão em dist
    # No desenvolvimento, o front-end é servido pelo Vite separadamente
    if is_dev:
        static_folder = None  # Em dev não servimos arquivos estáticos
        static_url_path = None
    else:
        # Em produção, servimos o front-end da pasta dist
        static_folder = '../dist' if os.path.exists('../dist') else 'dist'
        static_url_path = ''
    
    # Criar a instância do Flask
    app = Flask(__name__, static_folder=static_folder, static_url_path=static_url_path)
    
    # Importar apenas quando a app estiver criada para evitar imports circulares
    from app import register_routes
    
    # Registrar rotas e middlewares
    register_routes(app)
    
    # Verificar se a pasta estática existe e exibir informações
    if not is_dev and static_folder:
        if os.path.exists(os.path.join(os.path.dirname(__file__), static_folder)):
            print(f"✅ Servindo arquivos estáticos de: {static_folder}")
        else:
            print(f"⚠️ Pasta de arquivos estáticos não encontrada: {static_folder}")
            print("⚠️ O frontend não será servido pelo backend!")
    
    return app