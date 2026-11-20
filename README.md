# Lietuvių kalba

Static Lithuanian learning app. No backend; progress is stored in the browser (localStorage) and can be exported/imported as a JSON file.

Files: `index.html`, `style.css`, `app.js`, `data.json` (vocabulary and sentences), `grammar.json`, `exam.js` (Exam prep tab: written drills, mock test, speaking practice), `forms.json` (meanings of inflected word forms for tap-a-word), `fonts/` (Literata and Manrope, bundled, SIL Open Font License), `manifest.json` and `sw.js` (phone install and offline use).

The app loads the JSON files with `fetch`, so serve the folder over HTTP:

    python3 -m http.server 8000

then open http://localhost:8000. Any static host works (GitHub Pages, Netlify, ...).

`python3 build_standalone.py` writes `lithuanian-flashcards.html`, a single file that works when opened directly from disk.


## Phone / offline

`manifest.json` and `sw.js` make the app installable and usable offline once it has been opened over HTTPS (or localhost). Publish the folder on any static host, for example GitHub Pages: push the files to a repository, turn on Pages in its settings, open the link on the phone, then use "Add to Home Screen". After the first visit it works without a connection. When you change a file, raise the version in `CACHE` inside `sw.js` so phones pick up the update.

## Visit and install counts

Counting uses GoatCounter and is on (`GC_CODE = lithuanian` at the bottom of `app.js`).
Intended account: `lithuanian` (dashboard: https://lithuanian.goatcounter.com), site domain `ratko222.github.io`.
Events: page visits, `app-installed` (Android Chrome installs only), `opened-as-app`.
To check the numbers, open the dashboard while signed in (the password is the owner's).
