<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Получаем метод запроса
$method = $_SERVER['REQUEST_METHOD'];

// Получаем путь из URL
$requestUri = $_SERVER['REQUEST_URI'];
$scriptName = $_SERVER['SCRIPT_NAME'];
$path = str_replace($scriptName, '', $requestUri);
$path = trim($path, '/');

// URL Node.js сервера
$apiUrl = "http://127.0.0.1:3000/api";

// ==== ОБРАБОТКА UPLOAD (Base64 сохраняем локально, остальное проксируем) ====
if (strpos($path, 'upload') === 0) {
    if ($method === 'POST') {
        handleUpload();
        exit;
    } elseif ($method === 'GET') {
        serveImage();
        exit;
    }
}

// ==== ПРОКСИРОВАНИЕ ВСЕХ ОСТАЛЬНЫХ ЗАПРОСОВ НА NODE.JS ====

// Добавляем путь к URL
if (!empty($path)) {
    $apiUrl .= '/' . $path;
}

// Добавляем query string
$queryString = $_SERVER['QUERY_STRING'] ?? '';
if (!empty($queryString)) {
    $apiUrl .= '?' . $queryString;
}

// Логирование
error_log("API Proxy: $method $apiUrl");

// Инициализируем cURL
$ch = curl_init();

// Настраиваем cURL
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

// Обработка POST с _method override (для обхода nginx PUT limitation)
$postData = null;
$headers = [];

// Добавляем Authorization заголовок если есть
$authHeader = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
if ($authHeader) {
    $headers[] = 'Authorization: ' . $authHeader;
}

if ($method === 'POST') {
    $postData = file_get_contents('php://input');
    $data = json_decode($postData, true);
    
    // Если есть _method override, используем его как реальный метод
    if (isset($data['_method'])) {
        $realMethod = $data['_method'];
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $realMethod);
        // Удаляем _method из данных перед отправкой в Node.js
        unset($data['_method']);
        $postData = json_encode($data);
    }
    
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    $headers[] = 'Content-Type: ' . ($_SERVER['CONTENT_TYPE'] ?? 'application/json');
    $headers[] = 'Content-Length: ' . strlen($postData);
    
    error_log("POST Data: " . $postData);
}

// Устанавливаем заголовки
if (!empty($headers)) {
    curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
}

// Выполняем запрос
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

// Логирование результатов
error_log("Response Code: $httpCode");
error_log("Response: " . substr($response, 0, 500));

// Отправляем ответ
http_response_code($httpCode);
echo $response;

// ==== ФУНКЦИИ ====

function handleUpload() {
    $rawInput = file_get_contents('php://input');
    $input = json_decode($rawInput, true);
    
    error_log("Upload request received");
    
    // Base64 метод
    if (isset($input['image']) && isset($input['fileName']) && isset($input['mimeType'])) {
        $imageData = $input['image'];
        $fileName = $input['fileName'];
        $mimeType = $input['mimeType'];
        
        error_log("Base64 Upload: Name=$fileName, Type=$mimeType");
        
        // Декодируем Base64
        $imageData = preg_replace('#^data:image/\w+;base64,#i', '', $imageData);
        $imageBinary = base64_decode($imageData);
        
        // Генерируем уникальное имя файла
        $uniqueSuffix = time() . '-' . rand(1000, 9999);
        $fileExtension = pathinfo($fileName, PATHINFO_EXTENSION);
        $finalFileName = 'image-' . $uniqueSuffix . '.' . $fileExtension;
        $finalPath = 'uploads/' . $finalFileName;
        
        // Создаем папку uploads если нет
        if (!is_dir('uploads')) {
            mkdir('uploads', 0755, true);
        }
        
        // Сохраняем файл
        if (file_put_contents($finalPath, $imageBinary)) {
            $imageUrl = '/uploads/' . $finalFileName;
            error_log("Base64 файл сохранен: $imageUrl");
            
            echo json_encode([
                'success' => true,
                'imageUrl' => $imageUrl,
                'filename' => $finalFileName
            ]);
        } else {
            error_log("Ошибка сохранения Base64 файла");
            http_response_code(500);
            echo json_encode(['error' => 'Ошибка сохранения файла']);
        }
        return;
    }
    
    // Обычный multipart метод - проксируем на Node.js
    if (isset($_FILES['image'])) {
        $file = $_FILES['image'];
        $filePath = $file['tmp_name'];
        $fileName = $file['name'];
        $fileType = $file['type'];
        
        error_log("Multipart upload: $fileName");
        
        if ($file['error'] !== UPLOAD_ERR_OK) {
            http_response_code(400);
            echo json_encode(['error' => 'Ошибка загрузки файла: ' . $file['error']]);
            return;
        }
        
        // Создаем CURLFile
        $cfile = new CURLFile($filePath, $fileType, $fileName);
        $data = ['image' => $cfile];
        
        $apiUrl = "http://127.0.0.1:3000/api/upload";
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        http_response_code($httpCode);
        echo $response;
        return;
    }
    
    http_response_code(400);
    echo json_encode(['error' => 'Нет данных для загрузки']);
}

function serveImage() {
    $imagePath = $_GET['file'] ?? '';
    
    if (empty($imagePath)) {
        http_response_code(400);
        echo 'No file specified';
        return;
    }
    
    // Безопасность - проверяем что файл в папке uploads
    $fullPath = realpath('uploads/' . $imagePath);
    $uploadsPath = realpath('uploads/');
    
    if (!$fullPath || !$uploadsPath || strpos($fullPath, $uploadsPath) !== 0 || !file_exists($fullPath)) {
        error_log("Image not found: $fullPath");
        http_response_code(404);
        echo 'Image not found';
        return;
    }
    
    // Определяем MIME тип
    $imageInfo = getimagesize($fullPath);
    if ($imageInfo === false) {
        http_response_code(400);
        echo 'Invalid image';
        return;
    }
    
    header('Content-Type: ' . $imageInfo['mime']);
    header('Content-Length: ' . filesize($fullPath));
    readfile($fullPath);
}
?>
