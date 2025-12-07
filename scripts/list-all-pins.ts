import { PrismaClient } from "@prisma/client";
import { PIN_TO_RESTAURANT, RESTAURANT_NAMES } from "../lib/auth";

const prisma = new PrismaClient();

async function listAllPins() {
  console.log("\n=== LISTA COMPLETA DE PINs ===\n");
  
  // Get PINs from database
  const restaurants = await prisma.restaurant.findMany({
    select: { pin: true, name: true },
    orderBy: { pin: "asc" },
  });

  console.log("📋 PINs no Banco de Dados:");
  console.log("─".repeat(60));
  restaurants.forEach((r, i) => {
    const num = (i + 1).toString().padStart(2, "0");
    const pin = r.pin.padEnd(6, " ");
    const name = r.name || "(sem nome)";
    console.log(`${num}. PIN: ${pin} | Restaurante: ${name}`);
  });
  console.log(`\nTotal no banco: ${restaurants.length} restaurantes\n`);

  // Get PINs from code mapping
  console.log("📋 PINs Definidos no Código (PIN_TO_RESTAURANT):");
  console.log("─".repeat(60));
  const codePins = Object.entries(PIN_TO_RESTAURANT).sort(([a], [b]) => a.localeCompare(b));
  codePins.forEach(([pin, restaurantId], i) => {
    const num = (i + 1).toString().padStart(2, "0");
    const restaurantName = RESTAURANT_NAMES[restaurantId];
    console.log(`${num}. PIN: ${pin} | ID: ${restaurantId} | ${restaurantName}`);
  });
  console.log(`\nTotal no código: ${codePins.length} PINs\n`);

  // Summary table
  console.log("📊 Resumo por Restaurante:");
  console.log("─".repeat(60));
  const sortedByRestaurant = codePins.map(([pin, id]) => ({
    pin,
    id,
    name: RESTAURANT_NAMES[id],
    inDb: restaurants.some((r) => r.pin === pin),
  }));

  sortedByRestaurant.forEach((item, i) => {
    const num = (i + 1).toString().padStart(2, "0");
    const status = item.inDb ? "✅" : "❌";
    console.log(`${num}. ${status} PIN: ${item.pin} | ${item.id} - ${item.name}`);
  });

  await prisma.$disconnect();
}

listAllPins().catch((error) => {
  console.error("Erro ao listar PINs:", error);
  process.exit(1);
});

