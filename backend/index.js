const PORT = process.env.PORT || 2000; // ✅ FIX 1: iisnode Windows named pipe support
const express = require("express");
const bodyParser = require("body-parser");
require("dotenv").config({ path: __dirname + "/.env" });
const app = express();
const cors = require("cors");
const http = require("http");
const path = require("path");
const httpServer = http.createServer(app);
const adminRoutes = require("./routes/adminRoutes");
const employeeRoutes = require("./routes/employeeRoutes");
const fileUpload = require("express-fileupload");
const { initializeSocket } = require("./config/io.config");
const scheduleTask = require("./utils/ScheduleJob");
const { randomStrAlphabetNumeric } = require("./helper/utilityHelper");

initializeSocket(httpServer);
 
const corsOptions = {
  origin: "*",
  credentials: true,
  optionSuccessStatus: 200,
};
 
app.use(cors(corsOptions));
app.use(bodyParser.json({ limit: "10mb" }));
app.use(bodyParser.urlencoded({ limit: "10mb", extended: true }));
app.use(fileUpload());
app.use("/emp_docs", express.static(path.join(__dirname, "emp_docs")));
app.use("/admin_docs", express.static(path.join(__dirname, "admin_docs")));
app.use("/temp", express.static(path.join(__dirname, "temp")));
 
// Routes
app.use("/api/v1", adminRoutes);
app.use("/api/v1", employeeRoutes);
 
app.use(express.static(path.join(__dirname, "build")));
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "build", "index.html"));
});
 
scheduleTask();

// Start the server
httpServer.listen(PORT, () => {
  console.log("Server listening on port", PORT);
});