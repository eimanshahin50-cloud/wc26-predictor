// Run a one-off sync from your terminal: `npm run sync`
// Useful for the very first fixture pull, or to test your API key.
import { runFullSync } from "@/lib/football/sync";

runFullSync()
  .then((r) => { console.log("Sync complete:", r); process.exit(0); })
  .catch((e) => { console.error("Sync failed:", e); process.exit(1); });
