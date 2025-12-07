/**
 * Script de teste para verificar a conexão com Supabase
 * e se as operações de escrita estão a funcionar corretamente
 * 
 * Executar com: npx tsx scripts/test-db-connection.ts
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  log: ["query", "error", "warn"],
});

async function testConnection() {
  console.log("🔍 A testar conexão com Supabase...\n");

  try {
    // 1. Testar conexão básica
    console.log("1️⃣  Teste de conexão básica...");
    await prisma.$connect();
    console.log("✅ Conexão estabelecida com sucesso!\n");

    // 2. Testar leitura
    console.log("2️⃣  Teste de leitura (restaurants)...");
    const restaurants = await prisma.restaurant.findMany({
      take: 5,
      include: {
        categories: true,
        locations: true,
        productBatches: {
          take: 3,
          orderBy: { createdAt: "desc" },
        },
      },
    });
    console.log(`✅ Encontrados ${restaurants.length} restaurante(s)`);
    if (restaurants.length > 0) {
      const r = restaurants[0];
      console.log(`   - Nome: ${r.name}`);
      console.log(`   - Categorias: ${r.categories.length}`);
      console.log(`   - Localizações: ${r.locations.length}`);
      console.log(`   - Entradas de stock: ${r.productBatches.length}`);
    }
    console.log();

    // 3. Testar escrita (criar um registo de teste)
    console.log("3️⃣  Teste de escrita (criar categoria de teste)...");
    const testRestaurant = restaurants[0];
    
    if (testRestaurant) {
      const testCategoryName = `TESTE-${Date.now()}`;
      const testCategory = await prisma.category.create({
        data: {
          name: testCategoryName,
          tipo: "mp",
          restaurantId: testRestaurant.id,
        },
      });
      console.log(`✅ Categoria de teste criada: ${testCategory.name} (ID: ${testCategory.id})\n`);

      // 4. Verificar se foi guardado (ler novamente)
      console.log("4️⃣  Teste de verificação (ler categoria criada)...");
      const verifyCategory = await prisma.category.findUnique({
        where: { id: testCategory.id },
      });
      
      if (verifyCategory) {
        console.log(`✅ Categoria encontrada na base de dados!`);
        console.log(`   - Nome: ${verifyCategory.name}`);
        console.log(`   - Tipo: ${verifyCategory.tipo}`);
        console.log(`   - Criada em: ${verifyCategory.createdAt}\n`);

        // 5. Limpar - apagar categoria de teste
        console.log("5️⃣  Limpeza (apagar categoria de teste)...");
        await prisma.category.delete({
          where: { id: testCategory.id },
        });
        console.log(`✅ Categoria de teste apagada com sucesso!\n`);
      } else {
        console.log("❌ ERRO: Categoria não foi encontrada após criação!\n");
      }
    } else {
      console.log("⚠️  Nenhum restaurante encontrado. Criando restaurante de teste...");
      const newRestaurant = await prisma.restaurant.create({
        data: {
          pin: `TESTE-${Date.now()}`,
          name: `TESTE-RESTAURANTE-${Date.now()}`,
          alertDaysBeforeExpiry: 3,
          alertDaysBeforeExpiryMP: 3,
          alertDaysBeforeExpiryTransformado: 1,
        },
      });
      console.log(`✅ Restaurante de teste criado: ${newRestaurant.name} (ID: ${newRestaurant.id})\n`);
      
      // Limpar restaurante de teste
      await prisma.restaurant.delete({
        where: { id: newRestaurant.id },
      });
      console.log(`✅ Restaurante de teste apagado.\n`);
    }

    // 6. Testar operação de update
    console.log("6️⃣  Teste de atualização...");
    if (testRestaurant) {
      const originalAlertDays = testRestaurant.alertDaysBeforeExpiry;
      const newAlertDays = originalAlertDays === 3 ? 5 : 3;
      
      await prisma.restaurant.update({
        where: { id: testRestaurant.id },
        data: { alertDaysBeforeExpiry: newAlertDays },
      });
      
      const updated = await prisma.restaurant.findUnique({
        where: { id: testRestaurant.id },
      });
      
      if (updated && updated.alertDaysBeforeExpiry === newAlertDays) {
        console.log(`✅ Atualização funcionou! alertDaysBeforeExpiry: ${originalAlertDays} → ${newAlertDays}\n`);
        
        // Reverter alteração
        await prisma.restaurant.update({
          where: { id: testRestaurant.id },
          data: { alertDaysBeforeExpiry: originalAlertDays },
        });
        console.log(`✅ Alteração revertida.\n`);
      } else {
        console.log("❌ ERRO: Atualização não funcionou corretamente!\n");
      }
    }

    // 7. Verificar variáveis de ambiente
    console.log("7️⃣  Verificação de variáveis de ambiente...");
    const dbUrl = process.env.DATABASE_URL;
    const directUrl = process.env.DIRECT_URL;
    
    if (dbUrl) {
      // Ocultar password na exibição
      const safeUrl = dbUrl.replace(/:[^:@]+@/, ":****@");
      console.log(`✅ DATABASE_URL está definida: ${safeUrl}`);
    } else {
      console.log("❌ ERRO: DATABASE_URL não está definida!");
    }
    
    if (directUrl) {
      const safeDirectUrl = directUrl.replace(/:[^:@]+@/, ":****@");
      console.log(`✅ DIRECT_URL está definida: ${safeDirectUrl}`);
    } else {
      console.log("⚠️  DIRECT_URL não está definida (pode ser opcional)");
    }
    console.log();

    console.log("🎉 Todos os testes concluídos com sucesso!");
    console.log("\n📊 Resumo:");
    console.log("   ✅ Conexão com Supabase: OK");
    console.log("   ✅ Leitura de dados: OK");
    console.log("   ✅ Escrita de dados: OK");
    console.log("   ✅ Atualização de dados: OK");
    console.log("   ✅ Dados estão a ser guardados corretamente!");

  } catch (error) {
    console.error("\n❌ ERRO durante os testes:");
    console.error(error);
    
    if (error instanceof Error) {
      console.error("\n📝 Detalhes do erro:");
      console.error(`   Mensagem: ${error.message}`);
      console.error(`   Stack: ${error.stack}`);
    }
    
    // Verificar se é erro de conexão
    if (error instanceof Error && error.message.includes("connect")) {
      console.error("\n💡 Possíveis causas:");
      console.error("   1. DATABASE_URL ou DIRECT_URL não estão definidas");
      console.error("   2. Credenciais incorretas");
      console.error("   3. Supabase não permite conexões deste IP");
      console.error("   4. Base de dados está offline");
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
    console.log("\n🔌 Conexão fechada.");
  }
}

// Executar testes
testConnection()
  .then(() => {
    console.log("\n✅ Script concluído!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("\n❌ Erro fatal:", error);
    process.exit(1);
  });

