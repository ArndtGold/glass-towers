# Brownfield Analysis: Glasmaterialien vor Implementierung

Mode: `pre_implementation_analysis`
Decision: `pass`
Run: `glass-towers-webgpu-glass-materials`
Date: 2026-08-21
Based on: approved [TP](TP.md), approved [SD](SD.md), [Brownfield Review](BROWNFIELD_REVIEW.md)

## Scope

GLASS-T-01 bis GLASS-T-09 optimieren ausschließlich die bestehenden Glas- und render-only Piece-Owner. GLASS-T-10 bleibt direkte UAT nach QA. Rendererwahl, Fallback, Physik, Katalogsemantik, Store, UI, Eingaben und Persistenz sind geschützt.

## Existing-System Evidence

| Bereich | Beobachtete Evidenz | Bewertung |
|---|---|---|
| Material | `createMaterials.ts` besitzt `createGlassMaterial`, beide Gallery-Profile und die lokale Equirectangular-Environment | `partially_done`; innerhalb eines Owners refaktorierbar |
| Szene | `createScene.ts` besitzt Backend-Aktivierung, Material-/Geometrie-Caches, Piece-Visuals und idempotentes Dispose | `partially_done`; sauber erweiterbar |
| Runtime | `GameRuntime.start()` konfiguriert das erfolgreiche Backend vor der ersten Piece-Erzeugung | `fully_done`; Reihenfolge bleibt erhalten |
| Renderer | `RendererFactory.ts` besitzt WebGPU-Preflight, stabile Präsentation und genau einen WebGL2-Fallback | `fully_done`; unverändert und geschützt |
| Piece/Physik | `catalog.ts` und `PhysicsWorld.ts` besitzen Dimensionen, Collider, Dichte und Schwerpunktwirkung | `fully_done`; nur lesende optische Ableitung erlaubt |
| Tests | Galerie-Unit-, Gameplay-, Gallery- und Performance-Suites existieren für Auto und Forced WebGL2 | `partially_done`; fokussierte Material-/Lesbarkeitsevidenz ergänzen |
| Three.js | Version `0.185.1` liefert `MeshPhysicalMaterial`, `RoundedBoxGeometry` und `BufferGeometryUtils.mergeGeometries` lokal | `fully_done`; keine neue Laufzeitabhängigkeit erforderlich |

## Worktree Baseline And Isolation

- Baseline commit: `8e1b507a0884b86b8a414f0f3097fd70c298e257`.
- `git status --short` ist leer; `.agdf/` ist absichtlich ignoriert und verändert den getrackten Baseline-Nachweis nicht.
- Erlaubte Produktpfade: `src/game/rendering/createMaterials.ts`, `src/game/rendering/createScene.ts`, fokussierte Tests und bei zwingender Notwendigkeit testbezogene Hilfen.
- Geschützte Pfade: `RendererFactory.ts`, Piece-Katalog, Physik, Runtime, Store, UI, Eingaben und Persistenz.
- Die separate Galerie-Arbeitslinie bleibt auf `Awaiting QA`; ihre aktuelle Implementierung ist der eingefrorene Vergleichspunkt, keine implizite QA-Freigabe.

## Reuse Strategy

- `refactor`: `createGlassMaterial` zu einer Piece-basierten, reinen optischen Profilableitung im bestehenden Material-Owner.
- `extend`: vorhandene prozedurale Environment um kontrastreiche Karten und profilbezogene Auflösung.
- `extend`: vorhandenes `SceneBundle` um direkte Compatible-Environment-Bindung und gecachte gefaste Visuals.
- `reuse`: bestehende GalleryMaterialSet-Ownership, Backend-Konfiguration, Geometrie-/Materialmaps, Dispose und Performance-Fixture.
- `new`: nur fokussierte Tests beziehungsweise eine schmale reine Geometrie-/Bildmetrik-Hilfe, falls der vorhandene Owner sonst nicht testbar ist.
- `replace`: keine Architektur; nur die aktuellen hartkantigen Piece-Visual-Geometrien innerhalb desselben Cache-Owners.

## Interface And Regression Impact

| Schnittstelle | Änderung | Regressiongrenze |
|---|---|---|
| `createGlassMaterial` | nimmt `PieceDefinition` und profilbezogene Environment statt nur Farbe | ausschließlich interne Aufrufer/Tests; keine öffentliche Produkt-API |
| `GalleryMaterialSet` | Environment-Auflösung/Pixelinhalt und Diagnostikwerte ändern | Materialrollen und alleinige Texture-Ownership bleiben |
| `createPieceObject` | gefaste/zusammengeführte sichtbare Geometrie | Piece-ID, Außenmaße, Transform, Materialidentität und Physik bleiben |
| Compatible-Profil | direkte `envMap` am Glas | `scene.environment` bleibt null und Galerie-Materialien unverändert |
| High-Profil | physikalische Transmission ohne Alpha-Washout | ein Mesh/Material je Piece; kein zusätzlicher Pass |

Keine Datenmodell-, Persistenz-, Migration-, Security-, Deployment-, externe API- oder Releasewirkung.

## Parallel-Structure And Integrity Checks

- Kein zweiter Renderer, Scene Graph, Frame Loop, Piece-Katalog oder Physikpfad.
- Keine transparente Hülle, Outline-Scene oder globale Compatible-Environment.
- Ein Materialowner leitet beide Profile aus denselben Piece-Daten ab.
- `GalleryMaterialSet` bleibt alleiniger Environment-Texture-Owner; Glasmaterialien referenzieren nur.
- AppShell/GameStore bleiben sichtbare Status- und Recovery-Owner; Rendering fügt keine Produktzustände hinzu.
- Merge der Compound-Geometrie reduziert statt erweitert transparente Mesh-Parallelität.

## Test Impact

- Bestehende `galleryMaterials.test.ts` und `galleryEnvironment.test.ts` werden erweitert.
- Eine fokussierte Piece-Visual-Testdatei ist zulässig, falls sie Geometriegrenzen klarer isoliert.
- `gallery.spec.ts` erhält gepaarte Zustände, Fehlerwächter und deterministische Lesbarkeitsmetriken.
- Bestehende Gameplay-, Renderer- und Performance-Suites bleiben unverändert in ihrer Aussage und müssen vollständig bestehen.
- Echte WebGPU-/Safari-Evidenz bleibt UAT; Headless-WebGL2 darf sie nicht ersetzen.

## Risks

| Risiko | Wirkung | Kontrolle |
|---|---|---|
| Transparentes WebGL2-Overlap bleibt sortierempfindlich | `revise` | ein sichtbares Mesh je Piece, kein Shell-Material, Score-3-Screenshot |
| Environment wird vor referenzierenden Glasmaterialien entsorgt | `block` | configure-before-create, synchroner Rebind, Lifecycle-Unit-Test |
| Fasen verändern sichtbare Maße oder Collider | `block` | Bounding-Box-Toleranz und bytegleiche Piece-Daten |
| Dispersion/Transmission verletzt Performancebudget | `block` | 20-Body-p95, Dispersion-Exit, keine weiteren Passes |
| Bildmetrik misst globale Helligkeit | `revise` | Gradient, Innen/Außen und Chroma-Varianz gemeinsam plus gepaarte Sichtprüfung |

## Context Graph Impact

- context_graph_impact: `none`
- context_graph_refs: none
- context_graph_reconciliation: `not_applicable`
- context_graph_required_action: `none`
- context_graph_gate_effect: `none`
- context_graph_evidence: Wiederverwendbare Produkt- und Architekturentscheidungen sind bereits über PRD/SD in der SOT Registry verankert; Implementierungsdetails bleiben run-spezifisch.

## Decision

- decision: `pass`
- missing_evidence: none für den Start von CD+Tests; echte WebGPU-/Safari-Sichtprüfung bleibt bewusst spätere UAT-Evidenz
- current_coverage: `partially_done`
- reuse_strategy: bestehende Material-/Scene-Owner refaktorieren und erweitern; keine parallele Renderstruktur
- risks: vollständig kontrollierbar innerhalb TP und bestehender Testpfade
- required_next_step: GLASS-T-01 bis GLASS-T-09 implementieren; geschützte Pfade unverändert halten und alle geplanten Prüfungen ausführen.
