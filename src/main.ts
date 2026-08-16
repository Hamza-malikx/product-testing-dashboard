// Fonts are bundled with the app, no external requests at runtime
import '@fontsource/space-grotesk/500.css'
import '@fontsource/space-grotesk/600.css'
import '@fontsource/space-grotesk/700.css'
import '@fontsource/inter/400.css'
import '@fontsource/inter/500.css'
import '@fontsource/inter/600.css'
import '@fontsource/inter/700.css'
import '@fontsource/jetbrains-mono/400.css'
import '@fontsource/jetbrains-mono/500.css'
import '@fontsource/jetbrains-mono/600.css'
import '@fontsource/jetbrains-mono/700.css'
import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'

// Charts draw text on canvas, so wait for fonts before first paint
document.fonts.ready.then(() => {
  createApp(App).mount('#app')
})
