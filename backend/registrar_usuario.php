<?php
// Conexión a la base de datos
$conexion = new mysqli("localhost", "root", "", "usuarios_db");

// Verificar la conexión
if ($conexion->connect_error) {
    header("Location: registro.html?error=conexion");
    exit();
}

// Obtener datos del formulario
$nombre = $_POST["nombre"];
$numero_telefono = $_POST["numero_telefono"];
$correo_electronico = $_POST["correo_electronico"];
$contrasena = $_POST["contrasena"];

// Validar contraseña (mínimo 10, máximo 12, al menos una mayúscula, una minúscula, un número y un símbolo . - ?)
$regex = "/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[.\-?]).{10,12}$/";
if (!preg_match($regex, $contrasena)) {
    header("Location: registro.html?error=password");
    exit();
}

// Verificar si el correo ya existe
$sql = "SELECT * FROM usuarios WHERE correo_electronico = ?";
$stmt = $conexion->prepare($sql);
$stmt->bind_param("s", $correo_electronico);
$stmt->execute();
$resultado = $stmt->get_result();

if ($resultado->num_rows > 0) {
    header("Location: registro.html?error=usuario_existente");
    exit();
}

// Insertar nuevo usuario
$sql = "INSERT INTO usuarios (nombre, numero_telefono, correo_electronico, contrasena)
        VALUES (?, ?, ?, ?)";

$stmt = $conexion->prepare($sql);
$stmt->bind_param("ssss", $nombre, $numero_telefono, $correo_electronico, $contrasena);

if ($stmt->execute()) {
    header("Location: registro.html?registro=exitoso");
} else {
    $mensaje = urlencode("No se pudo registrar el usuario.");
    header("Location: registro.html?error=registro&mensaje=$mensaje");
}

$conexion->close();
?>
