// Qué avisa el snackbar al guardar un anuncio: normal con ✓, borrador, o advertencia (no cabe / sin conexión).
import { describe, expect, it } from 'vitest'
import { saveNotice } from '../../../src/features/announcements/editor/saveNotice'

describe('saveNotice', () => {
  it('listo → normal con ✓', () => {
    expect(saveNotice({ status: 'listo', offline: false })).toEqual({ message: 'Anuncio guardado', tone: 'normal', success: true })
  })

  it('borrador (no valida) → normal, dice que quedó como borrador', () => {
    expect(saveNotice({ status: 'borrador', offline: false })).toEqual({ message: 'Guardado como borrador', tone: 'normal', success: true })
  })

  it('no cabe → advertencia: el texto no cabe en la slide', () => {
    expect(saveNotice({ status: 'no_cabe', offline: false })).toEqual({ message: 'Guardado, pero el texto no cabe en la slide', tone: 'warning' })
  })

  it('sin conexión → advertencia: guardado en este dispositivo', () => {
    expect(saveNotice({ status: 'listo', offline: true })).toEqual({
      message: 'Sin conexión: guardado en este dispositivo, se subirá al volver internet',
      tone: 'warning',
    })
  })

  it('no cabe pesa más que sin conexión (lo que hay que arreglar va primero)', () => {
    expect(saveNotice({ status: 'no_cabe', offline: true }).message).toContain('no cabe')
  })
})
