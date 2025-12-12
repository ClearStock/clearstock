import { db } from "@/lib/db";

/**
 * Script to check if a PIN exists in the database
 */

async function checkPin(pin: string) {
  console.log(`Checking PIN: ${pin}`);
  
  const trimmedPin = pin.trim();
  console.log(`Trimmed PIN: ${trimmedPin}`);
  
  // Check if PIN exists
  const restaurant = await db.restaurant.findUnique({
    where: { pin: trimmedPin },
    select: {
      id: true,
      pin: true,
      name: true,
      createdAt: true,
    },
  });

  if (restaurant) {
    console.log("\n✅ PIN found!");
    console.log("Restaurant details:");
    console.log(`  ID: ${restaurant.id}`);
    console.log(`  PIN: ${restaurant.pin}`);
    console.log(`  Name: ${restaurant.name || "(not set)"}`);
    console.log(`  Created: ${restaurant.createdAt}`);
  } else {
    console.log("\n❌ PIN not found in database");
    
    // Check if there are any similar PINs
    const allRestaurants = await db.restaurant.findMany({
      select: {
        pin: true,
        name: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 10,
    });
    
    console.log("\nLast 10 PINs in database:");
    allRestaurants.forEach((r, i) => {
      console.log(`  ${i + 1}. PIN: ${r.pin} - Name: ${r.name || "(not set)"}`);
    });
  }
}

const pin = process.argv[2];

if (!pin) {
  console.error("Usage: tsx scripts/check-pin.ts <PIN>");
  process.exit(1);
}

checkPin(pin)
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Error:", error);
    process.exit(1);
  });

