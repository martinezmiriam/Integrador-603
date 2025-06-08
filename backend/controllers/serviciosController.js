const db = require("../db");
const fs = require("fs");
const path = require("path");

// Ruta donde se copiará la imagen (frontend)
const rutaFrontendImg = path.join(__dirname, "../../fronted/img/Servicios");

// GET - obtener todos los servicios activos con imagen
exports.getAll = async (req, res) => {
  try {
    const [rows] = await db.query("SELECT * FROM servicios WHERE activo = 1");

    console.log("🔎 Servicios activos encontrados:", rows.length);

    const posiblesImagenes = fs.existsSync(rutaFrontendImg)
      ? fs.readdirSync(rutaFrontendImg)
      : [];

    console.log("🖼️ Imágenes disponibles en carpeta:", posiblesImagenes);

    const serviciosConImagen = rows.map((servicio) => {
      const imagenEncontrada = posiblesImagenes.find(
        (img) =>
          img.includes(servicio.nombre.split(" ")[0]) ||
          img.startsWith(servicio.id_servicios + "_") // <- CORREGIDO
      );

      const rutaFinal = imagenEncontrada
        ? `/img/Servicios/${imagenEncontrada}`
        : null;

      console.log(
        `📦 Servicio [${servicio.id_servicios} - ${servicio.nombre}]:`,
        rutaFinal
      );

      return {
        ...servicio,
        imagen: rutaFinal,
      };
    });

    res.json(serviciosConImagen);
  } catch (err) {
    console.error("💥 Error en getAll:", err);
    res
      .status(500)
      .json({ error: err.message || "Error al obtener servicios" });
  }
};

// POST - crear nuevo servicio
exports.create = async (req, res) => {
  const { nombre, descripcion, precio } = req.body;

  try {
    const [result] = await db.query(
      `INSERT INTO servicios 
      (nombre, descripcion, precio, activo) 
    VALUES (?, ?, ?, 1)`,
      [nombre, descripcion, precio]
    );

    // manejo imagen como ya tienes
    if (req.file) {
      const nuevoNombre = `${result.insertId}_${req.file.originalname}`;
      const destinoFinal = path.join(rutaFrontendImg, nuevoNombre);

      if (!fs.existsSync(rutaFrontendImg)) {
        fs.mkdirSync(rutaFrontendImg, { recursive: true });
      }

      fs.copyFileSync(req.file.path, destinoFinal);
      fs.unlinkSync(req.file.path);
    }

    res.status(201).json({
      id: result.insertId,
      message: "Servicio creado correctamente",
    });
  } catch (err) {
    console.error("Error en create:", err);
    res.status(500).json({ error: "Error al crear el servicio" });
  }
};


// PATCH - actualizar campos y opcionalmente imagen
exports.update = async (req, res) => {
  const { id } = req.params;
  const { nombre, descripcion, precio } = req.body;

  try {
    // Validar que al menos un campo fue proporcionado
    if (!nombre && !descripcion && !precio && !req.file) {
      return res.status(400).json({ error: "No hay campos para actualizar" });
    }

    // Preparar la consulta SQL
    const updates = [];
    const values = [];
    
    if (nombre !== undefined) {
      updates.push('nombre = ?');
      values.push(nombre);
    }
    if (descripcion !== undefined) {
      updates.push('descripcion = ?');
      values.push(descripcion);
    }
    if (precio !== undefined) {
      updates.push('precio = ?');
      values.push(precio);
    }

    // Ejecutar actualización si hay campos para actualizar
    if (updates.length > 0) {
      await db.query(
        `UPDATE servicios SET ${updates.join(', ')} WHERE id_servicios = ?`,
        [...values, id]
      );
    }

    // Manejo de imagen (si se subió una nueva)
    if (req.file) {
      // Eliminar imagen anterior si existe
      const posiblesImagenes = fs.existsSync(rutaFrontendImg) 
        ? fs.readdirSync(rutaFrontendImg) 
        : [];
      
      posiblesImagenes.forEach(img => {
        if (img.startsWith(`${id}_`)) {
          fs.unlinkSync(path.join(rutaFrontendImg, img));
        }
      });

      // Guardar nueva imagen
      const ext = path.extname(req.file.originalname);
      const newName = `${id}_${Date.now()}${ext}`;
      const newPath = path.join(rutaFrontendImg, newName);
      
      // Crear directorio si no existe
      if (!fs.existsSync(rutaFrontendImg)) {
        fs.mkdirSync(rutaFrontendImg, { recursive: true });
      }
      
      fs.renameSync(req.file.path, newPath);
    }

    res.json({ 
      message: "Servicio actualizado correctamente",
      imagen: req.file ? `/img/Servicios/${id}_${Date.now()}${path.extname(req.file.originalname)}` : undefined
    });
  } catch (err) {
    console.error("Error en update:", err);
    res.status(500).json({ error: "Error al actualizar el servicio" });
  }
};

// DELETE lógico
exports.delete = async (req, res) => {
  const { id } = req.params;
  try {
    // Eliminación lógica
    await db.query("UPDATE servicios SET activo = 0 WHERE id_servicios = ?", [
      id,
    ]);

    // Opcional: Eliminar la imagen asociada
    const posiblesImagenes = fs.existsSync(rutaFrontendImg)
      ? fs.readdirSync(rutaFrontendImg)
      : [];
    const imagenAsociada = posiblesImagenes.find((img) =>
      img.startsWith(id + "_")
    );

    if (imagenAsociada) {
      fs.unlinkSync(path.join(rutaFrontendImg, imagenAsociada));
    }

    res.json({ message: "Servicio eliminado correctamente" });
  } catch (err) {
    console.error("Error en delete:", err);
    res.status(500).json({ error: "Error al eliminar el servicio" });
  }
};
