import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const dataDir = path.resolve("data");
const dbPath = path.join(dataDir, "memora-db.json");

const defaultDb = {
  behaviorEvents: [],
  episodicMemories: [],
  longTermPatterns: [],
  dailySummaries: [],
  reminders: []
};

let cache = null;

async function loadDb() {
  if (cache) return cache;

  await mkdir(dataDir, { recursive: true });

  try {
    const raw = await readFile(dbPath, "utf-8");
    cache = { ...defaultDb, ...JSON.parse(raw) };
  } catch {
    cache = structuredClone(defaultDb);
    await persistDb(cache);
  }

  return cache;
}

export async function persistDb(db) {
  await mkdir(dataDir, { recursive: true });
  await writeFile(dbPath, JSON.stringify(db, null, 2), "utf-8");
}

export async function withDb(mutator) {
  const db = await loadDb();
  const result = await mutator(db);
  await persistDb(db);
  return result;
}

export async function readDb(reader) {
  const db = await loadDb();
  return reader(db);
}
