import { randomUUID } from "crypto"

export const mockChats = [
  {
    id: randomUUID(),
    title: "Offerte opvolgen",
    messages: [
      { id: "u1", role: "user", text: "Hoe volg ik een offerte professioneel op na een week stilte?" },
      { id: "a1", role: "assistant", done: true, text: "Stuur een korte, vriendelijke e-mail waarin je aangeeft dat je benieuwd bent naar hun bevindingen. Vermijd druk — iets als: 'Ik wilde even informeren of u nog vragen heeft naar aanleiding van onze offerte.' Houd het kort en geef ze ruimte." },
    ]
  },
  {
    id: randomUUID(),
    title: "Factuur te laat betaald",
    messages: [
      { id: "u2", role: "user", text: "Een klant betaalt al 3 weken te laat, wat doe ik?" },
      { id: "a2", role: "assistant", done: true, text: "Stuur eerst een vriendelijke herinnering. Blijft het uit, stuur dan een formele aanmaning met een nieuwe deadline en vermeld dat je anders incassokosten in rekening brengt. Documenteer alles schriftelijk." },
    ]
  },
  {
    id: randomUUID(),
    title: "Nieuwe medewerker onboarden",
    messages: [
      { id: "u3", role: "user", text: "Wat zijn de belangrijkste stappen bij het onboarden van een nieuwe medewerker?" },
      { id: "a3", role: "assistant", done: true, text: "Zorg voor een duidelijk inwerkplan: dag 1 introductie met het team, week 1 kennismaken met processen en tools, week 2-4 zelfstandig werken met begeleiding. Wijs een buddy aan en plan vaste check-ins in de eerste maand." },
    ]
  },
  {
    id: randomUUID(),
    title: "LinkedIn bedrijfspagina",
    messages: [
      { id: "u4", role: "user", text: "Hoe maak ik onze LinkedIn bedrijfspagina aantrekkelijker?" },
      { id: "a4", role: "assistant", done: true, text: "Post minimaal 3x per week: mix van bedrijfsnieuws, tips uit jouw vakgebied en behind-the-scenes content. Zorg dat de bannerfoto professioneel is, de beschrijving duidelijk vertelt wat je doet en voeg een call-to-action toe in de header." },
    ]
  },
  {
    id: randomUUID(),
    title: "Vergadering efficiënter maken",
    messages: [
      { id: "u5", role: "user", text: "Onze vergaderingen duren altijd veel te lang, tips?" },
      { id: "a5", role: "assistant", done: true, text: "Stuur altijd vooraf een agenda met tijdsblokken per onderwerp. Begin en eindig op tijd. Benoem een timekeeper. Beslissingen die twee mensen kunnen nemen hoeven niet in een groepsvergadering. Evalueer achteraf of de meeting nodig was." },
    ]
  },
  {
    id: randomUUID(),
    title: "Klant wil korting",
    messages: [
      { id: "u6", role: "user", text: "Een klant vraagt altijd om korting, hoe ga ik daarmee om?" },
      { id: "a6", role: "assistant", done: true, text: "Geef geen korting zonder iets terug te vragen. Bied een kleinere scope aan voor een lagere prijs, of een korting bij snelle betaling. Verdedig je prijs met waarde: wat levert jouw dienst hen op? Een klant die altijd onderhandelt onderwaardeert je werk structureel." },
    ]
  },
  {
    id: randomUUID(),
    title: "Website conversie verbeteren",
    messages: [
      { id: "u7", role: "user", text: "Onze website trekt bezoekers maar niemand neemt contact op." },
      { id: "a7", role: "assistant", done: true, text: "Check of je call-to-action duidelijk en zichtbaar is boven de vouw. Bezoekers beslissen in 5 seconden of ze blijven — maak direct duidelijk wat je doet en voor wie. Voeg social proof toe: klantreviews, logo's of een concreet resultaat. Vereenvoudig het contactformulier tot maximaal 3 velden." },
    ]
  },
  {
    id: randomUUID(),
    title: "Samenwerking beëindigen",
    messages: [
      { id: "u8", role: "user", text: "Hoe stop ik professioneel een samenwerking met een lastige klant?" },
      { id: "a8", role: "assistant", done: true, text: "Wees direct maar respectvol. Geef aan dat je merkt dat de samenwerking niet meer optimaal aansluit en dat je denkt dat ze beter geholpen zijn elders. Geef ze ruim de tijd om een alternatief te vinden en rond lopende zaken netjes af. Vermijd uitgebreide uitleg — kort en helder is het meest professioneel." },
    ]
  },
  {
    id: randomUUID(),
    title: "Projectplanning maken",
    messages: [
      { id: "u9", role: "user", text: "Wat is een goede manier om een projectplanning op te zetten?" },
      { id: "a9", role: "assistant", done: true, text: "Begin met het eindresultaat en werk terug. Breek het project op in fases, elke fase in taken, elke taak krijgt een eigenaar en deadline. Gebruik een tool als Notion, Asana of simpelweg een spreadsheet. Bouw altijd 20% buffer in — projecten lopen altijd uit." },
    ]
  },
  {
    id: randomUUID(),
    title: "Prijzen verhogen",
    messages: [
      { id: "u10", role: "user", text: "Ik wil mijn prijzen verhogen maar ben bang klanten te verliezen." },
      { id: "a10", role: "assistant", done: true, text: "Communiceer de verhoging ruim van tevoren, minimaal 4-6 weken. Leg kort uit waarom — stijgende kosten, meer waarde, marktconformiteit. De meeste loyale klanten accepteren een redelijke verhoging. Klanten die vertrekken bij een kleine prijsverhoging waren zelden winstgevend." },
    ]
  },
  {
    id: randomUUID(),
    title: "Productlancering strategie",
    messages: [
      { id: "u11", role: "user", text: "We lanceren volgende maand een nieuw product, waar begin ik?" },
      { id: "a11", role: "assistant", done: true, text: "Start met een waitlist of pre-launch campagne om interesse te meten. Bouw spanning op via social media met teasers. Zorg dat je klantenservice klaar is voor vragen. Plan de lancering op dinsdag of woensdag — die dagen hebben de hoogste engagement. Stuur bestaande klanten een exclusief vroegboekvoordeel." },
      { id: "u11b", role: "user", text: "En hoe meet ik of de lancering succesvol is?" },
      { id: "a11b", role: "assistant", done: true, text: "Bepaal vooraf je KPIs: aantal verkopen dag 1, websiteverkeer, conversieratio en social media bereik. Vergelijk met je baseline. Een goede lancering is niet per se veel verkoop op dag 1 — soms zit de waarde in de naamsbekendheid en leads die later converteren." },
      { id: "u11c", role: "user", text: "Wat als de lancering tegenvalt?" },
      { id: "a11c", role: "assistant", done: true, text: "Analyseer eerst waarom: was het de timing, de prijs, de boodschap of het product zelf? Praat met mensen die hebben afgehaakt. Een tegenvallende lancering is waardevolle data. Vaak helpt een herpositionering of een second launch met betere targeting meer dan opgeven." },
      { id: "u11d", role: "user", text: "Heeft het zin om influencers in te zetten?" },
      { id: "a11d", role: "assistant", done: true, text: "Ja, maar kies voor micro-influencers in jouw niche boven grote namen. Een influencer met 8.000 betrokken volgers in jouw branche converteert beter dan iemand met 500.000 generieke volgers. Stuur een gratis product en vraag een eerlijke review — geen script, dat prikken mensen door." },
    ]
  },
  {
    id: randomUUID(),
    title: "Team motiveren",
    messages: [
      { id: "u12", role: "user", text: "Mijn team lijkt gedemotiveerd de laatste tijd, hoe pak ik dat aan?" },
      { id: "a12", role: "assistant", done: true, text: "Begin met luisteren — voer individuele gesprekken en vraag open wat ze nodig hebben. Demotivatie heeft zelden één oorzaak. Veelvoorkomende redenen: onduidelijkheid over richting, gebrek aan erkenning of te weinig autonomie. Maak verwachtingen helder en vier kleine overwinningen expliciet." },
      { id: "u12b", role: "user", text: "We hebben weinig budget voor bonussen, wat kan ik dan nog doen?" },
      { id: "a12b", role: "assistant", done: true, text: "Motivatie draait maar voor een klein deel om geld. Geef mensen meer eigenaarschap over hun werk, investeer in hun ontwikkeling met trainingen, geef expliciete complimenten en zorg voor een fijne werkomgeving. Flexibele werktijden of een extra vrije dag kosten weinig maar worden enorm gewaardeerd." },
      { id: "u12c", role: "user", text: "Hoe houd ik dit op lange termijn vol?" },
      { id: "a12c", role: "assistant", done: true, text: "Maak motivatie structureel: plan kwartaalgesprekken, heb een duidelijke visie waar het team naartoe werkt en zorg dat iedereen weet hoe hun werk bijdraagt aan het grotere geheel. Cultuur is geen project, het is dagelijks gedrag van leidinggevenden." },
      { id: "u12d", role: "user", text: "Wat als één persoon de sfeer blijft verpesten?" },
      { id: "a12d", role: "assistant", done: true, text: "Adresseer het direct en privé. Benoem concreet gedrag, niet de persoon. Geef duidelijk aan wat je verwacht en wat de consequenties zijn als het niet verandert. Eén negatieve persoon kan een heel team ondermijnen — als gesprekken niets opleveren moet je bereid zijn door te pakken." },
    ]
  },
  {
    id: randomUUID(),
    title: "Automatisering inzetten",
    messages: [
      { id: "u13", role: "user", text: "Welke bedrijfsprocessen kan ik het beste automatiseren?" },
      { id: "a13", role: "assistant", done: true, text: "Start met repetitieve taken: facturatie, e-mailresponses, rapportages en social media planning. Tools als Zapier of Make verbinden je bestaande software zonder code. Automatiseer eerst wat de meeste tijd kost en het minste denkvermogen vereist." },
      { id: "u13b", role: "user", text: "Wat kost dat gemiddeld?" },
      { id: "a13b", role: "assistant", done: true, text: "Zapier begint gratis en een betaald plan zit rond de €20-50 per maand voor de meeste MKB-bedrijven. Make is goedkoper en flexibeler. De ROI is snel terug: als je twee uur per week bespaart tegen een uurtarief van €75, verdien je een betaald plan in één dag terug." },
      { id: "u13c", role: "user", text: "Heb ik daar technische kennis voor nodig?" },
      { id: "a13c", role: "assistant", done: true, text: "Voor Zapier nauwelijks — het werkt met drag-and-drop en kant-en-klare templates. Make heeft een leercurve maar YouTube tutorials zijn uitstekend. Voor complexere koppelingen met maatwerk API's heb je een developer nodig, maar de meeste standaard automatiseringen doe je zelf." },
      { id: "u13d", role: "user", text: "Waar ga ik dan mis bij automatiseren?" },
      { id: "a13d", role: "assistant", done: true, text: "De grootste valkuil is automatiseren wat eerst geoptimaliseerd had moeten worden. Een slecht proces automatisch uitvoeren gaat sneller fout. Begin altijd met: is dit proces überhaupt nodig en kan het eenvoudiger? Daarna pas automatiseren. Documenteer ook wat je hebt gebouwd zodat je er later op terug kunt." },
    ]
  },
  {
    id: randomUUID(),
    title: "Slechte review ontvangen",
    messages: [
      { id: "u14", role: "user", text: "We hebben een slechte Google review gekregen die niet klopt, wat nu?" },
      { id: "a14", role: "assistant", done: true, text: "Reageer altijd openbaar, kalm en professioneel — anderen lezen mee. Erken de ervaring zonder toe te geven dat je fout zat. Nodig ze uit voor een gesprek buiten het platform. Een goede reactie op een slechte review kan je reputatie juist versterken." },
    ]
  },
  {
    id: randomUUID(),
    title: "Groeistrategie bepalen",
    messages: [
      { id: "u15", role: "user", text: "We draaien stabiel maar groeien niet meer, hoe pak ik dat aan?" },
      { id: "a15", role: "assistant", done: true, text: "Stabiel is goed maar kan ook een signaal zijn dat je markt verzadigd raakt of dat je aanbod niet meer differentieert. Analyseer waar je huidige klanten vandaan komen en probeer dat kanaal te verdubbelen. Kijk ook naar aangrenzende markten of extra diensten voor bestaande klanten — dat is goedkoper dan nieuwe klanten werven." },
      { id: "u15b", role: "user", text: "Moeten we dan nieuwe markten aanboren?" },
      { id: "a15b", role: "assistant", done: true, text: "Niet per se als eerste stap. Bestaande klanten meer laten kopen of langer vasthouden is efficiënter dan nieuwe markten. Kijk eerst naar churn: waarom stoppen klanten? En naar upsell: wat koop je nu niet bij ons wat je elders koopt? Nieuwe markten zijn zinvol als je huidige markt echt plafond bereikt heeft." },
      { id: "u15c", role: "user", text: "Hoe weet ik of we klaar zijn om te schalen?" },
      { id: "a15c", role: "assistant", done: true, text: "Je bent klaar om te schalen als je processen herhaalbaar zijn, je team niet afhankelijk is van jou voor dagelijkse beslissingen en je unit economics kloppen — dus elke nieuwe klant is winstgevend. Schalen voor die tijd vergroot alleen bestaande problemen." },
      { id: "u15d", role: "user", text: "Wat is een realistisch groeidoel voor komend jaar?" },
      { id: "a15d", role: "assistant", done: true, text: "Dat hangt af van je sector en huidige omzet, maar 20-30% groei is voor de meeste MKB-bedrijven ambitieus maar haalbaar met de juiste focus. Belangrijker dan het percentage is dat je weet welke hefboom je gebruikt: meer klanten, hogere orderwaarde of hogere retentie. Kies er één en ga er volledig voor." },
    ]
  },
];