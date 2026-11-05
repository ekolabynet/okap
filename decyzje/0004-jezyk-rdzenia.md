# 0004. Język rdzenia silnika
Status: otwarta   Data: 2026-11-02   Decydują: Piotr, Paweł

## Problem
Rdzeń ma działać w R, Pythonie, C++ (WorkFieldGIS) i w przeglądarce, być szybki (tryb wsadowy, duże obszary, woksele) i czytelny dla weryfikacji.

## Opcje
| Opcja | Za | Przeciw |
|---|---|---|
| A. C++ + WebAssembly (Emscripten) + pybind11 + Rcpp | naturalny dla modułu C++; dojrzałe nakładki dla R i Pythona | więcej pracy przy bezpieczeństwie pamięci i budowaniu na wiele platform |
| B. Rust + WebAssembly + PyO3 + extendr; nagłówek C dla C++ | bezpieczeństwo pamięci, dobre narzędzia WebAssembly | nakładka R mniej dojrzała; nowy język dla zespołu |
| C. Zostać przy JavaScript (silnik obecny) + porty ręczne | najszybszy start | wiele ręcznych implementacji do utrzymania; słaby w R/Pythonie |
| D. Wzorcowa implementacja w Pythonie (czytelność) + rdzeń wydajnościowy w A lub B | najlepsza do weryfikacji i nauki | dwa kody do zgodności |

## Kryteria (do zważenia)
Technologia WorkFieldGIS; wydajność w trybie wsadowym; łatwość weryfikacji równań; koszt utrzymania; dostępność w przeglądarce; kompetencje zespołu.

## Fakty o WorkField (repozytorium `ekolabynet/workfield`, stan z 2026-11-05)
- Odgałęzienie QField: aplikacja w **C++ i QML na Qt 6** (m.in. Quick, Quick3D, Positioning, Sensors), oparta na bibliotece **QGIS** dołączanej przez **vcpkg** (wersja przypięta w porcie), budowana **CMake**; wydania na Androida i komputer.
- Licencja **GPL-2.0-or-later**.
- **Wtyczki** to archiwa ZIP z `main.qml`, `metadata.txt` i ikoną (np. `workfield-plantnet`), czyli kod QML i JavaScript wykonywany przez silnik JavaScript Qt, bez kompilacji.

## Wnioski (propozycja do przeglądu)
1. **Szybka ścieżka do terenu:** wtyczka WorkField w QML/JavaScript, która uruchamia obecny silnik odniesienia (`reference/js/`) bez kompilacji, np. do podglądu z* albo zapasu pnia dla zmierzonego drzewa. Do sprawdzenia: czy silnik JavaScript Qt 6 obsługuje wszystkie konstrukcje silnika (Map, tablice typowane, funkcje strzałkowe) i czy wydajność wystarczy dla małego otoczenia drzewa.
2. **Ścieżka docelowa:** rdzeń jako biblioteka **C++** (CMake, port vcpkg), linkowana do WorkField tak jak QGIS. Ten sam kod skompilowany do WebAssembly dla HTML, z nakładkami pybind11 (Python) i Rcpp (R). To przemawia za **opcją A**.
3. **Rust (opcja B)** jest możliwy przez interfejs C, ale dokłada do budowania WorkField drugi łańcuch narzędzi (cargo, kompilacja na Androida) obok vcpkg i CMake.
4. **Licencja Okapu:** jeśli rdzeń ma być wkompilowany w WorkField, musi być zgodna z GPL-2.0-or-later. Bezpieczne są MIT, BSD, LGPL i GPL-2.0-or-later. Apache-2.0 jest zgodna tylko z GPLv3 (WorkField dopuszcza „or later”, ale to warto świadomie rozstrzygnąć). Osobna decyzja.

## Otwarte pytania
- Czy priorytetem jest najpierw wersja R (analizy do artykułów), czy wtyczka lub moduł WorkField?
- Standard C++ (17 czy 20) i zgodność z kompilatorami w łańcuchu budowania WorkField.
- Czy rdzeń ma od początku liczyć woksele i całą siatkę 2,5D, czy najpierw tylko pojedyncze drzewo z otoczeniem (wystarczające do zastosowań terenowych)?
