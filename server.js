import express from "express";
import fs from "fs";
import bodyParser from "body-parser";
import cors from "cors";

const app = express();
app.use(cors());
app.use((req, res, next) => {
  let data = "";

  req.on("data", chunk => {
    data += chunk;
  });

  req.on("end", () => {
    // Remove MT5 null bytes
    data = data.replace(/\0/g, "");

    try {
      req.body = JSON.parse(data);
      next();
    } catch (e) {
      console.error("JSON parse error:", e.message);
      console.log("RAW DATA:", data);
      return res.status(400).json({ error: "Invalid JSON", raw: data });
    }
  });
});


const API_KEY = "8f2a9d0b39f34b819c142acb7f12c677"; // Your secret key
const DATA_FILE = "stats.json";

// ------ Receive Stats From EA ------
app.post("/api/updateStats", (req, res) => {
  const clientKey = req.headers["x-api-key"];

  if (clientKey !== API_KEY) {
    return res.status(403).json({ error: "Invalid API Key" });
  }

  const stats = {
    ...req.body,
    received_at: new Date().toISOString(),
  };

  fs.writeFileSync(DATA_FILE, JSON.stringify(stats, null, 2));

  console.log("EA data received:", stats);
  return res.json({ success: true });
});

// ------ Get Latest Stats ------
app.get("/api/stats/latest", (req, res) => {
  if (!fs.existsSync(DATA_FILE)) {
    return res.json({ error: "No data received yet" });
  }

  const data = JSON.parse(fs.readFileSync(DATA_FILE));
  res.json(data);
});

// ------ Start Server ------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend API running on port ${PORT}`));
