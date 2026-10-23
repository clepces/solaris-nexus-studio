<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Middleware;

use SolarisNexus\Backend\Utils\LoggerService;
use SolarisNexus\Backend\Utils\UuidGenerator;
use Throwable;

final class ErrorHandlerMiddleware
{
    /**
     * Captura excepciones globales cumpliendo el protocolo corporativo UUID Safety (Cero Stack Traces).
     */
    public static function handle(Throwable $e, LoggerService $logger): void
    {
        $uuid = UuidGenerator::v4();
        
        // Log interno con contexto completo (enmascarando rutas sensibles)
        $logger->error(sprintf('[%s] %s in %s:%d', $uuid, $e->getMessage(), basename($e->getFile()), $e->getLine()));

        // Respuesta HTTP segura sin filtrar rutas de disco
        if (!headers_sent()) {
            http_response_code(500);
            header('Content-Type: application/json; charset=UTF-8');
        }

        echo json_encode([
            'success' => false,
            'error_uuid' => $uuid,
            'message' => 'INTERNAL_SERVER_ERROR: Se ha producido un fallo controlado en el subsistema.',
            'timestamp' => date('c'),
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        exit(1);
    }
}
