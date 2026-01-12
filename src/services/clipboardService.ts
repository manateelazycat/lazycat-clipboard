import { v4 as uuidv4 } from 'uuid'
import { db } from './db'
import type { ClipboardItem, TextClipboardItem, ImageClipboardItem } from '@/types/clipboard'

export async function getAllItems(): Promise<ClipboardItem[]> {
  return db.items.orderBy('order').toArray()
}

export async function addTextItem(content: string): Promise<TextClipboardItem> {
  const items = await getAllItems()
  const minOrder = items.length > 0 ? Math.min(...items.map(i => i.order)) : 0

  const item: TextClipboardItem = {
    id: uuidv4(),
    type: 'text',
    content,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    order: minOrder - 1
  }

  await db.items.add(item)
  return item
}

export async function addImageItem(blob: Blob, mimeType: string): Promise<ImageClipboardItem> {
  const items = await getAllItems()
  const minOrder = items.length > 0 ? Math.min(...items.map(i => i.order)) : 0

  const item: ImageClipboardItem = {
    id: uuidv4(),
    type: 'image',
    blob,
    mimeType,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    order: minOrder - 1
  }

  await db.items.add(item)
  return item
}

export async function updateTextItem(id: string, content: string): Promise<void> {
  await db.items.update(id, {
    content,
    updatedAt: Date.now()
  } as Partial<TextClipboardItem>)
}

export async function deleteItem(id: string): Promise<void> {
  await db.items.delete(id)
}

export async function updateItemsOrder(items: ClipboardItem[]): Promise<void> {
  await db.transaction('rw', db.items, async () => {
    for (let i = 0; i < items.length; i++) {
      const item = items[i]
      if (item) {
        await db.items.update(item.id, { order: i })
      }
    }
  })
}
