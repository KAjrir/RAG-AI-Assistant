// pages/Privacy.jsx
// Privacybeleid van Raggy (raggy.nl/privacy). Ook nodig voor de Google OAuth-verificatie.
import { Link } from 'react-router';
import '../styles/legal.css';

const CONTACT_EMAIL = 'support@raggy.nl';
const UPDATED_AT    = '19 november 2026';

export default function Privacy() {
  return (
    <div className="lg">
      <header className="lg-header">
        <Link to="/" className="lg-logo" aria-label="Raggy home">
          <img src="/images/logo.svg" alt="Raggy" width="96" height="36" />
        </Link>
      </header>

      <main className="lg-main">
        <p className="lg-label">Privacybeleid</p>
        <h1 className="lg-title">Hoe Raggy met je gegevens omgaat</h1>
        <p className="lg-updated">Laatst bijgewerkt: {UPDATED_AT}</p>

        <p>
          Raggy (raggy.nl) is een kennisassistent voor organisaties. Je uploadt documenten of koppelt
          een bron zoals Google Drive, en stelt daar vragen over in de chat. In dit privacybeleid lees je
          welke gegevens we daarvoor gebruiken, waarom, en welke rechten je hebt.
        </p>

        <h2>1. Welke gegevens we verwerken</h2>
        <ul>
          <li><strong>Accountgegevens:</strong> je naam, e-mailadres en wachtwoord (versleuteld opgeslagen), en de workspaces waar je lid van bent.</li>
          <li><strong>Documenten:</strong> de bestanden die je in Raggy uploadt, en de tekst die we daaruit halen om vragen te kunnen beantwoorden.</li>
          <li><strong>Chats:</strong> de vragen die je stelt en de antwoorden van Raggy, zodat je gesprekken later terug kunt lezen.</li>
          <li><strong>Gekoppelde diensten:</strong> als je een dienst zoals Google Drive koppelt, de toegangsgegevens (tokens) van die koppeling. Zie hoofdstuk 3.</li>
          <li><strong>Technische gegevens:</strong> wat nodig is om in te loggen en de dienst veilig te laten werken, zoals een sessiecookie.</li>
        </ul>

        <h2>2. Waarvoor we je gegevens gebruiken</h2>
        <ul>
          <li>Om je account en workspace te laten werken.</li>
          <li>Om vragen te beantwoorden op basis van de documenten en bestanden van jouw organisatie.</li>
          <li>Om de dienst te beveiligen en fouten op te lossen.</li>
          <li>Om contact met je op te nemen over je account, bijvoorbeeld bij een uitnodiging of een wachtwoordreset.</li>
        </ul>
        <p>
          We verkopen je gegevens niet, gebruiken ze niet voor advertenties, en gebruiken je documenten of
          chats niet om AI-modellen te trainen.
        </p>

        <h2>3. Google Drive</h2>
        <p>
          Als je Google Drive koppelt, vraagt Raggy alleen toegang tot de bestanden die je zelf kiest in de
          Google Drive-kiezer (de scope <code>drive.file</code>). Raggy ziet de rest van je Drive niet.
        </p>
        <ul>
          <li><strong>Wat we gebruiken:</strong> de naam, het type en de inhoud van de bestanden die je hebt gekozen.</li>
          <li><strong>Waarvoor:</strong> alleen om je vragen over die bestanden te beantwoorden in de chat.</li>
          <li><strong>Wat we opslaan:</strong> de toegangsgegevens (tokens) van de koppeling. De inhoud van je bestanden wordt opgehaald op het moment dat Raggy een vraag beantwoordt, en niet apart door ons bewaard.</li>
          <li><strong>Wat we niet doen:</strong> Raggy past je bestanden niet aan en deelt ze niet met andere gebruikers buiten je workspace.</li>
          <li><strong>Toegang intrekken:</strong> verwijder de koppeling in Raggy onder Connecties, of trek de toegang in via je Google-account op <a href="https://myaccount.google.com/permissions" target="_blank" rel="noreferrer">myaccount.google.com/permissions</a>.</li>
        </ul>
        <p>
          Het gebruik en de overdracht van gegevens die Raggy van Google API's ontvangt, voldoen aan de{' '}
          <a href="https://developers.google.com/terms/api-services-user-data-policy" target="_blank" rel="noreferrer">
            Google API Services User Data Policy
          </a>
          , inclusief de Limited Use-vereisten.
        </p>

        <h2>4. Met wie we gegevens delen</h2>
        <p>
          We werken met een paar dienstverleners die gegevens namens ons verwerken. Zij mogen je gegevens
          alleen gebruiken om hun dienst aan Raggy te leveren:
        </p>
        <ul>
          <li><strong>AI-verwerking:</strong> om antwoorden te maken, sturen we je vraag en de relevante stukken tekst uit je documenten naar onze AI-leverancier (OpenAI). Die gegevens worden niet gebruikt om hun modellen te trainen.</li>
          <li><strong>Hosting en database:</strong> onze servers en database, waar je account, documenten en chats worden opgeslagen.</li>
          <li><strong>E-mail:</strong> voor het versturen van uitnodigingen en wachtwoordresets.</li>
        </ul>
        <p>
          Sommige van deze leveranciers zitten buiten de Europese Unie. In dat geval zorgen we dat er
          passende afspraken zijn, zoals de standaardcontractbepalingen van de Europese Commissie.
        </p>

        <h2>5. Hoe lang we gegevens bewaren</h2>
        <p>
          We bewaren je gegevens zolang je account of workspace bestaat. Verwijder je een document, chat of
          koppeling, dan verwijderen we die ook bij ons. Verwijder je je workspace of account, dan
          verwijderen we de bijbehorende gegevens, tenzij we iets wettelijk langer moeten bewaren.
        </p>

        <h2>6. Beveiliging</h2>
        <p>
          We nemen passende maatregelen om je gegevens te beschermen: verbindingen zijn versleuteld (HTTPS),
          wachtwoorden worden versleuteld opgeslagen, en gegevens van verschillende workspaces zijn van
          elkaar gescheiden.
        </p>

        <h2>7. Je rechten</h2>
        <p>
          Volgens de AVG heb je het recht om je gegevens in te zien, te laten corrigeren of verwijderen, de
          verwerking te beperken, bezwaar te maken, en je gegevens mee te nemen. Mail ons op{' '}
          <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>, dan reageren we binnen een maand. Ben je
          het niet eens met hoe we met je gegevens omgaan, dan kun je ook een klacht indienen bij de{' '}
          <a href="https://autoriteitpersoonsgegevens.nl" target="_blank" rel="noreferrer">Autoriteit Persoonsgegevens</a>.
        </p>

        <h2>8. Wijzigingen</h2>
        <p>
          Als we dit privacybeleid aanpassen, zetten we de nieuwe versie op deze pagina, met de datum
          bovenaan. Bij grote wijzigingen laten we het je ook weten via e-mail of in de app.
        </p>

        <h2>9. Contact</h2>
        <p>
          Vragen over je privacy? Mail naar <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>.
        </p>
      </main>

      <footer className="lg-footer">
        © {new Date().getFullYear()} Raggy · <Link to="/">raggy.nl</Link>
      </footer>
    </div>
  );
}