/**
 * Script de compatibilidade para rota de login
 * Este script cria um middleware para transformar a requisição do frontend para o formato esperado pelo backend
 */

// Obter URL da API
const apiUrl = window.API_URL || '/api';
console.log('API URL para compatibilidade:', apiUrl);

// Função original de fetch
const originalFetch = window.fetch;

// Sobrescrever o método fetch para interceptar requisições
window.fetch = async function(url, options) {
    // Verificar se é uma requisição para a rota de login
    if (url === `${apiUrl}/auth/login` && options && options.method === 'POST') {
        try {
            console.log('Interceptando requisição de login para compatibilidade');
            
            // Parsear o corpo da requisição
            const body = JSON.parse(options.body);
            console.log('Corpo original:', body);
            
            // Verificar se há um campo 'username' em vez de 'user'
            if (body.username && !body.user) {
                console.log('Convertendo formato de username para user');
                
                // Criar novo corpo com o formato esperado pelo backend Flask
                const newBody = {
                    user: body.username,
                    password: body.password
                };
                
                console.log('Corpo convertido:', newBody);
                
                // Atualizar opções com o novo corpo
                const newOptions = {
                    ...options,
                    body: JSON.stringify(newBody)
                };
                
                // Fazer a requisição com o corpo modificado
                return originalFetch(url, newOptions);
            }
        } catch (error) {
            console.error('Erro ao processar compatibilidade de login:', error);
        }
    }
    
    // Para outras requisições, usar o fetch original
    return originalFetch(url, options);
};

console.log('Script de compatibilidade de login carregado');
