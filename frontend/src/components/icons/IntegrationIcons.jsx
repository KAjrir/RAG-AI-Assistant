import AfasIcon from "./AfasIcon.jsx";
import OnsWelzijnIcon from "./OnsWelzijnIcon.jsx";
import SdbGroepIcon from "./SdbGroepIcon.jsx";
import TOPdeskIcon from "./TopDeskIcon.jsx";

export default function IntegrationIcon({ name, size = 32 }) {
  const icons = {
    ons_welzijn: <OnsWelzijnIcon size={size} />,
    sdb_groep:   <SdbGroepIcon size={size} />,
    afas:        <AfasIcon size={size} />,
    topdesk:     <TOPdeskIcon size={size} />,
  };
  return icons[name] ?? null;
}