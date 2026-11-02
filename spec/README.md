# Specyfikacja modelu

Specyfikacja jest **wzorcem**: implementacje w JS, C++, R i Pythonie mają z niej wynikać i być z nią sprawdzane testami z `tests/`. Dziś wzorcem roboczym jest kod w `reference/js/` — rozdziały poniżej wyprowadzamy z niego po kolei i przy okazji poprawiamy.

| Rozdział | Zakres | Stan |
|---|---|---|
| 00 | Stan modelu: teren (siatka 2,5D), woksele okapu, drzewa, komórki gruntu; jednostki; losowość (strumienie ziaren) | do napisania |
| 01 | [Wiatr, obciążenie i wytrzymałość](01-wiatr-i-mechanika.md) | opis stanu + propozycja przebudowy |
| 02 | Światło: korony sektorowe, woksele, promienie, sygnał konkurencji | do napisania |
| 03 | Bilans węgla i alokacja: gra o wysokość, aklimacja mechaniczna, pory roku, rezerwy | do napisania |
| 04 | Korzenie, gleba, woda, sól, ściółka, fauna, runo | do napisania |
| 05 | Kontest koron, plastyczność, z* (PPA) | do napisania |
| 06 | Odnowienie: nasiona, siewki, odrosty | do napisania |
| 07 | Zgnilizna i (od 4.2) gildie grzybów | do napisania |
| 08 | Hałas drogowy i wskaźnik NO₂ | do napisania |
| 09 | Zarządzanie: przeglądy, cięcia, usunięcia, dosadzenia | do napisania |
| 10 | Usługi ekosystemowe i ryzyko | do napisania |
| 11 | Niepewność parametrów, zmienność genetyczna, plastyczność fenotypowa | do napisania |
| 12 | Kolejność kroków w roku (wiosna, lato, jesień, zima) i interfejs silnika (wejścia, wyjścia, zdarzenia) | do napisania |

Każdy rozdział ma ten sam układ: (1) pytanie, na które odpowiada; (2) gdzie w kodzie; (3) równania z jednostkami; (4) problemy; (5) propozycje; (6) testy.
