const express = require("express");
const cors = require("cors");
require("dotenv").config();

const barangRoutes = require("./routes/barang.routes");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/barang", barangRoutes);

app.get("/", (req, res) => {
  res.send("API Inventaris Barang aktif");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server berjalan di http://localhost:${PORT}`);
});