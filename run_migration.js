const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Configuração do Supabase
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Variáveis de ambiente VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY são obrigatórias');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runMigration() {
  try {
    console.log('🚀 Iniciando migração para adicionar campos de agendamento online...');

    // 1. Adicionar campo online_enabled
    console.log('📝 Adicionando campo online_enabled...');
    const { error: error1 } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'settings' 
                AND column_name = 'online_enabled'
            ) THEN
                ALTER TABLE public.settings 
                ADD COLUMN online_enabled BOOLEAN DEFAULT false;
                
                RAISE NOTICE 'Campo online_enabled adicionado';
            ELSE
                RAISE NOTICE 'Campo online_enabled já existe';
            END IF;
        END $$;
      `
    });

    if (error1) {
      console.error('❌ Erro ao adicionar campo online_enabled:', error1);
    } else {
      console.log('✅ Campo online_enabled adicionado com sucesso');
    }

    // 2. Adicionar campo online_booking
    console.log('📝 Adicionando campo online_booking...');
    const { error: error2 } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'settings' 
                AND column_name = 'online_booking'
            ) THEN
                ALTER TABLE public.settings 
                ADD COLUMN online_booking JSONB DEFAULT jsonb_build_object(
                    'auto_agendar', false,
                    'tempo_minimo_antecedencia', 24,
                    'duracao_padrao', 60
                );
                
                RAISE NOTICE 'Campo online_booking adicionado';
            ELSE
                RAISE NOTICE 'Campo online_booking já existe';
            END IF;
        END $$;
      `
    });

    if (error2) {
      console.error('❌ Erro ao adicionar campo online_booking:', error2);
    } else {
      console.log('✅ Campo online_booking adicionado com sucesso');
    }

    // 3. Adicionar campo working_hours se não existir
    console.log('📝 Verificando campo working_hours...');
    const { error: error3 } = await supabase.rpc('exec_sql', {
      sql: `
        DO $$
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM information_schema.columns 
                WHERE table_schema = 'public' 
                AND table_name = 'settings' 
                AND column_name = 'working_hours'
            ) THEN
                ALTER TABLE public.settings 
                ADD COLUMN working_hours JSONB DEFAULT jsonb_build_object(
                    'monday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
                    'tuesday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
                    'wednesday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
                    'thursday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
                    'friday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
                    'saturday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
                    'sunday', jsonb_build_object('enabled', false, 'start', '08:00', 'end', '18:00')
                );
                
                RAISE NOTICE 'Campo working_hours adicionado';
            ELSE
                RAISE NOTICE 'Campo working_hours já existe';
            END IF;
        END $$;
      `
    });

    if (error3) {
      console.error('❌ Erro ao verificar campo working_hours:', error3);
    } else {
      console.log('✅ Campo working_hours verificado com sucesso');
    }

    // 4. Atualizar configurações existentes
    console.log('📝 Atualizando configurações existentes...');
    const { error: error4 } = await supabase.rpc('exec_sql', {
      sql: `
        UPDATE public.settings 
        SET 
            online_enabled = COALESCE(online_enabled, false),
            online_booking = COALESCE(online_booking, jsonb_build_object(
                'auto_agendar', false,
                'tempo_minimo_antecedencia', 24,
                'duracao_padrao', 60
            )),
            working_hours = COALESCE(working_hours, jsonb_build_object(
                'monday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
                'tuesday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
                'wednesday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
                'thursday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
                'friday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
                'saturday', jsonb_build_object('enabled', true, 'start', '08:00', 'end', '18:00'),
                'sunday', jsonb_build_object('enabled', false, 'start', '08:00', 'end', '18:00')
            ))
        WHERE online_enabled IS NULL 
           OR online_booking IS NULL 
           OR working_hours IS NULL;
      `
    });

    if (error4) {
      console.error('❌ Erro ao atualizar configurações:', error4);
    } else {
      console.log('✅ Configurações atualizadas com sucesso');
    }

    // 5. Verificar se os campos foram adicionados
    console.log('🔍 Verificando se os campos foram adicionados...');
    const { data: columns, error: error5 } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'settings')
      .in('column_name', ['online_enabled', 'online_booking', 'working_hours']);

    if (error5) {
      console.error('❌ Erro ao verificar colunas:', error5);
    } else {
      console.log('✅ Colunas encontradas:', columns?.map(c => c.column_name));
    }

    console.log('🎉 Migração concluída com sucesso!');

  } catch (error) {
    console.error('❌ Erro durante a migração:', error);
    process.exit(1);
  }
}

// Executar a migração
runMigration();
