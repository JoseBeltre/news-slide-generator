// Base de datos local (Dexie/IndexedDB): fuente de verdad de la interfaz (§8.4).
import Dexie, { type Table } from 'dexie'
import type {
  Announcement,
  ImageAsset,
  ImageBlob,
  Ministry,
  Presentation,
  Settings,
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
  }
}

export function createDb(name = 'anuncios-del-sabado'): AppDb {
  return new AppDb(name)
}
