/* SPDX-License-Identifier: MPL-2.0
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 * © 2026 Piotr Mędrzycki, Paweł Mędrzycki */
// T-wiatr-03: jak wymagana pierśnica D_req rośnie z wysokością H przy stałej koronie i ekspozycji (wersja odniesienia).
// Fizyka (moment = siła na pole rzutu korony × ramię): D_req ∝ H^(2/3) bez profilu wiatru, ≈ H^0,87 z profilem (H/20)^0,3, gdy głębokość korony ∝ H.
// Uruchom: node tests/skrypty/T-wiatr-03_wykladnik.js
const fs = require('fs'), path = require('path');
const dir = path.join(__dirname, '..', '..', 'reference', 'js');
const code = ['e0_utils','e1_lib','e2_params','e3_terrain','e4_env','e5_sim','e6_run'].map(f => fs.readFileSync(path.join(dir, f + '.js'), 'utf8')).join('\n');
const E = new Function(code + ';return {demoTerrain, createSim, dReq, IND, setParams, get S(){return S;}};')();
E.setParams({world:{uncert:0, genVar:0}});
E.createSim(E.demoTerrain(1, 1), 7);
const t0 = E.S.trees.find(t => E.S.SP[t.sp].key === 'tcor' && t.H > 15);
const s = E.IND(t0);
const rows = [];
for (const H of [5, 10, 15, 20, 25, 30]) {
  const t = Object.assign({}, t0, {H, weq: 8, cf: 1, exp: 1, sw: 0.4});
  rows.push([H, E.dReq(t, s, E.S.W.qRef)]);
}
const lx = rows.map(r => Math.log(r[0])), ly = rows.map(r => Math.log(r[1]));
const mx = lx.reduce((a, b) => a + b) / lx.length, my = ly.reduce((a, b) => a + b) / ly.length;
let sxy = 0, sxx = 0; lx.forEach((x, i) => { sxy += (x - mx) * (ly[i] - my); sxx += (x - mx) ** 2; });
const b = sxy / sxx;
console.log('H [m] → D_req [cm] (lipa drobnolistna, korona 8 m, ekspozycja 1, qRef):');
rows.forEach(r => console.log('  ' + r[0] + ' → ' + r[1].toFixed(1)));
console.log('wykładnik D_req ∝ H^b w wersji odniesienia: b = ' + b.toFixed(3));
console.log('oczekiwany z fizyki przy głębokości korony ∝ H i profilu (H/20)^0,3: b ≈ 0,867');
console.log(Math.abs(b - 0.867) < 0.05 ? 'ZGODNE' : 'NIEZGODNE — patrz spec/01-wiatr-i-mechanika.md §4.2');
