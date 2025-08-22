// ===================================================
// SCRIPT PÓS-BUILD - INTEGRA FRONT-END E BACK-END
// ===================================================

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

// Cores para console
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  underscore: '\x1b[4m',
  blink: '\x1b[5m',
  reverse: '\x1b[7m',
  hidden: '\x1b[8m',
  
  black: '\x1b[30m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
  white: '\x1b[37m',
  
  bgBlack: '\x1b[40m',
  bgRed: '\x1b[41m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgBlue: '\x1b[44m',
  bgMagenta: '\x1b[45m',
  bgCyan: '\x1b[46m',
  bgWhite: '\x1b[47m'
};

// Função para imprimir mensagem formatada
function log(message, color = colors.white) {
  console.log(`${color}${message}${colors.reset}`);
}

// Função para criar diretório recursivamente
function mkdirRecursive(dirPath) {
  if (fs.existsSync(dirPath)) return true;
  
  try {
    fs.mkdirSync(dirPath, { recursive: true });
    return true;
  } catch (err) {
    log(`Erro ao criar diretório ${dirPath}: ${err.message}`, colors.red);
    return false;
  }
}

// Função para copiar arquivo
function copyFile(source, target) {
  try {
    fs.copyFileSync(source, target);
    return true;
  } catch (err) {
    log(`Erro ao copiar ${source} para ${target}: ${err.message}`, colors.red);
    return false;
  }
}

// Função para copiar diretório recursivamente
function copyDirRecursive(sourceDir, targetDir) {
  // Criar diretório de destino se não existir
  if (!mkdirRecursive(targetDir)) return false;
  
  try {
    // Ler conteúdo do diretório
    const items = fs.readdirSync(sourceDir);
    
    // Copiar cada item
    for (const item of items) {
      const sourcePath = path.join(sourceDir, item);
      const targetPath = path.join(targetDir, item);
      
      const stats = fs.statSync(sourcePath);
      
      if (stats.isFile()) {
        copyFile(sourcePath, targetPath);
      } else if (stats.isDirectory()) {
        copyDirRecursive(sourcePath, targetPath);
      }
    }
    
    return true;
  } catch (err) {
    log(`Erro ao copiar diretório ${sourceDir}: ${err.message}`, colors.red);
    return false;
  }
}

// Início do script
log('====================================================', colors.cyan);
log('     SCRIPT PÓS-BUILD: FRONT-END + BACK-END', colors.cyan);
log('====================================================', colors.cyan);
log('');

// Verificar se a pasta dist existe
const distDir = path.resolve(__dirname, 'dist');
if (!fs.existsSync(distDir)) {
  log('❌ Pasta dist não encontrada!', colors.red);
  log('Execute npm run build primeiro para gerar os arquivos de produção', colors.yellow);
  process.exit(1);
}

// Verificar se a pasta backend/dist existe, se não criar
const backendDistDir = path.resolve(__dirname, 'backend', 'dist');
if (!fs.existsSync(backendDistDir)) {
  log('📁 Criando pasta backend/dist...', colors.blue);
  if (!mkdirRecursive(backendDistDir)) {
    log('❌ Falha ao criar pasta backend/dist', colors.red);
    process.exit(1);
  }
  log('✅ Pasta backend/dist criada', colors.green);
} else {
  log('🗑️ Limpando pasta backend/dist existente...', colors.blue);
  try {
    fs.rmdirSync(backendDistDir, { recursive: true });
    mkdirRecursive(backendDistDir);
    log('✅ Pasta backend/dist limpa', colors.green);
  } catch (err) {
    log(`❌ Erro ao limpar pasta backend/dist: ${err.message}`, colors.red);
    process.exit(1);
  }
}

// Copiar arquivos de dist para backend/dist
log('📋 Copiando arquivos do front-end para backend/dist...', colors.blue);
if (copyDirRecursive(distDir, backendDistDir)) {
  log('✅ Arquivos copiados com sucesso', colors.green);
} else {
  log('❌ Falha ao copiar alguns arquivos', colors.red);
  process.exit(1);
}

// Copiar web.config para backend/dist
const webConfigSource = path.resolve(__dirname, 'web.config');
const webConfigTarget = path.resolve(backendDistDir, 'web.config');

log('📄 Copiando web.config para backend/dist...', colors.blue);
if (copyFile(webConfigSource, webConfigTarget)) {
  log('✅ web.config copiado com sucesso', colors.green);
} else {
  log('❌ Falha ao copiar web.config', colors.red);
}

// Copiar config.js para backend/dist
const configSource = path.resolve(__dirname, 'config.js');
const configTarget = path.resolve(backendDistDir, 'config.js');

log('📄 Copiando config.js para backend/dist...', colors.blue);
if (copyFile(configSource, configTarget)) {
  log('✅ config.js copiado com sucesso', colors.green);
} else {
  log('❌ Falha ao copiar config.js', colors.red);
}

log('');
log('====================================================', colors.green);
log('     ✅ INTEGRAÇÃO FRONT-END/BACK-END CONCLUÍDA', colors.green);
log('====================================================', colors.green);
log('');
log('📝 INSTRUÇÕES PARA DEPLOY:', colors.yellow);
log('');
log('1. Copie a pasta backend para o servidor IIS', colors.white);
log('2. Instale as dependências Python com:', colors.white);
log('   pip install -r backend/requirements.txt', colors.dim);
log('');
log('3. Configure o IIS para usar a pasta backend como aplicação', colors.white);
log('4. Instale e configure o Application Request Routing (ARR)', colors.white);
log('   - Habilite o proxy reverso nas configurações do ARR', colors.dim);
log('');
log('5. Inicie o backend com:', colors.white);
log('   python backend/run.py', colors.dim);
log('   (ou configure como serviço Windows)', colors.dim);
log('');
log('Todos os arquivos necessários estão na pasta backend', colors.cyan);
log('O front-end será servido pela pasta backend/dist', colors.cyan);
