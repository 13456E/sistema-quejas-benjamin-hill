<?php
class Database {
    private $db;

    public function __construct() {
        try {
            $this->db = new SQLite3(__DIR__ . '/quejas_sugerencias.db');
            $this->createTables();
        } catch (Exception $e) {
            die('Error al conectar con la base de datos: ' . $e->getMessage());
        }
    }

    private function createTables() {
        // Crear tabla de usuarios
        $this->db->exec('
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                email TEXT UNIQUE NOT NULL,
                telefono TEXT NOT NULL,
                password TEXT NOT NULL,
                two_factor_secret TEXT,
                two_factor_enabled INTEGER DEFAULT 0,
                fecha_registro DATETIME DEFAULT CURRENT_TIMESTAMP
            )
        ');

        // Crear tabla de quejas
        $this->db->exec('
            CREATE TABLE IF NOT EXISTS quejas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER,
                tipo TEXT NOT NULL,
                descripcion TEXT NOT NULL,
                estado TEXT DEFAULT "pendiente",
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
            )
        ');

        // Crear tabla de sugerencias
        $this->db->exec('
            CREATE TABLE IF NOT EXISTS sugerencias (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                usuario_id INTEGER,
                titulo TEXT NOT NULL,
                categoria TEXT NOT NULL,
                descripcion TEXT NOT NULL,
                estado TEXT DEFAULT "pendiente",
                fecha_creacion DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (usuario_id) REFERENCES usuarios(id)
            )
        ');

        // Crear tabla de seguimiento
        $this->db->exec('
            CREATE TABLE IF NOT EXISTS seguimiento_quejas (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                queja_id INTEGER,
                estado TEXT NOT NULL,
                comentario TEXT,
                fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (queja_id) REFERENCES quejas(id)
            )
        ');
    }

    public function registerUser($nombre, $email, $telefono, $password) {
        try {
            // Verificar si el email ya existe
            $stmt = $this->db->prepare('SELECT id FROM usuarios WHERE email = :email');
            $stmt->bindValue(':email', $email, SQLITE3_TEXT);
            $result = $stmt->execute();
            
            if ($result->fetchArray()) {
                return ['success' => false, 'message' => 'El correo electrónico ya está registrado'];
            }

            // Hash de la contraseña
            $hashedPassword = password_hash($password, PASSWORD_DEFAULT);

            // Insertar nuevo usuario
            $stmt = $this->db->prepare('
                INSERT INTO usuarios (nombre, email, telefono, password)
                VALUES (:nombre, :email, :telefono, :password)
            ');
            
            $stmt->bindValue(':nombre', $nombre, SQLITE3_TEXT);
            $stmt->bindValue(':email', $email, SQLITE3_TEXT);
            $stmt->bindValue(':telefono', $telefono, SQLITE3_TEXT);
            $stmt->bindValue(':password', $hashedPassword, SQLITE3_TEXT);
            
            $stmt->execute();
            
            return ['success' => true, 'message' => 'Usuario registrado exitosamente'];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al registrar usuario: ' . $e->getMessage()];
        }
    }

    public function loginUser($email, $password) {
        try {
            $stmt = $this->db->prepare('SELECT * FROM usuarios WHERE email = :email');
            $stmt->bindValue(':email', $email, SQLITE3_TEXT);
            $result = $stmt->execute();
            
            $user = $result->fetchArray(SQLITE3_ASSOC);
            
            if ($user && password_verify($password, $user['password'])) {
                // No enviar la contraseña al cliente
                unset($user['password']);
                return [
                    'success' => true,
                    'user' => $user,
                    'token' => 'user_token_' . time()
                ];
            }
            
            return ['success' => false, 'message' => 'Credenciales incorrectas'];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al iniciar sesión: ' . $e->getMessage()];
        }
    }

    public function obtenerDetalleQueja($quejaId) {
        try {
            // Obtener información de la queja
            $stmt = $this->db->prepare('SELECT * FROM quejas WHERE id = :id');
            $stmt->bindValue(':id', $quejaId, SQLITE3_INTEGER);
            $result = $stmt->execute();
            $queja = $result->fetchArray(SQLITE3_ASSOC);
            
            if (!$queja) {
                return ['success' => false, 'message' => 'Queja no encontrada'];
            }
            
            // Obtener seguimiento
            $stmt = $this->db->prepare('
                SELECT * FROM seguimiento_quejas 
                WHERE queja_id = :queja_id 
                ORDER BY fecha DESC
            ');
            $stmt->bindValue(':queja_id', $quejaId, SQLITE3_INTEGER);
            $result = $stmt->execute();
            
            $seguimiento = [];
            while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
                $seguimiento[] = $row;
            }
            
            $queja['seguimiento'] = $seguimiento;
            
            return ['success' => true, 'queja' => $queja];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al obtener detalles: ' . $e->getMessage()];
        }
    }

    public function actualizarEstadoQueja($quejaId, $nuevoEstado, $comentario) {
        try {
            // Actualizar estado en la tabla de quejas
            $stmt = $this->db->prepare('
                UPDATE quejas 
                SET estado = :estado 
                WHERE id = :id
            ');
            $stmt->bindValue(':estado', $nuevoEstado, SQLITE3_TEXT);
            $stmt->bindValue(':id', $quejaId, SQLITE3_INTEGER);
            $stmt->execute();
            
            // Registrar en el seguimiento
            $stmt = $this->db->prepare('
                INSERT INTO seguimiento_quejas (queja_id, estado, comentario)
                VALUES (:queja_id, :estado, :comentario)
            ');
            $stmt->bindValue(':queja_id', $quejaId, SQLITE3_INTEGER);
            $stmt->bindValue(':estado', $nuevoEstado, SQLITE3_TEXT);
            $stmt->bindValue(':comentario', $comentario, SQLITE3_TEXT);
            $stmt->execute();
            
            return ['success' => true, 'message' => 'Estado actualizado correctamente'];
        } catch (Exception $e) {
            return ['success' => false, 'message' => 'Error al actualizar estado: ' . $e->getMessage()];
        }
    }
}
?> 