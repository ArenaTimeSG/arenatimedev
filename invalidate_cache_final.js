// Script para invalidar cache e forçar reload da página
// Execute este código no Console do DevTools (F12)

console.log('🔄 Invalidando cache e forçando reload...');

// 1. Limpar localStorage
localStorage.clear();
console.log('✅ localStorage limpo');

// 2. Limpar sessionStorage
sessionStorage.clear();
console.log('✅ sessionStorage limpo');

// 3. Tentar invalidar React Query cache (se disponível)
if (window.queryClient) {
  try {
    window.queryClient.invalidateQueries({ queryKey: ['userProfile'] });
    window.queryClient.invalidateQueries({ queryKey: ['settings'] });
    window.queryClient.invalidateQueries({ queryKey: ['adminByUsername'] });
    console.log('✅ React Query cache invalidado');
  } catch (error) {
    console.log('⚠️ React Query não disponível:', error);
  }
}

// 4. Forçar reload da página
console.log('🔄 Recarregando página...');
window.location.reload(true);
