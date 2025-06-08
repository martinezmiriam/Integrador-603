const express = require("express");
const router = express.Router();
const controller = require("../controllers/serviciosController");
const multer = require("multer");
const path = require("path");
const fs = require("fs"); // Add fs module

// Carpeta temporal
const tempDir = path.join(__dirname, "../public/servicios-img");
if (!fs.existsSync(tempDir)) {
  fs.mkdirSync(tempDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, tempDir);
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// Rutas CRUD
router.get("/", controller.getAll);
router.post("/", upload.single("imagen"), controller.create);
router.patch("/:id", upload.single("imagen"), controller.update);
router.delete("/:id", controller.delete);

module.exports = router;
