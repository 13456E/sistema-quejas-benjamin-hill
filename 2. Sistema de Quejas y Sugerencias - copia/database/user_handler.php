<?php
header('Content-Type: application/json');
require_once 'db_config.php';

$db = new Database();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($_GET['action'])) {
        switch ($_GET['action']) {
            case 'get_stats':
                if (isset($data['usuario_id'])) {
                    $stats = [
                        'activas' => getActiveComplaints($db, $data['usuario_id']),
                        'totales' => getTotalComplaints($db, $data['usuario_id']),
                        'sugerencias' => getTotalSuggestions($db, $data['usuario_id']),
                        'resueltas' => getResolvedComplaints($db, $data['usuario_id'])
                    ];
                    echo json_encode(['success' => true] + $stats);
                } else {
                    echo json_encode(['success' => false, 'message' => 'ID de usuario no proporcionado']);
                }
                break;

            case 'update_profile':
                if (isset($data['usuario_id'], $data['nombre'], $data['email'], $data['telefono'])) {
                    $result = updateUserProfile($db, $data);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
                }
                break;

            case 'change_password':
                if (isset($data['usuario_id'], $data['current_password'], $data['new_password'])) {
                    $result = changeUserPassword($db, $data);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
                }
                break;

            case 'delete_account':
                if (isset($data['usuario_id'], $data['password'])) {
                    $result = deleteUserAccount($db, $data);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
                }
                break;

            case 'setup_2fa':
                if (isset($data['usuario_id'])) {
                    $result = setup2FA($db, $data['usuario_id']);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'ID de usuario no proporcionado']);
                }
                break;

            case 'verify_2fa':
                if (isset($data['usuario_id'], $data['code'], $data['secret'])) {
                    $result = verify2FA($db, $data);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
                }
                break;

            case 'check_2fa_status':
                if (isset($data['usuario_id'])) {
                    $result = check2FAStatus($db, $data['usuario_id']);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'ID de usuario no proporcionado']);
                }
                break;

            case 'export_data':
                if (isset($data['usuario_id'])) {
                    $result = exportUserData($db, $data['usuario_id']);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'ID de usuario no proporcionado']);
                }
                break;

            default:
                echo json_encode(['success' => false, 'message' => 'Acción no válida']);
        }
    } else {
        echo json_encode(['success' => false, 'message' => 'Acción no especificada']);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
}

// Funciones auxiliares
function getActiveComplaints($db, $userId) {
    $stmt = $db->db->prepare('
        SELECT COUNT(*) as count 
        FROM quejas 
        WHERE usuario_id = :usuario_id 
        AND estado = "pendiente"
    ');
    $stmt->bindValue(':usuario_id', $userId, SQLITE3_INTEGER);
    $result = $stmt->execute();
    $row = $result->fetchArray(SQLITE3_ASSOC);
    return $row['count'];
}

function getTotalComplaints($db, $userId) {
    $stmt = $db->db->prepare('
        SELECT COUNT(*) as count 
        FROM quejas 
        WHERE usuario_id = :usuario_id
    ');
    $stmt->bindValue(':usuario_id', $userId, SQLITE3_INTEGER);
    $result = $stmt->execute();
    $row = $result->fetchArray(SQLITE3_ASSOC);
    return $row['count'];
}

function getTotalSuggestions($db, $userId) {
    $stmt = $db->db->prepare('
        SELECT COUNT(*) as count 
        FROM sugerencias 
        WHERE usuario_id = :usuario_id
    ');
    $stmt->bindValue(':usuario_id', $userId, SQLITE3_INTEGER);
    $result = $stmt->execute();
    $row = $result->fetchArray(SQLITE3_ASSOC);
    return $row['count'];
}

function getResolvedComplaints($db, $userId) {
    $stmt = $db->db->prepare('
        SELECT COUNT(*) as count 
        FROM quejas 
        WHERE usuario_id = :usuario_id 
        AND estado = "resuelto"
    ');
    $stmt->bindValue(':usuario_id', $userId, SQLITE3_INTEGER);
    $result = $stmt->execute();
    $row = $result->fetchArray(SQLITE3_ASSOC);
    return $row['count'];
}

function updateUserProfile($db, $data) {
    try {
        // Verificar si el email ya existe para otro usuario
        $stmt = $db->db->prepare('
            SELECT id 
            FROM usuarios 
            WHERE email = :email 
            AND id != :usuario_id
        ');
        $stmt->bindValue(':email', $data['email'], SQLITE3_TEXT);
        $stmt->bindValue(':usuario_id', $data['usuario_id'], SQLITE3_INTEGER);
        $result = $stmt->execute();
        
        if ($result->fetchArray()) {
            return ['success' => false, 'message' => 'El correo electrónico ya está en uso'];
        }

        // Actualizar perfil
        $stmt = $db->db->prepare('
            UPDATE usuarios 
            SET nombre = :nombre,
                email = :email,
                telefono = :telefono
            WHERE id = :usuario_id
        ');
        
        $stmt->bindValue(':nombre', $data['nombre'], SQLITE3_TEXT);
        $stmt->bindValue(':email', $data['email'], SQLITE3_TEXT);
        $stmt->bindValue(':telefono', $data['telefono'], SQLITE3_TEXT);
        $stmt->bindValue(':usuario_id', $data['usuario_id'], SQLITE3_INTEGER);
        
        $stmt->execute();
        
        return [
            'success' => true, 
            'message' => 'Perfil actualizado exitosamente',
            'user' => [
                'id' => $data['usuario_id'],
                'nombre' => $data['nombre'],
                'email' => $data['email'],
                'telefono' => $data['telefono']
            ]
        ];
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Error al actualizar perfil: ' . $e->getMessage()];
    }
}

function changeUserPassword($db, $data) {
    try {
        // Verificar contraseña actual
        $stmt = $db->db->prepare('SELECT password FROM usuarios WHERE id = :usuario_id');
        $stmt->bindValue(':usuario_id', $data['usuario_id'], SQLITE3_INTEGER);
        $result = $stmt->execute();
        $user = $result->fetchArray(SQLITE3_ASSOC);
        
        if (!$user || !password_verify($data['current_password'], $user['password'])) {
            return ['success' => false, 'message' => 'Contraseña actual incorrecta'];
        }

        // Actualizar contraseña
        $hashedPassword = password_hash($data['new_password'], PASSWORD_DEFAULT);
        $stmt = $db->db->prepare('
            UPDATE usuarios 
            SET password = :password 
            WHERE id = :usuario_id
        ');
        
        $stmt->bindValue(':password', $hashedPassword, SQLITE3_TEXT);
        $stmt->bindValue(':usuario_id', $data['usuario_id'], SQLITE3_INTEGER);
        
        $stmt->execute();
        
        return ['success' => true, 'message' => 'Contraseña actualizada exitosamente'];
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Error al cambiar contraseña: ' . $e->getMessage()];
    }
}

function deleteUserAccount($db, $data) {
    try {
        // Verificar contraseña
        $stmt = $db->db->prepare('SELECT password FROM usuarios WHERE id = :usuario_id');
        $stmt->bindValue(':usuario_id', $data['usuario_id'], SQLITE3_INTEGER);
        $result = $stmt->execute();
        $user = $result->fetchArray(SQLITE3_ASSOC);
        
        if (!$user || !password_verify($data['password'], $user['password'])) {
            return ['success' => false, 'message' => 'Contraseña incorrecta'];
        }

        // Iniciar transacción
        $db->db->exec('BEGIN TRANSACTION');

        try {
            // Eliminar seguimiento de quejas
            $stmt = $db->db->prepare('
                DELETE FROM seguimiento_quejas 
                WHERE queja_id IN (
                    SELECT id FROM quejas WHERE usuario_id = :usuario_id
                )
            ');
            $stmt->bindValue(':usuario_id', $data['usuario_id'], SQLITE3_INTEGER);
            $stmt->execute();

            // Eliminar quejas
            $stmt = $db->db->prepare('DELETE FROM quejas WHERE usuario_id = :usuario_id');
            $stmt->bindValue(':usuario_id', $data['usuario_id'], SQLITE3_INTEGER);
            $stmt->execute();

            // Eliminar sugerencias
            $stmt = $db->db->prepare('DELETE FROM sugerencias WHERE usuario_id = :usuario_id');
            $stmt->bindValue(':usuario_id', $data['usuario_id'], SQLITE3_INTEGER);
            $stmt->execute();

            // Eliminar usuario
            $stmt = $db->db->prepare('DELETE FROM usuarios WHERE id = :usuario_id');
            $stmt->bindValue(':usuario_id', $data['usuario_id'], SQLITE3_INTEGER);
            $stmt->execute();

            $db->db->exec('COMMIT');
            return ['success' => true, 'message' => 'Cuenta eliminada exitosamente'];
        } catch (Exception $e) {
            $db->db->exec('ROLLBACK');
            throw $e;
        }
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Error al eliminar cuenta: ' . $e->getMessage()];
    }
}

function setup2FA($db, $userId) {
    try {
        require_once __DIR__ . '/totp.php';
        
        // Verificar si ya tiene 2FA activado
        $stmt = $db->db->prepare('SELECT two_factor_enabled FROM usuarios WHERE id = :usuario_id');
        $stmt->bindValue(':usuario_id', $userId, SQLITE3_INTEGER);
        $result = $stmt->execute();
        $user = $result->fetchArray(SQLITE3_ASSOC);
        
        if ($user && $user['two_factor_enabled']) {
            return ['success' => false, 'message' => '2FA ya está activado para este usuario'];
        }

        // Generar nuevo secreto
        $secret = TOTP::generateSecret();
        
        // Obtener información del usuario
        $stmt = $db->db->prepare('SELECT email FROM usuarios WHERE id = :usuario_id');
        $stmt->bindValue(':usuario_id', $userId, SQLITE3_INTEGER);
        $result = $stmt->execute();
        $user = $result->fetchArray(SQLITE3_ASSOC);
        
        if (!$user) {
            return ['success' => false, 'message' => 'Usuario no encontrado'];
        }

        // Guardar secreto temporalmente
        $stmt = $db->db->prepare('
            UPDATE usuarios 
            SET two_factor_secret = :secret
            WHERE id = :usuario_id
        ');
        $stmt->bindValue(':secret', $secret, SQLITE3_TEXT);
        $stmt->bindValue(':usuario_id', $userId, SQLITE3_INTEGER);
        $stmt->execute();

        $qrCodeUrl = TOTP::getQRCodeUrl('Sistema de Quejas - ' . $user['email'], $secret);

        return [
            'success' => true,
            'secret' => $secret,
            'qr_code' => $qrCodeUrl
        ];
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Error al configurar 2FA: ' . $e->getMessage()];
    }
}

function verify2FA($db, $data) {
    try {
        require_once __DIR__ . '/totp.php';
        
        // Verificar si el código es válido
        $result = TOTP::verifyCode($data['secret'], $data['code']);
        
        if ($result) {
            // Activar 2FA
            $stmt = $db->db->prepare('
                UPDATE usuarios 
                SET two_factor_enabled = 1
                WHERE id = :usuario_id AND two_factor_secret = :secret
            ');
            $stmt->bindValue(':usuario_id', $data['usuario_id'], SQLITE3_INTEGER);
            $stmt->bindValue(':secret', $data['secret'], SQLITE3_TEXT);
            $stmt->execute();
            
            if ($db->db->changes() > 0) {
                return ['success' => true, 'message' => '2FA configurado exitosamente'];
            } else {
                return ['success' => false, 'message' => 'No se pudo activar 2FA'];
            }
        } else {
            return ['success' => false, 'message' => 'Código incorrecto'];
        }
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Error al verificar código: ' . $e->getMessage()];
    }
}

function check2FAStatus($db, $userId) {
    try {
        $stmt = $db->db->prepare('
            SELECT two_factor_enabled 
            FROM usuarios 
            WHERE id = :usuario_id
        ');
        $stmt->bindValue(':usuario_id', $userId, SQLITE3_INTEGER);
        $result = $stmt->execute();
        $user = $result->fetchArray(SQLITE3_ASSOC);
        
        if ($user) {
            return [
                'success' => true,
                'enabled' => (bool)$user['two_factor_enabled']
            ];
        } else {
            return ['success' => false, 'message' => 'Usuario no encontrado'];
        }
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Error al verificar estado del 2FA: ' . $e->getMessage()];
    }
}

function exportUserData($db, $userId) {
    try {
        // Obtener datos del usuario
        $stmt = $db->db->prepare('
            SELECT id, nombre, email, telefono, fecha_registro
            FROM usuarios 
            WHERE id = :usuario_id
        ');
        $stmt->bindValue(':usuario_id', $userId, SQLITE3_INTEGER);
        $result = $stmt->execute();
        $userData = $result->fetchArray(SQLITE3_ASSOC);

        if (!$userData) {
            return ['success' => false, 'message' => 'Usuario no encontrado'];
        }

        // Obtener quejas
        $stmt = $db->db->prepare('
            SELECT q.*, 
                   (SELECT GROUP_CONCAT(json_object(
                       "fecha", s.fecha,
                       "estado", s.estado,
                       "comentario", s.comentario
                   )) 
                   FROM seguimiento_quejas s 
                   WHERE s.queja_id = q.id) as seguimiento
            FROM quejas q
            WHERE q.usuario_id = :usuario_id
            ORDER BY q.fecha_creacion DESC
        ');
        $stmt->bindValue(':usuario_id', $userId, SQLITE3_INTEGER);
        $result = $stmt->execute();
        
        $complaints = [];
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            if ($row['seguimiento']) {
                $row['seguimiento'] = json_decode('[' . $row['seguimiento'] . ']', true);
            } else {
                $row['seguimiento'] = [];
            }
            $complaints[] = $row;
        }

        // Obtener sugerencias
        $stmt = $db->db->prepare('
            SELECT * FROM sugerencias 
            WHERE usuario_id = :usuario_id 
            ORDER BY fecha_creacion DESC
        ');
        $stmt->bindValue(':usuario_id', $userId, SQLITE3_INTEGER);
        $result = $stmt->execute();
        
        $suggestions = [];
        while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
            $suggestions[] = $row;
        }

        return [
            'success' => true,
            'user_data' => $userData,
            'complaints' => $complaints,
            'suggestions' => $suggestions
        ];
    } catch (Exception $e) {
        return ['success' => false, 'message' => 'Error al exportar datos: ' . $e->getMessage()];
    }
}
?> 