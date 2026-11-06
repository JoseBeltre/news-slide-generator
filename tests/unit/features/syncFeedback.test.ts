// Aviso de error de la sincronización: sale en cada intento fallido y se cierra al recuperarse.
import { computed, effectScope, nextTick, ref } from 'vue'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { SyncService, SyncState } from '../../../src/data/sync/service'
import { useSyncFeedback } from '../../../src/features/sync/useSyncFeedback'
import { resetSnackbar, runSnackAction, snackbarState } from '../../../src/ui/useSnackbar'

beforeEach(() => resetSnackbar())

function setup() {
  const state = ref<SyncState>({ status: 'sincronizado', pending: 0, lastSyncAt: null, syncing: false, errorTick: 0 })
  const syncNow = vi.fn(async () => {})
  const service = { state: computed(() => state.value), syncNow } as unknown as SyncService
  effectScope().run(() => useSyncFeedback(computed(() => service)))
  return { state, syncNow }
}
const fail = (state: ReturnType<typeof setup>['state']) => (state.value = { ...state.value, status: 'nube-no-responde', errorTick: state.value.errorTick! + 1 })

describe('useSyncFeedback', () => {
  it('avisa al fallar y vuelve a avisar si Reintentar falla otra vez (mismo estado)', async () => {
    const { state, syncNow } = setup()
    fail(state)
    await nextTick()
    expect(snackbarState.current?.tone).toBe('error')
    await runSnackAction() // Reintentar: cierra el aviso y llama a syncNow
    expect(snackbarState.current).toBeNull()
    expect(syncNow).toHaveBeenCalled()
    fail(state) // el reintento falla: mismo estado, otro intento
    await nextTick()
    expect(snackbarState.current?.message).toContain('No se pudo sincronizar')
  })

  it('al recuperarse cierra el aviso de error, esté a la vista o en cola', async () => {
    const { state } = setup()
    fail(state)
    await nextTick()
    state.value = { ...state.value, status: 'sincronizado' }
    await nextTick()
    expect(snackbarState.current).toBeNull()
  })

  it('no deja un aviso de sync repetido: un segundo fallo reemplaza al primero', async () => {
    const { state } = setup()
    fail(state)
    await nextTick()
    fail(state)
    await nextTick()
    expect(snackbarState.queue).toEqual([])
    expect(snackbarState.current?.tone).toBe('error')
  })
})
