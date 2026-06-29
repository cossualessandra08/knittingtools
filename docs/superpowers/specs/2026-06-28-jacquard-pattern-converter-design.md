# Design: Convertitore pattern jacquard per AYAB

**Data:** 2026-06-28  
**Stato:** Approvato in brainstorming (sezioni 1–5)  
**Progetto:** knittingtools (secondo strumento nell’hub esistente)

---

## Obiettivo

Strumento web che trasforma una foto in un’immagine bitmap monocromatica (1 bit) da usare come schema jacquard, importabile in **AYAB** (All Yarns Are Beautiful) per mandare il pattern alla macchina da maglieria tramite Arduino.

L’utente carica una foto, sceglie le dimensioni (un pixel = una maglia × una corsa), il programma ridimensiona, converte in scala di grigi, applica una soglia regolabile e restituisce una griglia a due colori. Il **rapporto aghi/corse** corregge le proporzioni così il motivo non risulta schiacciato o allungato sul tessuto.

---

## Decisioni di prodotto (riepilogo)

| Tema                     | Decisione                                                                                                           |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Approccio architetturale | **Interfaccia unica** + **pipeline modulare** interna (opzione #2 in brainstorming)                                 |
| Dimensioni output        | **Larghezza in maglie**; altezza in corse **calcolata** da ritaglio + rapporto aghi/corse                           |
| Limite macchina          | Massimo **200 aghi**; se superato → **avviso**, scelta manuale dell’utente (non blocco automatico)                  |
| Rapporto aghi/corse      | Campi **maglie/cm** e **corse/cm** modificabili (es. 4,5 × 6,4); sezione UI: «Rapporto aghi/corse» (non «tensione») |
| Ritaglio                 | **Manuale** (riquadro trascinabile) + pulsante **«Adatta proporzioni»** al rapporto pattern                         |
| Conversione colore       | **Soglia** (cursore bianco/nero) + **contrasto** + **inversione**; **niente dithering** in v1                       |
| Colori semantici         | **Bianco = background**; **nero = foreground**                                                                      |
| Anteprima                | Pixel **quadrati** per lavorare; toggle **«Come sul tessuto»** per vista proporzioni corrette                       |
| Export AYAB              | PNG: larghezza px = maglie, altezza px = corse, pixel quadrati, solo bianco/nero puro                               |
| Export documentazione    | PNG annotato + PDF (griglia, numerazione, legenda, dimensioni cm)                                                   |
| Layout pagina            | **Tutto su una schermata** (editor); controlli sinistra, anteprima destra; layout più ampio del tool aghi           |
| Privacy                  | Elaborazione **solo nel browser**; nessun upload server                                                             |
| Lingue                   | Italiano e inglese (Paraglide, come hub)                                                                            |

---

## Posizione nell’hub

- Nuova voce in `registry.ts` (slug proposto: `jacquard-pattern`)
- Pagina `src/routes/tools/jacquard-pattern/+page.svelte`
- `ToolPageLayout` per portico; area strumento con **larghezza maggiore** di `max-w-2xl` (layout dedicato)
- Messaggi IT/EN in `messages/{it,en}.json`
- Portico: menzionare AYAB e il fatto che 1 pixel = 1 maglia

---

## Layout pagina e flusso

### Struttura desktop

| Zona sinistra (~1/3)                     | Zona destra (~2/3)                           |
| ---------------------------------------- | -------------------------------------------- |
| Sezioni controlli (scroll se necessario) | Anteprima pattern, aggiornata in tempo reale |

Su mobile/tablet: anteprima sopra, controlli sotto.

### Sezioni controlli (ordine)

1. **Immagine** — drag & drop o «Carica»; miniatura; sostituisci immagine
2. **Ritaglio** — riquadro su immagine originale; «Adatta proporzioni»
3. **Dimensioni e rapporto aghi/corse** — maglie (max 200), maglie/cm, corse/cm; corse calcolate; riepilogo cm
4. **Conversione** — contrasto, cursore bianco/nero, inversione colori
5. **Export** — due pulsanti distinti (vedi sezione Export)

### Flusso tipico

Carica foto → ritaglia → imposta maglie e rapporto → regola bianco/nero → esporta (AYAB o documentazione). Nessun cambio pagina.

Il layout resta una schermata unica; moduli interni permettono in futuro un wizard senza riscrivere la logica.

---

## Pipeline immagine (moduli)

Ogni fase è un modulo con interfaccia definita; l’anteprima si aggiorna dopo ogni modifica.

### 1. Caricamento

- Formati: JPEG, PNG, WebP
- Drag & drop + file picker
- Limite dimensione file: **20 MB** (configurabile)
- Immagine in memoria browser (`ImageData` / canvas)

### 2. Ritaglio

- Riquadro trascinabile e ridimensionabile sull’originale
- **«Adatta proporzioni»**: riquadro con rapporto larghezza/altezza del pattern (maglie : corse corretto per rapporto aghi/corse)
- Ritaglio opzionale; default = immagine intera
- Dimensione minima ritaglio: 1×1 px

### 3. Ridimensionamento

- Output: `larghezza_maglie` × `altezza_corse` pixel (quadrati)
- Altezza corse derivata dal ritaglio e dal rapporto (vedi sezione Calcolo dimensioni)
- Se larghezza > 200: avviso persistente; export con conferma esplicita

### 4. Conversione

1. Scala di grigi
2. Regolazione **contrasto** (cursore)
3. **Soglia** (cursore bianco/nero): sotto soglia → un colore, sopra → l’altro
4. **Inversione** opzionale (scambia background/foreground)
5. Output: griglia **1 bit** (nessun dithering)

### 5. Anteprima

- Rendering griglia da bitmap 1 bit
- Vista default: celle quadrate
- Toggle «Come sul tessuto»: celle con aspect ratio `corse_per_cm : maglie_per_cm`
- Zoom/pan per pattern grandi (fino a 200 maglie)

---

## Calcolo dimensioni e rapporto aghi/corse

### Input utente

| Campo               | Esempio | Vincoli                 |
| ------------------- | ------- | ----------------------- |
| Larghezza in maglie | 120     | 1–200 (avviso se > 200) |
| Maglie per cm       | 4,5     | > 0                     |
| Corse per cm        | 6,4     | > 0                     |

### Calcolo altezza in corse

1. Proporzione ritaglio: `R = larghezza_ritaglio_px / altezza_ritaglio_px`
2. Larghezza fisica tessuto (cm): `L_cm = maglie / maglie_per_cm`
3. Altezza fisica tessuto (cm): `H_cm = L_cm / R`
4. Corse: `corse = round(H_cm × corse_per_cm)`

### Esempio

Ritaglio quadrato (R = 1), 120 maglie, 4,5 maglie/cm, 6,4 corse/cm:

- `L_cm = 120 / 4,5 ≈ 26,67 cm`
- `H_cm ≈ 26,67 cm`
- `corse = round(26,67 × 6,4) = 171`

### Riepilogo UI

Sempre visibile sotto i campi, es.:

> 120 maglie × 171 corse — circa 26,7 × 26,7 cm sul tessuto

### Avvisi

| Condizione               | Comportamento                            |
| ------------------------ | ---------------------------------------- |
| Maglie > 200             | Avviso vicino al campo                   |
| Corse > 500              | Avviso informativo «Pattern molto lungo» |
| maglie/cm o corse/cm ≤ 0 | Campo non valido; calcolo sospeso        |

---

## Export

### Pulsante «Esporta per AYAB»

File PNG per import in AYAB:

| Proprietà      | Valore                                       |
| -------------- | -------------------------------------------- |
| Larghezza (px) | = numero maglie                              |
| Altezza (px)   | = numero corse                               |
| Pixel          | Quadrati; solo `#000000` e `#FFFFFF`         |
| Contenuto      | Solo bitmap; niente griglia, numeri, legenda |

Nome file suggerito: `pattern-{maglie}x{corse}-ayab.png`

### Pulsante «Esporta documentazione»

Scarica **PNG annotato** + **PDF**.

**PNG annotato:**

- Pattern bianco/nero
- Griglia (ogni cella o ogni N celle)
- Numeri riga (corse) a sinistra; numeri colonna (maglie) in alto
- Numerazione: ogni **10**, trattino ogni **5**
- Legenda: **Background** (bianco), **Foreground** (nero); etichette rinominabili prima dell’export (opzionale v1: etichette fisse localizzate)
- Vista quadrata o «come sul tessuto» (stesso toggle dell’anteprima)

**PDF:**

- Stesso contenuto del PNG annotato
- Orientamento automatico (landscape se pattern largo)
- Metadati testuali: maglie × corse, cm sul tessuto, rapporto aghi/corse usato

---

## Gestione errori

| Situazione              | Messaggio (intent)                                       |
| ----------------------- | -------------------------------------------------------- |
| Formato non supportato  | «Formato non supportato. Usa JPG, PNG o WebP.»           |
| File troppo grande      | «Immagine troppo grande. Prova con un file più leggero.» |
| Nessuna immagine        | Export disabilitati; «Carica un’immagine per iniziare»   |
| Export con maglie > 200 | Dialogo di conferma prima del download                   |

Tutti i messaggi in IT e EN via Paraglide.

---

## Fuori scope — v1

- Dithering e mezzetinte
- Pattern a 3–8 colori
- Preset salvabili del rapporto aghi/corse
- Export formato nativo AYAB (oltre al PNG bitmap)
- Ritaglio intelligente (rilevamento automatico soggetto/sfondo)
- Upload server / account

L’architettura modulare deve permettere dithering e multicolore senza rifare l’UI.

---

## Test (implementazione)

- Calcolo corse con rapporto 4,5 × 6,4 e ritaglio noto
- Avviso e conferma export oltre 200 maglie
- PNG AYAB: dimensioni e soli due colori
- Pipeline contrasto + soglia + inversione
- PDF/PNG documentato: griglia, numerazione, legenda background/foreground
- Ritaglio «Adatta proporzioni»: rapporto riquadro coerente con maglie/corse

---

## Prossimo passo

Dopo approvazione di questo file: piano di implementazione dettagliato (`writing-plans`).
