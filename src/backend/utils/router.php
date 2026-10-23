<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Utils;

use Closure;
use SolarisNexus\Backend\Utils\LoggerService;
use SolarisNexus\Backend\Utils\UuidGenerator;

final class Router
{
    /** @var array<string, array<string, Closure>> */
    private array $routes = [];

    public function __construct(private readonly LoggerService $logger)
    {
    }

    /**
     * Registra una ruta para el método GET.
     */
    public function get(string $pattern, Closure $handler): self
    {
        $this->routes['GET'][$pattern] = $handler;
        return $this;
    }

    /**
     * Registra una ruta para el método POST.
     */
    public function post(string $pattern, Closure $handler): self
    {
        $this->routes['POST'][$pattern] = $handler;
        return $this;
    }

    /**
     * Despacha la petición actual según el método y la URI solicitada.
     */
    public function dispatch(string $method, string $uri): void
    {
        $path = parse_url($uri, PHP_URL_PATH) ?? '/';

        $methodRoutes = $this->routes[$method] ?? [];
        foreach ($methodRoutes as $pattern => $handler) {
            if ($this->match($pattern, $path)) {
                $handler();
                return;
            }
        }

        // 404 No encontrado con UUID Safety
        $uuid = UuidGenerator::v4();
        $this->logger->warning(sprintf('[%s] ROUTE_NOT_FOUND: %s %s', $uuid, $method, $path));

        http_response_code(404);
        header('Content-Type: application/json; charset=UTF-8');
        echo json_encode([
            'success' => false,
            'error_uuid' => $uuid,
            'message' => 'NOT_FOUND: La ruta solicitada no existe en la API REST.',
            'timestamp' => date('c'),
        ], JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    }

    private function match(string $pattern, string $path): bool
    {
        if ($pattern === $path) {
            return true;
        }

        if (str_ends_with($path, $pattern)) {
            return true;
        }

        return false;
    }
}
