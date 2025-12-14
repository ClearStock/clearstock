# Migração para Nova Instância do Supabase

Este guia explica como migrar o schema e todos os dados para uma nova instância do Supabase.

## Pré-requisitos

1. Ter acesso à base de dados atual (DATABASE_URL e DIRECT_URL já configuradas)
2. Criar uma nova instância do Supabase
3. Obter as connection strings da nova instância

## Passo 1: Configurar Variáveis de Ambiente

Adicione as seguintes variáveis ao seu arquivo `.env`:

```env
# Base de dados atual (já deve estar configurada)
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...

# Nova base de dados Supabase
NOVA_DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-1-eu-west-2.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
NOVA_DIRECT_URL=postgresql://postgres:[PASSWORD]@db.[PROJECT-REF].supabase.co:5432/postgres
```

**Nota:** Substitua `[PROJECT-REF]` e `[PASSWORD]` pelos valores da sua nova instância do Supabase.

### Como obter as connection strings:

1. Vá ao [Supabase Dashboard](https://supabase.com/dashboard)
2. Selecione o seu novo projeto
3. Vá a **Settings** → **Database**
4. Copie as connection strings:
   - **Connection Pooling** (porta 6543) → `NOVA_DATABASE_URL`
   - **Direct Connection** (porta 5432) → `NOVA_DIRECT_URL`

## Passo 2: Aplicar Schema na Nova Base de Dados

Execute o script para aplicar todas as migrações na nova base de dados:

```bash
npx tsx scripts/setup-new-supabase.ts
```

Este script irá:
- ✅ Aplicar todas as migrações do Prisma
- ✅ Gerar o Prisma Client
- ✅ Preparar a base de dados para receber dados

## Passo 3: Migrar Dados

Execute o script de migração para copiar todos os dados:

```bash
npx tsx scripts/migrate-to-new-supabase.ts
```

Este script irá:
- ✅ Conectar à base de dados atual
- ✅ Exportar todos os dados (Restaurants, Users, Categories, Locations, ProductBatches, etc.)
- ✅ Conectar à nova base de dados
- ✅ Importar todos os dados mantendo os relacionamentos
- ✅ Verificar a integridade dos dados migrados

## Passo 4: Verificar Migração

Após a migração, o script mostrará uma tabela com estatísticas:

```
📊 Estatísticas da migração:

   Tabela                    | Origem | Destino | Status
   --------------------------|--------|---------|--------
   Restaurants               |      X |       X | ✅
   Users                     |      X |       X | ✅
   Categories                |      X |       X | ✅
   ...
```

Verifique se todos os status estão com ✅.

## Passo 5: Atualizar Aplicação (Opcional)

Se quiser usar a nova base de dados na aplicação, atualize as variáveis de ambiente:

```env
# Substituir as antigas pelas novas
DATABASE_URL=${NOVA_DATABASE_URL}
DIRECT_URL=${NOVA_DIRECT_URL}
```

Ou mantenha ambas configuradas e altere quando necessário.

## Troubleshooting

### Erro: "NOVA_DATABASE_URL não está definida"
- Verifique se adicionou as variáveis ao arquivo `.env`
- Certifique-se de que o arquivo `.env` está na raiz do projeto

### Erro: "Permission denied" ou "Connection refused"
- Verifique se as connection strings estão corretas
- Certifique-se de que o Supabase permite conexões do seu IP
- Verifique se a base de dados está online no Supabase Dashboard

### Erro: "Foreign key constraint failed"
- Isso pode acontecer se a ordem de importação estiver incorreta
- O script já lida com isso, mas se persistir, verifique os logs

### Dados não foram copiados completamente
- Verifique os logs do script para ver quais tabelas falharam
- Execute o script novamente (ele usa `upsert`, então é seguro re-executar)

## Notas Importantes

⚠️ **Atenção:**
- O script usa `upsert` para evitar duplicações, mas se a nova base já tiver dados, pode haver conflitos
- Sessões ativas não serão migradas (serão criadas novas quando os utilizadores fizerem login)
- Certifique-se de fazer backup antes de migrar dados importantes

✅ **Segurança:**
- Nunca commite o arquivo `.env` com as credenciais
- Use variáveis de ambiente no Vercel/produção
- Mantenha as credenciais seguras

## Scripts Disponíveis

- `scripts/setup-new-supabase.ts` - Aplica schema na nova base de dados
- `scripts/migrate-to-new-supabase.ts` - Copia todos os dados para a nova base
- `scripts/test-db-connection.ts` - Testa conexão com Supabase

