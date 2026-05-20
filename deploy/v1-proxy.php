<?php
/**
 * Proxy /v1/* → http://86.48.23.197/v1/*
 * Guardar como public_html/v1/index.php
 */

$api = 'http://86.48.23.197';

$method  = $_SERVER['REQUEST_METHOD'];
$path = '/v1/' . $_GET['_v1_path'];
$params = $_GET;
unset($params['_v1_path']);
if (!empty($params)) {
    $path .= '?' . http_build_query($params);
}
$body    = file_get_contents('php://input');
$headers = ['Expect:'];

foreach (getallheaders() as $key => $value) {
    $lower = strtolower($key);
    if ($lower === 'host' || $lower === 'content-length') continue;
    $headers[] = "$key: $value";
}

$ch = curl_init($api . $path);
curl_setopt_array($ch, [
    CURLOPT_CUSTOMREQUEST  => $method,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HEADER         => true,
    CURLOPT_HTTPHEADER     => $headers,
    CURLOPT_CONNECTTIMEOUT => 10,
    CURLOPT_TIMEOUT        => 30,
]);

if (!empty($body)) {
    curl_setopt($ch, CURLOPT_POSTFIELDS, $body);
}

$response = curl_exec($ch);

if ($response === false) {
    http_response_code(502);
    echo json_encode(['error' => ['message' => 'Bad Gateway: ' . curl_error($ch)]]);
    curl_close($ch);
    exit;
}

$headerSize = curl_getinfo($ch, CURLINFO_HEADER_SIZE);
$httpCode   = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

$rawHeaders = substr($response, 0, $headerSize);
$body       = substr($response, $headerSize);

// Forward Set-Cookie headers from API to browser
preg_match_all('/^Set-Cookie:\s*(.+)$/im', $rawHeaders, $matches);
foreach ($matches[1] as $cookie) {
    header("Set-Cookie: $cookie", false);
}

// Forward Content-Type
preg_match('/^Content-Type:\s*(.+)$/im', $rawHeaders, $ct);
if (!empty($ct[1])) {
    header("Content-Type: $ct[1]");
}

http_response_code($httpCode);
echo $body;
