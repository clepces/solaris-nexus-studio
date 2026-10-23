<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Middleware;

final class CorsMiddleware
{
    /**
     * Aplica cabeceras seguras de CORS para desarrollo local y orígenes restringidos.
     */
    public static function handle(): void
    {
        $origin = $_SERVER['HTTP_ORIGIN'] ?? '*';
        $allowedOrigins = ['http://localhost', 'http://127.0.0.1'];
        
        $isAllowed = false;
        foreach ($allowedOrigins as $allowed) {
            if (str_starts_with($origin, $allowed)) {
                $isAllowed = true;
                break;
            }
        }

        header('Access-Control-Allow-Origin: ' . ($isAllowed ? $origin : 'http://localhost'));
        header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
        header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');
        header('Access-Control-Max-Age: 86400');

        if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
            http_response_code(204);
            exit(0);
        }
    }
}
