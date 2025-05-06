<?php
header('Content-Type: application/json');
require_once 'db_config.php';

$db = new Database();

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);
    
    if (isset($_GET['action'])) {
        switch ($_GET['action']) {
            case 'register':
                if (isset($data['nombre'], $data['email'], $data['telefono'], $data['password'])) {
                    $result = $db->registerUser(
                        $data['nombre'],
                        $data['email'],
                        $data['telefono'],
                        $data['password']
                    );
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
                }
                break;
                
            case 'login':
                if (isset($data['email'], $data['password'])) {
                    $result = $db->loginUser($data['email'], $data['password']);
                    echo json_encode($result);
                } else {
                    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
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