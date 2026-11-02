# Silnik odniesienia (JavaScript, Okap Teren 4.1.0 „Brick Betula”)

Pliki w kolejności ładowania: `e0_utils.js`, `e1_lib.js` (gatunki), `e2_params.js` (parametry świata), `e3_terrain.js` (teren, ASC, CSV), `e4_env.js` (korony, woksele, światło, wiatr, hałas), `e5_sim.js` (procesy w porach roku), `e6_run.js` (przebiegi, eksperymenty, workery).

Działa bez przeglądarki (node), np.:

```js
const code = ['e0_utils','e1_lib','e2_params','e3_terrain','e4_env','e5_sim','e6_run'].map(f => require('fs').readFileSync(`${f}.js`,'utf8')).join('\n');
const E = new Function(code + ';return {demoTerrain, createSim, stepYear, summary, get S(){return S;}};')();
const T = E.demoTerrain(1, 1); E.createSim(T, 7); for (let y = 0; y < 30; y++) E.stepYear(); console.log(E.summary(E.S));
```

Nie poprawiamy go w miejscu bez odnotowania w rejestrze i specyfikacji — to punkt odniesienia dla testów regresji.
