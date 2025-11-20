# Configuração da Base de Dados no Vercel

## Problema: Erro de Conexão à Base de Dados

Se estás a receber o erro:
```
Can't reach database server at `aws-1-eu-west-2.pooler.supabase.com:5432`
```

## Verificações Necessárias:

### 1. Verificar Variáveis de Ambiente no Vercel

1. Vai ao [Vercel Dashboard](https://vercel.com/dashboard)
2. Seleciona o projeto `speakwise4`
3. Vai a **Settings** → **Environment Variables**
4. Verifica que existem **exatamente** estas variáveis:

   ```
   DATABASE_URL=postgresql://postgres:[PASSWORD]@aws-1-eu-west-2.pooler.supabase.com:5432/postgres?pgbouncer=true
   DIRECT_URL=postgresql://postgres:[PASSWORD]@aws-1-eu-west-2.pooler.supabase.com:5432/postgres
   ```

### 2. Obter a Connection String Correta da Supabase

1. Vai ao [Supabase Dashboard](https://supabase.com/dashboard)
2. Seleciona o projeto `speakwise5`
3. Vai a **Settings** → **Database**
4. Na secção **Connection string**, escolhe **"Session pooler"** (NÃO "Direct connection")
5. Copia a connection string completa
6. Deve ser algo como:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true
   ```

### 3. Configuração Correta das URLs

**Para DATABASE_URL:**
- Deve usar a porta **6543** (pooler) OU **5432** com `?pgbouncer=true`
- Formato: `postgresql://postgres:[PASSWORD]@[HOST]:[PORT]/postgres?pgbouncer=true&connection_limit=1`

**Para DIRECT_URL:**
- Deve usar a porta **5432** (direct connection)
- Formato: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

### 4. Problemas Comuns

1. **Password com caracteres especiais**: Se a password contém `@`, `:`, `/`, `%`, etc., deve ser URL-encoded
   - `@` → `%40`
   - `:` → `%3A`
   - `/` → `%2F`
   - `%` → `%25`

2. **Espaços extras**: Remove qualquer espaço antes ou depois da connection string

3. **Aspas**: NÃO incluir aspas na connection string no Vercel

### 5. Após Atualizar as Variáveis

1. Vai a **Settings** → **Environment Variables** no Vercel
2. **Remove** as variáveis antigas
3. **Adiciona** as novas variáveis com os valores corretos
4. Vai a **Deployments** → Seleciona o deployment mais recente → **Redeploy** (ou faz um novo push para o GitHub)

### 6. Verificar se Funciona

Após o redeploy, verifica os logs:
1. Vai a **Deployments** no Vercel
2. Clica no deployment mais recente
3. Vai à aba **Functions** ou **Logs**
4. Verifica se há erros de conexão

## Teste Local

Para testar localmente, cria um ficheiro `.env` na raiz do projeto:

```env
DATABASE_URL="postgresql://postgres:[PASSWORD]@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgresql://postgres:[PASSWORD]@aws-1-eu-west-2.pooler.supabase.com:5432/postgres"
```

Depois executa:
```bash
npm run dev
```

Se funcionar localmente mas não no Vercel, o problema são as variáveis de ambiente no Vercel.

