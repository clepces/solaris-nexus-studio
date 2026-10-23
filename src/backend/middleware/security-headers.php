<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Middleware;

final class SecurityHeaders
{
    /**
     * Inyecta cabeceras defensivas para mitigar ataques XSS, clickjacking e inspección no autorizada.
     */
    public static function apply(): void
    {
        if (headers_sent()) {
            return;
        }

        header('X-Content-Type-Options: nosniff');
        header('X-Frame-Options: SAMEORIGIN');
        header('X-XSS-Protection: 1; mode=block');
        header('Referrer-Policy: strict-origin-when-cross-origin');
        header('Content-Security-Policy: default-src \'self\'; script-src \'self\' \'unsafe-inline\'; style-src \'self\' \'unsafe-inline\'; img-src \'self\' data: blob:; connect-src \'self\';');
    }
}
