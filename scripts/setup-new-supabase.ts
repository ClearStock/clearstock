/**
 * Script para aplicar o schema (migrações) na nova base de dados Supabase
 * 
 * Este script aplica todas as migrações do Prisma na nova base de dados
 * antes de importar os dados.
 * 
 * Uso:
 * 1. Configure NOVA_DATABASE_URL e NOVA_DIRECT_URL no .env
 * 2. Execute: npx tsx scripts/setup-new-supabase.ts
 */

import { execSync } from "child_process";

async function setupNewDatabase() {
  console.log("🚀 Configurando nova base de dados Supabase...\n");

  // Verificar variáveis de ambiente
  if (!process.env.NOVA_DATABASE_URL) {
    throw new Error("❌ NOVA_DATABASE_URL não está definida! Configure no .env");
  }
  if (!process.env.NOVA_DIRECT_URL) {
    throw new Error("❌ NOVA_DIRECT_URL não está definida! Configure no .env");
  }

  // Salvar variáveis originais
  const originalDatabaseUrl = process.env.DATABASE_URL;
  const originalDirectUrl = process.env.DIRECT_URL;

  try {
    console.log("1️⃣  Configurando variáveis de ambiente temporárias...");
    
    // Configurar variáveis temporárias para a nova base de dados
    process.env.DATABASE_URL = process.env.NOVA_DATABASE_URL;
    process.env.DIRECT_URL = process.env.NOVA_DIRECT_URL;

    console.log("   ✅ Variáveis configuradas\n");

    console.log("2️⃣  Aplicando migrações do Prisma...");
    console.log("   (Isso pode demorar alguns minutos...)\n");

    // Aplicar migrações
    try {
      execSync("npx prisma migrate deploy", {
        stdio: "inherit",
        env: {
          ...process.env,
          DATABASE_URL: process.env.NOVA_DATABASE_URL,
          DIRECT_URL: process.env.NOVA_DIRECT_URL,
        },
      });
      console.log("\n   ✅ Migrações aplicadas com sucesso!\n");
    } catch (error) {
      console.error("\n   ❌ Erro ao aplicar migrações");
      throw error;
    }

    console.log("3️⃣  Gerando Prisma Client...");
    try {
      execSync("npx prisma generate", {
        stdio: "inherit",
        env: {
          ...process.env,
          DATABASE_URL: process.env.NOVA_DATABASE_URL,
          DIRECT_URL: process.env.NOVA_DIRECT_URL,
        },
      });
      console.log("   ✅ Prisma Client gerado com sucesso!\n");
    } catch (error) {
      console.error("   ❌ Erro ao gerar Prisma Client");
      throw error;
    }

    console.log("✅ Nova base de dados configurada e pronta para receber dados!\n");
    console.log("📝 Próximo passo: Execute o script de migração de dados:");
    console.log("   npx tsx scripts/migrate-to-new-supabase.ts\n");

  } catch (error) {
    console.error("\n❌ ERRO durante a configuração:");
    console.error(error);
    throw error;
  } finally {
    // Restaurar variáveis originais
    if (originalDatabaseUrl) {
      process.env.DATABASE_URL = originalDatabaseUrl;
    }
    if (originalDirectUrl) {
      process.env.DIRECT_URL = originalDirectUrl;
    }
  }
}

// Executar configuração
setupNewDatabase()
  .then(() => {
    console.log("✅ Script concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });

