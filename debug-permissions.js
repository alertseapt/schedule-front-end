// Script de debug para testar permissões

// Simular usuários para teste
const users = {
  developer: { id: 1, level_access: 0, name: "Dev User", user: "dev@test.com" },
  admin: { id: 2, level_access: 2, name: "Admin User", user: "admin@test.com" },
  manager: { id: 3, level_access: 3, name: "Manager User", user: "manager@test.com" },
  client: { id: 4, level_access: 1, name: "Client User", user: "client@test.com" },
  conferente: { id: 5, level_access: 9, name: "Conf User", user: "conf@test.com" }
};

// Função para testar canChangeLevel
function canChangeLevel(currentUser, targetUser) {
  // Desenvolvedores (0) podem alterar qualquer um, incluindo outros desenvolvedores
  if (currentUser?.level_access === 0) return true;
  
  // Gerentes (3) podem alterar usuários de nível inferior
  if (currentUser?.level_access === 3) {
    return targetUser.level_access > 3; // Só conferentes (9) e clientes (1)
  }
  
  // Administradores (2) podem alterar clientes (1) e conferentes (9)
  if (currentUser?.level_access === 2) {
    return targetUser.level_access === 1 || targetUser.level_access === 9;
  }
  
  return false;
}

// Função para testar canDelete
function canDelete(currentUser, targetUser) {
  // Não pode excluir próprio usuário
  if (targetUser.id === currentUser?.id) return false;
  
  // Desenvolvedores podem excluir qualquer um, incluindo outros desenvolvedores (exceto próprio)
  if (currentUser?.level_access === 0) return true;
  
  // Para outros níveis, não pode excluir desenvolvedores
  if (targetUser.level_access === 0) return false;
  
  // Gerentes podem excluir usuários de nível inferior
  if (currentUser?.level_access === 3) {
    return targetUser.level_access > 3;
  }
  
  return false;
}

console.log("=== TESTE DE PERMISSÕES ===\n");

// Testar desenvolvedor vs todos os usuários
console.log("👨‍💻 DESENVOLVEDOR testando permissões:");
Object.entries(users).forEach(([key, user]) => {
  const canChange = canChangeLevel(users.developer, user);
  const canDel = canDelete(users.developer, user);
  console.log(`  ${key}: canChangeLevel=${canChange}, canDelete=${canDel}`);
});

console.log("\n👔 GERENTE testando permissões:");
Object.entries(users).forEach(([key, user]) => {
  const canChange = canChangeLevel(users.manager, user);
  const canDel = canDelete(users.manager, user);
  console.log(`  ${key}: canChangeLevel=${canChange}, canDelete=${canDel}`);
});

console.log("\n👨‍💼 ADMIN testando permissões:");
Object.entries(users).forEach(([key, user]) => {
  const canChange = canChangeLevel(users.admin, user);
  const canDel = canDelete(users.admin, user);
  console.log(`  ${key}: canChangeLevel=${canChange}, canDelete=${canDel}`);
});