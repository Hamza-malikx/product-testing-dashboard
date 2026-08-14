// Fonts are bundled with the app, no external requests at runtime
import '@fontsource/libre-franklin/700.css'
import '@fontsource/libre-franklin/800.css'
import '@fontsource/public-sans/400.css'
import '@fontsource/public-sans/500.css'
import '@fontsource/public-sans/600.css'
import '@fontsource/ibm-plex-mono/400.css'
import '@fontsource/ibm-plex-mono/500.css'
import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

// createApp(App).mount('#app')
// Charts draw text on canvas, so wait for fonts before first paint
document.fonts.ready.then(() => {
  createApp(App).mount('#app')
})
