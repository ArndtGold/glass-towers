# UAT-Checkliste: Galerieumgebung

Status: revise — WebGPU-Vorprüfung fehlgeschlagen; Nachprüfung nach Fix ausstehend
Run: `glass-towers-gallery-environment`
Stand: 2026-08-20

Diese Checkliste ist der direkte menschliche Akzeptanzauftrag nach QA-Freigabe. Automatisierte Browserläufe ersetzen diese Prüfung nicht.

## UAT-Befund und Remediation

- Die reale Vorprüfung in Chrome mit aktivem WebGPU zeigte am 2026-08-20 trotz Badge `WebGPU · High Fidelity` eine nahezu schwarze Szene.
- Derselbe Browser stellte den erzwungenen WebGL2-Pfad nach Nutzerbestätigung korrekt dar.
- Der Befund ist als `implementation_gap` nach CD+Tests zurückgeroutet worden. Ursache waren nicht initialisierte LTC-Lookup-Texturen für die `RectAreaLight`-Nodes des WebGPU-Renderers.
- Die Galerie initialisiert diese Texturen nun einmalig am bestehenden Licht-Owner. Ein Unit-Test prüft die Initialisierung; die Galerie-E2E-Suite prüft zusätzlich eine minimale mittlere Canvas-Helligkeit.
- Die direkte Nachprüfung in echtem Chrome/WebGPU und Safari/WebGL2 bleibt nach erneuter QA-Freigabe verpflichtend.

## Reales Safari / WebGL2

1. Aktuelles Safari auf macOS öffnen und die Anwendung ohne erzwungenen Queryparameter starten.
2. Prüfen, dass das Badge `WebGL2 · Compatible` zeigt und kein Kompatibilitätsdialog erscheint.
3. Startszene auf räumlich geschlossene Galerie, sichtbare Boden-/Wandtiefe, verfeinerten Sockel, Materialunterscheidung und lesbare Glasform prüfen.
4. Drei Teile stabil stapeln, anschließend ein Teil seitlich fallen lassen und Game over auslösen.
5. Restart ausführen und bestätigen, dass Score 00, Bestwert, genau eine Galerie und genau ein Canvas sichtbar sind.
6. Desktop- und schmalen mobilen Viewport prüfen; Score, Vorschau, Sockel, aktive Form und Handlungsanweisung müssen lesbar bleiben.
7. Safari-Webinspektor auf Console Errors, Page Errors und fehlgeschlagene neue Galerie-Ressourcen prüfen.

## Echtes WebGPU-Gerät

1. Einen WebGPU-fähigen aktuellen Browser und aktivierten Hardwareadapter verwenden.
2. Ohne Forced-WebGL2 starten und das Badge `WebGPU · High` bestätigen.
3. Physical-Glas, Reflexionsumgebung, Flächenlicht-Highlights und Materialunterschiede mit der WebGL2-Evidenz vergleichen; Raumanker und Komposition müssen gleich bleiben.
4. Drei Teile, Game over und Restart durchspielen; keine Konsolenfehler oder sichtbaren Shaderausfälle akzeptieren.
5. Einen hohen Aufbau prüfen; Rückraum, Seitenfassungen und Lichtfelder dürfen kein Kulissenende zeigen.

## Akzeptanzprotokoll

- Tester / Gerät / OS / Browserversion dokumentieren.
- Ergebnis je Abschnitt als `pass | revise | block` festhalten.
- Mindestens einen Start-, Score-3-, Hochbau- und Game-over-Screenshot je realem Backend verlinken.
- Abweichungen mit betroffenem `GAL-AC-*`, Reproduktionsschritten und sichtbarer Evidenz erfassen.
- Nur ein vollständiger direkter Pass berechtigt anschließend zu `Approval: UAT`.
