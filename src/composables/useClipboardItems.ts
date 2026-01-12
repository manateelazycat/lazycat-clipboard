import { ref, onMounted } from 'vue'
import type { ClipboardItem } from '@/types/clipboard'
import * as clipboardService from '@/services/clipboardService'

const items = ref<ClipboardItem[]>([])
const selectedIndex = ref(-1)
const isLoading = ref(false)

export function useClipboardItems() {
  async function loadItems() {
    isLoading.value = true
    try {
      items.value = await clipboardService.getAllItems()
    } finally {
      isLoading.value = false
    }
  }

  async function addText(content: string) {
    if (!content.trim()) return
    const item = await clipboardService.addTextItem(content.trim())
    items.value.unshift(item)
    selectedIndex.value = 0
  }

  async function addImage(blob: Blob, mimeType: string) {
    const item = await clipboardService.addImageItem(blob, mimeType)
    items.value.unshift(item)
    selectedIndex.value = 0
  }

  async function updateText(id: string, content: string) {
    await clipboardService.updateTextItem(id, content)
    const index = items.value.findIndex(i => i.id === id)
    const item = items.value[index]
    if (index !== -1 && item && item.type === 'text') {
      (item as any).content = content
      item.updatedAt = Date.now()
    }
  }

  async function deleteItem(id: string) {
    await clipboardService.deleteItem(id)
    const index = items.value.findIndex(i => i.id === id)
    if (index !== -1) {
      items.value.splice(index, 1)
      if (selectedIndex.value >= items.value.length) {
        selectedIndex.value = items.value.length - 1
      }
    }
  }

  async function reorderItems(newItems: ClipboardItem[]) {
    items.value = newItems
    await clipboardService.updateItemsOrder(newItems)
  }

  function selectNext() {
    if (items.value.length === 0) return
    if (selectedIndex.value === -1) {
      selectedIndex.value = 0
    } else if (selectedIndex.value < items.value.length - 1) {
      selectedIndex.value++
    }
  }

  function selectPrevious() {
    if (items.value.length === 0) return
    if (selectedIndex.value > 0) {
      selectedIndex.value--
    } else if (selectedIndex.value === -1) {
      selectedIndex.value = 0
    }
  }

  function selectIndex(index: number) {
    if (index >= 0 && index < items.value.length) {
      selectedIndex.value = index
    }
  }

  function clearSelection() {
    selectedIndex.value = -1
  }

  onMounted(() => {
    loadItems()
  })

  return {
    items,
    selectedIndex,
    isLoading,
    loadItems,
    addText,
    addImage,
    updateText,
    deleteItem,
    reorderItems,
    selectNext,
    selectPrevious,
    selectIndex,
    clearSelection
  }
}
