/**
 * Script de Post-Build para Preparar Deploy de Produção
 * 
 * Este script:
 * 1. Adiciona o arquivo config.js na pasta dist
 * 2. Adiciona o web.config na pasta dist
 * 3. Modifica os arquivos HTML para carregar config.js
 * 4. Corrige as URLs hardcoded
 */

const fs = require('fs');
const path = require('path');

// Configurações
const DIST_DIR = path.join(__dirname, 'dist');
const PRODUCTION_API_URL = 'http://recebhomolog.mercocamptech.com.br:4000/api';

console.log('=== Post-Build para Produção ===');

// 1. Copiar config.js para dist
console.log('Copiando config.js...');
try {
    const configSrc = path.join(__dirname, 'config.js');
    const configDest = path.join(DIST_DIR, 'config.js');
    fs.copyFileSync(configSrc, configDest);
    console.log('✅ config.js copiado');
} catch (error) {
    console.error('❌ Erro ao copiar config.js:', error);
}

// 2. Copiar web.config para dist
console.log('Copiando web.config...');
try {
    const webConfigSrc = path.join(__dirname, 'web.config');
    const webConfigDest = path.join(DIST_DIR, 'web.config');
    fs.copyFileSync(webConfigSrc, webConfigDest);
    console.log('✅ web.config copiado');
} catch (error) {
    console.error('❌ Erro ao copiar web.config:', error);
}

// 3. Modificar login.html
console.log('Modificando login.html...');
try {
    const loginPath = path.join(DIST_DIR, 'login.html');
    let content = fs.readFileSync(loginPath, 'utf8');
    
    // Inserir script config.js no head
    if (!content.includes('<script src="config.js"></script>')) {
        content = content.replace(
            '</head>', 
            '    <script src="config.js"></script>\n</head>'
        );
    }
    
    // Corrigir caminhos relativos/absolutos para os recursos
    content = content.replace(/href="\/assets\//g, 'href="assets/');
    content = content.replace(/src="\/assets\//g, 'src="assets/');
    
    // Substituir URL hardcoded
    content = content.replace(
        /const API_BASE_URL = ['"]http:\/\/localhost:4000\/api['"];/g,
        `// URL da API
        let API_BASE_URL = '${PRODUCTION_API_URL}';
        
        // Usar configuração do config.js se disponível
        if (window.API_URL) {
            API_BASE_URL = window.API_URL;
            console.log('URL da API carregada do config.js:', API_BASE_URL);
        }`
    );
    
    fs.writeFileSync(loginPath, content, 'utf8');
    console.log('✅ login.html modificado com sucesso');
} catch (error) {
    console.error('❌ Erro ao modificar login.html:', error);
}

// 4. Modificar schedule-verification.html
console.log('Modificando schedule-verification.html...');
try {
    const verificationPath = path.join(DIST_DIR, 'schedule-verification.html');
    let content = fs.readFileSync(verificationPath, 'utf8');
    
    // Inserir script config.js no head
    if (!content.includes('<script src="config.js"></script>')) {
        content = content.replace(
            '</head>', 
            '    <script src="config.js"></script>\n</head>'
        );
    }
    
    // Corrigir caminhos relativos/absolutos para os recursos
    content = content.replace(/href="\/assets\//g, 'href="assets/');
    content = content.replace(/src="\/assets\//g, 'src="assets/');
    
    // Substituir URL hardcoded
    content = content.replace(
        /const API_BASE_URL = ['"]http:\/\/localhost:4000\/api['"];/g,
        `// URL da API
        let API_BASE_URL = '${PRODUCTION_API_URL}';
        
        // Usar configuração do config.js se disponível
        if (window.API_URL) {
            API_BASE_URL = window.API_URL;
            console.log('URL da API carregada do config.js:', API_BASE_URL);
        }`
    );
    
    fs.writeFileSync(verificationPath, content, 'utf8');
    console.log('✅ schedule-verification.html modificado com sucesso');
} catch (error) {
    console.error('❌ Erro ao modificar schedule-verification.html:', error);
}

// 5. Modificar index.html (se necessário)
console.log('Verificando index.html...');
try {
    const indexPath = path.join(DIST_DIR, 'index.html');
    let content = fs.readFileSync(indexPath, 'utf8');
    
    // Inserir script config.js se não existir
    if (!content.includes('<script src="config.js"></script>')) {
        content = content.replace(
            '</head>', 
            '    <script src="config.js"></script>\n</head>'
        );
        fs.writeFileSync(indexPath, content, 'utf8');
        console.log('✅ index.html modificado com sucesso');
    } else {
        console.log('✓ index.html já está correto');
    }
} catch (error) {
    console.error('❌ Erro ao verificar index.html:', error);
}

console.log('=== Post-Build Concluído ===');
console.log('Pasta dist pronta para deploy!');
console.log(`API configurada para: ${PRODUCTION_API_URL}`);
