const path = require("path");

const dotenv = require("dotenv");
dotenv.config();
console.log("ENV check:", {
  PORT: process.env.PORT,
  STRIPE_SECRET_KEY: !!process.env.STRIPE_SECRET_KEY,
});

const express = require("express");
const cors = require("cors");

const app = express();

app.use(cors({ origin: true, credentials: true }));
const mongoose = require("mongoose");

const authRoutes = require("./routes/authRoutes");
const paymentRoutes = require("./routes/paymentRoutes");
const complianceRoutes = require("./routes/complianceRoutes");
const treasuryRoutes = require("./routes/treasuryRoutes");
const ticketRoutes = require("./routes/ticketRoutes");
const marketplaceRoutes = require("./routes/marketplaceRoutes");
const mptMarketplaceRoutes = require("./routes/mptMarketplaceRoutes");
const eventRoutes = require("./routes/eventRoutes");
const refundRoutes = require("./routes/refundRoutes");


app.use(cors());
app.use(
  express.json({
    verify: (req, _res, buf) => {
      req.rawBody = buf.toString("utf8");
    },
  })
);

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.get("/", (_req, res) => {
  res.send("VeriTix Backend is running!");
});

app.post("/api/test", (req, res) => {
  res.json({ message: "Test successful", data: req.body });
});
app.use("/", paymentRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/compliance", complianceRoutes);
app.use("/api/treasury", treasuryRoutes);
app.use("/api/tickets", ticketRoutes);
app.use("/api/marketplace", marketplaceRoutes);
app.use("/api/mpt-marketplace", mptMarketplaceRoutes);
app.use("/api/events", eventRoutes);
app.use("/api/refunds", refundRoutes);

app.use((_req, res) => {
  res.status(404).json({ error: "Not found" });
});

app.use((err, _req, res, _next) => {
  const status = err.status || 500;
  res.status(status).json({ error: err.message || "Server error" });
});

const PORT = process.env.PORT || 4000;
const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/veritix";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);

      if (process.env.REFUND_MONITOR_ENABLED === "true") {
        const { startRefundMonitor } = require("./jobs/refundMonitor");
        startRefundMonitor();
        console.log("Refund monitor enabled");
      }
    });
  })
  .catch((error) => {
    console.error(
      "Failed to connect to MongoDB, continuing without DB:",
      error.message
    );

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT} (no MongoDB)`);
    });
  });

