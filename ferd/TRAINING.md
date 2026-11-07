# Trening i Ferd

Trening-fanen er en skrivebeskyttet visning av en publisert JSON-eksport fra
det lokale statistikkverkstedet. `training-data.json` lastes automatisk.
Brukeren har uttrykkelig valgt offentlig publisering av den avgrensede
eksporten. Treningsdataene finnes dermed også i Git-historikken. Ingen
Garmin-nøkler eller Garmin-synk publiseres. Siden har ikke innlogging.

1. Kjør lokal Garmin-synk i statistikkverkstedet.
2. Kjør `export_training.py --output <repoets ferd-mappe>\training-data.json`.
3. Test og publiser kun Ferd-endringene og den avgrensede eksporten.
4. Åpne **Trening** i Ferd. Data lastes automatisk uten manuell import.

Dette er manuelle publiseringsoppdateringer, ikke kontinuerlig Garmin-synk.
Siden viser eksportdato og markerer når datagrunnlaget er gammelt.

Eksporten inneholder dato, idrett, treningstid, distanse, snittpuls,
SkiErg/styrke-oppdeling, plan og utvalgte mål. GPS, rå FIT-data, helsedagsdata,
private notater og Garmin-ID-er er utelatt. Eksporten inneholder likevel
personlige data; publisering krever eksplisitt samtykke. Hele databasen,
nøkkellageret og rådataene må aldri publiseres.
Økter og mål holdes separat fra Ferds eksisterende turer og ruter.
Manuell import er fortsatt mulig og lagres i nettleseren. En nyere lokal
import bevares fremfor en eldre publisert fil. **Vis publiserte data** fjerner
kun lokal treningseksport og henter den offentlige filen igjen.
Nettverks- og valideringsfeil vises eksplisitt; tidligere viste data beholdes.

Den lokale appen er beholdt på `http://127.0.0.1:8766`. Start den med
`Start Ferd.cmd` i statistikkverkstedet. Lenken fra Trening-fanen fungerer kun
på PC-en hvor serveren kjører; webappen starter eller kontakter ikke Garmin.

Hovedvisualiseringen er en kalenderbasert tidslinje fra planstart til Birken,
med Sjusjøen som milepæl. Terrenget er illustrasjon, ikke målt kondisjon eller
en faktisk løypeprofil. Den gamle tidskurven er tilgjengelig under
**Treningsmengde og gjennomføring**.

Kondisjonsvisningen viser siste registrerte 5000 m-test mot delmålet 18:00.
Uten testbaseline og avtalte mellomtestmål er kondisjon foran/bak plan ukjent.
Løping vises som målte tempopunkter ved snittpuls 130–140 bpm og minst 15 min.
De siste fire ukene sammenlignes med de fire foregående bare med minst tre
turer i hver periode, høyst 3 bpm forskjell i snitt og høyst 20 % forskjell i
gjennomsnittlig varighet. Dette er observasjoner, ikke VO2max eller en
kontrollert kondisjonsmåling; rute, vær, skade og sykdom kan påvirke dem.

Ingen Birken-prognose eller konvertering fra løping/sykling til SkiErg brukes.
Ekstraaktiviteter summeres separat. Kart og avansert øktstatistikk forblir lokalt.
Animasjonen er SVG/CSS og deaktiveres ved `prefers-reduced-motion`.

Validering uten installasjon:

```powershell
node --test training.test.cjs
```
