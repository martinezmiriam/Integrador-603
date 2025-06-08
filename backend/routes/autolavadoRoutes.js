const express = require("express");
const router = express.Router();
const controller = require("../controllers/autolavadoController");
const multer = require("multer");
const path = require("path");

// Configuración de Multer para manejar la carga de archivos
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, "../public/autolavado-img"));
  },
  filename: function (req, file, cb) {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  },
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten imágenes'), false);
    }
  },
  limits: {
    fileSize: 5 * 1024 * 1024 // Límite de 5MB
  }
});

// Rutas CRUD
router.get("/", controller.getAll);
router.get("/:id", controller.getById); // ¡Este es el que faltaba!
router.post("/", upload.single("imagen"), controller.create);
router.patch("/:id", upload.single("imagen"), controller.update);
router.delete("/:id", controller.delete);

module.exports = router;