import express from "express";
import { createServer as createViteServer } from "vite";
import { createServer } from "http";
import { Server } from "socket.io";
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

  CREATE TABLE IF NOT EXISTS news (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    content TEXT,
    source TEXT,
    type TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS emergency_contacts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT,
    number TEXT,
    category TEXT
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

// Seed news if empty
const newsCount = db.prepare("SELECT COUNT(*) as count FROM news").get() as { count: number };
if (newsCount.count === 0) {
  const insertNews = db.prepare("INSERT INTO news (title, content, source, type) VALUES (?, ?, ?, ?)");
  insertNews.run("Flood Warning Issued", "Heavy rainfall expected in the next 24 hours. Residents in low-lying areas should prepare for evacuation.", "National Weather Service", "alert");
  insertNews.run("New Shelter Opened", "A new emergency shelter has been opened at the Community Center on 5th Street.", "City Emergency Management", "info");
  insertNews.run("Road Clearance Update", "Main Street has been cleared of debris and is now open for emergency vehicles.", "Department of Transportation", "success");
}

// Seed contacts if empty
const contactCount = db.prepare("SELECT COUNT(*) as count FROM emergency_contacts").get() as { count: number };
if (contactCount.count === 0) {
  const insertContact = db.prepare("INSERT INTO emergency_contacts (name, number, category) VALUES (?, ?, ?)");
  insertContact.run("Emergency Services", "911", "Emergency");
  insertContact.run("Red Cross Hotline", "1-800-RED-CROSS", "Support");
  insertContact.run("City Emergency Management", "555-0199", "Official");
  insertContact.run("Local Police (Non-Emergency)", "555-0123", "Police");
}

async function startServer() {
  const app = express();
  const httpServer = createServer(app);
  const io = new Server(httpServer, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Presence tracking
  const activeUsers = new Set();
  io.on("connection", (socket) => {
    activeUsers.add(socket.id);
    io.emit("presence:update", activeUsers.size);

    socket.on("sos:trigger", (data) => {
      socket.broadcast.emit("sos:alert", data);
    });

    socket.on("disconnect", () => {
      activeUsers.delete(socket.id);
      io.emit("presence:update", activeUsers.size);
    });
  });

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
    
    const newReport = {
      id: info.lastInsertRowid,
      type, severity, description, latitude, longitude, image_url,
      timestamp: new Date().toISOString()
    };
    
    io.emit("report:new", newReport);
    res.json(newReport);
  });

  app.get("/api/shelters", (req, res) => {
    const shelters = db.prepare("SELECT * FROM shelters").all();
    res.json(shelters);
  });

  app.get("/api/news", (req, res) => {
    const news = db.prepare("SELECT * FROM news ORDER BY timestamp DESC").all();
    res.json(news);
  });

  app.get("/api/contacts", (req, res) => {
    const contacts = db.prepare("SELECT * FROM emergency_contacts").all();
    res.json(contacts);
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

  httpServer.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
