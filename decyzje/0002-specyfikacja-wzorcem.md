# 0002. Specyfikacja wzorcem, implementacje sprawdzane wspólnymi testami
Status: przyjęta   Data: 2026-11-02   Decydują: Piotr, Paweł

## Problem
Silnik ma działać jako pakiet R, moduł Pythona, moduł C++ (np. w WorkFieldGIS) i silnik gry w HTML. Bez wspólnego wzorca każda implementacja rozjedzie się z pozostałymi.

## Decyzja
- Wzorcem jest specyfikacja w `spec/` (równania z jednostkami, kolejność kroków, losowość).
- Do czasu jej ukończenia wzorcem roboczym jest `reference/js/` (silnik Okap Teren 4.1.0).
- Każda implementacja przechodzi wspólne przypadki z `tests/`: to samo wejście i ziarno → ten sam wynik (tolerancja do ustalenia per wielkość).
- Losowość przez jawne, nazwane strumienie ziaren (dziś: zdarzenia, parametry, genotypy, reszta), żeby wyniki były odtwarzalne między językami.

## Konsekwencje
- Generator liczb losowych musi być ten sam we wszystkich implementacjach (dziś mulberry32) — do potwierdzenia w 0004.
- Zmiana równania wymaga zmiany specyfikacji, testów i wszystkich implementacji w jednym pull requeście albo oznaczenia implementacji jako nieaktualnej.
