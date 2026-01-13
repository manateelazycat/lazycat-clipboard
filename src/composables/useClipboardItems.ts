import { ref, onMounted } from 'vue'
import type { ClipboardItem, AppSettings } from '@/types/clipboard'
import * as clipboardService from '@/services/clipboardService'
import { loadSettings, saveSettings } from '@/services/settingsService'

const items = ref<ClipboardItem[]>([])
const selectedIndex = ref(-1)
const isLoading = ref(false)
const settings = ref<AppSettings | null>(null)
let initialized = false
const isSyncing = ref(false) // 用于 UI 展示
const syncLock = ref(false) // 控制写操作/刷新
let syncHideTimer: number | null = null
const MIN_SYNC_MS = 400

// Mobile detection
const isMobile = typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0)

async function withSync(fn: () => Promise<void>) {
  if (syncLock.value) return
  syncLock.value = true

  if (syncHideTimer) {
    clearTimeout(syncHideTimer)
    syncHideTimer = null
  }
  isSyncing.value = true
  const start = Date.now()
  try {
    await fn()
  } finally {
    syncLock.value = false
    const elapsed = Date.now() - start
    const delay = Math.max(0, MIN_SYNC_MS - elapsed)
    syncHideTimer = window.setTimeout(() => {
      isSyncing.value = false
      syncHideTimer = null
    }, delay)
  }
}

export function useClipboardItems() {
  async function loadItems(options: { silent?: boolean } = {}) {
    const silent = options.silent ?? false
    if (!silent) {
      isLoading.value = true
    }
    if (syncLock.value) {
      if (!silent) {
        isLoading.value = false
      }
      return
    }
    try {
      const newItems = await clipboardService.getAllItems()
      if (!itemsEqual(items.value, newItems)) {
        items.value = newItems
      }
    } finally {
      if (!silent) {
        isLoading.value = false
      }
    }
  }

  async function loadAppSettings() {
    settings.value = await loadSettings()
  }

  async function updateAppSettings(partial: Partial<AppSettings>) {
    const current = settings.value || (await loadSettings())
    const next = { ...current, ...partial }
    settings.value = next
    await saveSettings(next)
  }

  async function addText(content: string) {
    if (!content.trim()) return
    await withSync(async () => {
      await clipboardService.addTextItem(content.trim())
      await loadItems({ silent: true })
      // Only auto-select on desktop, not on mobile
      if (!isMobile) {
        selectedIndex.value = 0
      }
    })
  }

  async function addImage(blob: Blob, mimeType: string) {
    await withSync(async () => {
      await clipboardService.addImageItem(blob, mimeType)
      await loadItems({ silent: true })
      // Only auto-select on desktop, not on mobile
      if (!isMobile) {
        selectedIndex.value = 0
      }
    })
  }

  async function togglePin(id: string, pinned: boolean) {
    await withSync(async () => {
      await clipboardService.setPinStatus(id, pinned)
      await loadItems({ silent: true })
      const index = items.value.findIndex(i => i.id === id)
      if (index !== -1) {
        selectedIndex.value = index
      }
    })
  }

  async function updateText(id: string, content: string) {
    await withSync(async () => {
      await clipboardService.updateTextItem(id, content)
      const index = items.value.findIndex(i => i.id === id)
      const item = items.value[index]
      if (index !== -1 && item && item.type === 'text') {
        (item as any).content = content
        item.updatedAt = Date.now()
      }
    })
  }

  async function deleteItem(id: string) {
    await withSync(async () => {
      await clipboardService.deleteItem(id)
      const index = items.value.findIndex(i => i.id === id)
      if (index !== -1) {
        items.value.splice(index, 1)
        if (selectedIndex.value >= items.value.length) {
          selectedIndex.value = items.value.length - 1
        }
      }
    })
  }

  async function reorderItems(newItems: ClipboardItem[]) {
    // 先应用本地排序，随后写入服务端并重新读取，避免旧数据回退
    items.value = newItems
    await withSync(async () => {
      await clipboardService.updateItemsOrder(newItems)
      await loadItems({ silent: true })
    })
  }

  async function clearAll() {
    await withSync(async () => {
      await clipboardService.clearAllItems()
      items.value = []
      selectedIndex.value = -1
    })
  }

  async function getMetadata() {
    return clipboardService.getMetadata()
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
    if (initialized) return
    initialized = true
    loadItems()
    loadAppSettings()
  })

  return {
    items,
    selectedIndex,
    isLoading,
    isSyncing,
    syncLock,
    settings,
    loadItems,
    loadAppSettings,
    updateAppSettings,
    addText,
    addImage,
    updateText,
    deleteItem,
    reorderItems,
    clearAll,
    togglePin,
    getMetadata,
    selectNext,
    selectPrevious,
    selectIndex,
  clearSelection
}
}

function itemsEqual(a: ClipboardItem[], b: ClipboardItem[]) {
  if (a.length !== b.length) return false
  for (let i = 0; i < a.length; i++) {
    const itemA = a[i]
    const itemB = b[i]
    if (!itemA || !itemB) return false
    if (
      itemA.id !== itemB.id ||
      itemA.type !== itemB.type ||
      itemA.updatedAt !== itemB.updatedAt ||
      itemA.order !== itemB.order ||
      Boolean((itemA as any).pinned) !== Boolean((itemB as any).pinned)
    ) {
      return false
    }
  }
  return true
}
