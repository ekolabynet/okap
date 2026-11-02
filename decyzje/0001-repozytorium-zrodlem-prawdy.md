# 0001. Repozytorium jako źródło prawdy o modelu
Status: przyjęta   Data: 2026-11-02   Decydują: Piotr, Paweł

## Problem
Model rozwijał się w kolejnych plikach HTML (Okap Miasto 1.x–3.x, Okap Teren 4.x). Założenia, wartości i równania były tylko w kodzie i w rozmowach. Nie da się wskazać, co i dlaczego zmieniło się między wersjami, ani przypiąć wersji modelu do wyników.

## Decyzja
Jedno repozytorium Git (GitHub, prywatne) zawiera specyfikację, rejestr założeń, dziennik decyzji, kod, testy i aplikacje. Dyskusje robocze mogą toczyć się w dokumentach i rozmowach, ale ich wynik ląduje tutaj.

## Konsekwencje
- Każda zmiana modelu ma autora, datę i uzasadnienie w historii.
- Wyniki (artykuły, eksperymenty) odwołują się do wydania (tag) modelu.
- Duże dane nie trafiają do repozytorium; w `cases/` są tylko opisy i skrypty pobierania.
