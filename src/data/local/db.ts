// Base de datos local (Dexie/IndexedDB): fuente de verdad de la interfaz (§8.4).
import Dexie, { type Table } from 'dexie'
import type {
  Announcement,
  ImageAsset,
  ImageBlob,
  Ministry,
  OutboxEntry,
  Presentation,
  Settings,
  SyncStateEntry,
  SyncTable,
  Theme,
} from '../models'

export class AppDb extends Dexie {
  announcements!: Table<Announcement, string>
  ministries!: Table<Ministry, string>
  images!: Table<ImageAsset, string>
  imageBlobs!: Table<ImageBlob, string>
  presentations!: Table<Presentation, string>
  themes!: Table<Theme, string>
  settings!: Table<Settings, string>
  outbox!: Table<OutboxEntry, [SyncTable, string]>
  syncState!: Table<SyncStateEntry, string>

  constructor(name: string) {
    super(name)
    this.version(1).stores({
      announcements: 'id, typeId, eventDate, status, updatedAt',
      ministries: 'id, updatedAt',
      images: 'id, &hash, kind, updatedAt',
      imageBlobs: 'id',
      presentations: 'id, date, updatedAt',
      themes: 'id, updatedAt',
      settings: 'id',
    })
    // v2 (P4): `settings` se lista por updatedAt como las demás tablas.
    this.version(2).stores({ settings: 'id, updatedAt' })
    // v3 (P8): cola de cambios y estado del sincronizador. `hash` deja de ser único: dos equipos sin red
    // pueden guardar la misma foto con ids distintos, y bajar la del otro no debe chocar.
    this.version(3).stores({
      images: 'id, hash, kind, updatedAt',
      outbox: '[table+id], table',
      syncState: 'key',
    })
  }
}

export function createDb(name = 'anuncios-del-sabado'): AppDb {
  return new AppDb(name)
}
