# 0005. Wiatr i wytrzymałość w wielkościach fizycznych
Status: proponowana   Data: 2026-11-02   Decydują: Piotr, Paweł

## Problem
Wiatr odniesienia `qRef = 2` i współczynnik `kw` nie mają jednostek; `kw` bywa mylony z kW. W momencie zginającym brakuje jednej długości, przez co wymagana grubość pnia rośnie z wysokością wolniej, niż wynika z fizyki. Szczegóły: `spec/01-wiatr-i-mechanika.md` §4.

## Propozycja
Przebudować łańcuch na: prędkość porywu [m/s] → profil pionowy → ciśnienie dynamiczne [Pa] → siła na koronę [N] → moment [N·m] → naprężenie w pniu [MPa] → porównanie z wytrzymałością drewna świeżego [MPa]; zakotwienie jako krytyczny moment wywracający; prawdopodobieństwo awarii z rozkładów niepewności. Wartości ze źródeł (dane IMGW, Eurokod 1, tablice drewna, próby wyciągowe), z wpisami w rejestrze.

## Stan prac
- Specyfikacja docelowa: `spec/01-wiatr-i-mechanika.md` §7.
- Prototyp: `prototypy/wiatr_fiz.js`; testy skalowania `tests/skrypty/T-wiatr-fiz.js` (12/12 zgodnych).
- Rejestr: nowe parametry W23–W40 (status „do uzupełnienia”), stare W01–W19 oznaczone jako zastępowane.
- Brakuje: wartości ze źródeł; dopiero potem wpięcie do silnika.

## Konsekwencje
- Zmienią się zapasy i częstość awarii — trzeba porównać wersje przed/po na tych samych ziarnach.
- Karty zdarzeń w grze dostaną prędkości w m/s.
- `qRef` rozdzielone na diagnostyczne i aklimatyzacyjne.

## Otwarte pytania
- Jakie źródła danych o porywach dla Warszawy są dostępne i w jakiej rozdzielczości?
- Czy do zakotwienia mamy dostęp do wyników prób wyciągowych (własnych lub opublikowanych)?
