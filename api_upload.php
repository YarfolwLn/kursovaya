<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Включаем отображение всех ошибок
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Получаем данные из тела запроса
$rawInput = file_get_contents('php://input');
$input = json_decode($rawInput, true);

// Логирование для отладки
error_log("Raw input length: " . strlen($rawInput));
error_log("Content-Type: " . ($_SERVER['CONTENT_TYPE'] ?? 'not set'));
error_log("Request input: " . print_r($input, true));
error_log("FILES data: " . print_r($_FILES, true));

// Получаем метод запроса
$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'POST') {
    // Проверяем Base64 метод
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
        
        error_log("Final file path: $finalPath");
        
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
            echo json_encode(['error' => 'Ошибка сохранения файла']);
        }
    }
    // Обычный multipart метод (запасной)
    elseif (isset($_FILES['image'])) {
        $file = $_FILES['image'];
        $filePath = $file['tmp_name'];
        $fileName = $file['name'];
        $fileType = $file['type'];
        $fileSize = $file['size'];
        $errorCode = $file['error'];
        
        // Исправляем кодировку имени файла
        $fileName = mb_convert_encoding($fileName, 'UTF-8', 'ASCII');
        
        error_log("Upload file details (UTF-8 fixed): Name=$fileName, Type=$fileType, Size=$fileSize, Path=$filePath, Error=$errorCode");
        
        // Проверяем ошибки загрузки файла
        if ($errorCode !== UPLOAD_ERR_OK) {
            $errorMessages = [
                UPLOAD_ERR_INI_SIZE => 'Файл превышает лимит upload_max_filesize',
                UPLOAD_ERR_FORM_SIZE => 'Файл превышает лимит MAX_FILE_SIZE',
                UPLOAD_ERR_PARTIAL => 'Файл загружен частично',
                UPLOAD_ERR_NO_FILE => 'Файл не был загружен',
                UPLOAD_ERR_NO_TMP_DIR => 'Отсутствует временная папка',
                UPLOAD_ERR_CANT_WRITE => 'Ошибка записи файла на диск',
                UPLOAD_ERR_EXTENSION => 'Загрузка файла остановлена расширением',
            ];
            
            $errorMessage = $errorMessages[$errorCode] ?? 'Неизвестная ошибка загрузки';
            error_log("Upload error: $errorCode - $errorMessage");
            echo json_encode(['error' => $errorMessage]);
            http_response_code(400);
            exit;
        }
        
        // Проверяем что файл действительно существует
        if (!file_exists($filePath)) {
            error_log("File does not exist: $filePath");
            echo json_encode(['error' => 'Временный файл не найден']);
            http_response_code(400);
            exit;
        }
        
        // Проверяем размер файла
        $maxSize = 5 * 1024 * 1024; // 5MB
        if ($fileSize > $maxSize) {
            error_log("File too large: $fileSize > $maxSize");
            echo json_encode(['error' => 'Файл слишком большой (максимум 5MB)']);
            http_response_code(400);
            exit;
        }
        
        // Создаем CURLFile для загрузки
        if (class_exists('CURLFile')) {
            $cfile = new CURLFile($filePath, $fileName, $fileType);
            $data = ['image' => $cfile];
            error_log("Using CURLFile class");
        } else {
            // Альтернативный способ для старых версий PHP
            $data = [
                'image' => '@' . $filePath
            ];
            error_log("Using legacy file upload method");
        }
        
        // Выполняем запрос
        $apiUrl = "http://127.0.0.1:3000/api/upload";
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $apiUrl);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        curl_close($ch);
        
        error_log("CURL Response Code: $httpCode");
        error_log("CURL Response: " . substr($response, 0, 500));
        error_log("CURL Error: $error");
        
        http_response_code($httpCode);
        echo $response;
    } else {
        error_log("No upload data received");
        echo json_encode(['error' => 'Нет данных для загрузки']);
    }
} elseif ($method === 'GET') {
    // Отдача изображений
    $imagePath = $_GET['file'] ?? '';
    
    error_log("GET image request: $imagePath");
    
    // Безопасность - проверяем что файл в папке uploads
    $fullPath = realpath('uploads/' . $imagePath);
    $uploadsPath = realpath('uploads/');
    
    if (strpos($fullPath, $uploadsPath) !== 0 || !file_exists($fullPath)) {
        error_log("Image not found: $fullPath");
        http_response_code(404);
        echo 'Image not found';
        exit;
    }
    
    // Определяем MIME тип
    $imageInfo = getimagesize($fullPath);
    if ($imageInfo === false) {
        error_log("Invalid image: $fullPath");
        http_response_code(400);
        echo 'Invalid image';
        exit;
    }
    
    header('Content-Type: ' . $imageInfo['mime']);
    header('Content-Length: ' . filesize($fullPath));
    readfile($fullPath);
    exit;
} else {
    error_log("Wrong method: $method");
    echo json_encode(['error' => 'Неправильный метод запроса']);
}
?>
