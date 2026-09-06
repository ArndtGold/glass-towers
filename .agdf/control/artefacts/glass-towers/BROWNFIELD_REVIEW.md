# Brownfield Review: Glass Towers

- mode: post_ur_review
- decision: pass
- mode_slice_decision: structured_delivery
- required_next_gate: PRD
- artefact: `.agdf/control/artefacts/glass-towers/BROWNFIELD_REVIEW.md`
- scope: Vollständige Greenfield-Entwicklung des in der freigegebenen UR beschriebenen 3D-Browserspiels.
- delivery_context: greenfield
- ui_ux_impact: high
- ui_ux_impact_reason: Die Lieferung definiert die gesamte primäre Interaktion, mehrere Arbeits- und Fehlerzustände, sichtbare Status-Owner, Aktivierung, Recovery sowie Maus-, Touch- und Tastaturpfade.
- ux_intent_definition_required: yes
- ux_intent_definition_result: ready
- ux_intent_definition_evidence: `.agdf/control/artefacts/glass-towers/UX_INTENT_DEFINITION.md`

## Bestehender Systemzustand

- current_coverage: not_done
- evidence: Außer `.agdf/`, `.gitignore` und IDE-Metadaten existieren keine Anwendungssourcen, Abhängigkeiten, Tests oder Build-Konfigurationen.
- existing_product_owner: `.agdf/control/artefacts/glass-towers/UR.md`
- existing_architecture_owner: none
- existing_runtime_owner: none
- existing_test_owner: none
- reuse_strategy: new; der neue Anwendungsschnitt wird innerhalb einer einzigen später festzulegenden Architektur aufgebaut.
- parallel_structure_risk: Es darf kein separater WebGPU- und WebGL2-Spielzustand entstehen; beide Renderer müssen dieselbe Spiel-, Physik- und UI-Semantik konsumieren.
- sot_drift: none
- context_graph_impact: none

## Auswirkungen und offene Designpflichten

- Ein gemeinsamer Spielkern muss Rendering-Fähigkeiten, Physik, Eingaben, Wertung, Vorschau, Recovery und Persistenz des lokalen Bestwerts kohärent verbinden.
- WebGPU ist der bevorzugte Renderer; WebGL2 erhält dieselbe Kernspielmechanik mit zulässig reduzierter visueller Qualität.
- Ein Startfehler darf nicht als endloser Loader erscheinen; Fallback und endgültiger Kompatibilitätszustand benötigen eindeutige Owner und Übergänge.
- Browser-, Geräte- und Performance-Grenzen sowie die konkrete Bibliotheksauswahl gehören in SD und TP.
- Eine Implementation-preparation Brownfield Analysis ist nach freigegebenem TP erforderlich.

## Structured Depth Evidence

- depth_policy_version: 1
- depth_facts_status: complete
- primary_reason_code: architecture_runtime_depth
- decisive_full_depth_triggers: Neue Echtzeit-Architektur mit Renderer-Fähigkeitsverhandlung, zwei Grafikpfaden, Physik-Simulation, Eingabe-Orchestrierung und Recovery verändert Architektur- und Runtime-Grenzen über einen lokalen Slice hinaus.
- rejected_alternative: structured_slice; abgelehnt, weil der Nachweis `full_depth_impacts_absent` wegen der neuen Architektur- und Runtime-Grenzen nicht bestehen kann.
- missing_or_conflicting_facts: none
- depth_evidence_refs: Freigegebene UR, leeres Projektinventar und UX Intent Definition.

| Bounded-slice check | Ergebnis | Evidenz |
|---|---|---|
| coherent_outcome | pass | Ein vollständiger, klar abgegrenzter Einzelspieler-Lauf ist das kohärente Produktergebnis. |
| authority_boundary | pass | Produktintention liegt in der freigegebenen UR; es entstehen keine Trust-, Policy- oder Berechtigungsgrenzen. |
| owner_consumer_coordination | pass | Der Greenfield-Schnitt hat keine externen Consumer oder gemeinsamen Cutover-Owner. |
| full_depth_impacts_absent | fail | Dualer Renderer, Echtzeitphysik, Game Loop und Recovery sind vollständige Architektur-/Runtime-Impacts. |
| migration_propagation_bounded | pass | Keine Migration oder bestehende Propagation ist erforderlich. |
| failure_recovery_local | pass | Renderer-Fallback, Neustart und Kompatibilitätszustand bleiben innerhalb der Anwendung. |
| independently_acceptable | pass | Das Spiel besitzt eigenständige, in UR und PRD prüfbare Akzeptanzsignale. |

## Ergebnis

- transparency: Quick Task und Verified Change sind wegen neuer Produktsemantik und fehlender vorhandener Owner ungeeignet. Structured Delivery ist wegen des Architektur-/Runtime-Triggers erforderlich.
- missing_evidence: none für die Routenauswahl
- risks: Browserfähigkeiten und Performancebudgets müssen in den nächsten Artefakten messbar präzisiert werden.
- required_next_step: PRD auf Basis von UR, Brownfield Review und UX Intent Definition entwerfen und zur Freigabe vorlegen.
