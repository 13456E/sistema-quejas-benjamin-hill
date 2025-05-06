<?php
header('Content-Type: application/json');
require_once 'db_config.php';

$db = new Database();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($_GET['action'])) {
        switch ($_GET['action']) {
            case 'registrar_queja':
                if (isset($data['usuario_id'], $data['tipo'], $data['descripcion'])) {
                    $stmt = $db->db->prepare('
                        INSERT INTO quejas (usuario_id, tipo, descripcion)
                        VALUES (:usuario_id, :tipo, :descripcion)
                    ');
                    
                    $stmt->bindValue(':usuario_id', $data['usuario_id'], SQLITE3_INTEGER);
                    $stmt->bindValue(':tipo', $data['tipo'], SQLITE3_TEXT);
                    $stmt->bindValue(':descripcion', $data['descripcion'], SQLITE3_TEXT);
                    
                    $result = $stmt->execute();
                    
                    if ($result) {
                        echo json_encode(['success' => true, 'message' => 'Queja registrada exitosamente']);
                    } else {
                        echo json_encode(['success' => false, 'message' => 'Error al registrar la queja']);
                    }
                } else {
                    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
                }
                break;
                
            case 'obtener_quejas':
                if (isset($data['usuario_id'])) {
                    $stmt = $db->db->prepare('
                        SELECT * FROM quejas 
                        WHERE usuario_id = :usuario_id 
                        ORDER BY fecha_creacion DESC
                    ');
                    
                    $stmt->bindValue(':usuario_id', $data['usuario_id'], SQLITE3_INTEGER);
                    $result = $stmt->execute();
                    
                    $quejas = [];
                    while ($row = $result->fetchArray(SQLITE3_ASSOC)) {
                        $quejas[] = $row;
                    }
                    
                    echo json_encode(['success' => true, 'quejas' => $quejas]);
                } else {
                    echo json_encode(['success' => false, 'message' => 'ID de usuario no proporcionado']);
                }
                break;
                
            case 'registrar_sugerencia':
                if (isset($data['usuario_id'], $data['titulo'], $data['categoria'], $data['descripcion'])) {
                    $stmt = $db->db->prepare('
                        INSERT INTO sugerencias (usuario_id, titulo, categoria, descripcion)
                        VALUES (:usuario_id, :titulo, :categoria, :descripcion)
                    ');
                    
                    $stmt->bindValue(':usuario_id', $data['usuario_id'], SQLITE3_INTEGER);
                    $stmt->bindValue(':titulo', $data['titulo'], SQLITE3_TEXT);
                    $stmt->bindValue(':categoria', $data['categoria'], SQLITE3_TEXT);
                    $stmt->bindValue(':descripcion', $data['descripcion'], SQLITE3_TEXT);
                    
                    $result = $stmt->execute();
                    
                    if ($result) {
                        echo json_encode(['success' => true, 'message' => 'Sugerencia registrada exitosamente']);
                    } else {
                        echo json_encode(['success' => false, 'message' => 'Error al registrar la sugerencia']);
                    }
                } else {
                    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
                }
                break;
                
            case 'obtener_detalle_queja':
                if (isset($data['queja_id'])) {
                    $result = $db->obtenerDetalleQueja($data['queja_id']);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'ID de queja no proporcionado']);
                }
                break;
                
            case 'actualizar_estado':
                if (isset($data['queja_id'], $data['estado'], $data['comentario'])) {
                    $result = $db->actualizarEstadoQueja(
                        $data['queja_id'],
                        $data['estado'],
                        $data['comentario']
                    );
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Datos incompletos para actualizar estado']);
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
?> 