// backend/server.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const itemRoutes = require("./routes/itemRoutes");
const parseRoutes = require("./routes/parseRoutes");
const errorHandler = require("./middleware/errorHandler");

const app = express();

app.use(cors({ origin: "http://localhost:3000", credentials: true }));
app.use(express.json());

const MONGO_URI = process.env.MONGO_URI || "mongodb://127.0.0.1:27017/voice-shopping";

// ✅ Connect to MongoDB
mongoose
  .connect(MONGO_URI)
  .then(async () => {
    console.log("✅ MongoDB connected");

    // 🧹 Duplicate cleanup + normalization
    const Item = require("./models/item");
    const items = await Item.find({});
    const map = new Map();

    for (const item of items) {
      const key = item.name.trim().toLowerCase();

      // 🔧 Auto-assign category (basic logic)
      let category = item.category || "other";
      if (/milk|cheese|butter|yogurt/i.test(key)) category = "dairy";
      else if (/apple|banana|carrot|tomato|potato/i.test(key)) category = "produce";
      else if (/chicken|beef|fish|meat/i.test(key)) category = "meat";
      else if (/chips|biscuit|cookie|snack/i.test(key)) category = "snacks";
      else if (/rice|pasta|flour|sugar|salt/i.test(key)) category = "pantry";

      if (map.has(key)) {
        // merge duplicates
        const existing = map.get(key);
        existing.quantity += item.quantity;
        await existing.save();
        await Item.findByIdAndDelete(item._id);
        console.log(`🔁 Merged duplicate: ${item.name}`);
      } else {
        item.name = key;
        item.category = category;
        await item.save();
        map.set(key, item);
      }
    }

    console.log("🧹 Duplicate cleanup + category assignment complete!");
  })
  .catch((err) => console.error("❌ MongoDB error:", err.message));

// ✅ Routes
app.use("/api/items", itemRoutes);
app.use("/api/parse-command", parseRoutes);
app.get("/health", (req, res) => res.send("OK"));

// ✅ Error handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
