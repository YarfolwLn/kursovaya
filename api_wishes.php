<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Получаем метод запроса
$method = $_SERVER['REQUEST_METHOD'];

// URL вашего Node.js сервера
$apiUrl = "http://127.0.0.1:3000/api/wishes";

// Логирование для отладки
error_log("Wishes API Proxy: $method $apiUrl");

// Инициализируем cURL
$ch = curl_init();

// Настраиваем cURL
curl_setopt($ch, CURLOPT_URL, $apiUrl);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);

// Обработка POST запросов
if ($method === 'POST') {
    $postData = file_get_contents('php://input');
    curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
    curl_setopt($ch, CURLOPT_HTTPHEADER, [
        'Content-Type: application/json',
        'Content-Length: ' . strlen($postData)
    ]);
    
    error_log("POST Data: " . $postData);
}

// Выполняем запрос
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);

curl_close($ch);

// Логирование результатов
error_log("Response Code: $httpCode");
error_log("Response: " . substr($response, 0, 500));

// Отправляем ответ
http_response_code($httpCode);
echo $response;
?>
