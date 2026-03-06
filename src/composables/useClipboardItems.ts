import { ref, onMounted } from 'vue'
import { v4 as uuidv4 } from 'uuid'
import type { ClipboardItem, AppSettings, TextClipboardItem } from '@/types/clipboard'
import * as clipboardService from '@/services/clipboardService'
import { loadSettings, saveSettings } from '@/services/settingsService'

const items = ref<ClipboardItem[]>([])
const selectedIndex = ref(-1)
const isLoading = ref(false)
const settings = ref<AppSettings | null>(null)
let initialized = false
const isSyncing = ref(false)
const syncLock = ref(false)
let syncHideTimer: number | null = null
let syncQueue: Promise<unknown> = Promise.resolve()
const MIN_SYNC_MS = 400

const isMobile = typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0)

function compareItems(a: ClipboardItem, b: ClipboardItem): number {
  const pinnedA = Boolean(a.pinned)
  const pinnedB = Boolean(b.pinned)
  if (pinnedA !== pinnedB) {
    return pinnedA ? -1 : 1
  }

  const orderA = normalizeOrder(a.order)
  const orderB = normalizeOrder(b.order)
  if (orderA !== orderB) return orderA - orderB

  if (a.updatedAt !== b.updatedAt) return b.updatedAt - a.updatedAt
  return b.createdAt - a.createdAt
}

function normalizeOrder(order: unknown): number {
  if (typeof order === 'number') return order
  const parsed = Number(order)
  return Number.isFinite(parsed) ? parsed : Number.MAX_SAFE_INTEGER
}

function sortItemsForDisplay(nextItems: ClipboardItem[]) {
  nextItems.sort(compareItems)
  return nextItems
}

function getNextTopOrderFromItems() {
  const finiteOrders = items.value
    .map(item => normalizeOrder(item.order))
    .filter(n => Number.isFinite(n) && n !== Number.MAX_SAFE_INTEGER)

  if (finiteOrders.length === 0) return -1

  return Math.min(...finiteOrders) - 1
}

function upsertLocalItem(item: ClipboardItem) {
  const existingIndex = items.value.findIndex(existing => existing.id === item.id)
  const nextItems = [...items.value]

  if (existingIndex !== -1) {
    nextItems.splice(existingIndex, 1, item)
  } else {
    nextItems.push(item)
  }

  items.value = sortItemsForDisplay(nextItems)
  return items.value.findIndex(existing => existing.id === item.id)
}

function removeLocalItem(id: string) {
  const index = items.value.findIndex(item => item.id === id)
  if (index === -1) return

  const nextItems = [...items.value]
  nextItems.splice(index, 1)
  items.value = nextItems

  if (selectedIndex.value >= nextItems.length) {
    selectedIndex.value = nextItems.length - 1
  }
}

function setSyncingVisible() {
  if (syncHideTimer) {
    clearTimeout(syncHideTimer)
    syncHideTimer = null
  }
  isSyncing.value = true
}

function scheduleSyncingHide(start: number) {
  const elapsed = Date.now() - start
  const delay = Math.max(0, MIN_SYNC_MS - elapsed)
  syncHideTimer = window.setTimeout(() => {
    isSyncing.value = false
    syncHideTimer = null
  }, delay)
}

function withSync<T>(fn: () => Promise<T>): Promise<T> {
  const run = async () => {
    syncLock.value = true
    setSyncingVisible()
    const start = Date.now()

    try {
      return await fn()
    } finally {
      syncLock.value = false
      scheduleSyncingHide(start)
    }
  }

  const task = syncQueue.then(run, run)
  syncQueue = task.then(() => undefined, () => undefined)
  return task
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
    const trimmed = content.trim()
    if (!trimmed) return

    const now = Date.now()
    const optimisticItem: TextClipboardItem = {
      id: uuidv4(),
      type: 'text',
      content: trimmed,
      createdAt: now,
      updatedAt: now,
      order: getNextTopOrderFromItems(),
      pinned: false,
    }

    const previousSelectedIndex = selectedIndex.value
    const nextIndex = upsertLocalItem(optimisticItem)
    if (!isMobile) {
      selectedIndex.value = nextIndex
    }

    try {
      await withSync(async () => {
        await clipboardService.addTextItem(trimmed, optimisticItem)
      })
    } catch (error) {
      removeLocalItem(optimisticItem.id)
      selectedIndex.value = previousSelectedIndex
      console.error('发送文字失败', error)
      throw error
    }
  }

  async function addImage(blob: Blob, mimeType: string) {
    await withSync(async () => {
      const savedItem = await clipboardService.addImageItem(blob, mimeType)
      const nextIndex = upsertLocalItem(savedItem)
      if (!isMobile) {
        selectedIndex.value = nextIndex
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
        item.content = content
        item.updatedAt = Date.now()
      }
    })
  }

  async function deleteItem(id: string) {
    await withSync(async () => {
      await clipboardService.deleteItem(id)
      removeLocalItem(id)
    })
  }

  async function reorderItems(newItems: ClipboardItem[]) {
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
      Boolean(itemA.pinned) !== Boolean(itemB.pinned)
    ) {
      return false
    }
  }
  return true
}
