const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/users');


const app = express();
app.use(cors());
app.use(bodyParser.json());

app.use('/api/users', userRoutes);

app.listen(3000, () => {
    console.log('Servidor backend en http://localhost:3000');
});
