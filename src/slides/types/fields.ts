// Contrato declarativo de los tipos de anuncio (§7). Agregar un tipo es agregar datos, no código (RNF-08).
// Añadidos sobre §7: kind 'choice' (+ options) para el modo de cumpleaños y `defaultValue`.
// El kind 'ministry' no se usa: el logo va en `Announcement.logo` (RF-09), no en un campo.

export type FieldKind = 'text' | 'longtext' | 'date' | 'time' | 'money' | 'image' | 'people' | 'list' | 'choice'

/** Rol en la slide: decide jerarquía y tamaño (§5.3). 'presenter-only' nunca se proyecta. */
export type FieldRole = 'title' | 'key' | 'secondary' | 'presenter-only'

export interface FieldOption {
  value: string
  label: string
}

export interface FieldDef {
  key: string
  label: string
  kind: FieldKind
  required: boolean
  role?: FieldRole
  /** Nombre de ícono Lucide; se dibuja en las plantillas (P3). */
  icon?: string
  /** Orientativo: el formulario muestra un contador, pero quien decide si cabe es el motor (§5.6). */
  maxLength?: number
  /** Texto que precede al valor en la slide cuando el ícono solo no basta ("Llevar:", "Hasta el"). */
  slidePrefix?: string
  /** Solo para kind 'image': campo que nombra a la persona de la foto (la Visual lo destaca). */
  captionField?: string
  /** Solo para kind 'choice'. */
  options?: FieldOption[]
  defaultValue?: unknown
}

export type AnnouncementTypeId = 'culto' | 'salida' | 'obra_misionera' | 'cumpleanos' | 'actividad' | 'aviso' | 'imagen'

export interface AnnouncementTypeDef {
  id: AnnouncementTypeId
  name: string
  icon: string
  fields: FieldDef[]
  templateIds: string[]
  defaultTemplateId: string
}
