export type ClipboardItemType = 'text' | 'image'

export interface BaseClipboardItem {
  id: string
  type: ClipboardItemType
  createdAt: number
  updatedAt: number
  order: number
}

export interface TextClipboardItem extends BaseClipboardItem {
  type: 'text'
  content: string
}

export interface ImageClipboardItem extends BaseClipboardItem {
  type: 'image'
  imageData: string // base64 data URL
  mimeType: string
  blob?: Blob // 运行时使用的 Blob，不会持久化
}

export type ClipboardItem = TextClipboardItem | ImageClipboardItem

export interface ClipboardMetadata {
  total: number
  textCount: number
  imageCount: number
  latestCreatedAt?: number
  latestUpdatedAt?: number
  estimatedBytes: number
}

export function isTextItem(item: ClipboardItem): item is TextClipboardItem {
  return item.type === 'text'
}

export function isImageItem(item: ClipboardItem): item is ImageClipboardItem {
  return item.type === 'image'
}
