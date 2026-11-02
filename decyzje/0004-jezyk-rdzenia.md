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

## Otwarte pytania
- W czym jest napisany WorkFieldGIS i jak przyjmuje moduły?
- Czy priorytetem jest najpierw wersja R (analizy do artykułów), czy C++ (WorkFieldGIS)?
