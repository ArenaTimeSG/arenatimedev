// Script para invalidar cache do React Query e forçar reload do perfil
// Execute este script no Console do DevTools (F12)

// 1. Invalidar cache do userProfile
if (window.queryClient) {
  window.queryClient.invalidateQueries({ queryKey: ['userProfile'] });
  console.log('✅ Cache do userProfile invalidado');
} else {
  console.log('❌ queryClient não encontrado no window');
}

// 2. Forçar reload da página
console.log('🔄 Recarregando página para aplicar mudanças...');
window.location.reload();

// 3. Alternativa: Invalidar todos os caches relacionados
// Descomente as linhas abaixo se necessário:
/*
if (window.queryClient) {
  window.queryClient.invalidateQueries({ queryKey: ['userProfile'] });
  window.queryClient.invalidateQueries({ queryKey: ['settings'] });
  window.queryClient.invalidateQueries({ queryKey: ['adminByUsername'] });
  console.log('✅ Todos os caches invalidados');
}
*/
