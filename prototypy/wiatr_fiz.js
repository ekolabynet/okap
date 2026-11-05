/* Prototyp łańcucha wiatru w wielkościach fizycznych (decyzja 0005, spec/01 §7).
 * Czyste funkcje, jednostki SI w nazwach i komentarzach. NIE jest częścią silnika gry.
 * Parametry bez sprawdzonego źródła mają wartość null: funkcja, która ich potrzebuje, zgłasza błąd,
 * zamiast po cichu użyć zgadniętej liczby. Testy podstawiają wartości wyłącznie do sprawdzania skalowania.
 */
'use strict';

// Stałe fizyczne (nie wymagają kalibracji)
const PHYS = {
  rho_air_kg_m3: 1.225,   // gęstość powietrza w atmosferze wzorcowej, 15 °C, poziom morza
  g_m_s2: 9.81,           // przyspieszenie ziemskie
};

// Parametry do uzupełnienia ze źródeł (rejestr: W23–W38). null = brak sprawdzonej wartości.
const PARAMS_TEMPLATE = {
  v10_m_s: { wind: null, storm: null, gale: null },   // W23 porywy na 10 m dla klas zdarzeń (IMGW-PIB)
  v_per_q_m_s: null,        // W24 przelicznik zgodności: v10 = v_per_q · q (tylko do porównań ze starą wersją)
  profile_alpha: null,      // W25 wykładnik profilu potęgowego dla terenu zabudowanego (EN 1991-1-4 / literatura)
  z_ref_m: 10,              // W26 wysokość odniesienia pomiaru wiatru (standard meteorologiczny)
  sail_wood_share: null,    // W27 udział żagla bez liści (gałęzie), dawniej 0,35 (robocze)
  cd0: null,                // W28 współczynnik oporu korony przy małej prędkości
  v_reconf_m_s: null,       // W29 prędkość, od której korona się „rekonfiguruje”
  vogel_b: null,            // W30 wykładnik Vogla (< 0): C_d ∝ (v / v_r)^b powyżej v_r
  z_moment_m: 1.3,          // W31 wysokość przekroju, w którym liczymy zginanie (pierśnica)
  pdelta: 0,                // W32 wzmocnienie momentu przez ciężar przy wychyleniu (0 = pominięte)
  // właściwości drewna świeżego gatunku (W33–W35): MOR, E [Pa], gęstość [kg/m³]
  wood: {},                 // np. wood.tcor = { mor_pa: null, e_pa: null, rho_kg_m3: null }
  greenhill_c: 0.792,       // W36 stała Greenhilla dla jednorodnego walca (z literatury, do potwierdzenia w oryginale)
  stem_form: null,          // W37 współczynnik kształtu pnia do objętości (V = f · π D²/4 · H)
  k_anch_m: null,           // W38 nachylenie zależności M_kr = k · ciężar pnia (próby wyciągowe)
  cv_strength: null,        // W39 zmienność wytrzymałości (CV)
  cv_load: null,            // W40 zmienność obciążenia w zdarzeniu (CV)
};

function need(v, name) { if (v == null || !isFinite(v)) throw new Error('Brak wartości parametru ' + name + ' (do uzupełnienia ze źródła, rejestr założeń).'); return v; }

// Kształt korony z silnika odniesienia (reference/js/e4_env.js, crownShape): względny promień na względnej wysokości h ∈ [0,1] od podstawy korony.
const crownShape = h => h < 0.4 ? 0.5 + 0.5 * Math.sqrt(Math.max(0, 1 - ((0.4 - h) / 0.4) ** 2)) : Math.sqrt(Math.max(0, 1 - ((h - 0.4) / 0.6) ** 2));
// Wyprowadzone z kształtu: pole sylwetki (względem W·L_c) i względna wysokość środka parcia (bez profilu wiatru).
function shapeFactors(n = 2000) { let a = 0, m = 0; for (let i = 0; i < n; i++) { const h = (i + 0.5) / n, s = crownShape(h); a += s / n; m += h * s / n; } return { kappa: a, xi: m / a }; }
const SHAPE = shapeFactors();

// 1–2. Wiatr na wysokości z (profil potęgowy)
function windAt(v10, z_m, P) { return v10 * Math.pow(Math.max(z_m, 0.5) / P.z_ref_m, need(P.profile_alpha, 'profile_alpha')); }
// 3. Osłona: dawny wskaźnik ekspozycji mnożył obciążenie (∝ v²), więc na prędkość działa jego pierwiastek
const shelteredWind = (v_m_s, exposure) => v_m_s * Math.sqrt(exposure);
// 4. Ciśnienie dynamiczne [Pa]
const dynPressure = v_m_s => 0.5 * PHYS.rho_air_kg_m3 * v_m_s * v_m_s;
// 5. Pole rzutu czołowego korony [m²]: szerokość × długość korony × kształt × ulistnienie
function frontalArea(tree, P) { const leaf = need(P.sail_wood_share, 'sail_wood_share') + (1 - P.sail_wood_share) * tree.cf * tree.leafSeason; return tree.W_m * tree.Lc_m * SHAPE.kappa * leaf; }
// 6. Współczynnik oporu z rekonfiguracją
function dragCoef(v_m_s, P) { const c = need(P.cd0, 'cd0'), vr = need(P.v_reconf_m_s, 'v_reconf_m_s'), b = need(P.vogel_b, 'vogel_b'); return v_m_s > vr ? c * Math.pow(v_m_s / vr, b) : c; }
// Środek parcia [m nad gruntem]: wysokość podstawy korony + ξ · długość korony
const pressureHeight = tree => tree.Hb_m + SHAPE.xi * tree.Lc_m;

// Obciążenie drzewa w zdarzeniu o porywie v10 [m/s] → siła [N] i momenty [N·m]
function windLoad(tree, v10, P) {
  const zp = pressureHeight(tree);
  const v = shelteredWind(windAt(v10, zp, P), tree.exposure);
  const F = dynPressure(v) * dragCoef(v, P) * frontalArea(tree, P);
  const amp = 1 + (P.pdelta || 0);
  return { v_m_s: v, z_p_m: zp, F_N: F, M_stem_Nm: F * Math.max(0, zp - P.z_moment_m) * amp, M_base_Nm: F * zp * amp };
}
// 7–9. Naprężenie i zapas pnia (przekrój pierścieniowy przy zgniliźnie dr = d_wnęki / D)
const sectionModulus_m3 = (D_m, dr) => Math.PI * D_m ** 3 * (1 - Math.pow(dr || 0, 4)) / 32;
function stemMargin(tree, M_Nm, P) { const w = P.wood[tree.sp] || {}; const mor = need(w.mor_pa, 'wood.' + tree.sp + '.mor_pa'); const sigma = M_Nm / sectionModulus_m3(tree.D_m, tree.dr); return { sigma_pa: sigma, margin: mor / sigma }; }
// Pierśnica wymagana [m] przy danym momencie
function dRequired_m(tree, M_Nm, P) { const w = P.wood[tree.sp] || {}; return Math.cbrt(32 * M_Nm / (Math.PI * need(w.mor_pa, 'wood.' + tree.sp + '.mor_pa') * (1 - Math.pow(tree.dr || 0, 4)))); }
// 10. Wyboczenie (Greenhill): wysokość krytyczna [m]
function greenhillH_m(tree, P) { const w = P.wood[tree.sp] || {}; return P.greenhill_c * Math.cbrt(need(w.e_pa, 'wood.' + tree.sp + '.e_pa') / (need(w.rho_kg_m3, 'wood.' + tree.sp + '.rho_kg_m3') * PHYS.g_m_s2)) * Math.pow(tree.D_m, 2 / 3); }
// 11. Zakotwienie: krytyczny moment wywracający [N·m] ∝ ciężar pnia, modyfikowany względnym stanem korzeni rc (1 = cel osiągnięty)
function anchorageMcrit_Nm(tree, P) { const w = P.wood[tree.sp] || {}; const V = need(P.stem_form, 'stem_form') * Math.PI * tree.D_m ** 2 / 4 * tree.H_m; return need(P.k_anch_m, 'k_anch_m') * w.rho_kg_m3 * V * PHYS.g_m_s2 * (tree.rc == null ? 1 : tree.rc); }
// 12. Prawdopodobieństwo awarii przy zapasie medianowym m: P(m < 1) dla rozkładu logarytmiczno-normalnego
function failureProb(m_median, P) { const s = Math.sqrt(Math.log(1 + need(P.cv_strength, 'cv_strength') ** 2) + Math.log(1 + need(P.cv_load, 'cv_load') ** 2)); return 0.5 * erfc(Math.log(m_median) / (s * Math.SQRT2)); }
function erfc(x) { const z = Math.abs(x), t = 1 / (1 + 0.5 * z); const r = t * Math.exp(-z * z - 1.26551223 + t * (1.00002368 + t * (0.37409196 + t * (0.09678418 + t * (-0.18628806 + t * (0.27886807 + t * (-1.13520398 + t * (1.48851587 + t * (-0.82215223 + t * 0.17087277))))))))); return x >= 0 ? r : 2 - r; }

if (typeof module !== 'undefined') module.exports = { PHYS, PARAMS_TEMPLATE, SHAPE, crownShape, shapeFactors, windAt, shelteredWind, dynPressure, frontalArea, dragCoef, pressureHeight, windLoad, sectionModulus_m3, stemMargin, dRequired_m, greenhillH_m, anchorageMcrit_Nm, failureProb, erfc };
