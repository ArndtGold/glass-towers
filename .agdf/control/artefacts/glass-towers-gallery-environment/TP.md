# TP: Verfeinerte, vollständig gerenderte Galerieumgebung

Status: approved
Gate: TP
Gate approval: `Approval: TP` vom 2026-08-20 für Revision `7ef646d8-07d4-4e13-8c45-741331b0d4ed`
Based on: [SD](SD.md), [PRD](PRD.md), [Brownfield Review](BROWNFIELD_REVIEW.md)
Date: 2026-08-20
Owner: Delivery Owner

## 1. Ausführungsgrenze und Baseline

Dieser Task-/Testplan implementiert ausschließlich den freigegebenen Galerie-Slice. Die folgenden bereits vorhandenen Worktree-Änderungen gehören zum vorherigen Run `glass-towers` und sind für diesen Slice geschützt:

| Geschützter Pfad | Baseline-Status | Regel |
|---|---|---|
| `playwright.config.ts` | modified | Nicht ändern; die vorhandenen Chromium-/WebKit-Projekte werden nur konsumiert. |
| `src/game/rendering/RendererFactory.ts` | modified | Nicht ändern; WebGPU-Preflight und klassischer WebGL2-Fallback bleiben exakt erhalten. |
| `tests/e2e/gameplay.spec.ts` | modified | Nicht ändern; Galerie-E2E wird in einer neuen Datei ergänzt. |
| `tests/e2e/performance.spec.ts` | modified | Nicht ändern; Galerie-Performance wird in einer neuen Datei ergänzt. |
| `tests/unit/rendererFactory.test.ts` | staged and modified | Nicht ändern; neue Galerie-Unit-Tests erhalten eigene Dateien. |

Vor Implementierung erfasst die Brownfield Analysis den vollständigen tracked/untracked Baseline-Snapshot. Jede neue Änderung an einem geschützten Pfad blockiert diesen Slice, bis entweder der vorherige Safari-Umfang auf ausdrücklichen Auftrag separat committed wurde oder TP/SD bewusst revidiert wurden.

Zulässige geplante Code- und Testpfade:

- `src/game/rendering/createScene.ts`
- `src/game/rendering/createGalleryEnvironment.ts` (neu)
- `src/game/rendering/createMaterials.ts`
- `src/game/runtime/GameRuntime.ts`
- `src/game/config.ts` nur für kanonische Galerie-/Qualitätsbudgets
- `tests/unit/galleryEnvironment.test.ts` (neu)
- `tests/unit/galleryMaterials.test.ts` (neu)
- `tests/unit/sceneBundle.test.ts` (neu, falls nicht sinnvoll in `galleryEnvironment.test.ts` integrierbar)
- `tests/e2e/gallery.spec.ts` (neu)
- `tests/e2e/galleryPerformance.spec.ts` (neu)
- `package.json` ausschließlich für kanonische Galerie-Testskripte
- run-spezifische Evidenz unter `.agdf/control/artefacts/glass-towers-gallery-environment/evidence/`

Jeder weitere Produktpfad benötigt vor Änderung eine explizite TP-Revision.

## 2. Aufgabenliste

| task_id | Aufgabe | Abhängigkeiten | Geplante Pfade | Acceptance mapping | Erforderliche Evidenz |
|---|---|---|---|---|---|
| T-GAL-01 | Pre-Implementation-Baseline erfassen, geschützte Safari-Pfade bestätigen und zulässigen Pfadsatz gegen Git-Status prüfen | TP-Freigabe; Brownfield Analysis | keine Produktänderung; Brownfield-Artefakt | SD Constraints; GAL-AC-08, GAL-AC-09 | Vollständiger tracked/untracked Baseline-Snapshot; klare Protected-/Candidate-Path-Liste |
| T-GAL-02 | Datengetriebene PBR-Materialprofile sowie deterministische lokale Albedo-/Rauheits-/Normal- und Soft-Shadow-Texturen erstellen | T-GAL-01 | `createMaterials.ts`, `galleryMaterials.test.ts` | GAL-AC-04, 05, 06, 09, 11 | Unit-Tests für Determinismus, Profile, lokale Ressourcen und Dispose |
| T-GAL-03 | Reinen Galerie-Builder mit Bodenvolumen, Rückraum, Seitenfassungen, Pfeilern, Laibungen, Lichtfeldern und Rollenmetadaten implementieren | T-GAL-02 | `createGalleryEnvironment.ts`, `galleryEnvironment.test.ts` | GAL-AC-01, 02, 03, 07 | Strukturelle Tests; Geometrie-/Material-/Draw-Call-Diagnostik |
| T-GAL-04 | `SceneBundle` auf genau eine Galeriegruppe umstellen, Plane-Backdrop entfernen, Sockel verfeinern und Ressourcenregister integrieren | T-GAL-03 | `createScene.ts`, `sceneBundle.test.ts` oder `galleryEnvironment.test.ts` | GAL-AC-01, 02, 03, 08, 11 | Test für einen Scene Graph, fehlenden alten Backdrop, geteilte Ressourcen und idempotenten Dispose |
| T-GAL-05 | Idempotente Backendkonfiguration integrieren und nach erfolgreicher Rendererwahl genau einmal aus `GameRuntime` aktivieren | T-GAL-02, T-GAL-04 | `createScene.ts`, `GameRuntime.ts`, Unit-/E2E-Test | GAL-AC-06, 08, 09, 11 | High-/Compatible-Profiltests; Browsernachweis für genau eine Konfiguration pro Session und keine neue bei Restart |
| T-GAL-06 | Studioleuchten, emissive Lichtfelder, lokale Reflexionsumgebung und statische Soft-Contact-Shadows abstimmen | T-GAL-02, T-GAL-03 | `createGalleryEnvironment.ts`, `createMaterials.ts`, `createScene.ts` | GAL-AC-03, 04, 05 | Gepaarte Backend-Screenshots; Material-/Lichtrollen im Strukturtest |
| T-GAL-07 | Galerieabmessungen, Fog und gegebenenfalls begrenzte aspect-basierte Kamerakomposition für Start-, Hochbau- und Mobilansicht abstimmen | T-GAL-04, T-GAL-06 | `createScene.ts`, optional `GameRuntime.ts`, optional `config.ts` | GAL-AC-02, 05, 07 | Screenshotmatrix `1280×720`, `390×844` und hoher Stresszustand ohne Kulissenende oder UI-Überdeckung |
| T-GAL-08 | Ressourcen-, Restart- und Retry-Lifecycle verifizieren; Duplikation, Leaks und neue externe Assetabrufe ausschließen | T-GAL-04, T-GAL-05 | Unit-Tests, `gallery.spec.ts` | GAL-AC-08, 09, 11 | Dispose-Counts, Restart-/Reload-Läufe, Request-Log ohne neue externe Bild-/Fetch-/Media-Ressource |
| T-GAL-09 | Separate Galerie-Browser-Suite für Auto und erzwungenes WebGL2 in Chromium und WebKit implementieren | T-GAL-05 bis T-GAL-08 | `gallery.spec.ts` | GAL-AC-01 bis 09, 11 | Fehlerfreie Runs, abgeleitete Galerie-Diagnostik und benannte Screenshotartefakte |
| T-GAL-10 | Separate Galerie-Performance-Suite mit 20 Bodies und statischen Ressourcenbudgets implementieren | T-GAL-04, T-GAL-05 | `galleryPerformance.spec.ts`, optional `config.ts` | GAL-AC-10 | 10-Sekunden-Messung: p95 Work `≤33,3 ms`; Geometrien ≤14, Materialien ≤8, Draw Calls ≤28, Texturen <4 MiB |
| T-GAL-11 | Kanonische npm-Testskripte um neue Galerie-Suites ergänzen und vollständige Regression ausführen | T-GAL-09, T-GAL-10 | `package.json` | GAL-AC-06, 08, 09, 10 | Lint, Unit, Integration, Build, bestehende E2E und neue Galerie-E2E vollständig grün |
| T-GAL-12 | Sichtbare Evidenz, Browsermatrix, Revieweingaben und direkte UAT-Checkliste abschließen | T-GAL-11 | run-spezifische Evidenzdateien | GAL-AC-01 bis 11 | Evidenzregister, Screenshots, Messwerte, Console-Log-Status und realer Safari-/WebGPU-UAT-Auftrag |

## 3. Abhängigkeitsfolge

```text
T-GAL-01
  → T-GAL-02
  → T-GAL-03
  → T-GAL-04
  → T-GAL-05
  → T-GAL-06
  → T-GAL-07
  → T-GAL-08
  → T-GAL-09 + T-GAL-10
  → T-GAL-11
  → T-GAL-12
```

T-GAL-09 und T-GAL-10 dürfen nach gemeinsamer Implementierungsbasis parallel ausgeführt werden. Alle übrigen Schritte bleiben geordnet, weil Materialprofile, Scene Graph, Backendkonfiguration und visuelle Abstimmung dieselben Invarianten aufbauen.

## 4. Akzeptanz- und Evidenzmapping

| PRD-Kriterium | Primäre Tasks | Automatisierte Evidenz | Sichtbare Evidenz | Fidelity-Erwartung |
|---|---|---|---|---|
| GAL-AC-01 Räumlich geschlossene Galerie | T-GAL-03, 04, 09 | Scene-Graph-Struktur; Browserstart | Desktop-Startbilder Auto/WebGL2 | `fulfilled` nur bei erkennbarem Innenraum |
| GAL-AC-02 Kontinuität bei Kamerahöhe | T-GAL-03, 07, 09 | High-Stress-Lauf ohne Fehler/Clippingdiagnose | Start-, Mittel- und Hochbaufolge | `fulfilled` ohne sichtbares Kulissenende |
| GAL-AC-03 Verfeinerte Geometrie | T-GAL-03, 04, 06 | Rollen-, Segment- und Ressourcenprüfung | Nah-/Gesamtansicht von Sockel und Architektur | `fulfilled` bei ablesbaren Kanten und Kontaktzonen |
| GAL-AC-04 Materialunterscheidung | T-GAL-02, 06, 09 | Materialprofile und deterministische Maps | Gepaarte Materialansichten | `fulfilled` bei sichtbarer Mineral-/Akzentdifferenz |
| GAL-AC-05 Glaslesbarkeit | T-GAL-06, 07, 09 | Vollständiger Gameplaylauf | Formen in Aiming, Fall und Turm | `fulfilled` ohne relevante Verschmelzung mit Hintergrund |
| GAL-AC-06 Backendparität | T-GAL-05, 09 | Struktur-/Profilgleichheit und beide Rendererläufe | Gepaarte Auto-/WebGL2-Bilder | `fulfilled` bei identischen Raumankern und zulässiger Detailabstufung |
| GAL-AC-07 Responsive Lesbarkeit | T-GAL-07, 09 | Viewportläufe und DOM-Sichtbarkeit | `1280×720` und `390×844` | `fulfilled` ohne HUD-/Spielüberdeckung |
| GAL-AC-08 Spielinvarianten | T-GAL-01, 04, 05, 08, 11 | Bestehende Unit-/Integration-/Gameplay-Suites | Score-, Game-over- und Restartbilder | `fulfilled` nur bei unveränderter Kernsemantik |
| GAL-AC-09 Qualitätsfallback | T-GAL-02, 05, 08, 09 | Forced-WebGL2 und Profilfallback ohne Fehler | WebGL2-Galeriebilder | `fulfilled` ohne neuen Kompatibilitätsdialog |
| GAL-AC-10 Performance | T-GAL-10, 11 | p95-/Ressourcenbudgetdaten | Optionaler Stress-Screenshot als Kontext | `fulfilled` nur bei allen harten Budgets |
| GAL-AC-11 Lokale Ressourcen/Lifecycle | T-GAL-02, 04, 08, 11 | Request-Log, Dispose-/Restart-/Retry-Tests | Kein sichtbarer Nachladesprung | `fulfilled` ohne neue externe Galerie-Ressource oder Duplikation |

## 5. Testplan

### 5.1 Unit- und Strukturtests

| Test-ID | Gegenstand | Erwartung |
|---|---|---|
| U-GAL-01 | Galerie-Builder | Genau eine `gallery-environment`-Gruppe mit Boden, Rückraum, Seitenfassungen, vertikalen Modulen, Lichtfeldern und Kontaktflächen |
| U-GAL-02 | Alter Backdrop | Kein Mesh mit der bisherigen Backdrop-Rolle und keine alleinige Plane-Rückwand als Raumabschluss |
| U-GAL-03 | Ressourcenbudget | Eindeutige Galeriegeometrien ≤14, aktive Galeriematerialien je Profil ≤8, deklarierte Draw Calls ≤28 |
| U-GAL-04 | Materialdeterminismus | Gleicher Seed und Profil erzeugen bytegleiche prozedurale Texturdaten und identische Materialparameter |
| U-GAL-05 | Backendprofile | `webgpu` aktiviert `high`, `webgl2` aktiviert `compatible`; Komposition und Rollen bleiben identisch |
| U-GAL-06 | Idempotenz | Wiederholte Konfiguration desselben Backends erzeugt keine neuen Ressourcen und keinen zweiten Zustandswechsel |
| U-GAL-07 | Dispose | Jede einzigartige Geometrie, jedes Material und jede Textur wird genau einmal disposed; zweiter Dispose ist wirkungslos |
| U-GAL-08 | Render-only-Grenze | Galerieobjekte besitzen keine Physik-/Colliderdefinition und verändern keine Piece- oder Pedestal-Konfiguration |

Bestehende Unit-Suite bleibt vollständig erhalten; kein Test darf übersprungen, abgeschwächt oder auf einen Renderer beschränkt werden.

### 5.2 Integrations- und Regressionsprüfungen

- Bestehende Physikintegration: Fall, Kontakt, Stabilisierung und Fallgrenze unverändert.
- Bestehende RendererFactory-Tests: WebGPU-Preflight, WebGL2-Fallback, stabile Frames, Context-unavailable und Doppelfehler unverändert.
- Bestehende Game-State-, Input- und Bestwerttests vollständig grün.
- Build prüft Three.js-Addon-/Materialimporte für beide Rendererbundles und TypeScript.
- `git diff --name-only` wird gegen die in Abschnitt 1 geschützten Pfade geprüft; keine neue Galerieänderung darf dort erscheinen.

### 5.3 Browsermatrix

| Projekt | Modus | Viewport | Zustände | Harte Prüfung |
|---|---|---|---|---|
| Chromium | auto | `1280×720` | Start, 3 Teile, hoher Stress, Game over, Restart | Galerie bereit, Core Loop, keine Console/Page Errors |
| Chromium | forced WebGL2 | `1280×720` | Start, 3 Teile, hoher Stress | Compatible-Profil, gleiche Raumanker, keine Fehler |
| WebKit | auto | `1280×720` | Start, 3 Teile, Game over, Restart | Safari-naher Fallbackpfad und Galerie ohne Fehler |
| WebKit | forced WebGL2 | `1280×720` | Start, 3 Teile, hoher Stress | Klassischer WebGL2-Pfad, gleiche Komposition |
| Chromium | auto und forced WebGL2 | `390×844` | Start und 3 Teile | HUD, Sockel, aktive Form und Vorschau sichtbar |
| WebKit | auto und forced WebGL2 | `390×844` | Start und 3 Teile | Keine Architektur-/UI-Überdeckung oder Clippingkante |

Alle Browserfälle sammeln `console.error`, `pageerror` und unbehandelte Promise-Fehler und schlagen bei einem Eintrag fehl.

### 5.4 Sichtbare Evidenz

Dateien werden ausschließlich unter `.agdf/control/artefacts/glass-towers-gallery-environment/evidence/` abgelegt und enthalten Projekt, Backend, Viewport und Zustand im Namen, beispielsweise:

- `chromium-auto-1280x720-start.png`
- `chromium-webgl2-1280x720-score-3.png`
- `webkit-auto-1280x720-game-over.png`
- `webkit-webgl2-1280x720-high-stress.png`
- `chromium-auto-390x844-mobile.png`
- `webkit-webgl2-390x844-mobile.png`

Das Evidenzregister dokumentiert pro Bild die abgedeckten `GAL-AC-*`, das tatsächliche Backend, den sichtbaren Zustand und etwaige zulässige Qualitätsabstufungen. Screenshots allein beweisen weder Performance noch Lifecycle; sie werden mit Struktur-, Log- und Messdaten gekoppelt.

### 5.5 Performance- und Ressourcenmessung

- Bestehende `?stress=20&seed=152`-Fixture verwenden; keine zweite Stresslogik erzeugen.
- Pro Browserprojekt und Backendmodus zehn Sekunden messen.
- `data-stress-p95-work ≤ 33.3` ist blockierend; `p95-frame` bleibt beobachtend, weil Headless-rAF kein Hardware-Framebudget beweist.
- Galerie-Diagnostik muss Geometrie-, Material-, Draw-Call- und Texturbytewerte exponieren, ohne eine zweite Produktzustandsquelle zu werden.
- Grenzwerte: Geometrien ≤14, Materialien ≤8 je aktivem Profil, zusätzliche Galerie-Draw-Calls ≤28, lokale Texturen <4 MiB RGBA.
- Performance-JSON enthält Browserprojekt, tatsächliches Backend, Viewport, Körperzahl, Dauer, Samples, p95 Frame, p95 Work und Ressourcenwerte.

### 5.6 Netzwerk- und Lifecycleprüfung

- Browser-Request-Log erfasst alle `image`, `media`, `fetch` und Galerie-Texturquellen. Kein neuer externer Host ist zulässig.
- Der bereits bestehende Google-Font-Abruf ist weder Galerie-Asset noch Bestandteil dieses Slices und wird als vorhandene Abhängigkeit separat ausgewiesen.
- Mindestens drei Restarts im selben Runtime-Lebenszyklus: Galerieinstanz bleibt eins, Ressourcenzähler bleiben stabil.
- Mindestens zwei vollständige Reload-/Renderer-Retry-Zyklen: alte Ressourcen sind disposed und jede neue Runtime besitzt genau eine Galerie.

### 5.7 Kanonische Befehle

Nach Implementierung müssen mindestens diese Befehle erfolgreich laufen:

```text
npm run lint
npm run test
npm run test:integration
npm run build
npm run test:e2e
```

`package.json` ergänzt die neuen Galerie-Suites in `test:e2e`, ohne bestehende Gameplay- oder Performancebefehle zu entfernen. Einzelne fokussierte Befehle dürfen während der Entwicklung verwendet werden, ersetzen aber nicht den abschließenden Gesamtlauf.

## 6. Brownfield Scope vor Implementierung

Nach TP-Freigabe ist `pre_implementation_analysis` verpflichtend. Sie muss mindestens prüfen:

- den dann aktuellen Git-Status gegen die geschützte Baseline;
- `createScene.ts`, `createMaterials.ts`, `GameRuntime.ts` und `config.ts` als vorhandene Owner;
- die aktuelle `RendererFactory.ts` ausschließlich lesend als unveränderliche Backendgrenze;
- vorhandene Geometrie-/Material-Caches und Dispose-Verhalten;
- die tatsächliche Three.js-`0.185.1`-Unterstützung der gewählten Material-, Licht-, Textur- und Addonklassen;
- bestehende E2E-Skripte und die Möglichkeit, neue Suites ohne Änderung geschützter Testdateien einzuhängen;
- Risiko eines zweiten Scene Graphs, Dual-Shaders, parallelen Ressourcenowners, versteckten Fallbacks oder UI-/Physikzustands;
- minimalen sauberen Implementierungspfad und exakten erlaubten Changed-Path-Satz.

Nur ein `pass` der Brownfield Analysis öffnet `CD+Tests`.

## 7. Außerhalb des Umfangs

- Änderungen an `RendererFactory.ts`, `playwright.config.ts`, den bestehenden Gameplay-/Performance-E2E-Dateien oder `rendererFactory.test.ts`.
- Eigener GLSL-, WGSL- oder TSL-Shadercode, `ShaderMaterial`, `onBeforeCompile`, Postprocessing oder zweiter Renderpass.
- Echte Shadow-Map-Aktivierung oder Rendererinterface-Erweiterung.
- Physik-, Collider-, Piece-Katalog-, Scoring-, Input-, Bestwert- oder Game-State-Änderungen.
- HUD-/Dialog-Redesign, freie Kamera, neuer Spielmodus oder neue sichtbare Einstellungen.
- Externe Galerie-Assets, neue npm-Abhängigkeiten, Hosting, Deployment oder Release.
- Pixelidentische WebGPU-/WebGL2-Bilder; Komposition und Lesbarkeit müssen übereinstimmen, Detailstufe darf abweichen.

## 8. Risiken und QA-Routing

| Risiko / Befund | QA-Wirkung | Erforderliche Reaktion |
|---|---|---|
| Neuer Diff an einem geschützten Safari-Pfad | `block` | Implementierung stoppen; Scope trennen oder TP/SD revidieren. |
| Zweite Szene, zweiter Frame Loop, eigener Hintergrundrenderer oder paralleler Ressourcenowner | `block` | Primärlösung wieder auf bestehende Owner zurückführen. |
| Eigener backendabhängiger Shadercode oder stiller Rendererfallback | `block` | Portable PBR-Materialfamilie und explizites Profil wiederherstellen. |
| Gameplay-, Physik-, Score-, Restart- oder Kompatibilitätsregression | `block` | Zu `CD+Tests` zurückkehren und Regression beheben. |
| p95 Work über `33,3 ms`, Ressourcenbudget überschritten oder Browserfehler | `block` | Geometrie-/Material-/Lichtkosten reduzieren und erneut messen. |
| Neue externe Galerie-Ressource | `block` | Lokal bündeln oder prozedural erzeugen. |
| Fehlende Backend-/Viewport-/Zustandsevidenz | `revise` | Exakten fehlenden Browserlauf oder Screenshot nachholen. |
| Material- oder Raumqualität nur behauptet, aber nicht sichtbar prüfbar | `revise` | Gepaarte Evidenz und nachvollziehbare manuelle Prüfschritte ergänzen. |
| Reales WebGPU-Gerät oder reale Safari-UAT noch nicht durchgeführt | `warn` bis QA; blockiert UAT-Abschluss | Automatisierte Evidenz vollständig halten und direkte UAT separat anfordern. |
| Bestehender externer Google-Font-Abruf | `warn` | Als Vorbestand sichtbar halten; keine Ausweitung durch Galerieassets. |

## 9. Definition of Done für CD+Tests

- T-GAL-01 bis T-GAL-12 sind implementiert oder mit genehmigter Abweichung nachvollziehbar geschlossen.
- Alle elf `GAL-AC-*` besitzen automatisierte oder sichtbare Evidenz und eine eindeutige Task-Zuordnung.
- Zulässiger Pfadsatz ist eingehalten; geschützte Safari-Pfade sind gegenüber der Baseline unverändert.
- Lint, Unit, Integration, Build und vollständige E2E-Matrix bestehen.
- Chromium und WebKit zeigen Auto und erzwungenes WebGL2 ohne Console/Page Errors.
- Ressourcen- und p95-Work-Budgets bestehen.
- Task Plan Review, Clean Implementation Review und Code Review haben keine offenen Findings.
- QA-Bericht benennt direkte Safari-/WebGPU-UAT weiterhin als getrennte Nutzerakzeptanz, falls sie noch aussteht.

## 10. Nächster Schritt

Diesen Task-/Testplan prüfen und nur mit folgendem exakten Wert freigeben:

`Approval: TP`
