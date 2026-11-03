// Hora actual para la vista del presentador (RF-63): "7:42 p. m.", al día cada 15 s.
import { onBeforeUnmount, readonly, ref } from 'vue'
import { formatTime } from '../../../lib/format'

const now = () => {
  const d = new Date()
  return formatTime(`${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`)
}

export function useClock() {
  const time = ref(now())
  const timer = setInterval(() => (time.value = now()), 15_000)
  onBeforeUnmount(() => clearInterval(timer))
  return readonly(time)
}
