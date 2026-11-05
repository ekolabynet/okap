# Testy

Wspólne przypadki testowe dla wszystkich implementacji silnika.

- `przypadki/` — wejścia (teren, drzewa, parametry, ziarno) w formatach wymiany.
- `oczekiwane/` — wyniki wzorcowe (z wersji odniesienia albo wyprowadzone analitycznie).
- Każdy test ma identyfikator (np. `T-wiatr-01`) wpisany w kolumnie `test` rejestru założeń.

Rodzaje: testy jednostek (wymiarów), testy analityczne (tożsamości), testy zgodności między implementacjami, testy regresji (czy zmiana nie zmieniła wyników niezamierzenie), analizy wrażliwości.

## Skrypty

| Test | Plik | Wynik na wersji odniesienia 4.1.0 |
|---|---|---|
| T-wiatr-03 | `skrypty/T-wiatr-03_wykladnik.js` | wykładnik `D_req ∝ H^b`: b = 0,533; oczekiwany z fizyki ≈ 0,867 → **niezgodne** (spec 01 §4.2) |
| T-wiatr-00…08 | `skrypty/T-wiatr-fiz.js` | prototyp łańcucha fizycznego: 12/12 zgodnych (skalowanie, wykładnik 2/3 i (2 + 2α)/3, Greenhill, P(awaria), zakotwienie) |
