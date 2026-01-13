import { v4 as uuidv4 } from 'uuid'
import { clipboardCollection } from './db'
import type { ClipboardItem, TextClipboardItem, ImageClipboardItem, ClipboardMetadata } from '@/types/clipboard'

/**
 * 获取所有剪贴板项目，按 order 排序
 */
export async function getAllItems(): Promise<ClipboardItem[]> {
  const docs = await clipboardCollection.find({}, { sort: ['order'] }).fetch()
  return Promise.all(docs.map(doc => hydrateItem(doc as any)))
}

/**
 * 添加文本项目
 */
export async function addTextItem(content: string): Promise<TextClipboardItem> {
  const items = await getAllItems()
  const minOrder = items.length > 0 ? Math.min(...items.map(i => i.order)) : 0

  const itemToSave: TextClipboardItem = {
    id: uuidv4(),
    type: 'text',
    content,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    order: minOrder - 1
  }

  await clipboardCollection.upsert(itemToSave)
  return itemToSave
}

/**
 * 添加图片项目（将 Blob 转换为 base64）
 */
export async function addImageItem(blob: Blob, mimeType: string): Promise<ImageClipboardItem> {
  const items = await getAllItems()
  const minOrder = items.length > 0 ? Math.min(...items.map(i => i.order)) : 0

  // 将 Blob 转换为 base64
  const imageData = await blobToBase64(blob)

  const itemToSave: ImageClipboardItem = {
    id: uuidv4(),
    type: 'image',
    imageData,
    mimeType,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    order: minOrder - 1
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
  // 查找现有项目
  const docs = await clipboardCollection.find({ id }).fetch()
  if (docs.length === 0) {
    throw new Error(`Item with id ${id} not found`)
  }

  const existingItem = docs[0] as any

  // 创建更新后的项目
  const updatedItem = {
    ...existingItem,
    content,
    updatedAt: Date.now()
  }

  // 使用 upsert 更新（传入 base 参数）
  await clipboardCollection.upsert(updatedItem, existingItem)
}

/**
 * 删除项目
 */
export async function deleteItem(id: string): Promise<void> {
  // 查找项目
  const docs = await clipboardCollection.find({ id }).fetch()
  if (docs.length === 0) {
    return
  }

  const item = docs[0] as any
  if (item._id) {
    await clipboardCollection.remove(String(item._id))
  }
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
  return ids.length
}

/**
 * 更新项目顺序
 */
export async function updateItemsOrder(items: ClipboardItem[]): Promise<void> {
  // MiniDB 没有事务，我们顺序更新每个项目
  for (let i = 0; i < items.length; i++) {
    const item = items[i]
    if (!item) continue

    // 查找现有项目
    const docs = await clipboardCollection.find({ id: item.id }).fetch()
    if (docs.length > 0) {
      const existingItem = docs[0] as any
      const updatedItem = {
        ...existingItem,
        order: i
      }
      await clipboardCollection.upsert(updatedItem, existingItem)
    }
  }
}

/**
 * 工具函数：将 Blob 转换为 base64 data URL
 */
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

/**
 * 工具函数：将 base64 data URL 转换为 Blob
 */
async function dataUrlToBlob(dataUrl: string, mimeType: string): Promise<Blob> {
  // 优先使用 fetch 简化转换，确保 mimeType 正确
  const response = await fetch(dataUrl)
  const fetchedBlob = await response.blob()
  if (fetchedBlob.type === mimeType) {
    return fetchedBlob
  }
  return new Blob([await fetchedBlob.arrayBuffer()], { type: mimeType })
}

/**
 * 将数据库文档转换为运行时可用的 ClipboardItem
 */
async function hydrateItem(doc: any): Promise<ClipboardItem> {
  if (doc.type === 'image') {
    try {
      const blob = await dataUrlToBlob(doc.imageData, doc.mimeType)
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
