// Fonts are bundled with the app, so there are no external requests at
// runtime and the page looks right on a bad connection.
// Latin subsets only: the default entry points also ship Cyrillic,
// Greek and Vietnamese, which this dashboard never renders.
import '@fontsource/space-grotesk/latin-500.css'
import '@fontsource/space-grotesk/latin-600.css'
import '@fontsource/space-grotesk/latin-700.css'
import '@fontsource/inter/latin-400.css'
import '@fontsource/inter/latin-500.css'
import '@fontsource/inter/latin-600.css'
import '@fontsource/inter/latin-700.css'
import '@fontsource/jetbrains-mono/latin-400.css'
import '@fontsource/jetbrains-mono/latin-500.css'
import '@fontsource/jetbrains-mono/latin-600.css'
import '@fontsource/jetbrains-mono/latin-700.css'
import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

// Charts draw text on canvas, and canvas text does not repaint itself
// when a font arrives late, so wait for fonts before the first paint.
// Every failure path still mounts: a missing or stalled font must never
// leave the page blank.
const mount = () => createApp(App).mount('#app')
const fonts = document.fonts?.ready

if (fonts) {
  Promise.race([fonts, new Promise((resolve) => setTimeout(resolve, 1500))])
    .then(mount)
    .catch(mount)
} else {
  mount()
}
