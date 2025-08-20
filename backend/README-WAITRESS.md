# Executando o Backend com Waitress

Este guia explica como usar o Waitress, um servidor WSGI de produção para Python, para executar a aplicação backend Flask em ambiente de produção.

## Sobre o Waitress

[Waitress](https://docs.pylonsproject.org/projects/waitress/) é um servidor WSGI de produção para Python que oferece:

- Alta performance e confiabilidade
- Compatibilidade com Windows e UNIX
- Não requer dependências externas ou compilação
- Suporte a múltiplas threads
- Ideal para ambientes de produção

## Instalação

O Waitress já está incluído no arquivo `requirements.txt`. Para instalar:

```bash
pip install -r requirements.txt
```

Ou instale apenas o Waitress:

```bash
pip install waitress==2.1.2
```

## Métodos para Executar o Backend

### 1. Usando o script run_waitress.py

Este é o método mais simples:

```bash
# No diretório backend
python run_waitress.py
```

O script configura automaticamente o servidor Waitress com as configurações adequadas.

### 2. Usando o arquivo batch (Windows)

Para Windows, foi criado um arquivo batch que facilita a execução:

```bash
# No diretório backend
start_server.bat
```

O script batch verifica se o Python está instalado, instala dependências necessárias e inicia o servidor.

### 3. Como Serviço Windows

Para ambientes de produção, você pode configurar o backend como um serviço do Windows:

```powershell
# Execute o PowerShell como Administrador
.\install_windows_service.ps1
```

Este script requer o NSSM ([Non-Sucking Service Manager](https://nssm.cc/)) e configura o backend para iniciar automaticamente quando o servidor é ligado.

## Configuração

### Variáveis de Ambiente

O servidor Waitress aceita estas variáveis de ambiente:

- `PORT`: Porta em que o servidor vai rodar (padrão: 4000)
- `WAITRESS_THREADS`: Número de threads de trabalho (padrão: 4)
- `FLASK_ENV`: Ambiente (development, production)

Exemplo:

```bash
# Windows
set PORT=5000
set WAITRESS_THREADS=8
python run_waitress.py

# Linux/Mac
PORT=5000 WAITRESS_THREADS=8 python run_waitress.py
```

## Monitoramento

### Logs

Quando executado como serviço Windows, os logs são gravados em:

- `logs/service-output.log`: Saída padrão
- `logs/service-error.log`: Erros e mensagens de alerta

Os logs são rotacionados diariamente ou quando atingem 10MB.

## Troubleshooting

### Erro: Endereço já em uso

Se o servidor não iniciar com erro "Address already in use":

1. Verifique se outra aplicação está usando a mesma porta
2. Use outra porta através da variável de ambiente PORT
3. Encerre o processo que está usando a porta

```powershell
# Windows (encontrar processo usando a porta 4000)
netstat -ano | findstr :4000

# Encerrar processo (substitua PID pelo ID do processo)
taskkill /F /PID PID
```

### Erros ao iniciar o serviço Windows

1. Verifique os logs em `logs/service-error.log`
2. Certifique-se de que todas as dependências foram instaladas
3. Confirme que o Python está no PATH do sistema

## Segurança e Performance

### Número de Threads

O número ideal de threads depende da sua máquina:

- Para servidores pequenos: 4 threads
- Para servidores médios: 8 threads
- Para servidores grandes: 16 ou mais threads

Ajuste a variável `WAITRESS_THREADS` conforme necessário.

### Proxy Reverso

É altamente recomendado usar o Waitress junto com um proxy reverso (IIS/ARR, Nginx ou Apache) que pode lidar com:

- Terminação SSL/TLS
- Compressão de conteúdo
- Cache
- Balanceamento de carga

O IIS com Application Request Routing (ARR) já foi configurado neste projeto para essa finalidade.
