# AGDF Source-of-Truth Registry

Use this file to prevent parallel sources of truth. Each domain should have one primary owner.

## Primary Sources of Truth

| Domain | SoT Document | Status | Owner | Last Verified |
|---|---|---|---|---|
| Product intent | [Glass Towers PRD](artefacts/glass-towers/PRD.md) | active | Product owner | 2026-08-20 |
| Gallery environment product intent | [Galerieumgebung PRD](artefacts/glass-towers-gallery-environment/PRD.md) | active | Product owner | 2026-08-20 |
| Glass material product intent | [Glasmaterialien PRD](artefacts/glass-towers-webgpu-glass-materials/PRD.md) | active | Product owner | 2026-08-21 |
| Architecture | [Glass Towers SD](artefacts/glass-towers/SD.md) | active | Technical owner | 2026-08-20 |
| Gallery environment architecture | [Galerieumgebung SD](artefacts/glass-towers-gallery-environment/SD.md) | active | Technical owner | 2026-08-20 |
| Glass material architecture | [Glasmaterialien SD](artefacts/glass-towers-webgpu-glass-materials/SD.md) | active | Technical owner | 2026-08-21 |
| Runtime contracts | [Glass Towers SD](artefacts/glass-towers/SD.md) | active | Technical owner | 2026-08-20 |
| UX / user flows | [Glass Towers PRD](artefacts/glass-towers/PRD.md) | active | Product owner | 2026-08-20 |
| Operations / release |  | `active | draft | superseded` |  |  |

## Secondary References

Secondary references may support decisions, but they do not override the primary SoT.

| Reference | Purpose | Limit |
|---|---|---|
| [UX Intent Definition](artefacts/glass-towers/UX_INTENT_DEFINITION.md) | Strukturierte Eingabe für das PRD | Nicht autoritativ; wird erst durch ein freigegebenes PRD verbindlich |
|  |  |  |

## Conflict Rule

When a secondary document, generated output, old snapshot or chat summary conflicts with the primary SoT, the primary SoT wins until a new approved artefact changes it.
