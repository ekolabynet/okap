# 0006. Licencje: podwójne licencjonowanie silnika i licencje warstw
Status: proponowana   Data: 2026-11-05   Decydują: Piotr, Paweł

> Rozpoznanie opcji, nie porada prawna. Przed przyjęciem wariantu z licencją komercyjną i przed treścią umowy współtwórcy — konsultacja z prawnikiem.

## Problem
Silnik ma trafić do WorkField (GPL-2.0-or-later), do pakietów R i Pythona, do przeglądarki (WebAssembly) i potencjalnie do cudzych, także zamkniętych aplikacji. Chcemy, żeby ulepszenia modelu wracały do otwartego kodu, żeby dało się go cytować w nauce i żeby zostawić możliwość licencji komercyjnej.

## Założenia
- Licencjonować (także podwójnie) może tylko posiadacz praw autorskich. Dziś są to Piotr i Paweł.
- Rdzeń wbudowany w WorkField musi mieć licencję zgodną z GPL-2.0-or-later.
- Para „GPL albo LGPL” niewiele daje, bo LGPL już pozwala na korzystanie na warunkach GPL. Podwójne licencjonowanie ma sens jako **licencja otwarta + licencja komercyjna**.
- Ochrona prawnoautorska części kodu napisanej z pomocą narzędzi AI może być w niektórych jurysdykcjach niejasna — do sprawdzenia przed wariantem komercyjnym.

## Propozycja
| Warstwa | Licencja | Uwagi |
|---|---|---|
| Silnik (`core/`, `bindings/`, `reference/`, `prototypy/`) | **licencja otwarta ze słabym copyleftem ALBO licencja komercyjna** (podwójne licencjonowanie) | wybór licencji otwartej: patrz niżej |
| Specyfikacja, rejestr założeń, decyzje, dokumentacja (`spec/`, `zalozenia/`, `decyzje/`, pliki `.md`) | **CC BY 4.0** | swobodne użycie z przypisaniem autorstwa; dobre dla obiegu naukowego |
| Testy i eksperymenty (`tests/`, `experiments/`) | jak silnik | |
| Aplikacja HTML (`apps/html/`) | jak silnik | |
| Wtyczka lub moduł WorkField | **GPL-2.0-or-later** | wymusza to WorkField |
| Znane przypadki (`cases/`) | licencja źródła danych, zapisana w opisie każdego zbioru | skrypty — jak silnik |

### Licencja otwarta silnika — do wyboru w przeglądzie
| Opcja | Za | Przeciw |
|---|---|---|
| **LGPL-2.1-or-later** | znana w GIS (biblioteki, z których korzysta QGIS); zgodna z GPL-2.0-or-later | warunek „możliwości ponownego linkowania” bywa kłopotliwy przy statycznym linkowaniu i WebAssembly |
| **MPL-2.0** | copyleft na poziomie pliku: proste przy WebAssembly, statycznym linkowaniu i pakietach R/Pythona; klauzula zgodności z GPL | mniej znana w środowisku GIS |

### Licencja komercyjna
Osobna umowa z firmą, która chce wbudować silnik bez warunków licencji otwartej. Warunki i cennik ustalane indywidualnie, poza repozytorium.

## Konsekwencje
1. **Umowa współtwórcy (CLA) przed pierwszym wkładem z zewnątrz.** Bez niej nie da się utrzymać podwójnego licencjonowania. Treść do przygotowania z prawnikiem; do tego czasu zmiany wnoszą tylko Piotr i Paweł (`CONTRIBUTING.md`).
2. **Pliki licencji** (`LICENSE`, `LICENSE-docs`, nagłówki SPDX w plikach źródłowych) dodajemy po wyborze opcji. Do tego czasu obowiązuje `LICENCJA.md`: wszelkie prawa zastrzeżone, wgląd publiczny.
3. **Cytowanie:** `CITATION.cff` i archiwizacja wydań z DOI (np. Zenodo).
4. Silnik odniesienia w JavaScript (`reference/js/`) dziedziczy licencję silnika.

## Otwarte pytania
- LGPL-2.1-or-later czy MPL-2.0 jako licencja otwarta silnika?
- Kto jest posiadaczem praw: osoby fizyczne czy podmiot (np. ekolabynet)? Od tego zależy, kto podpisuje licencje komercyjne i umowy współtwórców.
- Czy licencja komercyjna jest planowana od razu, czy tylko zostawiamy na nią furtkę?
