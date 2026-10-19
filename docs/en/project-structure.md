# Source Code Architecture & Directory Layout - Solaris Nexus

## 1. Clean Architecture Principles
- **Strict Kebab-Case:** All folders and files are written strictly in lowercase with hyphen separation (`token-guard-service.ts`, `mod-orchestrator.php`).
- **Compiled Code Shielding:** Developers write exclusively in `/src`. Build artifacts in `/dist` or `/build` are managed solely by automated bundlers.
- **Strict Typing / Zero `any`:** Prohibited usage of `any` in TypeScript. All external I/O data must pass runtime type guards.
- **Fail-Fast Environment Shielding:** Missing critical paths or database connections cause immediate startup aborts rather than runtime cascading errors.

---

## 2. Comprehensive Directory Tree

```text
C:\wamp64\www\sins-of-sola-empire\
├── config/                                 # Global configuration & environment
│   ├── app-config.php                      # WAMP and server execution settings
│   ├── database-config.php                 # Database connection pooling (PDO/SQLite)
│   └── .env.example                        # Secure environment variables template
│
├── docs/                                   # System Architecture & Technical Specs
│   ├── api-spec.md                         # REST API endpoints & contracts
│   ├── architecture-spec.md                # System pillars & high-level architecture
│   ├── database-schema.md                  # Relational ERD & DDL SQL schema
│   ├── engineering-guidelines.md           # Engine limits, memory budgeting & gotchas
│   ├── events-spec.md                      # Asynchronous Event Bus & Pub/Sub catalog
│   ├── mod-system-spec.md                  # Sins VFS, EnabledMods.txt & Priority engine
│   ├── project-structure.md                # This file (Source code routing)
│   ├── ui-components.md                    # UI/UX components, DataGrid & Wireframes
│   └── user-guide.md                       # Operational manual & troubleshooting
│
├── public/                                 # Web root accessible by Apache/WAMP
│   ├── assets/
│   │   ├── css/
│   │   │   ├── main-theme.css              # Dark sci-fi design tokens
│   │   │   ├── datatable-virtual.css       # Styles for 8,000+ rows virtual scrolling
│   │   │   └── mod-manager.css             # Mod conflict grid & badge styles
│   │   └── img/
│   │       ├── nexus-banner.jpg            # Application banner
│   │       └── badges/                     # Status icons
│   ├── index.html                          # Single Page Application entry point
│   └── .htaccess                           # URL rewriting & security headers
│
├── src/                                    # ACTIVE SOURCE CODE
│   ├── backend/                            # Server Core (PHP 8+ / Node.js)
│   │   ├── controllers/
│   │   │   ├── string-controller.php       # Ingestion, parsing, diff & export
│   │   │   ├── mod-controller.php          # Mod scanning & EnabledMods.txt writer
│   │   │   └── system-controller.php       # Language packager & steam_emu config
│   │   ├── services/
│   │   │   ├── str-parser-service.php      # AST parsing of .str grammar
│   │   │   ├── token-guard-service.php     # Regex preservation of *VALUE*, %s
│   │   │   ├── linter-service.php          # Quotation delimiter & NumStrings linter
│   │   │   ├── mod-orchestrator.php        # Priority calculation & conflict matrix
│   │   │   ├── ram-profiler-service.php    # 32-bit memory weight estimator
│   │   │   └── language-packager.php       # Scaffolds Localizations/ directory
│   │   ├── repositories/
│   │   │   ├── project-repository.php      # Project and string DB transactions
│   │   │   ├── translation-memory-repo.php # TM hash lookups & upserts
│   │   │   └── mod-repository.php          # Mod catalog & profile persistence
│   │   └── utils/
│   │       ├── byte-buffer-helper.php      # UTF-8 BOM (0xEF 0xBB 0xBF) & CRLF writer
│   │       ├── uuid-generator.php          # RFC4122 v4 UUID generator
│   │       └── logger-service.php          # Secure on-disk audit logger
│   │
│   ├── frontend/                           # Client Application (TypeScript)
│   │   ├── components/
│   │   │   ├── dashboard-header.ts         # Top bar with game version & RAM meter
│   │   │   ├── mode-switcher.ts            # View tabs (Translation / Mods / Tools)
│   │   │   ├── str-virtual-grid.ts         # Virtualized table for 8,000+ entries
│   │   │   ├── string-editor-modal.ts      # Floating editor with Token Guard feedback
│   │   │   ├── token-highlighter.ts        # Syntax highlighter for C++ & engine tokens
│   │   │   ├── mod-selector-panel.ts       # Main mod radio & minimod checkboxes
│   │   │   ├── conflict-warning-box.ts     # Incompatibility alert banner
│   │   │   ├── status-badge.ts             # Badges: ACTIVE, BETA, IN_DEV, PLANNED
│   │   │   └── memory-load-meter.ts        # 32-bit virtual memory gauge (LAA Guard)
│   │   ├── state/
│   │   │   ├── event-bus.ts                # Client-side Pub/Sub dispatcher
│   │   │   ├── translation-store.ts        # Active string entries state
│   │   │   └── mod-store.ts                # Selected mods & calculated priorities
│   │   └── api-client/
│   │       └── nexus-api-client.ts         # Async REST client with error interception
│   │
│   └── shared/                             # Universal Types & Constants
│       ├── types/
│       │   ├── localization-types.ts       # StringInfo & AST entry schemas
│       │   ├── mod-types.ts                # ModItem, IncompatibilityPair, EnabledArchive
│       │   └── api-response-types.ts       # Standard success and error responses
│       └── constants/
│           ├── reserved-tokens.ts          # Regular expressions for engine variables
│           └── engine-limits.ts            # 32-bit RAM thresholds & buffer sizes
│
├── storage/                                # Local Filesystem Storage (Protected)
│   ├── cache/                              # Parsed AST and diff caches
│   ├── logs/                               # Error audit logs with UUID tracing
│   └── backups/                            # Pre-write safety backups of .str files
│
├── tests/                                  # Automated Quality Assurance Suite
│   ├── unit/
│   │   ├── str-parser.test.ts              # Validates 7,828 entries sequential parsing
│   │   ├── token-guard.test.ts             # Checks variable preservation rules
│   │   ├── mod-priority.test.ts            # Verifies descending priority sort
│   │   └── encoding-bom.test.ts            # Validates 0xEF 0xBB 0xBF byte signature
│   └── fixtures/
│       ├── sample-corrupted.str            # Test file with quotation anomalies
│       └── sample-valid.str                # Canonical English.str.back test file
│
└── readme.md                               # Project manifesto & architectural pillars
```
