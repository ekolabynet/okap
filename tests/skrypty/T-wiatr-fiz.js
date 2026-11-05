/* SPDX-License-Identifier: MPL-2.0
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/.
 * © 2026 Piotr Mędrzycki, Paweł Mędrzycki */
// Testy prototypu łańcucha wiatru w wielkościach fizycznych (prototypy/wiatr_fiz.js).
// Sprawdzają WYŁĄCZNIE skalowanie i spójność wzorów. Wartości parametrów poniżej są testowe (umowne),
// NIE są wartościami fizycznymi do użycia w modelu — te uzupełniamy ze źródeł w rejestrze założeń.
// Uruchom: node tests/skrypty/T-wiatr-fiz.js
const W = require('../../prototypy/wiatr_fiz.js');
let ok = 0, bad = 0;
const check = (id, cond, msg) => { if (cond) { ok++; console.log('OK   ' + id + ' ' + msg); } else { bad++; console.log('BŁĄD ' + id + ' ' + msg); } };
const near = (a, b, tol) => Math.abs(a - b) <= tol * Math.max(1, Math.abs(b));
const slope = rows => { const lx = rows.map(r => Math.log(r[0])), ly = rows.map(r => Math.log(r[1])); const mx = lx.reduce((a, b) => a + b) / lx.length, my = ly.reduce((a, b) => a + b) / ly.length; let sxy = 0, sxx = 0; lx.forEach((x, i) => { sxy += (x - mx) * (ly[i] - my); sxx += (x - mx) ** 2; }); return sxy / sxx; };

const TEST = Object.assign({}, W.PARAMS_TEMPLATE, { profile_alpha: 0, sail_wood_share: 0.3, cd0: 1, v_reconf_m_s: 1e9, vogel_b: -0.5, z_moment_m: 0, stem_form: 0.5, k_anch_m: 1, cv_strength: 0.15, cv_load: 0.2,
  wood: { test: { mor_pa: 1, e_pa: 1, rho_kg_m3: 1 } } });
const tree = (H, o) => Object.assign({ sp: 'test', H_m: H, Hb_m: 0.5 * H, Lc_m: 0.5 * H, W_m: 8, D_m: 0.4, dr: 0, cf: 1, leafSeason: 1, exposure: 1, rc: 1 }, o || {});

console.log('Kształt korony z silnika: pole sylwetki κ = ' + W.SHAPE.kappa.toFixed(4) + ' (· W · L_c), środek parcia ξ = ' + W.SHAPE.xi.toFixed(4) + ' długości korony od podstawy');

// T-wiatr-00: brak wartości => błąd zamiast cichego zgadywania
let threw = false; try { W.windLoad(tree(20), 20, W.PARAMS_TEMPLATE); } catch (e) { threw = /Brak wartości/.test(e.message); }
check('T-wiatr-00', threw, 'brakujący parametr zgłasza błąd (szablon ma null)');

// T-wiatr-01: skalowanie
const L1 = W.windLoad(tree(20), 10, TEST), L2 = W.windLoad(tree(20), 20, TEST);
check('T-wiatr-01a', near(L2.F_N / L1.F_N, 4, 1e-9), 'podwojenie prędkości → siła ×4 (bez rekonfiguracji): ' + (L2.F_N / L1.F_N).toFixed(6));
const s1 = W.stemMargin(tree(20, { D_m: 0.4 }), 1000, TEST).sigma_pa, s2 = W.stemMargin(tree(20, { D_m: 0.8 }), 1000, TEST).sigma_pa;
check('T-wiatr-01b', near(s1 / s2, 8, 1e-9), 'podwojenie pierśnicy → naprężenie ÷8: ' + (s1 / s2).toFixed(6));
const sh = W.stemMargin(tree(20, { dr: 0.5 }), 1000, TEST).sigma_pa;
check('T-wiatr-01c', near(sh / s1, 1 / (1 - 0.5 ** 4), 1e-9), 'wnęka d/D = 0,5 → naprężenie × 1/(1 − 0,5⁴) = ' + (1 / (1 - 0.0625)).toFixed(4));
const A1 = W.frontalArea(tree(20, { W_m: 8 }), TEST), A2 = W.frontalArea(tree(20, { W_m: 16 }), TEST);
check('T-wiatr-01d', near(A2 / A1, 2, 1e-12), 'pole rzutu liniowe względem szerokości korony');
const Lr = W.windLoad(tree(20), 20, Object.assign({}, TEST, { v_reconf_m_s: 10 })).F_N / W.windLoad(tree(20), 20, TEST).F_N;
check('T-wiatr-01e', near(Lr, Math.pow(2, -0.5), 1e-9), 'rekonfiguracja (b = −0,5) przy v = 2 v_r zmniejsza siłę o 2^b: ' + Lr.toFixed(6));

// T-wiatr-03b: wykładnik D_req ∝ H^b przy stałej szerokości korony i długości korony ∝ H
const rows0 = [5, 10, 15, 20, 25, 30].map(H => { const t = tree(H); return [H, W.dRequired_m(t, W.windLoad(t, 20, TEST).M_base_Nm, TEST)]; });
const b0 = slope(rows0);
check('T-wiatr-03b', near(b0, 2 / 3, 1e-6), 'bez profilu wiatru: b = ' + b0.toFixed(4) + ' (oczekiwane 2/3; wersja odniesienia 4.1.0 daje ≈ 0,33 bez profilu)');
const Tp = Object.assign({}, TEST, { profile_alpha: 0.3 });
const rows1 = [5, 10, 15, 20, 25, 30].map(H => { const t = tree(H); return [H, W.dRequired_m(t, W.windLoad(t, 20, Tp).M_base_Nm, Tp)]; });
const b1 = slope(rows1);
check('T-wiatr-03c', near(b1, (2 + 2 * 0.3) / 3, 1e-6), 'z profilem α = 0,3 (wartość testowa): b = ' + b1.toFixed(4) + ' (oczekiwane (2 + 2α)/3 = 0,8667; wersja odniesienia 0,533)');

// T-wiatr-06: Greenhill H_kr ∝ D^(2/3)
const g1 = W.greenhillH_m(tree(20, { D_m: 0.2 }), TEST), g2 = W.greenhillH_m(tree(20, { D_m: 0.4 }), TEST);
check('T-wiatr-06', near(g2 / g1, Math.pow(2, 2 / 3), 1e-12), 'wysokość krytyczna Greenhilla rośnie jak D^(2/3)');

// T-wiatr-07: prawdopodobieństwo awarii
const p1 = W.failureProb(1, TEST), p2 = W.failureProb(1.5, TEST), p3 = W.failureProb(0.7, TEST);
check('T-wiatr-07a', near(p1, 0.5, 1e-6), 'P(awaria) przy zapasie medianowym 1 = 0,5: ' + p1.toFixed(6));
check('T-wiatr-07b', p3 > p1 && p1 > p2, 'P maleje z zapasem: m = 0,7 → ' + p3.toFixed(3) + ', m = 1,5 → ' + p2.toFixed(3));

// T-wiatr-08: zakotwienie ∝ ciężar pnia (D² H)
const m1 = W.anchorageMcrit_Nm(tree(20, { D_m: 0.4 }), TEST), m2 = W.anchorageMcrit_Nm(tree(20, { D_m: 0.8 }), TEST);
check('T-wiatr-08', near(m2 / m1, 4, 1e-12), 'krytyczny moment wywracający ∝ D² przy stałej wysokości');

console.log('\n' + ok + ' zgodnych, ' + bad + ' niezgodnych');
process.exitCode = bad ? 1 : 0;
