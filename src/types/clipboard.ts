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
  blob: Blob
  mimeType: string
}

export type ClipboardItem = TextClipboardItem | ImageClipboardItem

export function isTextItem(item: ClipboardItem): item is TextClipboardItem {
  return item.type === 'text'
}

export function isImageItem(item: ClipboardItem): item is ImageClipboardItem {
  return item.type === 'image'
}
