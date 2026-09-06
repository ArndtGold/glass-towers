# Brownfield Review: Dynamische Kameraführung

Status: done
Mode: `post_ur_review`
Run: `glass-towers-camera-tracking`
Stand: 2026-08-21
Based on: [approved UR](UR.md)

## Brownfield Analysis

- Entscheidung: pass
- Mode/Slice Decision: `structured_slice`
- Required next gate: PRD
- Scope: automatische, sichtbarkeitsorientierte Kameraführung für Wachstum, Kollaps und Restart innerhalb der bestehenden Spiel- und Rendererarchitektur.
- Delivery context: `brownfield`
- UI/UX impact: `low`
- UI/UX impact reason: Die Bildkomposition ändert sich sichtbar, aber primäre Aktion, Spielmodus, effektiver Zustand, Aktivierung, Eingabe und Recovery-Semantik bleiben unverändert.
- UX intent definition required: `no`; Ziel, Aktivierung und Recovery sind in der freigegebenen UR eindeutig. Bewegungsreduktion bleibt eine proportionale PRD-Entscheidung und eröffnet keinen neuen Modus.
- Transparenz: Quick Task ist zu eng, weil Kollaps-Bounds, Framing über mehrere Bildformate und Backendparität noch als Produkt- und Testgrenze präzisiert werden müssen. Verified Change ist wegen mehrerer betroffener Owner und des bereits veränderten `GameRuntime.ts` nicht sauber belegbar. Full Structured Delivery ist mangels Full-Depth-Trigger nicht gerechtfertigt.
- Fehlende Evidenz: keine für die Pfadwahl; konkrete Framing-Grenzen und Reduced-Motion-Verhalten gehören in PRD/SD.
- Context graph impact: none
- Required next step: ein begrenztes PRD für Kamera-Framing, Kollapsverfolgung, Restart und Abnahmeevidenz erstellen.

## Bestehende Owner und Abdeckung

| Bereich | Bestehender Owner | Abdeckung | Befund |
|---|---|---|---|
| Kameraerzeugung | `src/game/rendering/createScene.ts` | partially_done | Perspektive, Startposition und initiales Blickziel sind zentral vorhanden. |
| Laufzeitführung | `src/game/runtime/GameRuntime.ts` | partially_done | Zeitbasierte Lerp-Faktoren folgen `towerHeight()` nach oben und grundsätzlich auch nach unten; Kollapsabsicht und Framing-Bounds fehlen. |
| Physiksignal | `src/game/physics/PhysicsWorld.ts` | partially_done | `towerHeight()` liefert den höchsten nicht gefallenen Stein; `snapshots()` enthält dagegen alle Körperpositionen. |
| Spielzustand | `src/game/state/gameMachine.ts` | fully_done | `aiming`, `dropping`, `settling`, `game-over` und `restart` liefern die nötigen Phasen ohne neue Zustandsmaschine. |
| Tests | `tests/unit/**`, `tests/e2e/gameplay.spec.ts` | partially_done | Gameplay- und Browsernachweise existieren, aber keine isolierten Kamera-Ziel-, Kollaps- oder Reset-Regressionen. |

## Reuse Strategy

- Strategie: `extend` und eng begrenztes `refactor`.
- `GameRuntime` bleibt Owner der Aktivierung pro Frame und der finalen Kameraanwendung.
- `PhysicsWorld.snapshots()` und bestehende Spielphasen werden als vorhandene Signale wiederverwendet; `towerHeight()` bleibt Spawn-/Turmhöhenquelle und wird nicht stillschweigend zur Kollaps-Bounds-API umgedeutet.
- Eine mögliche reine Framing-/Dämpfungsberechnung darf Testbarkeit schaffen, aber keinen zweiten Laufzeit- oder Kamera-Owner etablieren.
- RendererFactory, Materialprofile, Physikregeln, Score und Persistenz bleiben unverändert.

## Impact und Risiken

| Thema | Bewertung | Konsequenz |
|---|---|---|
| Architektur / Runtime | lokal begrenzt | keine neue Schleife, kein neuer Scheduler, keine neue Recovery-Grenze |
| Daten / Migration | none | keine Persistenz- oder Schemaänderung |
| Externe Verträge | none | keine API-, CLI- oder Dateiformatänderung |
| Kompatibilität | WebGPU und WebGL2 betroffen | dieselbe Kameraberechnung muss vor beiden Rendererpfaden liegen |
| Worktree-Isolation | `GameRuntime.ts` ist durch den abgeschlossenen Glasmaterial-Scope bereits verändert | Kameraänderungen müssen auf getrennte Zeilen begrenzt und im Review scopespezifisch ausgewiesen werden |
| Sichtbarkeit | rohe Höhe ignoriert Rotation, Breite und gefallene Körper | PRD/SD müssen relevante Bounds und Framing-Grenzen festlegen |
| Komfort | weite oder schnelle Kollapsbewegungen können unangenehm sein | Dämpfung, Begrenzung und Reduced-Motion-Erwartung proportional festlegen |

## Parallelstruktur- und SoT-Prüfung

- Kein zweiter Renderloop und keine zweite Kamera-Instanz.
- Keine parallele Game-over- oder Kollapszustandsmaschine; `GameStore` bleibt Phasen-SoT.
- Keine zweite Physiksnapshot-Sammlung; vorhandene `PhysicsWorld.snapshots()`-Daten werden genutzt.
- Keine Produkt- oder Runtime-Drift festgestellt: Die UR erweitert bewusst die bisher nur höhenbasierte Kameraqualität.
- UI-Monolith-Risiko: niedrig bis mittel; `GameRuntime` ist zentral, daher soll komplexe Mathematik als reine Berechnung testbar bleiben, während Orchestrierung dort verbleibt.

## Structured Depth Evidence

- depth_policy_version: 1
- depth_facts_status: complete
- primary_reason_code: `bounded_structured_slice`
- decisive_full_depth_triggers: none
- rejected_alternative: `quick_task` wegen noch zu entscheidender Kollaps-/Framing-Semantik und fehlender Kameraevidenz; `structured_delivery` wegen fehlender Authority-, Architektur-, Persistenz-, Vertrags-, Release- oder Koordinationstrigger.
- missing_or_conflicting_facts: none
- depth_evidence_refs: approved `UR.md`, `src/game/runtime/GameRuntime.ts`, `src/game/physics/PhysicsWorld.ts`, `src/game/rendering/createScene.ts`, `src/game/state/gameMachine.ts`, existing unit/E2E test layout and current worktree status.

| Bounded-slice check | Ergebnis | Evidenz |
|---|---|---|
| `coherent_outcome` | pass | Ein sichtbarer Kamera-Outcome mit Aufbau-, Kollaps- und Restart-Grenze ist in der UR definiert. |
| `authority_boundary` | pass | Kameraanwendung bleibt bei `GameRuntime`; Spielzustand und Physik behalten ihre bestehenden SoT-Owner. |
| `owner_consumer_coordination` | pass | Betroffene Owner liegen vollständig im lokalen Spielruntime-Slice; kein externer Cutover. |
| `full_depth_impacts_absent` | pass | Keine Policy-, Security-, Persistenz-, externe API-, CLI-, Release- oder Cross-Host-Auswirkung. |
| `migration_propagation_bounded` | pass | Keine Migration; Änderung ist lokal testbar und durch Rücknahme der Kameraberechnung reversibel. |
| `failure_recovery_local` | pass | Fehler betreffen nur Komposition; Restart und bestehender Renderer-Fallback bleiben lokal kontrollierbar. |
| `independently_acceptable` | pass | Hoher Turm, Kollaps, Restart, Bildformate und beide Rendererprofile haben eigenständige sichtbare Akzeptanzsignale. |

## Context Graph

- context_graph_impact: none
- context_graph_refs: none
- context_graph_reconciliation: not_applicable
- context_graph_required_action: none
- context_graph_gate_effect: none
- context_graph_evidence: Die Owner- und Pfadentscheidung ist run-spezifisch und ändert keine projektweite SoT-Zuordnung.
