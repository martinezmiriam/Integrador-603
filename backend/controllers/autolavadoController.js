const db = require("../db");
const fs = require("fs");
const path = require("path");


const rutaFrontendImg = path.join(__dirname, "../../fronted/img/Promocion");

exports.getAll = async (req, res) => {
  try {
    const [paquetes] = await db.query("SELECT * FROM autolavado WHERE activo = 1");

    // Servicios relacionados (igual que antes)
    const [relaciones] = await db.query(`
      SELECT sp.id_autolavado, s.id_servicios, s.nombre, s.descripcion, s.precio 
      FROM servicios_por_paquete sp
      JOIN servicios s ON sp.id_servicios = s.id_servicios
    `);

    const serviciosPorPaquete = {};
    for (const row of relaciones) {
      if (!serviciosPorPaquete[row.id_autolavado]) {
        serviciosPorPaquete[row.id_autolavado] = [];
      }
      serviciosPorPaquete[row.id_autolavado].push(row.nombre);
    }

    const carpetaImg = path.join(__dirname, "../../fronted/img/Promocion");
    let archivosImg = [];

    if (fs.existsSync(carpetaImg)) {
      archivosImg = fs.readdirSync(carpetaImg);
    }

    const resultado = paquetes.map(p => {
      const archivoImg = archivosImg.find(f => f.startsWith(p.id_autolavado + "_"));
      return {
        ...p,
        servicios: serviciosPorPaquete[p.id_autolavado] || [],
        imagen_url: archivoImg ? `/img/Promocion/${archivoImg}` : null
      };
    });

    res.json(resultado);
  } catch (err) {
    console.error("Error en getAll:", err);
    res.status(500).json({ error: "Error al obtener paquetes" });
  }
};

exports.getById = async (req, res) => {
  const { id } = req.params;

  try {
    const [paqueteRows] = await db.query(
      `SELECT * FROM autolavado WHERE id_autolavado = ?`,
      [id]
    );

    if (paqueteRows.length === 0) {
      return res.status(404).json({ error: "Paquete no encontrado" });
    }

    const paquete = paqueteRows[0];

    // Obtener servicios relacionados
    const [serviciosRows] = await db.query(
      `SELECT s.id_servicios, s.nombre
       FROM servicios s
       JOIN servicios_por_paquete spp ON s.id_servicios = spp.id_servicios
       WHERE spp.id_autolavado = ?`,
      [id]
    );

    paquete.servicios = serviciosRows.map(s => s.nombre); // o puedes usar IDs

    res.json(paquete);
  } catch (err) {
    console.error("💥 Error en getById de autolavado:", err);
    res.status(500).json({ error: "Error al obtener el paquete" });
  }
};


// Crear nuevo servicio de autolavado
exports.create = async (req, res) => {
  let {
    nombre_paquete,
    tipo_paquete,
    descripcion,
    precio,
    duracion_aprox,
    servicios = []
  } = req.body;

  try {
    if (typeof servicios === 'string') {
      try {
        servicios = JSON.parse(servicios);
      } catch {
        servicios = [];
      }
    }

    if (!Array.isArray(servicios)) servicios = [];

    const fechaActual = new Date().toISOString();

    // Guardar paquete sin imagen en BD
    const [result] = await db.query(
      `INSERT INTO autolavado 
       (nombre_paquete, tipo_paquete, descripcion, precio, duracion_aprox, activo, fecha_creacion, fecha_actualizacion)
       VALUES (?, ?, ?, ?, ?, 1, ?, ?)`,
      [nombre_paquete, tipo_paquete, descripcion, precio, duracion_aprox, fechaActual, fechaActual]
    );

    const nuevoId = result.insertId;

    // Guardar servicios relacionados si hay
    for (const id_servicio of servicios) {
      const [existe] = await db.query(
        `SELECT id_servicios FROM servicios WHERE id_servicios = ? AND activo = 1`,
        [id_servicio]
      );

      if (existe.length > 0) {
        await db.query(
          `INSERT INTO servicios_por_paquete (id_autolavado, id_servicios) VALUES (?, ?)`,
          [nuevoId, id_servicio]
        );
      }
    }

    // Guardar imagen si existe archivo
    if (req.file) {
      const carpetaDestino = path.join(__dirname, "../../fronted/img/Promocion");
      if (!fs.existsSync(carpetaDestino)) {
        fs.mkdirSync(carpetaDestino, { recursive: true });
      }

      const ext = path.extname(req.file.originalname);
      const nombreArchivo = `${nuevoId}_${Date.now()}${ext}`;
      const destinoFinal = path.join(carpetaDestino, nombreArchivo);

      try {
        fs.renameSync(req.file.path, destinoFinal);
        console.log(`✅ Imagen guardada correctamente en: ${destinoFinal}`);
      } catch (error) {
        console.error("❌ Error al mover la imagen a carpeta final:", error);
      }
    } else {
      console.log("⚠️ No se recibió archivo de imagen en la petición.");
    }

    res.status(201).json({ message: "Paquete creado correctamente", id: nuevoId });
  } catch (err) {
    console.error("💥 Error al crear el paquete:", err);
    res.status(500).json({ error: "Error al crear el paquete" });
  }
};

// Actualizar campos específicos con PATCH
exports.update = async (req, res) => {
  const { id } = req.params;
  const {
    nombre_paquete,
    tipo_paquete,
    descripcion,
    precio,
    duracion_aprox,
    servicios_agregar = [],
    servicios_quitar = [],
  } = req.body;

  const rutaFrontendImg = path.join(__dirname, "../../fronted/img/Promocion");

  try {
    const updates = [];
    const values = [];

    if (nombre_paquete !== undefined) {
      updates.push("nombre_paquete = ?");
      values.push(nombre_paquete);
    }
    if (tipo_paquete !== undefined) {
      updates.push("tipo_paquete = ?");
      values.push(tipo_paquete);
    }
    if (descripcion !== undefined) {
      updates.push("descripcion = ?");
      values.push(descripcion);
    }
    if (precio !== undefined) {
      updates.push("precio = ?");
      values.push(precio);
    }
    if (duracion_aprox !== undefined) {
      updates.push("duracion_aprox = ?");
      values.push(duracion_aprox);
    }

    // Siempre actualizar la fecha de modificación
    if (updates.length > 0) {
      updates.push("fecha_actualizacion = ?");
      values.push(new Date().toISOString());

      await db.query(
        `UPDATE autolavado SET ${updates.join(", ")} WHERE id_autolavado = ?`,
        [...values, id]
      );
    }

    // Lógica de IMAGEN si se subió una nueva
    let nuevaImagenUrl = null;
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
      const nombreNuevo = `${id}_${Date.now()}${ext}`;
      const rutaDestino = path.join(rutaFrontendImg, nombreNuevo);

      if (!fs.existsSync(rutaFrontendImg)) {
        fs.mkdirSync(rutaFrontendImg, { recursive: true });
      }

      fs.renameSync(req.file.path, rutaDestino);
      nuevaImagenUrl = `/img/Promocion/${nombreNuevo}`;
    }

    // Quitar servicios
    for (const id_servicio of servicios_quitar) {
      await db.query(
        `DELETE FROM servicios_por_paquete WHERE id_autolavado = ? AND id_servicios = ?`,
        [id, id_servicio]
      );
    }

    // Agregar servicios (evitando duplicados)
    for (const id_servicio of servicios_agregar) {
      const [existe] = await db.query(
        `SELECT 1 FROM servicios_por_paquete WHERE id_autolavado = ? AND id_servicios = ?`,
        [id, id_servicio]
      );
      if (existe.length === 0) {
        await db.query(
          `INSERT INTO servicios_por_paquete (id_autolavado, id_servicios) VALUES (?, ?)`,
          [id, id_servicio]
        );
      }
    }

    res.json({
      message: "Paquete actualizado correctamente",
      imagen: nuevaImagenUrl || undefined
    });

  } catch (err) {
    console.error("💥 Error en update de autolavado:", err);
    res.status(500).json({ error: "Error al actualizar el paquete" });
  }
};


// Eliminar lógicamente
exports.delete = async (req, res) => {
  const { id } = req.params;

  try {
    // Marcar como inactivo
    await db.query(`UPDATE autolavado SET activo = 0 WHERE id_autolavado = ?`, [id]);

    // Eliminar relaciones de servicios
    await db.query(`DELETE FROM servicios_por_paquete WHERE id_autolavado = ?`, [id]);

    res.json({ message: "Paquete eliminado correctamente" });
  } catch (err) {
    console.error("💥 Error en delete de autolavado:", err);
    res.status(500).json({ error: "Error al eliminar el paquete" });
  }
};

