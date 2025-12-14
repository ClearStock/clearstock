/**
 * Script de migração para copiar schema e dados para uma nova instância do Supabase
 * 
 * Este script:
 * 1. Conecta à base de dados atual (DATABASE_URL)
 * 2. Exporta todos os dados de todas as tabelas
 * 3. Conecta à nova base de dados (NOVA_DATABASE_URL)
 * 4. Aplica o schema (migrações)
 * 5. Importa todos os dados mantendo os relacionamentos
 * 
 * Uso:
 * 1. Configure NOVA_DATABASE_URL e NOVA_DIRECT_URL no .env
 * 2. Execute: npx tsx scripts/migrate-to-new-supabase.ts
 */

import { PrismaClient } from "@prisma/client";

// Cliente para a base de dados atual
const sourceDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
  log: ["error", "warn"],
});

// Cliente para a nova base de dados
const targetDb = new PrismaClient({
  datasources: {
    db: {
      url: process.env.NOVA_DATABASE_URL,
    },
  },
  log: ["error", "warn"],
});

interface MigrationStats {
  restaurants: number;
  users: number;
  categories: number;
  locations: number;
  productTemplates: number;
  productBatches: number;
  supportMessages: number;
  stockEvents: number;
  sessions: number;
}

async function migrateData() {
  console.log("🚀 Iniciando migração para nova base de dados Supabase...\n");

  // Verificar variáveis de ambiente
  if (!process.env.DATABASE_URL) {
    throw new Error("❌ DATABASE_URL não está definida!");
  }
  if (!process.env.NOVA_DATABASE_URL) {
    throw new Error("❌ NOVA_DATABASE_URL não está definida! Configure no .env");
  }

  const stats: MigrationStats = {
    restaurants: 0,
    users: 0,
    categories: 0,
    locations: 0,
    productTemplates: 0,
    productBatches: 0,
    supportMessages: 0,
    stockEvents: 0,
    sessions: 0,
  };

  try {
    // 1. Conectar às bases de dados
    console.log("1️⃣  Conectando às bases de dados...");
    await sourceDb.$connect();
    console.log("   ✅ Conectado à base de dados atual");
    
    await targetDb.$connect();
    console.log("   ✅ Conectado à nova base de dados\n");

    // 2. Verificar se a nova base está vazia
    console.log("2️⃣  Verificando estado da nova base de dados...");
    const existingRestaurants = await targetDb.restaurant.count();
    if (existingRestaurants > 0) {
      console.log(`   ⚠️  ATENÇÃO: A nova base de dados já contém ${existingRestaurants} restaurante(s)!`);
      console.log("   ⚠️  A migração irá adicionar dados, mas pode causar conflitos.\n");
    } else {
      console.log("   ✅ Nova base de dados está vazia\n");
    }

    // 3. Exportar dados da base atual (ordem: respeitando foreign keys)
    console.log("3️⃣  Exportando dados da base de dados atual...\n");

    // 3.1. Restaurants (sem dependências)
    console.log("   📦 Exportando Restaurants...");
    const restaurants = await sourceDb.restaurant.findMany({
      orderBy: { createdAt: "asc" },
    });
    stats.restaurants = restaurants.length;
    console.log(`   ✅ ${restaurants.length} restaurante(s) exportado(s)`);

    // 3.2. Users (depende de Restaurant)
    console.log("   📦 Exportando Users...");
    const users = await sourceDb.user.findMany({
      orderBy: { createdAt: "asc" },
    });
    stats.users = users.length;
    console.log(`   ✅ ${users.length} utilizador(es) exportado(s)`);

    // 3.3. Categories (depende de Restaurant)
    console.log("   📦 Exportando Categories...");
    const categories = await sourceDb.category.findMany({
      orderBy: { createdAt: "asc" },
    });
    stats.categories = categories.length;
    console.log(`   ✅ ${categories.length} categoria(s) exportada(s)`);

    // 3.4. Locations (depende de Restaurant)
    console.log("   📦 Exportando Locations...");
    const locations = await sourceDb.location.findMany({
      orderBy: { createdAt: "asc" },
    });
    stats.locations = locations.length;
    console.log(`   ✅ ${locations.length} localização(ões) exportada(s)`);

    // 3.5. ProductTemplates (depende de Restaurant)
    console.log("   📦 Exportando ProductTemplates...");
    const productTemplates = await sourceDb.productTemplate.findMany({
      orderBy: { createdAt: "asc" },
    });
    stats.productTemplates = productTemplates.length;
    console.log(`   ✅ ${productTemplates.length} template(s) de produto exportado(s)`);

    // 3.6. ProductBatches (depende de Restaurant, Category, Location, User)
    console.log("   📦 Exportando ProductBatches...");
    const productBatches = await sourceDb.productBatch.findMany({
      orderBy: { createdAt: "asc" },
    });
    stats.productBatches = productBatches.length;
    console.log(`   ✅ ${productBatches.length} lote(s) de produto exportado(s)`);

    // 3.7. SupportMessages (depende de Restaurant)
    console.log("   📦 Exportando SupportMessages...");
    const supportMessages = await sourceDb.supportMessage.findMany({
      orderBy: { createdAt: "asc" },
    });
    stats.supportMessages = supportMessages.length;
    console.log(`   ✅ ${supportMessages.length} mensagem(ns) de suporte exportada(s)`);

    // 3.8. StockEvents (depende de Restaurant)
    console.log("   📦 Exportando StockEvents...");
    const stockEvents = await sourceDb.stockEvent.findMany({
      orderBy: { createdAt: "asc" },
    });
    stats.stockEvents = stockEvents.length;
    console.log(`   ✅ ${stockEvents.length} evento(s) de stock exportado(s)`);

    // 3.9. Sessions (depende de Restaurant)
    console.log("   📦 Exportando Sessions...");
    const sessions = await sourceDb.session.findMany({
      orderBy: { createdAt: "asc" },
    });
    stats.sessions = sessions.length;
    console.log(`   ✅ ${sessions.length} sessão(ões) exportada(s)\n`);

    // 4. Importar dados para a nova base (mesma ordem)
    console.log("4️⃣  Importando dados para a nova base de dados...\n");

    // 4.1. Restaurants
    if (restaurants.length > 0) {
      console.log("   📥 Importando Restaurants...");
      for (const restaurant of restaurants) {
        try {
          await targetDb.restaurant.upsert({
            where: { id: restaurant.id },
            update: {
              pin: restaurant.pin,
              name: restaurant.name,
              alertDaysBeforeExpiry: restaurant.alertDaysBeforeExpiry,
              alertDaysBeforeExpiryMP: restaurant.alertDaysBeforeExpiryMP,
              alertDaysBeforeExpiryTransformado: restaurant.alertDaysBeforeExpiryTransformado,
              createdAt: restaurant.createdAt,
              updatedAt: restaurant.updatedAt,
            },
            create: {
              id: restaurant.id,
              pin: restaurant.pin,
              name: restaurant.name,
              alertDaysBeforeExpiry: restaurant.alertDaysBeforeExpiry,
              alertDaysBeforeExpiryMP: restaurant.alertDaysBeforeExpiryMP,
              alertDaysBeforeExpiryTransformado: restaurant.alertDaysBeforeExpiryTransformado,
              createdAt: restaurant.createdAt,
              updatedAt: restaurant.updatedAt,
            },
          });
        } catch (error) {
          console.error(`   ⚠️  Erro ao importar restaurante ${restaurant.id}:`, error);
        }
      }
      console.log(`   ✅ ${restaurants.length} restaurante(s) importado(s)`);
    }

    // 4.2. Users
    if (users.length > 0) {
      console.log("   📥 Importando Users...");
      for (const user of users) {
        try {
          await targetDb.user.upsert({
            where: { id: user.id },
            update: {
              name: user.name,
              email: user.email,
              restaurantId: user.restaurantId,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
            create: {
              id: user.id,
              name: user.name,
              email: user.email,
              restaurantId: user.restaurantId,
              createdAt: user.createdAt,
              updatedAt: user.updatedAt,
            },
          });
        } catch (error) {
          console.error(`   ⚠️  Erro ao importar utilizador ${user.id}:`, error);
        }
      }
      console.log(`   ✅ ${users.length} utilizador(es) importado(s)`);
    }

    // 4.3. Categories
    if (categories.length > 0) {
      console.log("   📥 Importando Categories...");
      for (const category of categories) {
        try {
          await targetDb.category.upsert({
            where: { id: category.id },
            update: {
              name: category.name,
              tipo: category.tipo,
              alertDaysBeforeExpiry: category.alertDaysBeforeExpiry,
              warningDaysBeforeExpiry: category.warningDaysBeforeExpiry,
              restaurantId: category.restaurantId,
              createdAt: category.createdAt,
              updatedAt: category.updatedAt,
            },
            create: {
              id: category.id,
              name: category.name,
              tipo: category.tipo,
              alertDaysBeforeExpiry: category.alertDaysBeforeExpiry,
              warningDaysBeforeExpiry: category.warningDaysBeforeExpiry,
              restaurantId: category.restaurantId,
              createdAt: category.createdAt,
              updatedAt: category.updatedAt,
            },
          });
        } catch (error) {
          console.error(`   ⚠️  Erro ao importar categoria ${category.id}:`, error);
        }
      }
      console.log(`   ✅ ${categories.length} categoria(s) importada(s)`);
    }

    // 4.4. Locations
    if (locations.length > 0) {
      console.log("   📥 Importando Locations...");
      for (const location of locations) {
        try {
          await targetDb.location.upsert({
            where: { id: location.id },
            update: {
              name: location.name,
              restaurantId: location.restaurantId,
              createdAt: location.createdAt,
              updatedAt: location.updatedAt,
            },
            create: {
              id: location.id,
              name: location.name,
              restaurantId: location.restaurantId,
              createdAt: location.createdAt,
              updatedAt: location.updatedAt,
            },
          });
        } catch (error) {
          console.error(`   ⚠️  Erro ao importar localização ${location.id}:`, error);
        }
      }
      console.log(`   ✅ ${locations.length} localização(ões) importada(s)`);
    }

    // 4.5. ProductTemplates
    if (productTemplates.length > 0) {
      console.log("   📥 Importando ProductTemplates...");
      for (const template of productTemplates) {
        try {
          await targetDb.productTemplate.upsert({
            where: { id: template.id },
            update: {
              name: template.name,
              restaurantId: template.restaurantId,
              createdAt: template.createdAt,
              updatedAt: template.updatedAt,
            },
            create: {
              id: template.id,
              name: template.name,
              restaurantId: template.restaurantId,
              createdAt: template.createdAt,
              updatedAt: template.updatedAt,
            },
          });
        } catch (error) {
          console.error(`   ⚠️  Erro ao importar template ${template.id}:`, error);
        }
      }
      console.log(`   ✅ ${productTemplates.length} template(s) importado(s)`);
    }

    // 4.6. ProductBatches
    if (productBatches.length > 0) {
      console.log("   📥 Importando ProductBatches...");
      for (const batch of productBatches) {
        try {
          await targetDb.productBatch.upsert({
            where: { id: batch.id },
            update: {
              name: batch.name,
              quantity: batch.quantity,
              unit: batch.unit,
              expiryDate: batch.expiryDate,
              imageUrl: batch.imageUrl,
              tipo: batch.tipo,
              packagingType: batch.packagingType,
              size: batch.size,
              sizeUnit: batch.sizeUnit,
              status: batch.status,
              restaurantId: batch.restaurantId,
              categoryId: batch.categoryId,
              locationId: batch.locationId,
              userId: batch.userId,
              createdAt: batch.createdAt,
              updatedAt: batch.updatedAt,
            },
            create: {
              id: batch.id,
              name: batch.name,
              quantity: batch.quantity,
              unit: batch.unit,
              expiryDate: batch.expiryDate,
              imageUrl: batch.imageUrl,
              tipo: batch.tipo,
              packagingType: batch.packagingType,
              size: batch.size,
              sizeUnit: batch.sizeUnit,
              status: batch.status,
              restaurantId: batch.restaurantId,
              categoryId: batch.categoryId,
              locationId: batch.locationId,
              userId: batch.userId,
              createdAt: batch.createdAt,
              updatedAt: batch.updatedAt,
            },
          });
        } catch (error) {
          console.error(`   ⚠️  Erro ao importar lote ${batch.id}:`, error);
        }
      }
      console.log(`   ✅ ${productBatches.length} lote(s) importado(s)`);
    }

    // 4.7. SupportMessages
    if (supportMessages.length > 0) {
      console.log("   📥 Importando SupportMessages...");
      for (const message of supportMessages) {
        try {
          await targetDb.supportMessage.create({
            data: {
              id: message.id,
              restaurantId: message.restaurantId,
              restaurantName: message.restaurantName,
              type: message.type,
              message: message.message,
              contact: message.contact,
              createdAt: message.createdAt,
            },
          });
        } catch (error) {
          console.error(`   ⚠️  Erro ao importar mensagem ${message.id}:`, error);
        }
      }
      console.log(`   ✅ ${supportMessages.length} mensagem(ns) importada(s)`);
    }

    // 4.8. StockEvents
    if (stockEvents.length > 0) {
      console.log("   📥 Importando StockEvents...");
      for (const event of stockEvents) {
        try {
          await targetDb.stockEvent.create({
            data: {
              id: event.id,
              restaurantId: event.restaurantId,
              type: event.type,
              productName: event.productName,
              quantity: event.quantity,
              unit: event.unit,
              batchId: event.batchId,
              createdAt: event.createdAt,
            },
          });
        } catch (error) {
          console.error(`   ⚠️  Erro ao importar evento ${event.id}:`, error);
        }
      }
      console.log(`   ✅ ${stockEvents.length} evento(s) importado(s)`);
    }

    // 4.9. Sessions
    if (sessions.length > 0) {
      console.log("   📥 Importando Sessions...");
      for (const session of sessions) {
        try {
          await targetDb.session.upsert({
            where: { id: session.id },
            update: {
              token: session.token,
              restaurantId: session.restaurantId,
              expiresAt: session.expiresAt,
              createdAt: session.createdAt,
              lastUsedAt: session.lastUsedAt,
            },
            create: {
              id: session.id,
              token: session.token,
              restaurantId: session.restaurantId,
              expiresAt: session.expiresAt,
              createdAt: session.createdAt,
              lastUsedAt: session.lastUsedAt,
            },
          });
        } catch (error) {
          console.error(`   ⚠️  Erro ao importar sessão ${session.id}:`, error);
        }
      }
      console.log(`   ✅ ${sessions.length} sessão(ões) importada(s)\n`);
    }

    // 5. Verificar integridade
    console.log("5️⃣  Verificando integridade dos dados migrados...\n");
    
    const targetStats: MigrationStats = {
      restaurants: await targetDb.restaurant.count(),
      users: await targetDb.user.count(),
      categories: await targetDb.category.count(),
      locations: await targetDb.location.count(),
      productTemplates: await targetDb.productTemplate.count(),
      productBatches: await targetDb.productBatch.count(),
      supportMessages: await targetDb.supportMessage.count(),
      stockEvents: await targetDb.stockEvent.count(),
      sessions: await targetDb.session.count(),
    };

    console.log("📊 Estatísticas da migração:\n");
    console.log("   Tabela                    | Origem | Destino | Status");
    console.log("   --------------------------|--------|---------|--------");
    console.log(`   Restaurants               | ${String(stats.restaurants).padStart(6)} | ${String(targetStats.restaurants).padStart(7)} | ${stats.restaurants === targetStats.restaurants ? "✅" : "❌"}`);
    console.log(`   Users                     | ${String(stats.users).padStart(6)} | ${String(targetStats.users).padStart(7)} | ${stats.users === targetStats.users ? "✅" : "❌"}`);
    console.log(`   Categories                | ${String(stats.categories).padStart(6)} | ${String(targetStats.categories).padStart(7)} | ${stats.categories === targetStats.categories ? "✅" : "❌"}`);
    console.log(`   Locations                 | ${String(stats.locations).padStart(6)} | ${String(targetStats.locations).padStart(7)} | ${stats.locations === targetStats.locations ? "✅" : "❌"}`);
    console.log(`   ProductTemplates          | ${String(stats.productTemplates).padStart(6)} | ${String(targetStats.productTemplates).padStart(7)} | ${stats.productTemplates === targetStats.productTemplates ? "✅" : "❌"}`);
    console.log(`   ProductBatches            | ${String(stats.productBatches).padStart(6)} | ${String(targetStats.productBatches).padStart(7)} | ${stats.productBatches === targetStats.productBatches ? "✅" : "❌"}`);
    console.log(`   SupportMessages           | ${String(stats.supportMessages).padStart(6)} | ${String(targetStats.supportMessages).padStart(7)} | ${stats.supportMessages === targetStats.supportMessages ? "✅" : "❌"}`);
    console.log(`   StockEvents               | ${String(stats.stockEvents).padStart(6)} | ${String(targetStats.stockEvents).padStart(7)} | ${stats.stockEvents === targetStats.stockEvents ? "✅" : "❌"}`);
    console.log(`   Sessions                  | ${String(stats.sessions).padStart(6)} | ${String(targetStats.sessions).padStart(7)} | ${stats.sessions === targetStats.sessions ? "✅" : "❌"}`);
    console.log();

    const allMatch = 
      stats.restaurants === targetStats.restaurants &&
      stats.users === targetStats.users &&
      stats.categories === targetStats.categories &&
      stats.locations === targetStats.locations &&
      stats.productTemplates === targetStats.productTemplates &&
      stats.productBatches === targetStats.productBatches &&
      stats.supportMessages === targetStats.supportMessages &&
      stats.stockEvents === targetStats.stockEvents &&
      stats.sessions === targetStats.sessions;

    if (allMatch) {
      console.log("🎉 Migração concluída com sucesso! Todos os dados foram copiados corretamente.\n");
    } else {
      console.log("⚠️  Migração concluída, mas alguns dados podem não ter sido copiados corretamente.\n");
    }

  } catch (error) {
    console.error("\n❌ ERRO durante a migração:");
    console.error(error);
    
    if (error instanceof Error) {
      console.error("\n📝 Detalhes do erro:");
      console.error(`   Mensagem: ${error.message}`);
    }
    
    throw error;
  } finally {
    await sourceDb.$disconnect();
    await targetDb.$disconnect();
    console.log("🔌 Conexões fechadas.");
  }
}

// Executar migração
migrateData()
  .then(() => {
    console.log("\n✅ Script de migração concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });

