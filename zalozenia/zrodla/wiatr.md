# Teczka źródeł: łańcuch wiatru (W23–W40)

Stan: 2026-11-05, pierwsze przeszukanie. Dla każdego parametru: co mówią źródła, skąd to wiadomo, co trzeba jeszcze sprawdzić.

**Jak czytać statusy sprawdzenia**
- **sprawdzone w tekście** — liczbę przeczytano w pełnym tekście albo w oficjalnym streszczeniu źródła pierwotnego;
- **źródło wtórne** — liczba pochodzi z opracowania, wykładu albo przeglądu; trzeba ją potwierdzić w źródle pierwotnym;
- **do odczytu z oryginału** — źródło znalezione, ale potrzebnej liczby nie było w dostępnym fragmencie;
- **komentarz analityczny** — przeliczenie albo wniosek autora teczki, nie twierdzenie źródła.

Żadna z liczb poniżej nie jest jeszcze wpisana do modelu. Rejestr dostaje odnośniki i status, a decyzję o wartościach podejmujemy w przeglądzie.

---

## W23. Porywy wiatru dla klas zdarzeń

| Źródło | Co mówi | Status |
|---|---|---|
| PN-EN 1991-1-4, załącznik krajowy (NA), tab. NA.1 — za: wykład „Aerodynamika struktur urbanistycznych, PN-EN 1991-1-4 Eurokod 1”, MEiL PW | strefa 1 i 3: v_b,0 = 22 m/s (A ≤ 300 m n.p.m.), strefa 2: 26 m/s; q_b,0 = 0,30 i 0,42 kPa | źródło wtórne; przypisanie Warszawy do strefy 1 do odczytu z mapy NA |
| EN 1991-1-4:2005, p. 1.6.1 i 4.2 | v_b,0 to **10-minutowa średnia** na 10 m w terenie kategorii II o rocznym prawdopodobieństwie przekroczenia 0,02 (okres powrotu 50 lat), niezależnie od kierunku | sprawdzone w tekście |
| Szkobodziński & Miedziałowski 2015, Budownictwo i Inżynieria Środowiska 6: 201–211 | ciśnienia charakterystyczne wg Eurokodu: 303 N/m² (strefa I), 423 N/m² (II), przy ρ = 1,25 kg/m³ | sprawdzone w tekście; przeliczenie na ≈ 22 i 26 m/s to komentarz analityczny |
| IMGW-PIB, dane publiczne (`danepubliczne.imgw.pl`) | dane dobowe synoptyczne zawierają **średnią** prędkość wiatru (bez porywów — wg dokumentacji pakietu *wetterdienst*); porywy trzeba szukać w danych terminowych (godzinowych) | do sprawdzenia, czy dane terminowe dla Warszawy-Okęcia mają maksymalny poryw |
| Pakiet R `imgw` / `climate` (B. Czernecki) | pobieranie danych IMGW do R (`meteo_hourly`, `meteo_daily`, `meteo_monthly`) | narzędzie, do sprawdzenia zakresu zmiennych |

**Wniosek roboczy (komentarz analityczny):** Eurokod daje wartość projektową, czyli średnią 10-minutową raz na 50 lat, a nie rozkład porywów w zwykłych latach. Do kart gry potrzebny jest rozkład porywów z szeregu godzinowego IMGW dla Warszawy. Wartość z Eurokodu służy jako punkt kontrolny dla klasy „wichura”. Do przeliczenia średniej na poryw Eurokod używa ciśnienia szczytowego z intensywnością turbulencji (W40).

## W24. Przelicznik q → v10
Brak źródła z natury rzeczy: to kalibracja do starej wersji gry. Proponuję dobrać go tak, żeby `windBase.gale` odpowiadało porywowi rzędu 50-letniego z W23. To decyzja projektowa, nie wartość z literatury.

## W25–W26. Profil wiatru

| Źródło | Co mówi | Status |
|---|---|---|
| EN 1991-1-4:2005, tab. 4.1 | kategoria III: z0 = 0,3 m, z_min = 5 m; kategoria IV (≥ 15% powierzchni zabudowane, średnia wysokość > 15 m): z0 = 1,0 m, z_min = 10 m | sprawdzone w tekście |
| EN 1991-1-4:2005, p. 4.3.2 | profil logarytmiczny c_r(z) = k_r · ln(z/z0), k_r = 0,19 · (z0/0,05)^0,07; poniżej z_min stała wartość c_r(z_min) | postać standardowa (wzór w wyciągu był zniekształcony) — do potwierdzenia w tekście normy |
| PN-EN 1991-1-4 NA, tab. NA.2 — za: wykład MEiL PW | wersja polska w postaci potęgowej: kat. III c_r = 0,8 · (z/10)^0,19, kat. IV c_r = 0,6 · (z/10)^0,24 | źródło wtórne |
| EN 1991-1-4:2005, p. 1.6.1 | wysokość odniesienia 10 m | sprawdzone w tekście |
| EN 1991-1-4:2005, p. 4.5, uwaga 2 | zalecana gęstość powietrza ρ = 1,25 kg/m³ | sprawdzone w tekście |

**Wnioski robocze (komentarz analityczny):**
- Dla Warszawy wybór jest między kategorią III (przedmieścia, parki z zabudową, lasy) a IV (zwarta zabudowa). Kandydat do przyjęcia: α = 0,24 dla kategorii IV, z rozróżnieniem kategorii według rastra pokrycia terenu.
- **Poniżej z_min (10 m w kategorii IV) profil normowy jest stały.** Dla drzew niższych niż ok. 15 m środek parcia korony leży w tej strefie, więc profil przestaje różnicować drzewa. To ważne dla wykładnika D_req(H) z testu T-wiatr-03c.
- Prototyp ma ρ = 1,225 kg/m³ (atmosfera wzorcowa), a Eurokod zaleca 1,25. Do ujednolicenia.

## W27. Udział żagla bez liści

| Źródło | Co mówi | Status |
|---|---|---|
| Koizumi i in. 2010, *Journal of Wood Science* 56: 189–193, doi:10.1007/s10086-009-1091-8 | topola włoska (*Populus nigra* var. *italica*), 3 drzewa 12–13 m, pomiar terenowy: stosunek C_d korony bezlistnej do ulistnionej przy 10 m/s = **0,553–0,770** | sprawdzone w tekście |
| Roodbaraky i in. 1994 — za: Cullen 2005 | drzewa liściaste w terenie: C_d ok. **4 razy większy** w liściach niż bez | źródło wtórne |
| Lai 1955 — za: Cullen 2005 | drzewa w liściach mają 2–10 razy większy opór | źródło wtórne |

**Wniosek roboczy:** udział żagla bezlistnego leży w szerokim przedziale ok. 0,1–0,8, zależnie od gatunku i prędkości. Obecne 0,35 mieści się w przedziale, ale nie ma źródła. Rozkład niepewności powinien być szeroki.

## W28–W30. Opór korony i rekonfiguracja

| Źródło | Co mówi | Status |
|---|---|---|
| Vollsinger i in. 2005, *Canadian Journal of Forest Research* 35(5): 1238–1249, doi:10.1139/x05-051 | tunel aerodynamiczny, 4–20 m/s, topola balsamiczna, olsza czerwona, brzoza papierowa (po 10 koron): przy 20 m/s pole rzutu spada do **28%, 37%, 20%** wartości w spoczynku; C_d liczony na pole w spoczynku przy 20 m/s = **0,15–0,22**; opór proporcjonalny do iloczynu masy korony i prędkości | sprawdzone w streszczeniu |
| Koizumi i in. 2010 (jw.) | C_d korony ulistnionej przy 10 m/s średnio **0,250**; ekstrapolacja do 30 m/s **0,102**; dopasowania potęgowe C_d = 1,77·v^−0,911; 1,14·v^−0,824; 1,79·v^−0,714 | sprawdzone w tekście |
| Mayhead 1973 (dane), za: Vogel 1996 i Cullen 2005 | iglaste w tunelu: opór rośnie z wykładnikiem **0,72** zamiast 2 (do 38 m/s) | źródło wtórne |
| Hoag i in. 1971, za: Cullen 2005 | liściaste: opór ∝ v^1,4 | źródło wtórne |
| Cullen 2005, *Arboriculture & Urban Forestry* 31(3): 101–113, doi:10.48044/jauf.2005.013 | przegląd: wnioskuje, że dla zarządzania ryzykiem drzew postać z v² jest odpowiednia | sprawdzone w streszczeniu |
| Bekkers, Angelou & Dellwik 2022, *J. Wind Eng. Ind. Aerodyn.* 220: 104854, doi:10.1016/j.jweia.2021.104854 | dąb soliterny, pomiar w pełnej skali: dojrzałe drzewo ma **mniejszą bezwzględną wartość wykładnika Vogla** niż młode | sprawdzone w streszczeniu; liczby do odczytu z oryginału |
| Li i in. 2021, arXiv:2101.04202 | przegląd: C_d koron w literaturze 0,2–1, maleje z prędkością | źródło wtórne |

**Wnioski robocze (komentarz analityczny):**
- Z dopasowań Koizumiego wykładnik Vogla b ≈ −0,7 do −0,9 (topola, w zakresie pomiaru). Z danych Mayheada b ≈ −1,3 (iglaste). Z wyników Bekkersa wynika, że dla dużych drzew |b| jest mniejsze.
- Przy b ≈ −0,8 siła rośnie jak v^1,2, a nie v². To silnie zmienia, czy drzewo pada przy 25 czy przy 40 m/s. Parametr ma pierwszorzędne znaczenie dla wyników.
- Proponuję zmienić postać w prototypie na `C_d(v) = C_d,ref · (v / 10 m/s)^b` z C_d,ref przy 10 m/s, czyli tak, jak raportuje Koizumi. Próg v_r staje się wtedy zbędny.

## W31. Miejsce zginania i złamania

| Źródło | Co mówi | Status |
|---|---|---|
| Kane & Clouston 2008, *Arboriculture & Urban Forestry* 34(2): 101–109 | próby wyciągowe 24 dużych klonów (*Acer platanoides*, *A. rubrum*, *A. saccharum*; pierśnica 0,45–0,71 m): **żaden się nie wywrócił**; 13 złamań w rozwidleniach (przy ok. **45% MOR**), 11 w pniu przy bocznych gałęziach (ok. **79% MOR**) | sprawdzone w tekście; DOI do ustalenia |
| van Haaften i in. 2021, *PLoS ONE* 16(2): e0246805, doi:10.1371/journal.pone.0246805 | metaanaliza 161 prac: z łamaniem pnia wiążą się wysokość i masa pnia; z wywrotem — masa pnia i drzewa; dla łamania gałęzi nie znaleziono czynników | sprawdzone w streszczeniu |

**Wniosek roboczy:** pień jednolity liczony na wysokości 1,3 m to przybliżenie. Rozwidlenia i miejsca nasady gałęzi zawodzą przy ułamku wytrzymałości drewna, co uzasadnia osobny współczynnik osłabienia dla wad budowy. To kandydat na nowy parametr.

## W33–W35. Drewno świeże: MOR, E, gęstość

**USDA Wood Handbook (FPL-GTR-113, 1999), rozdz. 4, tab. 4-3a, stan świeży.** Ciężar właściwy to masa w stanie suchym przez objętość w stanie świeżym. Wszystkie wartości sprawdzone w tekście.

| Gatunek w tabeli | Odpowiednik w Okapie | Ciężar właściwy | MOR [MPa] | E [GPa] |
|---|---|---|---|---|
| *Quercus rubra* (northern red oak) | dąb czerwony — **ten sam gatunek** | 0,56 | 57 | 9,3 |
| *Robinia pseudoacacia* (black locust) | robinia — **ten sam gatunek** | 0,66 | 95 | 12,8 |
| *Fraxinus pennsylvanica* (green ash) | jesion pensylwański — **ten sam gatunek** | 0,53 | 66 | 9,7 |
| *Acer saccharinum* (silver maple) | klon srebrzysty — **ten sam gatunek** | 0,44 | 40 | 6,5 |
| *Tilia americana* (American basswood) | lipy — analog z rodzaju | 0,32 | 34 | 7,2 |
| *Acer saccharum* / *A. rubrum* | klon zwyczajny, jawor — analogi z rodzaju | 0,56 / 0,49 | 65 / 53 | 10,7 / 9,6 |
| *Quercus alba* (white oak) | dąb szypułkowy — analog z grupy dębów białych | 0,60 | 57 | 8,6 |
| *Fraxinus americana* (white ash) | jesion wyniosły — analog z rodzaju | 0,55 | 66 | 9,9 |
| *Betula papyrifera* (paper birch) | brzoza brodawkowata — analog z rodzaju | 0,48 | 44 | 8,1 |
| *Populus trichocarpa* (black cottonwood) | topole — analog z rodzaju | 0,31 | 34 | 7,4 |
| *Salix nigra* (black willow) | wierzba biała — analog z rodzaju | 0,36 | 33 | 5,4 |

| Inne źródło | Co mówi | Status |
|---|---|---|
| Spatz & Pfisterer 2013, *Arboriculture & Urban Forestry* 39(5): 218–225, doi:10.48044/jauf.2013.028 | 306 gatunków z katalogów Jessome 1977, Lavers 1983 i Wood Handbook: prawie liniowa zależność E od gęstości przy 50% wilgotności; regresje E = 18,6·ρ^0,94, wytrzymałość na zginanie = 0,0152·ρ^1,25 | sprawdzone w streszczeniu; jednostki (ρ w kg/m³, wynik w MPa) to komentarz analityczny z rzędu wielkości — do potwierdzenia |
| Lavers 1983, *The Strength Properties of Timber*, BRE | wartości dla drewna świeżego gatunków brytyjskich (lipa, jawor, dęby, buk, jesion…) | do odczytu z oryginału (książka) |
| Wessolly & Erb 1998, *Handbuch der Baumstatik* („katalog wytrzymałości stuttgarcki”) | wartości używane w arborystycznych próbach wyciągowych; Spatz & Pfisterer krytykują brak zależności od gęstości | do odczytu z oryginału |

**Wnioski robocze (komentarz analityczny):**
- Cztery gatunki z biblioteki Okapu mają wartości wprost z tabeli. Dla lip, klonów pospolitych, dębu szypułkowego i jesionu wyniosłego potrzebny jest Lavers 1983. Druga możliwość to regresja Spatza i Pfisterera z gęstości.
- Gęstość drewna świeżego (do Greenhilla i masy pnia) wymaga wilgotności drewna świeżego: ρ_świeże = ciężar właściwy · 1000 · (1 + wilgotność). Wilgotność trzeba wziąć ze źródła.

## W36. Stała Greenhilla

| Źródło | Co mówi | Status |
|---|---|---|
| Greenhill 1881, *Proceedings of the Cambridge Philosophical Society* 4: 65–73 | wyboczenie słupa pod ciężarem własnym | odnośnik potwierdzony (cytowany w pracy INRA o ryzyku wyboczenia siewek); liczba do odczytu z oryginału |
| McMahon 1973, *Science* 179: 1201–1204 | wysokość krytyczna rośnie jak D^(2/3); 576 rekordowych drzew leży na linii o wysokości **ok. 1/4 wysokości krytycznej** | sprawdzone w tekście |
| Praca INRA „How to determine sapling buckling risk with only a few measurements” (236 siewek, 16 gatunków) | ryzyko wyboczenia zależy przede wszystkim od rozmiaru, potem od współczynnika kształtu i modułu sprężystości; wzór „jednorodnego walca” bywa niedokładny | sprawdzone w streszczeniu; autorzy i rok do ustalenia |

**Komentarz analityczny:** ze znanej stałej krytycznego obciążenia słupa pod ciężarem własnym (q·l³/(E·I) ≈ 7,837) dla pełnego walca (I/A = D²/16) wychodzi H_kr = (7,837/16)^(1/3) · (E/(ρg))^(1/3) · D^(2/3) ≈ **0,788** · (E/(ρg))^(1/3) · D^(2/3). Wartość 0,792 w prototypie jest bliska, ale obie trzeba potwierdzić u Greenhilla. Praca INRA wskazuje, że dla drzew ważniejszy od samej stałej jest współczynnik kształtu.

## W37. Współczynnik kształtu pnia
Nie znaleziono jeszcze sprawdzonej wartości. Do zebrania z polskich tablic miąższości i literatury dendrometrycznej (pierśnicowa liczba kształtu dla gatunków liściastych). Wartość z pamięci nie jest wpisana.

## W38. Zakotwienie: moment wywracający a ciężar pnia

| Źródło | Co mówi | Status |
|---|---|---|
| Lundström, Jonsson & Kalberer 2007, *Plant and Soil* 300: 35–49 | świerk pospolity, regresja przez zero M_a = b · m_pnia: **b = 157 N·m/kg** (niższe położenie, 45 drzew, R² 0,93) i **91,1 N·m/kg** (wyższe, płytsza gleba, 21 drzew, R² 0,92) | sprawdzone w tekście; DOI do potwierdzenia |
| Nicoll i in. 2006, *Canadian Journal of Forest Research* 36, doi:10.1139/x06-072 | baza prawie 2000 drzew z 12 gatunków iglastych, 34 stanowiska w Wielkiej Brytanii, 1960–2000; regresje momentu krytycznego względem masy pnia; głębokie ukorzenienie zwiększa moment o 10–15% | sprawdzone w streszczeniu; nachylenia do odczytu z oryginału |
| Bergeron i in. 2009, *Forestry* 82(1): 29–41, doi:10.1093/forestry/cpn035 | świerk czarny: masa pnia to najlepszy predyktor; zależność moment–masa nie różni się między stanowiskami | sprawdzone w streszczeniu |
| Andreozzi i in. 2025, *Forests* 16: 1780, doi:10.3390/f16121780 | wywrócone drzewa liściaste (moment krytyczny): *Acer platanoides* pierśnica 23,2 cm, H 13,5 m → **45,5 kN·m**; 27,1 cm, 13,2 m → **53,5 kN·m**; *Quercus* 22,6 cm, 13,0 m → 36,4 kN·m; 37,0 cm, 17,0 m → 86,9 kN·m; *Betula* 52 cm, 13 m → 89,0 kN·m; brak korelacji w obrębie gatunku przy podobnych wymiarach, decydują warunki miejsca | sprawdzone w tekście |
| Pallafray, Sivarajah & Ruel 2024, *Forests* 15(6): 1041, doi:10.3390/f15061041 | 14 *Acer platanoides* i 14 *Tilia cordata* w parkach Quebecu (pierśnica 23–40 cm): współczynniki bezpieczeństwa przed wywrotem **0,5–4,5**; wpływ cięcia korzeni | sprawdzone w streszczeniu; wartości momentów w materiałach uzupełniających (tab. S6) |
| van Haaften i in. 2021 (jw.) | z wywrotem wiążą się masa pnia i masa drzewa | sprawdzone w streszczeniu |

**Komentarze analityczne:**
- W naszej postaci M_kr = k_A · m_pnia · g, więc k_A = b / g. Dla świerka Lundströma wychodzi **k_A ≈ 16,0 m** (gleba głęboka) i **≈ 9,3 m** (płytka).
- Kontrola rzędu wielkości dla klonu z pracy Andreozziego: dla pierśnicy 23,2 cm, H 13,5 m, przyjmując współczynnik kształtu 0,5 i gęstość świeżą 800 kg/m³, masa pnia wynosi ok. 230 kg. Przy M = 45,5 kN·m daje to b ≈ 200 N·m/kg, czyli ten sam rząd co u świerka. Współczynnik kształtu i gęstość przyjęto tu tylko do tego przeliczenia, nie są wartościami modelu.
- Dla drzew miejskich najważniejsze są Pallafray 2024 (lipa drobnolistna i klon zwyczajny, czyli gatunki z naszych danych) oraz ograniczona objętość gleby. Dziś objętość gleby wchodzi do modelu jako `sv`.

## W39–W40. Zmienność wytrzymałości i obciążenia

| Źródło | Co mówi | Status |
|---|---|---|
| USDA Wood Handbook, tab. 4-6 | średnie współczynniki zmienności właściwości drewna bez wad (MOR, E, gęstość) | do odczytu z oryginału (tabeli nie było w dostępnym wyciągu) |
| EN 1991-1-4:2005, p. 4.4 i 4.5 | intensywność turbulencji I_v(z) = k_l / (c_0 · ln(z/z0)) z k_l = 1 (zalecane); ciśnienie szczytowe zawiera czynnik szczytowy 3,5 („7” we wzorze 4.8) | postać standardowa (wzór w wyciągu był zniekształcony); czynnik 3,5 sprawdzony w tekście (uwaga 3) |

**Komentarz analityczny:** jeśli v10 w modelu ma być porywem z danych IMGW, a nie średnią, CV_load opisuje już tylko resztę: kierunek, osłonę i rekonfigurację. Jeśli ma być średnią 10-minutową, trzeba doliczyć porywistość. Na wysokości 15 m w kategorii IV wychodzi I_v ≈ 1/ln(15) ≈ 0,37. Wybór definicji v10 to decyzja do podjęcia razem z W23.

---

## Punkt kontrolny dla całego łańcucha (T-wiatr-02)

| Źródło | Co mówi | Status |
|---|---|---|
| Virot i in. 2016, *Physical Review E* 93: 023001, doi:10.1103/PhysRevE.93.023001 | po orkanie Klaus (2009, płd.-zach. Europa): tam, gdzie lokalny wiatr przekraczał ok. **42 m/s**, przetrwała mniej niż połowa drzew, sosen i dębów, niezależnie od rozmiaru i gatunku | sprawdzone (omówienie w *Physics Today*, cytowanie z DOI) |

**Propozycja testu:** łańcuch z wartościami z tej teczki ma dawać dla zdrowych drzew zapas pnia w okolicy 1 przy porywie rzędu 40 m/s. Daleko od tego (np. awarie przy 20 m/s albo brak awarii przy 60 m/s) oznacza błąd w wartościach albo w postaci wzorów.

## Do zrobienia
1. Szereg godzinowy porywów IMGW dla Warszawy-Okęcia (i ew. stacji miejskich): rozkład dla klas zdarzeń i pór roku (W23).
2. Mapa stref i tabela NA z polskiego wydania PN-EN 1991-1-4 (potwierdzenie W23, W25).
3. Lavers 1983 i Wood Handbook tab. 4-6 (W33–W35, W39).
4. Greenhill 1881 albo podręcznik z jawnym wzorem (W36).
5. Nachylenia z Nicoll i in. 2006; materiały uzupełniające Pallafray i in. 2024 (W38).
6. Pierśnicowa liczba kształtu dla gatunków liściastych z polskich tablic (W37).
