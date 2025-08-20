"""
Script para iniciar a aplicação Flask com servidor Waitress (produção)
Uso: python run_waitress.py
"""
import os
import socket
from waitress import serve
from init_app import get_app

if __name__ == '__main__':
    # Configuração do servidor
    host = '0.0.0.0'
    port = int(os.getenv('PORT', 4000))
    threads = int(os.getenv('WAITRESS_THREADS', 4))
    
    # Importar a aplicação Flask
    app = get_app()
    
    # Obter IPs do servidor para exibição
    ip_addresses = []
    try:
        hostname = socket.gethostname()
        ip_addresses = [ip for ip in socket.gethostbyname_ex(hostname)[2] if not ip.startswith('127.')]
        if not ip_addresses:
            # Se não encontrar IPs não-localhost, tenta outra abordagem
            s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
            s.connect(('8.8.8.8', 53))
            ip_addresses = [s.getsockname()[0]]
            s.close()
    except:
        pass
    
    # Exibir informações do servidor
    print('\n============================================================')
    print('🚀 SERVIDOR WAITRESS INICIADO COM SUCESSO')
    print('============================================================')
    
    print(f'\n📡 Porta: {port}')
    print(f'🧵 Threads: {threads}')
    print(f'🌐 Ambiente: {os.getenv("FLASK_ENV", "production")}')
    
    # Exibir URLs exatas de acesso à API
    print('\n📍 ENDPOINTS DA API:')
    if ip_addresses:
        for ip in ip_addresses:
            print(f'   ✅ http://{ip}:{port}/api')
    print(f'   ✅ http://localhost:{port}/api')
    print(f'   ✅ http://127.0.0.1:{port}/api')
    
    print('\n🔍 ENDPOINTS PRINCIPAIS:')
    print(f'   🏥 Health Check: http://localhost:{port}/api/health')
    print(f'   📚 Documentação: http://localhost:{port}/api/info')
    print(f'   🔑 Login: http://localhost:{port}/api/auth/login')
    print('\n============================================================')
    print('⏳ Servidor em execução. Pressione CTRL+C para parar.')
    print('============================================================\n')
    
    # Iniciar o servidor Waitress
    serve(app, host=host, port=port, threads=threads)
