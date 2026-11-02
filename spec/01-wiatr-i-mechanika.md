# 01. Wiatr, obciążenie i wytrzymałość drzewa

**Status rozdziału:** opis stanu obecnego (wersja odniesienia 4.1.0) + propozycja przebudowy na wielkości fizyczne.
**Kod odniesienia:** `reference/js/e5_sim.js` (funkcje `qAt`, `sail`, `sigEff`, `dEff`, `dReq`, `dBuck`, `anchReq`, `anchCap`, `rootTarget`, `windTest`, `refMech`, `annualPf`, `storms`), `reference/js/e4_env.js` (`exposure`), `reference/js/e2_params.js` (`qRef`, `kw`, `cb`, `kA`, `windBase`, `deck`, `windRose`).
**Wiersze rejestru:** `zalozenia/rejestr.csv`, łańcuch `wiatr`.

---

## 1. Odpowiedź na pytanie „co to jest 2 kW?”

W modelu **nie ma jednostki kW**. Są dwa sąsiadujące parametry:

- `qRef = 2` — **wiatr odniesienia**, bezwymiarowy, umowny indeks siły burzy;
- `kw = 0.00008` — **współczynnik wiatru** (k_w, nie „kilowat”), stała skalująca, w której zszyto wszystkie nieznane stałe fizyczne.

Ani `q`, ani `kw` nie mają dziś określonej jednostki fizycznej. Z budowy równań wynika, że `q` zachowuje się jak **umowna prędkość wiatru** (obciążenie rośnie z `q²`, tak jak ciśnienie dynamiczne rośnie z kwadratem prędkości). Nie wiadomo jednak, jakiej prędkości w m/s odpowiada `q = 2`. **To jest główny powód przebudowy opisanej w części 4.**

## 2. Gdzie wiatr wchodzi do modelu

`q` działa w trzech miejscach, a nie tylko w burzach:

1. **Zdarzenia burzowe** (losowe karty pór roku): `q = windBase[typ] · (0,7 + 0,1·k)`, gdzie `k` = rzut kostką 1–6. Daje to zakresy:
   - wiatr (`windBase.wind = 1,3`): q ≈ 1,04–1,69,
   - burza (`windBase.storm = 2,0`): q ≈ 1,6–2,6,
   - wichura (`windBase.gale = 2,6`): q ≈ 2,08–3,38.
   `qRef = 2` to więc środek przedziału „burzy”.
2. **Diagnoza** (karta drzewa, wskaźniki, ryzyko): zapasy pnia i zakotwienia są liczone przy `q = qRef`.
3. **Wzrost korzeni:** cel nośności korzeni (`rootTarget`) jest proporcjonalny do obciążenia przy `qRef`. **Wiatr odniesienia ustala więc także, do jakiej burzy drzewo się „przygotowuje”** — to założenie biologiczne, nie tylko diagnostyczne.

## 3. Równania w wersji odniesienia 4.1.0

Oznaczenia: `H` wysokość [m], `D` pierśnica [cm], `W` szerokość korony równoważna `weq = 2·R_eff` [m], `cf` kondycja korony [0–1], `exp` ekspozycja [0,4–1], `σ_s` wytrzymałość gatunku (indeks względny, 0,6–0,95), `sw` zmienna stanu drewna (0,15–0,6; znaczenie do opisania w rozdziale o wzroście), `dr` udział zgnilizny w promieniu [0–0,92], `RC` nośność korzeni (jednostki umowne), `rd` uszkodzenie korzeni [0–0,9].

| Krok | Równanie (kod) | Uwagi |
|---|---|---|
| Profil wiatru z wysokością | `q_e = q · (max(H,1)/20)^0,3` | potęgowy profil, wysokość odniesienia 20 m, wykładnik 0,3; liczony na **wierzchołku** drzewa |
| „Żagiel” korony | `sail = max(W, 0,3) · (0,35 + 0,65 · cf · LEAF_F[pora])` | `LEAF_F` = [0,7; 1; 0,7; 0,25] (wiosna, lato, jesień, zima); 0,35 = część bez liści |
| Wytrzymałość efektywna | `σ_e = σ_s · (0,8 + 0,5 · sw)` | |
| Pierśnica wymagana (zginanie) | `D_req = 100 · ∛( k_w · q_e² · exp · sail · H / σ_e )` | [cm] tylko dzięki skali `k_w` |
| Pierśnica krytyczna (wyboczenie) | `D_buck = 100 · ( H / (c_b · ∛σ_s) )^1,5` | postać zależności Greenhilla: `H_kr ∝ D^(2/3)` |
| Pierśnica efektywna przy zgniliźnie | `D_eff = D · ∛(1 − dr⁴)` | wskaźnik wytrzymałości przekroju rury: `∝ D³(1 − (d/D)⁴)` — **fizycznie poprawne** |
| Zapas pnia | `m = D_eff / max(D_req(qRef), D_buck)` | |
| Obciążenie zakotwienia | `A_req = k_A · q_e² · exp · sail · H` | |
| Nośność zakotwienia | `A_cap = RC · (1 − rd)` | |
| Zapas zakotwienia | `a = A_cap / A_req(qRef)` | |
| Test w zdarzeniu | `mn = min(m(q), a(q) · wetF · (3 jeśli palikowane))`; jeśli `mn < 1`, awaria z prawd. `clamp(1,2·(1 − mn), 0, 0,7)` | `wetF = 0,8` przy mokrej porze i odwilży; wywrot, gdy `a/wet < m`, `wet = 1,3` na wilgotnym siedlisku |
| Progi | brak testu przy `H < 2 m`; przy `H < 4 m` tylko wyboczenie | |
| Roczne prawdopodobieństwo | `p = Σ_pory Σ_typy w_typ/6 · Σ_k clamp(1,2(1 − mn(q_k)))`, `pf = 1 − e^(−p)` (+0,15 dla martwych) | `w_typ` = udział karty w talii danej pory |
| Ekspozycja | `exp = clamp( Σ_kier r_kier · (1 − 0,6 · osłona_kier), 0,4, 1 )` | osłona = najwyższy względny obiekt (budynek, cudza korona) do odległości 2H, malejąca liniowo z odległością; `r` = róża wiatrów |
| Cel korzeni | `RC_cel = A_req(qRef) · (1,5 + 0,8·sv) · (1 − 0,15·uszczelnienie) · clamp(0,6 + 0,4·fr/0,15; 0,7; 1,4)` | `sv` gleba dostępna, `fr` udział alokacji w korzenie |

## 4. Problemy znalezione przy analizie

Poniższe punkty to **analiza wymiarowa i logiczna** (komentarz analityczny, nie wynik z literatury). Każdy ma odpowiadające zgłoszenie do rozstrzygnięcia.

1. **`q` nie ma jednostki** i nie wiadomo, jakiej prędkości odpowiada. Nie da się porównać „burzy” modelu z danymi meteorologicznymi.
2. **Brakuje jednej długości w momencie zginającym.** Fizycznie moment u podstawy to `M = F · z_p`, a siła `F = p · C_d · A_f`, gdzie `A_f` (pole rzutu czołowego korony) ≈ szerokość × głębokość korony. Iloczyn ma wymiar m³ (× ciśnienie). W kodzie jest `sail · H`, czyli szerokość × wysokość (m²). Brakującą długość „połyka” `k_w`. Skutek: **`D_req` rośnie z wysokością wolniej, niż wynikałoby z fizyki**. W kodzie `D_req ∝ H^(1/3 + 0,2) ≈ H^0,53` przy stałej szerokości korony. Przy `A_f ∝ W·0,5H` i `z_p ∝ H` byłoby to `∝ H^(2/3 + 0,2) ≈ H^0,87`. **Dla projektu o smukłości to ważne**, bo zależność wymaganej grubości od wysokości to dokładnie ta krzywa, do której drzewo „dostraja” H/D.
3. **Wytrzymałość `σ_s` jest indeksem względnym**, a nie wytrzymałością drewna na zginanie w MPa. Nie da się jej wziąć wprost z tablic drewna.
4. **Zakotwienie (`k_A`, `RC`) jest w jednostkach umownych** i nie jest powiązane z masą bryły korzeniowej ani z wynikami prób wyciągowych.
5. **Prawdopodobieństwo awarii `1,2·(1 − mn)` z obcięciem 0,7** to reguła gry. Nie wynika z rozkładu niepewności wytrzymałości i obciążenia.
6. **`qRef` steruje wzrostem korzeni.** Zmiana „wiatru odniesienia” w celach diagnostycznych zmienia też biologię drzewa. Trzeba rozdzielić `qRef` diagnostyczne od `q_acclim` (do czego drzewo się aklimatyzuje).
7. **Profil wiatru liczony na wierzchołku**, a nie w środku parcia korony.
8. **Nazwa `kw` myli się z jednostką kW** — do zmiany nazwy w specyfikacji (`k_wind`).

## 5. Propozycja: łańcuch w wielkościach fizycznych

Struktura do przyjęcia (decyzja `0005`); **wartości liczbowe do uzupełnienia ze źródeł**, nie z pamięci.

| Ogniwo | Wielkość | Jednostka | Skąd wartość (do zebrania) |
|---|---|---|---|
| 1. Wiatr zdarzenia | prędkość porywu na 10 m `v₁₀` dla klas zdarzeń i pór roku | m/s | dane meteorologiczne (IMGW-PIB) dla Warszawy; rozkład porywów rocznych maksimów |
| 2. Profil pionowy | `v(z) = v₁₀ · f(z; z₀, α)` dla terenu zabudowanego | – | profil logarytmiczny lub potęgowy; kategorie terenu z Eurokodu 1 (EN 1991-1-4) |
| 3. Osłona lokalna | `v_lok = v(z) · s(exp)` | – | obecny wskaźnik osłony; do porównania z pomiarami lub modelami przepływu |
| 4. Ciśnienie dynamiczne | `p = ½ ρ v_lok²`, ρ ≈ 1,2 kg/m³ | Pa | stała fizyczna |
| 5. Siła na koronę | `F = p · C_d(v) · A_f`, `A_f = W · L_c · porowatość(pora)` | N | współczynnik oporu i rekonfiguracja koron przy dużych prędkościach — literatura inżynierii wiatrowej drzew |
| 6. Moment zginający | `M = F · z_p` (+ ewentualnie ciężar korony przy wychyleniu) | N·m | `z_p` = środek parcia korony |
| 7. Naprężenie w pniu | `σ = 32 M / (π D_eff³)` | MPa | — |
| 8. Wytrzymałość pnia | moduł zrywający drewna świeżego `MOR_s` gatunku | MPa | tablice właściwości drewna świeżego; badania arborystyczne |
| 9. Zapas pnia | `m = MOR_s / σ` | – | — |
| 10. Wyboczenie | wzór Greenhilla z modułem sprężystości `E_s` i gęstością | m | tablice drewna |
| 11. Zakotwienie | krytyczny moment wywracający `M_kr` | N·m | próby wyciągowe (winching, pulling tests; metody arborystyczne typu SIA) — zależność od masy pnia lub bryły korzeniowej |
| 12. Prawdopodobieństwo | `P(m < 1)` z rozkładów niepewności wytrzymałości i obciążenia | – | z rejestru niepewności zamiast reguły `1,2(1 − mn)` |

**Zgodność z grą:** po przebudowie stare `q` da się wyrazić jako `v₁₀` przez jawne przeliczenie, a gra zachowa karty zdarzeń, tylko z prędkościami w m/s.

## 6. Testy weryfikujące (do zdefiniowania w `tests/`)

- **T-wiatr-01:** analiza wymiarowa każdego ogniwa (testy jednostek).
- **T-wiatr-02:** dla drzewa wzorcowego (np. lipa 20 m, D 40 cm, korona 10 m) moment `M` przy zadanym `v₁₀` mieści się w przedziale z prób wyciągowych opisanych w literaturze (przedział do wpisania po zebraniu źródeł).
- **T-wiatr-03:** zależność `D_req(H)` przy stałej szerokości korony ma wykładnik zgodny z fizyką (≈ 2/3 bez profilu wiatru).
- **T-wiatr-04:** zgodność implementacji (JS ↔ C++ ↔ R ↔ Python) na tym samym wejściu do tolerancji 1e-9.
- **T-wiatr-05:** wrażliwość: wkład każdego parametru łańcucha w `m` i `pf` (np. analiza Sobola).
