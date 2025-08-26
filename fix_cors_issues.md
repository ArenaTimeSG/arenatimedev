# 🔧 CORREÇÃO DE PROBLEMAS DE CORS - SUPABASE

## ❌ Problema: "Failed to fetch (api.supabase.com)"

### 🔍 Possíveis Causas:

1. **Configuração de CORS no Supabase**
2. **Problemas de rede/firewall**
3. **Configuração incorreta do cliente**
4. **Problemas de certificado SSL**

### ✅ Soluções:

#### 1. **Verificar Configuração de CORS no Supabase**

Acesse o painel do Supabase:
1. Vá para **Settings** > **API**
2. Em **CORS (Cross-Origin Resource Sharing)**
3. Adicione os domínios permitidos:
   ```
   http://localhost:8080
   http://127.0.0.1:8080
   http://localhost:3000
   http://127.0.0.1:3000
   ```

#### 2. **Verificar Configuração do Cliente**

O arquivo `src/integrations/supabase/client.ts` deve estar correto:
```typescript
const SUPABASE_URL = "https://xtufbfvrgpzqbvdfmtiy.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...";
```

#### 3. **Testar Conectividade**

Execute o script `test_supabase_connection.js` no console do browser:
```javascript
// Cole o conteúdo do arquivo test_supabase_connection.js no console
```

#### 4. **Verificar Configuração do Vite**

O arquivo `vite.config.ts` deve ter:
```typescript
server: {
  cors: true,
  proxy: {
    '/supabase': {
      target: 'https://xtufbfvrgpzqbvdfmtiy.supabase.co',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/supabase/, ''),
      secure: true,
    }
  }
}
```

#### 5. **Reiniciar o Servidor**

```bash
# Parar o servidor (Ctrl+C)
# Reiniciar
npm run dev
```

#### 6. **Verificar Console do Browser**

1. Abra o DevTools (F12)
2. Vá para a aba **Console**
3. Procure por erros de CORS ou rede
4. Execute o teste de conectividade

### 🚀 **Próximos Passos:**

1. **Execute o script de teste** no console do browser
2. **Verifique as configurações de CORS** no Supabase
3. **Reinicie o servidor** se necessário
4. **Teste o agendamento online** novamente

### 📞 **Se o problema persistir:**

1. Verifique se o Supabase está online
2. Teste com um navegador diferente
3. Desative temporariamente o firewall/antivírus
4. Verifique se há problemas de rede corporativa
