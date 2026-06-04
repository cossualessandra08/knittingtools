# Design: Hub strumenti per la maglieria

**Data:** 2026-06-04  
**Stato:** Approvato in brainstorming (sezioni 1–6)  
**Progetto:** knittingtools (repository esistente, homepage da costruire)

---

## Obiettivo

Sito che raccoglie strumenti dedicati alla maglieria. Ogni strumento ha una sottosezione (pagina) propria. L’esperienza privilegia la **scoperta** (catalogo da esplorare) più che l’uso immediato senza contesto.

## Decisioni di prodotto (riepilogo)

| Tema                     | Decisione                                                                                      |
| ------------------------ | ---------------------------------------------------------------------------------------------- |
| Esperienza principale    | Catalogo da esplorare — capire cosa fa ogni strumento prima/durante l’uso                      |
| Pubblico                 | Tutti — dal principiante all’esperto; linguaggio accessibile                                   |
| Atmosfera visiva         | Pulita e moderna — molto spazio bianco, tipografia netta, sensazione quasi “app”               |
| Lancio                   | Pochi strumenti reali; struttura pronta per molti senza ridisegnare                            |
| Navigazione catalogo     | Griglia unica, ordine **curato manualmente** (no categorie/filtri/ricerca in v1)               |
| Lingue                   | Italiano e inglese, commutatore sempre disponibile                                             |
| Schede catalogo          | Titolo + una frase + icona/illustrazione coerente per strumento                                |
| Homepage                 | Intro breve (titolo sito + una riga), poi griglia                                              |
| Modello pagina strumento | **Portico di scoperta** + area strumento + link ritorno al catalogo (approccio consigliato #3) |

---

## Architettura informativa

### Pagine

| Pagina               | Ruolo                                                                |
| -------------------- | -------------------------------------------------------------------- |
| **Home**             | Intro breve + griglia curata degli strumenti                         |
| **Pagina strumento** | Portico + interfaccia dello strumento + invito a tornare al catalogo |

### Percorso utente

1. Arrivo in home → leggo intro (titolo + una riga) → esploro la griglia.
2. Clic su scheda → portico (contesto) → uso lo strumento.
3. Torno al catalogo tramite link esplicito (es. «Altri strumenti» / «All tools»).

### Aggiunta di un nuovo strumento

Per ogni strumento, contenuti da produrre (IT + EN):

1. Icona nel set visivo condiviso
2. Titolo + frase per la scheda in griglia
3. Portico (2–3 frasi)
4. Interfaccia dello strumento

Azioni strutturali: nuova scheda in griglia (stesso formato) + nuova pagina (stesso layout). L’ordine in griglia è decisione editoriale (curazione).

---

## Homepage

### Header (globale)

- Sinistra: nome del sito (wordmark tipografico; logo complesso non richiesto al lancio).
- Destra: commutatore **IT | EN** — lingua attiva evidenziata in modo sottile.

### Intro

- Titolo principale (nome progetto o definizione della raccolta).
- Sottotitolo: **una sola frase** su cosa si trova nel sito.
- Nessun carosello o banner tra intro e catalogo.

### Griglia catalogo

- Schede uniformi (stesso formato per tutti gli strumenti).
- Ordine curato dall’autore.
- Layout responsive: 1 colonna (mobile), 2 (tablet), 3 max (desktop), con spaziatura generosa.
- Con 1–2 strumenti al lancio: pochi elementi e molto whitespace — **no** schede placeholder «in arrivo».

### Scheda strumento (card)

| Elemento              | Specifica                                                                      |
| --------------------- | ------------------------------------------------------------------------------ |
| Icona / illustrazione | In alto; stessa dimensione; stile coerente (line weight, palette, peso visivo) |
| Titolo                | Breve, funzionale                                                              |
| Frase                 | Una riga, verbo all’inizio, cosa risolve                                       |
| Interazione           | Hover/focus leggero (bordo sottile o sollevamento minimo)                      |

**Escluso dalla scheda in v1:** tag, categorie, badge «nuovo», rating.

---

## Pagina strumento

### Sezioni (dall’alto)

1. **Header** — identico alla home.
2. **Portico di scoperta**
   - Icona (stessa della scheda, dimensione maggiore)
   - Titolo strumento
   - 2–3 frasi: cosa fa, quando è utile, (opzionale) cosa si ottiene
   - Riga opzionale tipo «Non serve registrarsi» / «Risultato subito» — **solo** se vera per tutti gli strumenti; altrimenti omessa
3. **Area strumento**
   - Separata dal portico con spazio bianco o linea 1px
   - Contenitore con larghezza massima leggibile; margini coerenti su tutte le pagine strumento
   - UI specifica per strumento; stile pulsanti/input condiviso (vedi linguaggio visivo)
4. **Chiusura**
   - Link testuale al catalogo (IT/EN)
   - Nessun footer complesso in v1

### Coerenza scheda ↔ portico

- La frase in griglia è l’hook; il portico **espande** senza ripetere parola per parola.
- Stessa icona in entrambi i contesti.

---

## Linguaggio visivo

### Colore

- Sfondo: bianco o off-white leggerissimo.
- Testo: grigio quasi nero (corpo); nero per titoli.
- **Un solo colore accento** (link, lingua attiva, focus scheda) — da definire (es. blu-verde tenue, terracotta soft, viola polvere); evitare estetica «craft kitsch».
- Icone: linea grigio scuro; opzionale accento su hover.
- No gradienti vistosi; max 2 colori oltre ai neutri.

### Tipografia

- Una famiglia sans (neo-grotesk / geometrica), titoli e corpo.
- Gerarchia: titoli semibold grandi; sottotitolo intro grigio medio; corpo regular; frase scheda leggermente più piccola del titolo scheda.
- Interlinea generosa.

### Spazio e componenti

- Margini laterali ampi su desktop.
- Padding generoso nelle schede.
- Distanza fissa tra portico e area strumento (identica su tutte le pagine).
- Schede: raggio 8–12px; ombra quasi assente o bordo 1px grigio chiaro.
- Pulsanti e input: stile unico, focus con colore accento.

### Accessibilità (intent)

- Contrasto testo/sfondo leggibile.
- Stati focus visibili senza mouse.

---

## Tono dei testi (IT / EN)

- Utile, breve, diretto (tu / you).
- Termini tecnici spiegati alla prima occorrenza se necessari.
- Parità di contenuto tra lingue (stesso significato, non traduzione rigida).
- Formule: frase scheda con verbo iniziale; portico in 3 micro-passi (cosa / quando / risultato opzionale).
- Evitare: superlativi, gergo da prodotto software, umorismo forzato, emoji nel copy, titoli vaghi.

**Da definire dall’autore:** nome definitivo del sito; nomi degli strumenti al lancio.

---

## Fuori scope — v1

- Account / login
- Categorie, tag, filtri, ricerca
- Blog, newsletter
- Pagina «Chi sono» dedicata
- Commenti, rating, community
- Schede placeholder «in arrivo»
- Tema scuro
- App nativa
- Monetizzazione visibile (ads, paywall)

---

## In scope — v1

- Home: intro + griglia bilingue
- Pagine strumento: portico + area strumento + ritorno catalogo
- Header con IT | EN
- Set icone/illustrazioni coerente
- Pochi strumenti funzionanti; struttura scalabile

---

## Contesto tecnico (riferimento minimo)

Il repository `knittingtools` esiste già (SvelteKit, deploy statico, base i18n en/it). Questo documento descrive **esperienza e contenuti**; l’implementazione seguirà in un piano separato dopo approvazione di questa spec.

---

## Prossimo passo

Dopo approvazione di questo file: piano di implementazione dettagliato (`writing-plans`).
