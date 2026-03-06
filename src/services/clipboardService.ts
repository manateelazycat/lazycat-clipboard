import { v4 as uuidv4 } from 'uuid'
import { clipboardCollection } from './db'
import type { ClipboardItem, TextClipboardItem, ImageClipboardItem, ClipboardMetadata } from '@/types/clipboard'

const imageBlobCache = new Map<string, { signature: string; blob: Blob }>()

/**
 * 获取所有剪贴板项目，按 order 排序
 */
export async function getAllItems(): Promise<ClipboardItem[]> {
  const docs = await clipboardCollection.find({}, { sort: ['order'] }).fetch()
  const sorted = docs.slice().sort(compareDocs)
  return Promise.all(sorted.map(doc => hydrateItem(doc as any)))
}

/**
 * 添加文本项目
 */
export async function addTextItem(
  content: string,
  preset?: Pick<TextClipboardItem, 'id' | 'createdAt' | 'updatedAt' | 'order' | 'pinned'>
): Promise<TextClipboardItem> {
  const now = Date.now()
  const itemToSave: TextClipboardItem = {
    id: preset?.id ?? uuidv4(),
    type: 'text',
    content,
    createdAt: preset?.createdAt ?? now,
    updatedAt: preset?.updatedAt ?? now,
    order: typeof preset?.order === 'number' ? preset.order : await getNextTopOrder(),
    pinned: preset?.pinned ?? false
  }

  await clipboardCollection.upsert(itemToSave)
  return itemToSave
}

/**
 * 添加图片项目（将 Blob 转换为 base64）
 */
export async function addImageItem(blob: Blob, mimeType: string): Promise<ImageClipboardItem> {
  const imageData = await blobToBase64(blob)

  const itemToSave: ImageClipboardItem = {
    id: uuidv4(),
    type: 'image',
    imageData,
    mimeType,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    order: await getNextTopOrder(),
    pinned: false
  }

  await clipboardCollection.upsert(itemToSave)

  return {
    ...itemToSave,
    blob
  }
}

/**
 * 更新文本项目
 */
export async function updateTextItem(id: string, content: string): Promise<void> {
  const docs = await clipboardCollection.find({ id }).fetch()
  if (docs.length === 0) {
    throw new Error(`Item with id ${id} not found`)
  }

  const existingItem = docs[0] as any
  const updatedItem = {
    ...existingItem,
    content,
    updatedAt: Date.now()
  }

  await clipboardCollection.upsert(updatedItem, existingItem)
}

/**
 * 置顶/取消置顶项目
 */
export async function setPinStatus(id: string, pinned: boolean): Promise<void> {
  const docs = await clipboardCollection.find({ id }).fetch()
  if (docs.length === 0) return

  const existingItem = docs[0] as any
  let nextOrder = existingItem.order

  const allItems = await getAllItems()
  if (pinned) {
    const pinnedOrders = allItems
      .filter(item => item.pinned)
      .map(item => normalizeOrder(item.order))
      .filter(n => Number.isFinite(n))
    const minPinnedOrder = pinnedOrders.length > 0 ? Math.min(...pinnedOrders) : 0
    nextOrder = minPinnedOrder - 1
  } else {
    const unpinnedOrders = allItems
      .filter(item => !item.pinned || item.id === id)
      .map(item => normalizeOrder(item.order))
      .filter(n => Number.isFinite(n) && n !== Number.MAX_SAFE_INTEGER)
    const maxUnpinnedOrder = unpinnedOrders.length > 0 ? Math.max(...unpinnedOrders) : 0
    nextOrder = maxUnpinnedOrder + 1
  }

  const updatedItem = {
    ...existingItem,
    pinned,
    order: nextOrder,
    updatedAt: Date.now()
  }

  await clipboardCollection.upsert(updatedItem, existingItem)
}

/**
 * 删除项目
 */
export async function deleteItem(id: string): Promise<void> {
  const docs = await clipboardCollection.find({ id }).fetch()
  if (docs.length === 0) {
    return
  }

  const item = docs[0] as any
  if (item._id) {
    await clipboardCollection.remove(String(item._id))
  }
  imageBlobCache.delete(id)
}

/**
 * 清空所有项目
 */
export async function clearAllItems(): Promise<number> {
  const docs = await clipboardCollection.find({}).fetch()
  const ids = docs.map((item: any) => item._id).filter(Boolean)
  if (ids.length > 0) {
    await clipboardCollection.remove(ids)
  }
  imageBlobCache.clear()
  return ids.length
}

/**
 * 更新项目顺序
 */
export async function updateItemsOrder(items: ClipboardItem[]): Promise<void> {
  const docs = await clipboardCollection.find({}).fetch()
  const map = new Map<string, any>()
  for (const doc of docs as any[]) {
    if (doc?.id) {
      map.set(doc.id as string, doc)
    }
  }

  const docsToSave: any[] = []
  const bases: any[] = []

  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (!item) continue
    const base = map.get(item.id)
    if (!base) continue
    const updated = {
      ...base,
      order: i,
      updatedAt: Date.now()
    }
    docsToSave.push(updated)
    bases.push(base)
  }

  if (docsToSave.length > 0) {
    await clipboardCollection.upsert(docsToSave, bases)
  }
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      const result = reader.result as string
      resolve(result)
    }
    reader.onerror = reject
    reader.readAsDataURL(blob)
  })
}

async function dataUrlToBlob(dataUrl: string, mimeType: string): Promise<Blob> {
  const response = await fetch(dataUrl)
  const fetchedBlob = await response.blob()
  if (fetchedBlob.type === mimeType) {
    return fetchedBlob
  }
  return new Blob([await fetchedBlob.arrayBuffer()], { type: mimeType })
}

async function hydrateItem(doc: any): Promise<ClipboardItem> {
  if (doc.type === 'image') {
    const signature = getImageSignature(doc)
    const cached = imageBlobCache.get(String(doc.id))
    if (cached && cached.signature === signature) {
      return {
        ...(doc as ImageClipboardItem),
        blob: cached.blob
      }
    }

    try {
      const blob = await dataUrlToBlob(doc.imageData, doc.mimeType)
      imageBlobCache.set(String(doc.id), { signature, blob })
      return {
        ...(doc as ImageClipboardItem),
        blob
      }
    } catch (error) {
      console.warn('图片数据恢复失败，已返回原始记录', error)
      return doc as ClipboardItem
    }
  }

  return doc as ClipboardItem
}

function getImageSignature(doc: { imageData?: string; mimeType?: string }) {
  const imageData = doc.imageData ?? ''
  const prefix = imageData.slice(0, 48)
  const suffix = imageData.slice(-48)
  return `${doc.mimeType ?? ''}:${imageData.length}:${prefix}:${suffix}`
}

function normalizeOrder(order: unknown): number {
  if (typeof order === 'number') return order
  const parsed = Number(order)
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER
}

function compareDocs(a: any, b: any): number {
  const pinnedA = Boolean(a?.pinned)
  const pinnedB = Boolean(b?.pinned)
  if (pinnedA !== pinnedB) {
    return pinnedA ? -1 : 1
  }

  const orderA = normalizeOrder(a?.order)
  const orderB = normalizeOrder(b?.order)
  if (orderA !== orderB) return orderA - orderB

  const updatedA = normalizeTimestamp(a?.updatedAt)
  const updatedB = normalizeTimestamp(b?.updatedAt)
  if (updatedA !== updatedB) return updatedB - updatedA

  const createdA = normalizeTimestamp(a?.createdAt)
  const createdB = normalizeTimestamp(b?.createdAt)
  return createdB - createdA
}

function normalizeTimestamp(value: unknown): number {
  const num = Number(value)
  return Number.isFinite(num) ? num : 0
}

async function getNextTopOrder(): Promise<number> {
  const docs = await clipboardCollection.find({}, { sort: ['order'] }).fetch()
  const finiteOrders = docs
    .map((doc: any) => normalizeOrder(doc?.order))
    .filter(n => Number.isFinite(n) && n !== Number.MAX_SAFE_INTEGER)

  if (finiteOrders.length === 0) return -1

  return Math.min(...finiteOrders) - 1
}

/**
 * 查询当前数据元信息
 */
export async function getMetadata(): Promise<ClipboardMetadata> {
  const docs = await clipboardCollection.find({}).fetch()
  const textCount = docs.filter((item: any) => item.type === 'text').length
  const imageCount = docs.filter((item: any) => item.type === 'image').length
  const createdTimes = docs.map((item: any) => item.createdAt).filter(Boolean) as number[]
  const updatedTimes = docs.map((item: any) => item.updatedAt).filter(Boolean) as number[]

  const estimatedBytes = docs.reduce((sum, doc) => {
    const serialized = JSON.stringify(doc)
    return sum + new TextEncoder().encode(serialized).length
  }, 0)

  return {
    total: docs.length,
    textCount,
    imageCount,
    latestCreatedAt: createdTimes.length > 0 ? Math.max(...createdTimes) : undefined,
    latestUpdatedAt: updatedTimes.length > 0 ? Math.max(...updatedTimes) : undefined,
    estimatedBytes
  }
}
