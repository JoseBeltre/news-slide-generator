// Cómo se reconoce cada tipo en la interfaz: nombre, ícono y su color (solo como marca, DESIGN.md).
import type { Component } from 'vue'
import { iconFor } from '../../../slides/icons'
import { TYPE_ACCENTS } from '../../../slides/themes'
import { getTypeDef } from '../../../slides/types/definitions'
import type { AnnouncementTypeId } from '../../../slides/types/fields'

export interface TypeVisual {
  name: string
  icon: Component | undefined
  /** Para `:style="{ '--type-accent': accent }"` y las clases `border-(--type-accent)`. */
  accent: string
}

export function typeVisual(typeId: string): TypeVisual {
  const def = getTypeDef(typeId)
  return { name: def.name, icon: iconFor(def.icon), accent: TYPE_ACCENTS[typeId as AnnouncementTypeId] }
}
