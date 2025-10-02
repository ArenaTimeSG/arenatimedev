// Limpar agendamentos duplicados
const cleanupDuplicates = async () => {
  console.log('🧹 Limpando agendamentos duplicados...');
  
  try {
    // Buscar agendamentos duplicados
    const response = await fetch('https://xjsovawofsibcolnrgxl.supabase.co/rest/v1/appointments?user_id=eq.e23bca4f-2a4e-4f60-baf8-2cc4b0b4a00f&order=created_at.desc', {
      headers: {
        'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjQ0MDksImV4cCI6MjA3NDM0MDQwOX0.7E4CcCqm7apbXMrFR-jYgyn3ZWtfMDubT2rK_UgFp1U',
        'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjQ0MDksImV4cCI6MjA3NDM0MDQwOX0.7E4CcCqm7apbXMrFR-jYgyn3ZWtfMDubT2rK_UgFp1U'
      }
    });
    
    if (response.ok) {
      const appointments = await response.json();
      console.log('📋 Total de agendamentos:', appointments.length);
      
      // Agrupar por data para encontrar duplicatas
      const appointmentsByDate = {};
      appointments.forEach(apt => {
        const dateKey = apt.date;
        if (!appointmentsByDate[dateKey]) {
          appointmentsByDate[dateKey] = [];
        }
        appointmentsByDate[dateKey].push(apt);
      });
      
      // Identificar e remover duplicatas (manter apenas o mais recente)
      let toDelete = [];
      Object.keys(appointmentsByDate).forEach(date => {
        const aptsForDate = appointmentsByDate[date];
        if (aptsForDate.length > 1) {
          console.log(`⚠️ Encontradas ${aptsForDate.length} duplicatas para ${date}`);
          
          // Ordenar por created_at (mais recente primeiro)
          aptsForDate.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
          
          // Manter o primeiro (mais recente), deletar os outros
          const toKeep = aptsForDate[0];
          const toDeleteForDate = aptsForDate.slice(1);
          
          console.log(`  ✅ Mantendo: ${toKeep.id} (${toKeep.created_at})`);
          toDeleteForDate.forEach(apt => {
            console.log(`  ❌ Deletando: ${apt.id} (${apt.created_at})`);
            toDelete.push(apt.id);
          });
        }
      });
      
      if (toDelete.length > 0) {
        console.log(`🗑️ Deletando ${toDelete.length} agendamentos duplicados...`);
        
        // Deletar em lotes
        for (const id of toDelete) {
          const deleteResponse = await fetch(`https://xjsovawofsibcolnrgxl.supabase.co/rest/v1/appointments?id=eq.${id}`, {
            method: 'DELETE',
            headers: {
              'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjQ0MDksImV4cCI6MjA3NDM0MDQwOX0.7E4CcCqm7apbXMrFR-jYgyn3ZWtfMDubT2rK_UgFp1U',
              'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhqc292YXdvZnNpYmNvbG5yZ3hsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg3NjQ0MDksImV4cCI6MjA3NDM0MDQwOX0.7E4CcCqm7apbXMrFR-jYgyn3ZWtfMDubT2rK_UgFp1U'
            }
          });
          
          if (deleteResponse.ok) {
            console.log(`✅ Deletado: ${id}`);
          } else {
            console.log(`❌ Erro ao deletar: ${id}`);
          }
        }
        
        console.log('✅ Limpeza concluída!');
      } else {
        console.log('✅ Nenhuma duplicata encontrada!');
      }
      
    } else {
      console.log('❌ Erro ao buscar agendamentos:', response.status);
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  }
};

cleanupDuplicates();
