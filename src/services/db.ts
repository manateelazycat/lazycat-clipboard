import Dexie, { type Table } from 'dexie'
import type { ClipboardItem } from '@/types/clipboard'

class ClipboardDatabase extends Dexie {
  items!: Table<ClipboardItem, string>

  constructor() {
    super('lazycat-clipboard')

    this.version(1).stores({
      items: 'id, type, createdAt, updatedAt, order'
    })
  }
}

export const db = new ClipboardDatabase()
