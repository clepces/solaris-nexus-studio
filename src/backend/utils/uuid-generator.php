<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Utils;

final class UuidGenerator
{
    /**
     * Genera un identificador único universal (UUID v4) criptográficamente seguro.
     */
    public static function v4(): string
    {
        $bytes = random_bytes(16);
        $bytes[6] = chr((ord($bytes[6]) & 0x0f) | 0x40); // Version 4
        $bytes[8] = chr((ord($bytes[8]) & 0x3f) | 0x80); // Variant RFC 4122

        return vsprintf('%s%s-%s-%s-%s-%s%s%s', str_split(bin2hex($bytes), 4));
    }
}
