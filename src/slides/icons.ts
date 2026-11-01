// Íconos de los datos clave (§5.4): SVG de Lucide empaquetados, nunca emojis del sistema.
// Solo se importan los usados, por nombre, para que el resto quede fuera del build.
import {
  Backpack,
  Banknote,
  BookOpen,
  Bus,
  Cake,
  Calendar,
  CalendarClock,
  CalendarDays,
  Church,
  Clock,
  Flag,
  ImageIcon,
  MapIcon,
  MapPin,
  Megaphone,
  MessageSquare,
  Phone,
  Quote,
  User,
} from '@lucide/vue'
import type { Component } from 'vue'

/** Clave = nombre Lucide usado en `FieldDef.icon` y `AnnouncementTypeDef.icon`. */
export const ICONS: Readonly<Record<string, Component>> = Object.freeze({
  backpack: Backpack,
  banknote: Banknote,
  'book-open': BookOpen,
  bus: Bus,
  cake: Cake,
  calendar: Calendar,
  'calendar-clock': CalendarClock,
  'calendar-days': CalendarDays,
  church: Church,
  clock: Clock,
  flag: Flag,
  image: ImageIcon,
  map: MapIcon,
  'map-pin': MapPin,
  megaphone: Megaphone,
  'message-square': MessageSquare,
  phone: Phone,
  quote: Quote,
  user: User,
})

export function iconFor(name: string | undefined): Component | undefined {
  return name === undefined ? undefined : ICONS[name]
}
