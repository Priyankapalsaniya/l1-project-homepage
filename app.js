const mysql = require("mysql");
const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");

const app = express();

/* 🔴 FIX #1: Body parsers (add BEFORE routes) */
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

/* 🔴 FIX #2: Ensure uploads folder exists */
if (!fs.existsSync("uploads")) {
  fs.mkdirSync("uploads");
}

const upload = multer({ dest: "uploads/" });

// AWS config
AWS.config.update({ region: "us-west-2" });
const s3 = new AWS.S3();

// serve static files (HTML, CSS)
app.use(express.static(path.join(__dirname, "public")));

app.post("/upload", upload.single("bill"), (req, res) => {
  const file = req.file;

  if (!file) {
    return res.status(400).send("No file uploaded");
  }

  const params = {
    Bucket: "customer-bills1",
    Key: `${Date.now()}-${file.originalname}`,
    Body: fs.createReadStream(file.path),
    ContentType: file.mimetype
  };

  s3.upload(params, (err, data) => {
    if (err) {
      console.error("S3 Upload Error:", err);
      return res.status(500).send("Upload failed");
    }

    // delete file from EC2 after upload
    fs.unlinkSync(file.path);

    res.send("File uploaded successfully");
  });
});

app.get("/", (req, res) => {
  res.sendFile(path.resolve("public/index.html"));
});

app.listen(3000, "0.0.0.0", () => {
  console.log("🚀 Server running on port 3000");
});

require('dotenv').config();
const mysql = require('mysql');

const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) {
    console.error("DB connection failed:", err);
    return;
  }
  console.log("✅ Connected to RDS");
});



