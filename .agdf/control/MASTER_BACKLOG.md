# AGDF Master Backlog

This file is the living control pointer for active AGDF delivery work. Detailed UR, Brownfield Review, PRD, SD, TP, QA and OR artefacts should live in stable paths and be linked from here.

## Rules

1. New product semantics, functional change or user-visible behaviour change starts as a new UR draft in a stable local artefact path, for example `.agdf/control/artefacts/<key>/UR.md`, unless an authoritative repository SoT already exists and is linked here.
2. `Approval: UR` adds or updates exactly one steering row with a document-relative Markdown link to the UR.
3. Brownfield Review is created for the same work item after UR approval when existing-system impact must be sized before PRD depth or Quick Task execution.
4. PRD, SD, TP and QA report artefacts are created for the same work item after the previous gate is approved and persisted or linked.
5. `Approval: PRD`, `Approval: SD`, `Approval: TP` and `Approval: QA` require the corresponding durable artefact or linked repository SoT before the next gate can open.
6. Generic consent such as "ok", "go ahead", "do it", "continue", "leg los" or "approved" does not update a gate. Only `Approval: <GateName>` does.
7. Keep only steering-relevant work in `Active Backlog`.
8. Every active item has exactly one linked current spec and a visible linked artefact chain.
9. Historical artefacts remain linkable but do not override the current pointer.
10. If an item is superseded, mark the replacement.
11. If active work grows beyond roughly ten items, triage the backlog.
12. `Status` must be one of the human-readable labels normalized by `create-agdf/lib/control-evaluation/shared.js`: Needs UR, Awaiting Brownfield Review, Awaiting PRD, Awaiting PRD Approval, Awaiting SD, Awaiting SD Approval, Awaiting TP, Awaiting TP Approval, In Progress, Blocked, Awaiting QA, Awaiting UAT, Awaiting OR, Completed, Superseded, Abandoned. The parser module is authoritative; this list only mirrors it for readability.
13. `Artefacts` link labels must be one of the labels normalized by the same parser module: `ur`, `brownfield`, `prd`, `sd`, `tp`, `qa`, `or` (case-insensitive). Do not invent other labels such as a raw artefact filename.
14. After writing or updating this file, run `doctor --json` (or the locally available equivalent) and resolve any `AGDF_BACKLOG_STATUS_UNKNOWN` or `AGDF_BACKLOG_ARTEFACT_LABEL_UNKNOWN` finding before treating the edit as done.
15. A `Work item` cell may optionally start with a bracketed scope tag, one of `[framework-maintenance]` or `[external-delivery]`, so the split between AGDF's own maintenance work and external product delivery stays visible at a glance. The tag is never required retroactively on `Completed / Superseded Pointers` rows. `create-agdf/lib/control-evaluation/shared.js` is authoritative for the accepted values.
16. After writing or updating this file, also resolve any `AGDF_BACKLOG_SCOPE_LABEL_UNKNOWN` finding, which fires only for a present-but-unrecognized bracketed tag, never for an absent one.

## Active Backlog

| Priority | Key | Work item | Status | Artefacts | Current spec | Next step |
|---:|---|---|---|---|---|---|
| 1 | glass-towers-gallery-environment | [external-delivery] Vollständig gerenderte Galerieumgebung | Awaiting QA | [UR](artefacts/glass-towers-gallery-environment/UR.md) · [Brownfield](artefacts/glass-towers-gallery-environment/BROWNFIELD_REVIEW.md) · [PRD](artefacts/glass-towers-gallery-environment/PRD.md) · [SD](artefacts/glass-towers-gallery-environment/SD.md) · [TP](artefacts/glass-towers-gallery-environment/TP.md) · [QA](artefacts/glass-towers-gallery-environment/QA_REPORT.md) | [QA](artefacts/glass-towers-gallery-environment/QA_REPORT.md) | Exaktes `Approval: QA` für Revision `1eee85af-fa25-4ffb-b770-4d1c61468370`; danach direkte Safari-/WebGPU-UAT |
| 1 | glass-towers | [external-delivery] Glass Towers 3D browser game | In Progress | [UR](artefacts/glass-towers/UR.md) · [Brownfield](artefacts/glass-towers/BROWNFIELD_REVIEW.md) · [PRD](artefacts/glass-towers/PRD.md) · [SD](artefacts/glass-towers/SD.md) · [TP](artefacts/glass-towers/TP.md) | [TP](artefacts/glass-towers/TP.md) | Implement T-01 through T-12 and collect evidence |

## Planned / Parking Lot

| Priority | Key | Work item | Status | Artefacts | Current spec | Next step |
|---:|---|---|---|---|---|---|

## Completed / Superseded Pointers

| Key | Work item | Final status | Historical record | Outcome |
|---|---|---|---|---|
| glass-towers-camera-tracking | Dynamische Kameraführung für Turm und Kollaps | Completed | [OR](artefacts/glass-towers-camera-tracking/OR.md) | Weiches Turm-/Kollaps-Tracking, Safe Frame und Restart mit vollständiger QA, genehmigter UAT und OR; keine VCS- oder Release-Aktion. |
| glass-towers-webgpu-glass-materials | WebGPU-/WebGL2-Glasmaterialien und Lesbarkeit | Completed | [OR](artefacts/glass-towers-webgpu-glass-materials/OR.md) | Fünf unterscheidbare Glasfarben, backendgerechte Materialprofile, QA pass und UAT freigegeben; keine VCS- oder Release-Aktion. |
