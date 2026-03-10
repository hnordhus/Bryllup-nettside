# chommie.no — Bryllupsnettside for Ingunn & Henrik

Bryllupsnettside bygget som en enkel single-page HTML-applikasjon. Ingen rammeverk, ingen byggsteg — bare én fil og noen bilder.

> **chommie** /ˈtʃɒmi/ — sørafrikansk slang for *venn*, *kompis*, *bestevenn*. Fra afrikaans «tjommie».

## Funksjoner

- **Passordbeskyttet** — gjeste- og admin-nivå med forskjellige rettigheter
- **RSVP-skjema** — med duplikatsjekk, +1-støtte, matpreferanser og lasteindikator
- **Google Sheets-integrasjon** — RSVP-data sendes automatisk til et regneark via Google Apps Script
- **Gjesteliste** — admin ser allergier, kan slette gjester og eksportere til CSV
- **Gaveliste** — integrert ønskeliste via ønsk.no (iframe)
- **Fargeadmin** — live fargeendring via 🎨-knappen
- **Responsivt design** — fungerer på mobil og desktop

## Mappestruktur

```
├── index.html        ← Hele nettsiden
├── CNAME             ← Custom domain for GitHub Pages
├── README.md
├── images/
│   ├── collage-ramme.png
│   └── NSH.png
└── .vscode/
    └── settings.json
```

## Lokal utvikling

Åpne prosjektet i VS Code og bruk **Live Server**-utvidelsen (høyreklikk `index.html` → «Open with Live Server»). VS Code sin innebygde preview håndterer ikke `sessionStorage` og `location.reload()` like godt.

## Hosting

Nettsiden hostes via **GitHub Pages** med custom domain `chommie.no`.

### DNS-oppsett (simply.com)

For at domenet skal peke til GitHub Pages må følgende DNS-poster legges inn hos domeneregistraren:

**A-poster** (peker rotdomenet til GitHub):

| Type | Navn | Verdi |
|------|------|-------|
| A | @ | 185.199.108.153 |
| A | @ | 185.199.109.153 |
| A | @ | 185.199.110.153 |
| A | @ | 185.199.111.153 |

**CNAME-post** (peker www til GitHub):

| Type | Navn | Verdi |
|------|------|-------|
| CNAME | www | hnordhus.github.io |

> Erstatt `hnordhus` med ditt GitHub-brukernavn hvis det er annerledes.

Etter DNS-endringer kan det ta opptil 24 timer før alt propagerer. Når DNS-sjekken i GitHub er grønn, huk av «Enforce HTTPS».

## Google Sheets backend

RSVP-data sendes til Google Sheets via en Google Apps Script Web App (`doGet`). Scriptet håndterer to handlinger:

- `action=add` — legger til ny rad med gjesteinformasjon
- `action=delete` — fjerner raden som matcher navnet (brukes ved redigering og admin-sletting)

Apps Script URL-en er hardkodet i `index.html` under variabelen `SHEET_URL`.

## Passord

- **Gjestepassord:** gir tilgang til siden og gjestelisten (uten allergier)
- **Adminpassord:** gir tilgang til allergier, sletting, CSV-eksport og «Kommer ikke»-listen

Passordene er definert øverst i `<script>`-blokken i `index.html`.

## Teknologi

- Vanilla HTML/CSS/JS (ingen avhengigheter)
- Google Fonts (Cormorant Garamond + Montserrat)
- Google Maps embed
- Google Apps Script + Sheets (backend)
- GitHub Pages (hosting)
- localStorage (lokal gjestecache)
- sessionStorage (innloggingsstatus)
