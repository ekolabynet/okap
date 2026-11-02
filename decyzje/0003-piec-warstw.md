# 0003. Pięć warstw i ich granice
Status: proponowana   Data: 2026-11-02   Decydują: Piotr, Paweł

## Problem
Aplikacja łączy model, wizualizację, eksperymenty, dane i interfejs w jednym pliku HTML. Rozwój każdej z tych części blokuje pozostałe.

## Propozycja
1. **Silnik** — tylko model: stan, krok czasu, zdarzenia, wyjścia. Bez wiedzy o ekranie, plikach i interfejsie. Wystawia: stan drzew, rastry gruntu, woksele okapu, dziennik zdarzeń, wskaźniki roczne.
2. **Wizualizacja** — czyta stan silnika, nigdy go nie zmienia. Otwarta lista metod: profil 1,5D, przekroje 2D, mapa i aksonometria 2,5D, woksele, pełne 3D, siatki, chmury punktów…
3. **Eksperymenty** — plany (N powtórzeń × M protokołów × Q ustawień), uruchamianie wsadowe, zapis wyników z wersją modelu i ziarnami; biblioteki eksperymentów jako pliki.
4. **Znane przypadki** — opisy zbiorów danych, skrypty pobierania i przekształcania na wejście silnika (teren, drzewa, czasem kolejne pomiary).
5. **Interfejsy** — HTML (gra/eksplorator), CLI (podstawa do skryptów i serwerów obliczeniowych), w przyszłości inne (np. moduł WorkFieldGIS).

## Granice do ustalenia
- Format stanu i wymiany: JSON/CSV/ASC (dziś) a docelowo coś binarnego dla dużych obszarów (np. Parquet, Zarr, GeoTIFF/COG, LAS/LAZ dla chmur).
- Czy wizualizacja dostaje kopię stanu, czy widok tylko do odczytu.
- Co jest „zdarzeniem” wystawianym przez silnik (awarie, usunięcia, posadzenia…).
