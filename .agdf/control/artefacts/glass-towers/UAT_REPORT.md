# UAT Report: Glass Towers Safari-Korrektur

- status: approved
- approval: Nutzer lieferte `Approval: UAT` am 20. August 2026 für Run-Revision `75cab992-d36d-40a4-8f35-2059a05a9225` nach der konditionierten Safari-Checkliste.
- run: `glass-towers`
- environment_owner: Nutzer auf realem Safari-Gerät
- automated_prerequisite: pass; Playwright Chromium/WebKit, Reviews und QA sind grün.

## Prüfschritte

1. Die aktuelle Anwendung in Safari öffnen und einen vollständigen Reload ausführen.
2. Bestätigen, dass nicht `This sculpture needs WebGPU or WebGL2.` erscheint und das Spiel den Zustand `aiming` erreicht.
3. Den sichtbaren Backendstatus notieren: `WebGPU · High fidelity` oder `WebGL2 · Compatible`.
4. Mindestens ein Piece per Klick oder Tap abwerfen und bestätigen, dass der Score auf mindestens `01` steigt.
5. Ein Piece absichtlich neben den Sockel setzen und den sichtbaren Game-over-Zustand bestätigen.
6. `Build again` verwenden und bestätigen, dass der Score auf `00` zurückgesetzt wird und das Spiel wieder bedienbar ist.
7. Falls die Safari-Web-Konsole geöffnet ist, bestätigen, dass während dieses Laufs kein WebGL-Kontextverlust oder unbehandelter Fehler erscheint.

## Akzeptanz

| UAT-Kriterium | Status | Nutzerevidenz |
|---|---|---|
| Safari startet WebGPU oder klassischen WebGL2-Fallback | passed | Direkte Nutzerfreigabe nach konditionierter Checkliste |
| Mindestens ein erfolgreicher Score | passed | Direkte Nutzerfreigabe nach konditionierter Checkliste |
| Fehlwurf führt zu Game over | passed | Direkte Nutzerfreigabe nach konditionierter Checkliste |
| Restart kehrt zu einem bedienbaren Lauf zurück | passed | Direkte Nutzerfreigabe nach konditionierter Checkliste |
| Kein erneuter Compatibility Error oder sichtbarer Kontextverlust | passed | Direkte Nutzerfreigabe nach konditionierter Checkliste |

## Entscheidung

- approval_required: satisfied
- approval_condition: erfüllt durch exakte Freigabe nach der ausdrücklich konditionierten Safari-Checkliste.
- missing_evidence: none
- required_next_step: OR finalisieren und commit-bereiten Handoff anbieten; keine VCS-Aktion automatisch ausführen.
