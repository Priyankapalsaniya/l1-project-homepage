const mysql = require("mysql");
const express = require("express");
const multer = require("multer");
const AWS = require("aws-sdk");
const fs = require("fs");
const path = require("path");

const app = express();
const upload = multer({ dest: "uploads/" });

// AWS config
AWS.config.update({ region: "us-west-2" });
const s3 = new AWS.S3();

// serve static files (HTML, CSS)
app.use(express.static(path.join(__dirname, "public")));

app.post("/upload", upload.single("bill"), (req, res) => {
  const file = req.file;

  const params = {
    Bucket: "customer-bills-terraform",
    Key: file.originalname,
    Body: fs.createReadStream(file.path),
  };

  s3.upload(params, (err) => {
    if (err) {
      console.error(err);
      return res.send("Upload failed");
    }
    res.send("Bill uploaded successfully!");
  });
});

// RDS connection
const db = mysql.createConnection({
  host: "RDS-ENDPOINT",
  user: "admin",
  password: "password",
  database: "newsletter"
});
app.use(express.urlencoded({ extended: true }));

app.post("/subscribe", (req, res) => {
  const email = req.body.email;

  db.query(
    "INSERT INTO subscribers (email) VALUES (?)",
    [email],
    (err) => {
      if (err) return res.send("Already subscribed");
      res.send("Subscribed successfully!");
    }
  );
});



app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

app.listen(3000, "0.0.0.0", () => {
  console.log("Server running on port 3000");
});
