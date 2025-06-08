// index.js
const express = require('express');
const cors = require('cors');
const path = require('path');

const userRoutes = require('./routes/users'); // Tus rutas ya modulares
const autolavadoRoutes = require('./routes/autolavadoRoutes');// ruta para autolavado
const serviciosRoutes = require('./routes/serviciosRoutes');// ruta para autolavado
const compraRoutes = require("./routes/compraRoutes");
const reservas = require("./routes/reserva");
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors({ origin: 'http://localhost:3000' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Frontend (ajusta la carpeta según tu estructura)
app.use(express.static(path.join(__dirname, '../fronted')));
app.use("/img/Servicios", express.static(path.join(__dirname, "../fronted/img/Servicios")));
app.use('/img/Promocion', express.static(path.join(__dirname, 'public/promociones-img')));
app.use("/img/Promocion", express.static(path.join(__dirname, "../fronted/img/Promocion")));


// Rutas API
app.use('/api/usuarios', userRoutes);
app.use("/api/reservas", reservas);
app.use('/api/servicios', serviciosRoutes);
app.use('/api/autolavado', autolavadoRoutes);
app.use("/api/compras", compraRoutes);


// Ruta base de prueba
app.get('/api', (req, res) => {
  res.json({ message: 'Servidor activo' });
});

// Inicio del servidor
app.listen(PORT, () => {
  console.log(`Servidor ejecutándose en http://localhost:${PORT}`);
});
