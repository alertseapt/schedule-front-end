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
const PRODUCTION_API_URL = '/api'; // Usar proxy reverso em produção

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

// 2.5. Copiar api-standalone.js para dist
console.log('Copiando api-standalone.js...');
try {
    const apiSrc = path.join(__dirname, 'api-standalone.js');
    const apiDest = path.join(DIST_DIR, 'api-standalone.js');
    fs.copyFileSync(apiSrc, apiDest);
    console.log('✅ api-standalone.js copiado');
} catch (error) {
    console.error('❌ Erro ao copiar api-standalone.js:', error);
}

// 2.6. Copiar diagnostic.js para dist (temporário para debug)
console.log('Copiando diagnostic.js...');
try {
    const diagnosticSrc = path.join(__dirname, 'diagnostic.js');
    const diagnosticDest = path.join(DIST_DIR, 'diagnostic.js');
    fs.copyFileSync(diagnosticSrc, diagnosticDest);
    console.log('✅ diagnostic.js copiado');
} catch (error) {
    console.error('❌ Erro ao copiar diagnostic.js:', error);
}

// 2.7. Copiar login.css para dist (standalone)
console.log('Copiando login.css...');
try {
    const loginCssSrc = path.join(__dirname, 'src/assets/css/login.css');
    const loginCssDest = path.join(DIST_DIR, 'assets/login.css');
    fs.copyFileSync(loginCssSrc, loginCssDest);
    console.log('✅ login.css copiado');
} catch (error) {
    console.error('❌ Erro ao copiar login.css:', error);
}

// 3. Copiar e modificar login.html (se existir)
console.log('Copiando e modificando login.html...');
try {
    const loginSrc = path.join(__dirname, 'login.html');
    const loginDest = path.join(DIST_DIR, 'login.html');
    
    // Verificar se o arquivo fonte existe
    if (!fs.existsSync(loginSrc)) {
        console.log('⚠️ login.html não encontrado no projeto - pulando');
        return; // Sair do bloco try sem erro
    }
    
    // Copiar arquivo para dist
    fs.copyFileSync(loginSrc, loginDest);
    
    // Modificar o arquivo copiado
    let content = fs.readFileSync(loginDest, 'utf8');
    
    // Inserir script config.js no head
    if (!content.includes('<script src="config.js"></script>')) {
        content = content.replace(
            '</head>', 
            '    <script src="config.js"></script>\n</head>'
        );
    }
    
    // Inserir script api-standalone.js no head
    if (!content.includes('<script src="api-standalone.js"></script>')) {
        content = content.replace(
            '</head>', 
            '    <script src="api-standalone.js"></script>\n</head>'
        );
    }
    
    // Corrigir caminhos dos assets - substituir caminhos de desenvolvimento pelos de produção
    // Primeiro, encontrar os nomes dos arquivos gerados pelo build
    const distAssetsDir = path.join(DIST_DIR, 'assets');
    let logoFile = '';
    let cssFile = '';
    
    if (fs.existsSync(distAssetsDir)) {
        const assets = fs.readdirSync(distAssetsDir);
        logoFile = assets.find(file => file.startsWith('logo-') && file.endsWith('.png')) || 'logo.png';
        cssFile = assets.find(file => file.startsWith('main-') && file.endsWith('.css')) || 'main.css';
    }
    
    console.log(`Encontrados assets para login.html: logo=${logoFile}, css=${cssFile}`);
    
    // Substituir caminhos de desenvolvimento pelos caminhos de produção
    content = content.replace(/href="\/src\/assets\/images\/logo\.png"/g, `href="/assets/${logoFile}"`);
    content = content.replace(/src="\/src\/assets\/images\/logo\.png"/g, `src="/assets/${logoFile}"`);
    content = content.replace(/href="\/src\/assets\/css\/login\.css"/g, `href="/assets/login.css"`);    // Usar CSS específico do login
    
    // Corrigir caminhos relativos/absolutos para os recursos (fallback)
    content = content.replace(/href="\/assets\//g, 'href="/assets/');
    content = content.replace(/src="\/assets\//g, 'src="/assets/');
    
    // CORREÇÃO: Substituir importação do módulo ES6 por versão compatível com produção
    content = content.replace(
        /import \{ BASE_URL \} from ['"]\/src\/config\/api\.js['"];/g,
        '// Importação substituída para produção - usar config.js carregado'
    );
    
    // CORREÇÃO: Substituir uso do BASE_URL importado por window.API_BASE_URL
    content = content.replace(
        /const API_BASE_URL = BASE_URL \|\| ['"]http:\/\/localhost:4001\/api['"];/g,
        `// URL da API carregada pelo api-standalone.js
        const API_BASE_URL = window.API_BASE_URL || '${PRODUCTION_API_URL}';`
    );
    
    // CORREÇÃO: Substituir outras declarações de API_BASE_URL
    content = content.replace(
        /\/\/ Configuração da API - usar porta de homologação para desenvolvimento[\s\S]*?console\.log\('API Base URL configurada para:', API_BASE_URL\);/g,
        `// Configuração da API carregada pelo api-standalone.js
        const API_BASE_URL = window.API_BASE_URL || '${PRODUCTION_API_URL}';
        console.log('API Base URL configurada para:', API_BASE_URL);`
    );
    
    // Substituir URL hardcoded (fallback para outras versões)
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
    
    fs.writeFileSync(loginDest, content, 'utf8');
    console.log('✅ login.html copiado e modificado com sucesso');
} catch (error) {
    console.error('❌ Erro ao processar login.html:', error);
}

// 4. Copiar e modificar schedule-verification.html (se existir)
console.log('Copiando e modificando schedule-verification.html...');
try {
    const verificationSrc = path.join(__dirname, 'schedule-verification.html');
    const verificationDest = path.join(DIST_DIR, 'schedule-verification.html');
    
    // Verificar se o arquivo fonte existe
    if (!fs.existsSync(verificationSrc)) {
        console.log('⚠️ schedule-verification.html não encontrado no projeto - pulando');
        return; // Sair do bloco try sem erro
    }
    
    // Copiar arquivo para dist
    fs.copyFileSync(verificationSrc, verificationDest);
    
    // Modificar o arquivo copiado
    let content = fs.readFileSync(verificationDest, 'utf8');
    
    // Inserir script config.js no head
    if (!content.includes('<script src="config.js"></script>')) {
        content = content.replace(
            '</head>', 
            '    <script src="config.js"></script>\n</head>'
        );
    }
    
    // Inserir script api-standalone.js no head
    if (!content.includes('<script src="api-standalone.js"></script>')) {
        content = content.replace(
            '</head>', 
            '    <script src="api-standalone.js"></script>\n</head>'
        );
    }
    
    // Corrigir caminhos dos assets - reutilizar os arquivos já encontrados
    if (fs.existsSync(path.join(DIST_DIR, 'assets'))) {
        const assets = fs.readdirSync(path.join(DIST_DIR, 'assets'));
        const logoFile = assets.find(file => file.startsWith('logo-') && file.endsWith('.png')) || 'logo.png';
        const cssFile = assets.find(file => file.startsWith('main-') && file.endsWith('.css')) || 'main.css';
        
        console.log(`Encontrados assets para schedule-verification.html: logo=${logoFile}, css=${cssFile}`);
        
        // Substituir caminhos de desenvolvimento pelos caminhos de produção
        content = content.replace(/href="\/src\/assets\/images\/logo\.png"/g, `href="/assets/${logoFile}"`);
        content = content.replace(/src="\/src\/assets\/images\/logo\.png"/g, `src="/assets/${logoFile}"`);
        content = content.replace(/href="\/src\/assets\/css\/login\.css"/g, `href="/assets/login.css"`);    // Usar CSS específico do login
    }
    
    // Corrigir caminhos relativos/absolutos para os recursos (fallback)
    content = content.replace(/href="\/assets\//g, 'href="/assets/');
    content = content.replace(/src="\/assets\//g, 'src="/assets/');
    
    // CORREÇÃO: Substituir importação do módulo ES6 por versão compatível com produção
    content = content.replace(
        /import \{ BASE_URL \} from ['"]\/src\/config\/api\.js['"];/g,
        '// Importação substituída para produção - usar config.js carregado'
    );
    
    // CORREÇÃO: Substituir uso do BASE_URL importado por window.API_BASE_URL
    content = content.replace(
        /const API_BASE_URL = BASE_URL \|\| ['"]http:\/\/localhost:4001\/api['"];/g,
        `// URL da API carregada pelo api-standalone.js
        const API_BASE_URL = window.API_BASE_URL || '${PRODUCTION_API_URL}';`
    );
    
    // CORREÇÃO: Substituir outras declarações de API_BASE_URL
    content = content.replace(
        /\/\/ Configuração da API - usar porta de homologação para desenvolvimento[\s\S]*?console\.log\('API Base URL configurada para:', API_BASE_URL\);/g,
        `// Configuração da API carregada pelo api-standalone.js
        const API_BASE_URL = window.API_BASE_URL || '${PRODUCTION_API_URL}';
        console.log('API Base URL configurada para:', API_BASE_URL);`
    );
    
    // Substituir URL hardcoded (fallback para outras versões)
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
    
    fs.writeFileSync(verificationDest, content, 'utf8');
    console.log('✅ schedule-verification.html copiado e modificado com sucesso');
} catch (error) {
    console.error('❌ Erro ao processar schedule-verification.html:', error);
}

// 5. Modificar index.html (se necessário)
console.log('Verificando index.html...');
try {
    const indexPath = path.join(DIST_DIR, 'index.html');
    let content = fs.readFileSync(indexPath, 'utf8');
    let modified = false;
    
    // Inserir script config.js se não existir
    if (!content.includes('<script src="config.js"></script>')) {
        content = content.replace(
            '</head>', 
            '    <script src="config.js"></script>\n</head>'
        );
        modified = true;
        console.log('✅ config.js adicionado ao index.html');
    } else {
        console.log('✓ config.js já está no index.html');
    }
    
    // Inserir script api-standalone.js se não existir
    if (!content.includes('<script src="api-standalone.js"></script>')) {
        content = content.replace(
            '</head>', 
            '    <script src="api-standalone.js"></script>\n</head>'
        );
        modified = true;
        console.log('✅ api-standalone.js adicionado ao index.html');
    } else {
        console.log('✓ api-standalone.js já está no index.html');
    }
    
    // Inserir script diagnostic.js se não existir (temporário para debug)
    if (!content.includes('<script src="diagnostic.js"></script>')) {
        content = content.replace(
            '</head>', 
            '    <script src="diagnostic.js"></script>\n</head>'
        );
        modified = true;
        console.log('✅ diagnostic.js adicionado ao index.html');
    } else {
        console.log('✓ diagnostic.js já está no index.html');
    }
    
    if (modified) {
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
