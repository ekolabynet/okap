# Rejestr założeń

`rejestr.csv` (separator `;`, UTF-8) — jeden wiersz na parametr, regułę albo założenie modelu.

| Kolumna | Znaczenie |
|---|---|
| `id` | identyfikator: litera łańcucha + numer (W = wiatr i mechanika, L = światło, A = alokacja, K = korzenie i gleba, H = hałas i powietrze, R = odnowienie, Z = zarządzanie, G = genetyka i plastyczność, V = woksele i korony) |
| `lancuch` | łańcuch przyczynowy, do którego należy (np. `wiatr`, `wytrzymałość`, `zakotwienie`, `awaria`) |
| `symbol_w_kodzie` | nazwa parametru lub wyrażenie w wersji odniesienia |
| `znaczenie` | co oznacza, jednym zdaniem |
| `wartosc_domyslna` | wartość w wersji odniesienia |
| `jednostka` | jednostka fizyczna albo „umowna” / „bez jednostki” — nigdy puste |
| `rozklad_niepewnosci` | rozkład z modelu (ln CV, logit-normalny κ, normalny SD) albo „brak” |
| `zrodlo` | publikacja (z DOI sprawdzonym), dane, pomiar albo „brak” |
| `status` | `robocze` → `z literatury` → `skalibrowane` → `zweryfikowane` (albo `zweryfikowane analitycznie` dla tożsamości matematycznych) |
| `gdzie_w_kodzie` | plik i funkcja |
| `test` | identyfikator testu z `tests/`, który sprawdza założenie |
| `odpowiedzialny` | kto prowadzi weryfikację |
| `uwagi` | problemy, plany zmian, odsyłacze do specyfikacji |

## Zasady

- Wartość bez źródła ma zawsze status `robocze`.
- Zmiana wartości lub statusu = commit z opisem *dlaczego* (źródło, wynik kalibracji).
- Liczby z literatury wpisujemy dopiero po sprawdzeniu w oryginale.
- Pilotem jest łańcuch wiatru (W01–W22, specyfikacja `spec/01-wiatr-i-mechanika.md`). Kolejne łańcuchy dopisujemy po kolei.
