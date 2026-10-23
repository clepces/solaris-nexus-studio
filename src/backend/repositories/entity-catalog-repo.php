<?php
declare(strict_types=1);

namespace SolarisNexus\Backend\Repositories;

final class EntityCatalogRepo
{
    /**
     * Retorna el catálogo canónico de naves con valores 100% reales del motor Rebellion.
     */
    public static function getCatalog(): array
    {
        return [
            'entities' => [
                [
                    'id' => 'CAPITALSHIP_TECHBATTLESHIP',
                    'name' => 'Acorazado Kol (TEC)',
                    'faction' => 'TEC Loyalists / Rebels',
                    'factionCode' => 'TEC',
                    'role' => 'Nave Insignia de Combate Pesado',
                    'status' => 'ACTIVE',
                    'isAvailable' => true,
                    'shieldPoints' => 1500.0,
                    'shieldRestore' => 3.60,
                    'hullPoints' => 3600.0,
                    'hullRestore' => 1.80,
                    'antiMatter' => 225.0,
                    'antiMatterRestore' => 0.75,
                    'armorPoints' => 6.0,
                    'maxMitigation' => 0.65,
                    'buildTime' => 75.0,
                    'slotCount' => 50.0,
                    'credits' => 3000.0,
                    'metal' => 400.0,
                    'crystal' => 250.0,
                    'filePath' => 'GameInfo/CAPITALSHIP_TECHBATTLESHIP.entity',
                    'abilities' => [
                        ['id' => 'AbilityGaussBlast', 'name' => 'Cañón Gauss Pesado', 'type' => 'Ataque Focalizado', 'desc' => 'Dispara un proyectil cinético masivo que perfora escudos y blindaje infligiendo 2400 de daño.'],
                        ['id' => 'AbilityFlakBurst', 'name' => 'Ráfaga Antiaérea (Flak)', 'type' => 'Defensa de Punto', 'desc' => 'Detonación esférica de metralla en 360° que aniquila escuadrones de cazas y bombarderos hostiles.'],
                        ['id' => 'AbilityAdaptiveShield', 'name' => 'Escudos Adaptativos', 'type' => 'Mitigación Deflectora', 'desc' => 'Reorienta generadores de pantalla incrementando la absorción y mitigación de daño un +15%.'],
                        ['id' => 'AbilityLastStand', 'name' => 'Momento Cumbre (Finest Hour)', 'type' => 'Protocolo Épico TEC', 'desc' => 'Sobrecarga los reactores de fusión, acelerando la recarga de armas un 60% y autorreparando casco.']
                    ],
                    'weapons' => [
                        ['name' => 'Batería de Haz Pesado', 'type' => 'Beam / Energía', 'dps' => 132.3, 'range' => 5000, 'arc' => 'Frontal (0°)'],
                        ['name' => 'Cañones Automáticos Gauss (x4)', 'type' => 'Cinético / Físico', 'dps' => 166.0, 'range' => 5000, 'arc' => 'Frontal / Flancos / Popa'],
                        ['name' => 'Láseres de Pulso de Fase (x2)', 'type' => 'Energía Directa', 'dps' => 84.0, 'range' => 4500, 'arc' => 'Flanco Babor / Estribor']
                    ]
                ],
                [
                    'id' => 'CAPITALSHIP_TECHSUPPORT',
                    'name' => 'Crucero de Batalla Dunov (TEC)',
                    'faction' => 'TEC Loyalists / Rebels',
                    'factionCode' => 'TEC',
                    'role' => 'Nave de Soporte Táctico y Drenaje de Escudos',
                    'status' => 'ACTIVE',
                    'isAvailable' => true,
                    'shieldPoints' => 1293.75,
                    'shieldRestore' => 3.45,
                    'hullPoints' => 3220.0,
                    'hullRestore' => 1.725,
                    'antiMatter' => 322.0,
                    'antiMatterRestore' => 1.15,
                    'armorPoints' => 4.0,
                    'maxMitigation' => 0.65,
                    'buildTime' => 75.0,
                    'slotCount' => 50.0,
                    'credits' => 3000.0,
                    'metal' => 400.0,
                    'crystal' => 250.0,
                    'filePath' => 'GameInfo/CAPITALSHIP_TECHSUPPORT.entity',
                    'abilities' => [
                        ['id' => 'AbilityShieldRestore', 'name' => 'Restauración de Escudos', 'type' => 'Soporte de Flota', 'desc' => 'Sobrecarga de emergencia que recarga instantáneamente los escudos deflectores de un navío aliado.'],
                        ['id' => 'AbilityEMPBlast', 'name' => 'Pulso EMP Táctico', 'type' => 'Disrupción Electromagnética', 'desc' => 'Descarga que drena reservas de antimateria de objetivos e inhabilita sus sistemas de armamento.'],
                        ['id' => 'AbilityMagnetize', 'name' => 'Polarización Magnética', 'type' => 'Control de Masas', 'desc' => 'Atrae cazas enemigos hacia el casco del objetivo haciéndolos vulnerables al fuego de metralla.'],
                        ['id' => 'AbilityLowCostAbilities', 'name' => 'Campo de Flujo de Antimateria', 'type' => 'Aura Pasiva TEC', 'desc' => 'Campo de resonancia que optimiza reactores de la flota reduciendo costes de habilidad un 25%.']
                    ],
                    'weapons' => [
                        ['name' => 'Cañones Láser Pesados (x2)', 'type' => 'Energía', 'dps' => 58.0, 'range' => 5000, 'arc' => 'Frontal'],
                        ['name' => 'Baterías de Autocañones (x2)', 'type' => 'Cinético', 'dps' => 42.0, 'range' => 4500, 'arc' => 'Flancos']
                    ]
                ],
                [
                    'id' => 'CAPITALSHIP_TECHSIEGE',
                    'name' => 'Dreadnought Marza (TEC)',
                    'faction' => 'TEC Loyalists / Rebels',
                    'factionCode' => 'TEC',
                    'role' => 'Nave de Asedio Planetario y Bombardeo',
                    'status' => 'ACTIVE',
                    'isAvailable' => true,
                    'shieldPoints' => 1207.50,
                    'shieldRestore' => 3.15,
                    'hullPoints' => 3018.75,
                    'hullRestore' => 1.575,
                    'antiMatter' => 235.0,
                    'antiMatterRestore' => 0.80,
                    'armorPoints' => 4.25,
                    'maxMitigation' => 0.65,
                    'buildTime' => 75.0,
                    'slotCount' => 50.0,
                    'credits' => 3000.0,
                    'metal' => 400.0,
                    'crystal' => 250.0,
                    'filePath' => 'GameInfo/CAPITALSHIP_TECHSIEGE.entity',
                    'abilities' => [
                        ['id' => 'AbilityRadiationBomb', 'name' => 'Ojiva de Radiación', 'type' => 'Asedio / Debilitamiento', 'desc' => 'Detona carga nuclear/radiológica que reduce drásticamente la armadura y la resistencia estructural.'],
                        ['id' => 'AbilityRazePlanet', 'name' => 'Bombardeo Incinerador', 'type' => 'Asedio Planetario', 'desc' => 'Protocolo de aniquilación de superficie que devasta infraestructuras y población enemiga.'],
                        ['id' => 'AbilityIncendiaryShells', 'name' => 'Proyectiles Incendiarios', 'type' => 'Daño Térmico Continuo', 'desc' => 'Municiones de termita pesada que calcinan el casco enemigo produciendo daño por segundo residual.'],
                        ['id' => 'AbilityMissileBarrage', 'name' => 'Salva Masiva de Misiles', 'type' => 'Bombardeo en Saturación', 'desc' => 'Lanza una tormenta ininterrumpida de cientos de misiles guiados que satura todo el sector.']
                    ],
                    'weapons' => [
                        ['name' => 'Torretas de Asedio Gauss (x4)', 'type' => 'Cinético Pesado', 'dps' => 110.0, 'range' => 5000, 'arc' => 'Frontal / Flancos'],
                        ['name' => 'Silos de Misiles de Crucero', 'type' => 'Misiles Guiados', 'dps' => 95.0, 'range' => 6000, 'arc' => '360° Omnidireccional']
                    ]
                ],
                [
                    'id' => 'CAPITALSHIP_PSIBATTLESHIP',
                    'name' => 'Acorazado Radiance (Advent)',
                    'faction' => 'Advent Unity',
                    'factionCode' => 'ADV',
                    'role' => 'Nave de Proyección Psiónica y Purificación',
                    'status' => 'ACTIVE',
                    'isAvailable' => true,
                    'shieldPoints' => 2100.0,
                    'shieldRestore' => 3.60,
                    'hullPoints' => 2640.0,
                    'hullRestore' => 1.80,
                    'antiMatter' => 240.0,
                    'antiMatterRestore' => 0.75,
                    'armorPoints' => 5.4,
                    'maxMitigation' => 0.65,
                    'buildTime' => 75.0,
                    'slotCount' => 50.0,
                    'credits' => 3000.0,
                    'metal' => 400.0,
                    'crystal' => 250.0,
                    'filePath' => 'GameInfo/CAPITALSHIP_PSIBATTLESHIP.entity',
                    'abilities' => [
                        ['id' => 'AbilityAntiMatterDetonate', 'name' => 'Detonación de Antimateria', 'type' => 'Ataque Psiónico', 'desc' => 'Convierte las reservas de combustible del objetivo en una explosión que desgarra su propio blindaje.'],
                        ['id' => 'AbilityTaunt', 'name' => 'Animosidad Psiónica', 'type' => 'Control Táctico', 'desc' => 'Emisión telepática que compele a la flota hostil a redirigir todos sus cañones hacia el Radiance.'],
                        ['id' => 'AbilityEnergyAbsorb', 'name' => 'Absorción de Energía', 'type' => 'Defensa Deflectora', 'desc' => 'Matriz de escudos reflectora que absorbe descargas de armas energéticas recargando antimateria.'],
                        ['id' => 'AbilityBeamBlast', 'name' => 'Brillo Purificador (Cleansing)', 'type' => 'Haz Solar Concentrado', 'desc' => 'Columna colosal de plasma psi continuo que vaporiza naves en una trayectoria recta mortal.']
                    ],
                    'weapons' => [
                        ['name' => 'Haz Psiónico Continuo', 'type' => 'Haz Psi', 'dps' => 145.0, 'range' => 5200, 'arc' => 'Frontal (0°)'],
                        ['name' => 'Proyectores de Plasma Psi (x4)', 'type' => 'Plasma Energético', 'dps' => 78.0, 'range' => 4800, 'arc' => 'Flancos Babor / Estribor']
                    ]
                ],
                [
                    'id' => 'CAPITALSHIP_PHASECARRIER',
                    'name' => 'Portanaves Skirantra (Vasari)',
                    'faction' => 'Vasari Empire',
                    'factionCode' => 'VAS',
                    'role' => 'Nave Nodo de Hangar Nanotecnológico',
                    'status' => 'ACTIVE',
                    'isAvailable' => true,
                    'shieldPoints' => 1275.0,
                    'shieldRestore' => 3.00,
                    'hullPoints' => 2425.0,
                    'hullRestore' => 1.50,
                    'antiMatter' => 250.0,
                    'antiMatterRestore' => 0.85,
                    'armorPoints' => 4.0,
                    'maxMitigation' => 0.65,
                    'buildTime' => 75.0,
                    'slotCount' => 50.0,
                    'credits' => 3000.0,
                    'metal' => 400.0,
                    'crystal' => 250.0,
                    'filePath' => 'GameInfo/CAPITALSHIP_PHASECARRIER.entity',
                    'abilities' => [
                        ['id' => 'AbilityNanoHullRepair', 'name' => 'Enjambre Nanotecnológico', 'type' => 'Autorreparación Celular', 'desc' => 'Dispersa nubes de nanorobots que reconstruyen activamente el blindaje y casco de naves aliadas.'],
                        ['id' => 'AbilitySpawnSquad', 'name' => 'Replicación Rápida de Cazas', 'type' => 'Hangar Nanotáctico', 'desc' => 'Ensamblaje molecular instantáneo de un escuadrón completo de interceptores Vasari en pleno combate.'],
                        ['id' => 'AbilityFighterBlink', 'name' => 'Salto de Fase de Escuadrones', 'type' => 'Teletransportación', 'desc' => 'Desfasa escuadrones a través del espacio hiperbólico colocándolos al instante sobre la retaguardia enemiga.'],
                        ['id' => 'AbilityCloneFrigate', 'name' => 'Desfase Inmaterial (Phase Out)', 'type' => 'Inmunidad de Fase', 'desc' => 'Desplaza temporalmente el navío a una dimensión no física, volviéndolo inmune a todo daño entrante.']
                    ],
                    'weapons' => [
                        ['name' => 'Bahías de Hangares Vasari (x4)', 'type' => 'Lanzadera de Cazas', 'dps' => 120.0, 'range' => 8000, 'arc' => 'Proyección Táctica Global'],
                        ['name' => 'Cañones de Pulso de Fase (x2)', 'type' => 'Pulso de Fase', 'dps' => 64.0, 'range' => 4500, 'arc' => 'Flancos Babor / Estribor']
                    ]
                ]
            ]
        ];
    }
}
