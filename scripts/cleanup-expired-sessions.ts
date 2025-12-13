import { cleanupExpiredSessions } from "@/lib/auth-server";

/**
 * Script to clean up expired sessions from the database
 * Can be run periodically (e.g., via cron job) to keep the database clean
 */

async function main() {
  console.log("Starting cleanup of expired sessions...");
  
  try {
    const deletedCount = await cleanupExpiredSessions();
    console.log(`✅ Cleanup completed: ${deletedCount} expired session(s) deleted`);
  } catch (error) {
    console.error("❌ Error during cleanup:", error);
    process.exit(1);
  }
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  });

