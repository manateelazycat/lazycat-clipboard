import { ref } from 'vue'

const copyEventId = ref(0)
const lastCopySuccess = ref(false)
const lastCopyMessage = ref('')

export function useClipboard() {
  async function copyText(text: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(text)
      lastCopySuccess.value = true
      lastCopyMessage.value = '已复制到剪贴板'
      copyEventId.value++
      return true
    } catch (err) {
      console.error('Failed to copy text:', err)
      lastCopySuccess.value = false
      lastCopyMessage.value = '复制失败'
      copyEventId.value++
      return false
    }
  }

  async function copyImage(blob: Blob): Promise<boolean> {
    try {
      // Convert image to PNG if needed (browsers only support PNG for clipboard)
      let pngBlob = blob
      if (blob.type !== 'image/png') {
        pngBlob = await convertToPng(blob)
      }

      const item = new ClipboardItem({
        'image/png': pngBlob
      })
      await navigator.clipboard.write([item])
      lastCopySuccess.value = true
      lastCopyMessage.value = '已复制图片到剪贴板'
      copyEventId.value++
      return true
    } catch (err) {
      console.error('Failed to copy image:', err)
      lastCopySuccess.value = false
      lastCopyMessage.value = '复制图片失败'
      copyEventId.value++
      return false
    }
  }

  async function convertToPng(blob: Blob): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('Failed to get canvas context'))
          return
        }
        ctx.drawImage(img, 0, 0)
        canvas.toBlob((pngBlob) => {
          if (pngBlob) {
            resolve(pngBlob)
          } else {
            reject(new Error('Failed to convert to PNG'))
          }
        }, 'image/png')
      }
      img.onerror = () => reject(new Error('Failed to load image'))
      img.src = URL.createObjectURL(blob)
    })
  }

  async function readFromClipboard(): Promise<{ type: 'text' | 'image'; content?: string; blob?: Blob; mimeType?: string } | null> {
    try {
      const clipboardItems = await navigator.clipboard.read()
      for (const item of clipboardItems) {
        // Check for images first
        for (const type of item.types) {
          if (type.startsWith('image/')) {
            const blob = await item.getType(type)
            return { type: 'image', blob, mimeType: type }
          }
        }
        // Then text
        if (item.types.includes('text/plain')) {
          const blob = await item.getType('text/plain')
          const text = await blob.text()
          return { type: 'text', content: text }
        }
      }
      return null
    } catch (err) {
      // Fallback to readText for older browsers
      try {
        const text = await navigator.clipboard.readText()
        if (text) {
          return { type: 'text', content: text }
        }
      } catch {
        console.error('Failed to read clipboard:', err)
      }
      return null
    }
  }

  return {
    copyText,
    copyImage,
    readFromClipboard,
    lastCopySuccess,
    lastCopyMessage,
    copyEventId
  }
}
