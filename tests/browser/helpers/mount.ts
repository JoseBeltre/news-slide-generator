import { mount, type ComponentMountingOptions } from '@vue/test-utils'
import type { Component } from 'vue'

const mounted: { unmount: () => void; host: HTMLElement }[] = []

/** Espera dos frames para que corran ResizeObserver y el layout. */
export const frame = () => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))

/** Monta un componente dentro de un host de tamaño fijo (px CSS) pegado a la esquina superior izquierda. */
export function mountInHost<C extends Component>(
  component: C,
  width: number,
  height: number,
  options: ComponentMountingOptions<C> = {},
) {
  const host = document.createElement('div')
  host.style.cssText = `position:absolute;left:0;top:0;width:${width}px;height:${height}px`
  document.body.appendChild(host)
  // attachTo monta dentro de un div nuevo sin tamaño: le damos el del host.
  const mountPoint = document.createElement('div')
  mountPoint.style.cssText = 'width:100%;height:100%'
  host.appendChild(mountPoint)
  const wrapper = mount(component, { ...options, attachTo: mountPoint } as ComponentMountingOptions<C>)
  ;(mountPoint.firstElementChild as HTMLElement | null)?.style.setProperty('height', '100%')
  mounted.push({ unmount: () => wrapper.unmount(), host })
  return { wrapper, host }
}

/** Desmonta todo lo montado con `mountInHost`; llamar en `afterEach`. */
export function cleanupMounted() {
  for (const { unmount, host } of mounted.splice(0)) {
    unmount()
    host.remove()
  }
}
