import { onScopeDispose, ref } from 'vue'

// Reactive media query: true while the query matches, updates live
// on resize or rotation. Charts use this to switch layouts, because
// canvas content cannot respond to CSS media queries.
export function useMediaQuery(query: string) {
  const mq = window.matchMedia(query)
  const matches = ref(mq.matches)
  const onChange = (event: MediaQueryListEvent) => {
    matches.value = event.matches
  }
  mq.addEventListener('change', onChange)
  onScopeDispose(() => mq.removeEventListener('change', onChange))
  return matches
}
