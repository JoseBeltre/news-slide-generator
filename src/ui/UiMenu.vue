<script setup lang="ts">
// Menú de tres puntos: un botón y su lista de acciones. El menú se dibuja fuera de su contenedor
// (Teleport) para que ninguna fila con overflow lo recorte; aparece con escala .95 → 1 desde la esquina
// del botón y se abre hacia arriba si abajo no cabe. Esc, un clic fuera o desplazarse lo cierran.
import { EllipsisVertical } from '@lucide/vue'
import { nextTick, onBeforeUnmount, ref, useId, type Component } from 'vue'

export interface MenuItem {
  key: string
  label: string
  icon: Component
  danger?: boolean
  separatorBefore?: boolean
}

const props = defineProps<{ label: string; items: readonly MenuItem[] }>()
const emit = defineEmits<{ select: [key: string] }>()

const MENU_ITEM_PX = 46
const NAV_ALLOWANCE_PX = 76
const trigger = ref<HTMLButtonElement | null>(null)
const menu = ref<HTMLElement | null>(null)
const open = ref(false)
const above = ref(false)
const spot = ref<{ right: string; top?: string; bottom?: string }>({ right: '8px' })
const menuId = useId()

function place() {
  const r = trigger.value!.getBoundingClientRect()
  const height = props.items.length * MENU_ITEM_PX + 9
  above.value = r.bottom + height > window.innerHeight - NAV_ALLOWANCE_PX
  const right = `${Math.max(8, window.innerWidth - r.right)}px`
  spot.value = above.value ? { right, bottom: `${window.innerHeight - r.top + 4}px` } : { right, top: `${r.bottom + 4}px` }
}

function close(restoreFocus = true) {
  if (!open.value) return
  open.value = false
  removeListeners()
  if (restoreFocus) trigger.value?.focus()
}

const onOutside = (e: Event) => {
  const t = e.target as Node
  if (!menu.value?.contains(t) && !trigger.value?.contains(t)) close(false)
}
const onScroll = () => close(false)
function addListeners() {
  document.addEventListener('pointerdown', onOutside)
  window.addEventListener('scroll', onScroll, true)
  window.addEventListener('resize', onScroll)
}
function removeListeners() {
  document.removeEventListener('pointerdown', onOutside)
  window.removeEventListener('scroll', onScroll, true)
  window.removeEventListener('resize', onScroll)
}
onBeforeUnmount(removeListeners)

async function toggle() {
  if (open.value) return close()
  place()
  open.value = true
  addListeners()
  await nextTick()
  menu.value?.querySelector<HTMLElement>('[role="menuitem"]')?.focus()
}

function move(step: number) {
  const items = [...(menu.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
  const at = items.indexOf(document.activeElement as HTMLElement)
  items[(at + step + items.length) % items.length]?.focus()
}

function focusAt(index: number) {
  const items = [...(menu.value?.querySelectorAll<HTMLElement>('[role="menuitem"]') ?? [])]
  items.at(index)?.focus()
}

function choose(key: string) {
  close()
  emit('select', key)
}
</script>

<template>
  <button
    ref="trigger"
    type="button"
    aria-haspopup="menu"
    :aria-expanded="open"
    :aria-controls="open ? menuId : undefined"
    :aria-label="label"
    :title="label"
    class="inline-flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-sm text-ink-muted transition-[background-color,transform] duration-150 ease-out hover:bg-muted hover:text-ink active:scale-97 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ink md:size-10"
    @click="toggle"
    @keydown.escape.stop="close()"
  >
    <EllipsisVertical :size="22" aria-hidden="true" />
  </button>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-160 ease-out"
      leave-active-class="transition duration-120 ease-in"
      enter-from-class="scale-95 opacity-0 motion-reduce:scale-100"
      leave-to-class="scale-95 opacity-0 motion-reduce:scale-100"
    >
      <div
        v-if="open"
        :id="menuId"
        ref="menu"
        role="menu"
        :aria-label="label"
        :style="spot"
        :class="['fixed z-50 min-w-49 rounded-md border border-field-border bg-surface p-1 shadow-lg', above ? 'origin-bottom-right' : 'origin-top-right']"
        @keydown.escape.stop.prevent="close()"
        @keydown.down.prevent="move(1)"
        @keydown.up.prevent="move(-1)"
        @keydown.tab.prevent="close()"
        @keydown.home.prevent="focusAt(0)"
        @keydown.end.prevent="focusAt(-1)"
      >
        <template v-for="item in items" :key="item.key">
          <hr v-if="item.separatorBefore" class="my-1 border-t border-hairline" />
          <button
            type="button"
            role="menuitem"
            :data-menu-item="item.key"
            :class="[
              'flex min-h-11.5 w-full cursor-pointer items-center gap-3 rounded-sm px-3 text-left text-[15px] transition-[background-color,transform] duration-120 ease-out active:scale-97 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-ink',
              item.danger ? 'text-danger hover:bg-danger-bg' : 'text-ink hover:bg-muted',
            ]"
            @click="choose(item.key)"
          >
            <component :is="item.icon" :size="20" aria-hidden="true" />{{ item.label }}
          </button>
        </template>
      </div>
    </Transition>
  </Teleport>
</template>
