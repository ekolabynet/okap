# Okap

Model eko-ewolucyjnej alokacji drzew (gra o wysokość, smukłość H/D, biomechanika) dla drzew miejskich i ich otoczenia, wraz z narzędziami do wizualizacji, eksperymentów i porównań z danymi.

Projekt badawczy: Piotr i Paweł Mędrzyccy (Warszawa). Związany z projektem „Relative Biology Of Trees” — smukłość jako ogniwo między teorią alokacji a arborystyką.

> **Stan:** wszystkie parametry modelu są **robocze i nieskalibrowane**. Wyniki służą do porównywania wariantów i sprawdzania, jakie wzorce dają przyjęte reguły — nie są prognozą dla konkretnych drzew ani dowodem empirycznym.

## Pięć warstw

| Warstwa | Katalog | Co zawiera | Stan |
|---|---|---|---|
| 1. Silnik modelu | `spec/`, `zalozenia/`, `core/`, `bindings/` | specyfikacja niezależna od języka, rejestr założeń, rdzeń i nakładki (R, Python, C++/WorkFieldGIS, WebAssembly/HTML) | specyfikacja w budowie; wersja odniesienia w `reference/js/` |
| 2. Wizualizacja | `viz/` | otwarta paleta metod geometrycznych: 1,5D, 2,5D, woksele, pełne 3D, siatki, chmury punktów… | metody istnieją w aplikacji HTML |
| 3. Eksperymenty | `experiments/` | plany N × M × Q, biblioteki eksperymentów, skrypty, zapis wyników | format planu z Okapu Teren 4.x |
| 4. Znane przypadki | `cases/` | opisy publicznych zbiorów danych o drzewostanach i skrypty pobierania | do rozpoznania |
| 5. Interfejsy | `apps/` | aplikacja HTML (Okap Teren), CLI, inne | HTML 4.1.0 |

## Zasady pracy

1. **Specyfikacja jest wzorcem**, nie kod. Każda implementacja (JS, C++, R, Python) jest sprawdzana tymi samymi przypadkami testowymi z `tests/`.
2. **Każde założenie ma wiersz w rejestrze** (`zalozenia/rejestr.csv`): znaczenie, jednostka, wartość, rozkład niepewności, źródło, status, test.
3. **Każda decyzja architektoniczna ma zapis** w `decyzje/` (problem → opcje → kryteria → wybór → konsekwencje).
4. **Zmiana modelu = jedna zmiana w repozytorium**, która jednocześnie poprawia specyfikację, rejestr, kod i testy. Przegląd przez pull request.
5. **Nie zmyślamy liczb ani źródeł.** Wartość bez źródła ma status `robocze`. Cytowania (DOI) sprawdzane przed wpisaniem.
6. **Granica przekrój / dynamika:** wzorce stojące z gry lub danych przekrojowych nie są testem dynamiki.

## Wersje

Numeracja `Główna.Pomniejsza.Poprawka` + nazwa kodowa (słowo miejskie + rodzaj drzewa), np. `4.1.0 Brick Betula`.

| Wersja | Nazwa | Co |
|---|---|---|
| 3.4.0 | Shovel Sorbus | Okap Miasto: przekrój 1D ulicy/parku, pełny zestaw procesów |
| 4.0.0 | Terrace Tilia | Okap Teren: siatka 2,5D, przekroje, import/eksport ASC/CSV, hałas→NO₂, eksperymenty wsadowe |
| 4.1.0 | Brick Betula | okap wokselowy, plastyczne korony (8 sektorów), z* wg PPA, widok wokselowy |

## Katalogi

```
spec/          specyfikacja modelu (równania, jednostki, kolejność kroków)
zalozenia/     rejestr założeń + opisy łańcuchów (np. wiatr → obciążenie → pień)
decyzje/       dziennik decyzji architektonicznych
reference/js/  obecny silnik JavaScript (wersja odniesienia, z której wyprowadzamy specyfikację)
prototypy/     prototypy zmian modelu do weryfikacji przed wpięciem do silnika
core/          docelowy rdzeń (język: decyzja 0004, otwarta)
bindings/      nakładki: python/, r/, wasm/
tests/         wspólne przypadki testowe i oczekiwane wyniki
viz/           metody wizualizacji
experiments/   plany i biblioteki eksperymentów
cases/         znane przypadki (zbiory danych)
apps/          interfejsy: html/ (Okap Teren), cli/
```
