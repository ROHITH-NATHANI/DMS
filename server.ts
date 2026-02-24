import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("disaster_response.db");

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT,
    severity TEXT,
    description TEXT,
    latitude REAL,
    longitude REAL,
    image_url TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS missing_persons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    last_seen_location TEXT,
    latitude REAL,
    longitude REAL,
    contact_info TEXT,
    status TEXT DEFAULT 'missing',
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS shelters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    type TEXT,
    latitude REAL,
    longitude REAL,
    capacity INTEGER,
    occupancy INTEGER,
    address TEXT
  );
`);

// Seed some shelters if empty
const shelterCount = db.prepare("SELECT COUNT(*) as count FROM shelters").get() as { count: number };
if (shelterCount.count === 0) {
  const insertShelter = db.prepare("INSERT INTO shelters (name, type, latitude, longitude, capacity, occupancy, address) VALUES (?, ?, ?, ?, ?, ?, ?)");
  insertShelter.run("Central High School", "Shelter", 37.7749, -122.4194, 500, 120, "123 Main St");
  insertShelter.run("City Hospital", "Medical", 37.7849, -122.4094, 200, 180, "456 Health Ave");
  insertShelter.run("Westside Police Station", "Police", 37.7649, -122.4294, 50, 10, "789 Safety Blvd");
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // API Routes
  app.get("/api/reports", (req, res) => {
    const reports = db.prepare("SELECT * FROM reports ORDER BY timestamp DESC").all();
    res.json(reports);
  });

  app.post("/api/reports", (req, res) => {
    const { type, severity, description, latitude, longitude, image_url } = req.body;
    const info = db.prepare(
      "INSERT INTO reports (type, severity, description, latitude, longitude, image_url) VALUES (?, ?, ?, ?, ?, ?)"
    ).run(type, severity, description, latitude, longitude, image_url);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/shelters", (req, res) => {
    const shelters = db.prepare("SELECT * FROM shelters").all();
    res.json(shelters);
  });

  app.get("/api/missing-persons", (req, res) => {
    const persons = db.prepare("SELECT * FROM missing_persons ORDER BY timestamp DESC").all();
    res.json(persons);
  });

  app.post("/api/missing-persons", (req, res) => {
    const { name, last_seen_location, latitude, longitude, contact_info } = req.body;
    const info = db.prepare(
      "INSERT INTO missing_persons (name, last_seen_location, latitude, longitude, contact_info) VALUES (?, ?, ?, ?, ?)"
    ).run(name, last_seen_location, latitude, longitude, contact_info);
    res.json({ id: info.lastInsertRowid });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
