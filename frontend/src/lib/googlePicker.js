// lib/googlePicker.js
// Laadt de Google Picker en laat de gebruiker bestanden kiezen.
// Met scope drive.file krijgt Raggy alleen toegang tot wat hier gekozen wordt.

const PICKER_SCRIPT = 'https://apis.google.com/js/api.js';

// Mappen staan altijd in de Picker, zodat je erin kunt bladeren.
// Welke bestanden kiesbaar zijn, bepaalt de server (mimeTypes uit /picker).
const FOLDER = 'application/vnd.google-apps.folder';

let loading = null;

export function loadPicker() {
  if (loading) return loading;

  loading = new Promise((resolve, reject) => {
    const init = () =>
      window.gapi.load('picker', {
        callback: resolve,
        onerror: () => reject(new Error('Google Picker kon niet worden geladen.')),
      });

    if (window.gapi?.load) return init();

    const script = document.createElement('script');
    script.src = PICKER_SCRIPT;
    script.async = true;
    script.onload = init;
    script.onerror = () => {
      loading = null; // volgende keer opnieuw proberen
      reject(new Error('Google Picker kon niet worden geladen.'));
    };
    document.head.appendChild(script);
  });

  return loading;
}

/**
 * Opent de Picker. Geeft de gekozen bestanden terug als { id, name, mimeType },
 * of [] als de gebruiker annuleert.
 */
export async function openDrivePicker({ accessToken, apiKey, appId, mimeTypes = [] }) {
  await loadPicker();
  const gp = window.google.picker;
  const allowed = [FOLDER, ...mimeTypes].join(',');

  const myDrive = new gp.DocsView(gp.ViewId.DOCS)
    .setIncludeFolders(true)
    .setSelectFolderEnabled(false) // mappen alleen om in te bladeren
    .setMimeTypes(allowed);

  const sharedDrives = new gp.DocsView(gp.ViewId.DOCS)
    .setEnableDrives(true)
    .setIncludeFolders(true)
    .setSelectFolderEnabled(false) // mappen alleen om in te bladeren
    .setMimeTypes(allowed);

  return new Promise(resolve => {
    const picker = new gp.PickerBuilder()
      .setOAuthToken(accessToken)
      .setDeveloperKey(apiKey)
      .setAppId(appId) // nodig zodat de gekozen bestanden echt aan Raggy worden toegekend
      .addView(myDrive)
      .addView(sharedDrives)
      .enableFeature(gp.Feature.MULTISELECT_ENABLED)
      .enableFeature(gp.Feature.SUPPORT_DRIVES)
      .setLocale('nl')
      .setTitle('Kies wat Raggy mag gebruiken')
      .setCallback(data => {
        if (data.action === gp.Action.PICKED) {
          resolve(data.docs.map(d => ({ id: d.id, name: d.name, mimeType: d.mimeType })));
        } else if (data.action === gp.Action.CANCEL) {
          resolve([]);
        }
      })
      .build();

    picker.setVisible(true);
  });
}