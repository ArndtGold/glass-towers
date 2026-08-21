![Intro: Glass Towser](assets/intro.png)


Minimalistisches 3D-Browserspiel über das Balancieren transluzenter Formen. WebGPU wird bevorzugt; falls es nicht verfügbar oder nicht stabil initialisierbar ist, verwendet dieselbe Three.js-Szene automatisch WebGL2.

## Entwicklung

```bash
npm install
npm run dev
```

Steuerung: Maus oder Touch bewegen die aktive Form und lassen sie per Klick/Tap fallen. Pfeiltasten positionieren schrittweise; `Space` lässt fallen. `R` oder `Enter` startet nach Game over neu.

## Qualitätsprüfungen

```bash
npm run lint
npm test
npm run test:integration
npm run test:e2e
npm run build
```

Die Browser-Suite deckt Auto-Backend, erzwungenes WebGL2, vollständiges Renderer-Scheitern, Eingabekanäle sowie eine 10-Sekunden-Frameprobe mit 20 Rapier-Bodies ab. Die Query-Parameter `renderer`, `seed` und `stress` sind nur im Development-Build aktiv.
