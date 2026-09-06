# UX Intent Definition: Glass Towers

- decision: ready
- blocking_reason: none
- primary_user_intent: Eine möglichst hohe, stabile Glasskulptur durch verständliches Positionieren und zeitlich bewusstes Fallenlassen unterschiedlicher Formen bauen.
- success_signal: Eine Form bleibt stabil auf dem Turm, der Punktestand steigt und der nächste Zug wird eindeutig vorbereitet.
- primary_decision_or_action: Horizontale Position wählen und die aktuelle Form per Klick, Touch oder Leertaste fallenlassen.

## Arbeitsmodi und sichtbare Zustände

| Modus | Effektiver Zustand | Sichtbare Zustandstypen | Effektive Autorität | Primärer Präsentations-Owner |
|---|---|---|---|---|
| Start und Renderer-Auswahl | Renderer wird geprüft, WebGPU bevorzugt und bei Bedarf WebGL2 aktiviert. | Laden, Fallback aktiv, Kompatibilität blockiert | Freigegebene Renderer-Policy der UR | Start-/Kompatibilitätsfläche |
| Positionieren | Eine nächste Form ist beweglich und noch nicht Teil der Physiksimulation. | Aktuelle Form, Zielbereich, nächste Form, Score, Bestwert | Aktueller Spielzug | Spiel-HUD und 3D-Szene |
| Fallen und Stabilisieren | Eingabe für die fallende Form ist beendet; Physik entscheidet Kollision und Ruhe. | Bewegung, Aufprall-Feedback, stabilisierender Turm | Physikalischer Laufzustand | 3D-Szene |
| Nächster Zug | Die letzte Form gilt als erfolgreich platziert; Score und Vorschau werden fortgeschrieben. | Aktualisierter Score, Bestwert und neue Vorschau | Bestätigter stabiler Spielzustand | Spiel-HUD |
| Game over | Eine Form ist vom Sockel gefallen und der Lauf nimmt keine weiteren Abwürfe an. | Endstand, Bestwert, klare Neustartaktion | Beendeter Lauf | Game-over-Fläche |

## Aktivierung, Blocker und Recovery

- activation_paths: Seitenaufruf startet die Renderer-Auswahl; erfolgreicher Backend-Start aktiviert den ersten Zug; Neustart aktiviert einen frischen Lauf.
- deactivation_paths: Ein heruntergefallenes Objekt beendet den aktiven Lauf; fehlende WebGPU- und WebGL2-Fähigkeit blockiert die Spielaktivierung.
- blockers: Nicht initialisierbares WebGPU löst automatisch WebGL2 aus. Scheitert auch WebGL2, nennt der Kompatibilitätszustand die Ursache und eine sinnvolle nächste Handlung.
- recovery_paths: Game over bietet Neustart; ein transienter Renderer-Startfehler bietet sichtbaren Retry; ein dauerhaft inkompatibler Browser verweist auf einen unterstützten Browser oder ein unterstütztes Gerät.
- relevant_state_transitions: Start → WebGPU oder WebGL2 → Positionieren → Fallen/Stabilisieren → nächster Zug; Fallen → Game over → Neustart; Renderer-Auswahl → Kompatibilitätszustand → Retry.

## Vorgeschlagene PRD-Akzeptanzkriterien

- Jeder aktive Zug zeigt genau eine steuerbare Form, den aktuellen Score, den lokalen Bestwert und die nächste Form.
- Während Fallen und Stabilisieren kann dieselbe Form nicht erneut abgeworfen werden.
- Ein stabiler Abschluss erhöht den Score genau einmal; ein Fall vom Sockel wechselt genau einmal zu Game over.
- WebGPU-Fehler aktiviert ohne Nutzerentscheidung WebGL2 und erhält die komplette Kernmechanik.
- Wenn beide Renderer scheitern, endet der Start in einem verständlichen Zustand mit Retry oder Geräte-/Browserhinweis statt in einem dauerhaften Loader.
- Maus, Touch und Tastatur führen semantisch dieselben Positionierungs-, Abwurf- und Neustartaktionen aus.

- open_product_questions: none für PRD-Drafting; konkrete technische Budgets und Owner gehören in SD/TP.
- affected_outputs: PRD-Akzeptanzkriterien und spätere sichtbare Browser-Evidenz.
- evidence: Freigegebene UR und Brownfield Review.
- missing_evidence: none
- required_next_step: Kriterien in das PRD übernehmen; dieses Analyseartefakt bleibt nicht-authoritativ.
