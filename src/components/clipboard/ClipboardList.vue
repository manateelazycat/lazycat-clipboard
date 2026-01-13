<script setup lang="ts">
import { computed, inject, ref, watch, onMounted, onUnmounted } from 'vue'
import draggable from 'vuedraggable'
import ClipboardItemComponent from './ClipboardItem.vue'
import { useClipboardItems } from '@/composables/useClipboardItems'
import { useClipboard } from '@/composables/useClipboard'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { isTextItem, isImageItem } from '@/types/clipboard'
import type { ClipboardItem, CopyMode } from '@/types/clipboard'

const {
  items,
  selectedIndex,
  isLoading,
  reorderItems,
  selectNext,
  selectPrevious,
  selectIndex,
  togglePin,
  deleteItem,
  settings,
  syncLock
} = useClipboardItems()

const { copyText, copyImage } = useClipboard()

const showEditModal = inject<(item: ClipboardItem) => void>('showEditModal')
const showDeleteConfirm = inject<(item: ClipboardItem) => void>('showDeleteConfirm')
const isModalOpen = inject<{ value: boolean }>('isModalOpen', { value: false })
const focusInput = inject<() => void>('focusInput')

const copyMode = computed<CopyMode>(() => settings.value?.copyMode ?? 'single-tap')
const pinEnabled = computed(() => settings.value?.enablePin ?? true)

const selectionIds = ref<Set<string>>(new Set())
const multiSelectMode = ref(false)
const containerRef = ref<HTMLElement | null>(null)
const skipNextDocumentExit = ref(false)

// Mobile detection
const isMobile = ref(
  typeof window !== 'undefined' &&
  ('ontouchstart' in window || navigator.maxTouchPoints > 0)
)

async function handleCopy(index: number) {
  if (multiSelectMode.value) return
  const item = items.value[index]
  if (!item) return

  selectIndex(index)

  if (isTextItem(item)) {
    await copyText(item.content)
  } else if (isImageItem(item)) {
    if (item.blob) {
      await copyImage(item.blob)
    } else {
      console.warn('未找到可复制的图片数据')
    }
  }
}

function handleEdit(index: number) {
  const item = items.value[index]
  if (item && showEditModal) {
    selectIndex(index)
    showEditModal(item)
  }
}

async function handleDelete(index: number) {
  const item = items.value[index]
  if (!item) return
  if (multiSelectMode.value) {
    await deleteItem(item.id)
    selectionIds.value.delete(item.id)
    return
  }
  if (showDeleteConfirm) {
    selectIndex(index)
    showDeleteConfirm(item)
  }
}

async function handleTogglePin(index: number) {
  if (!pinEnabled.value) return
  const item = items.value[index]
  if (!item) return
  await togglePin(item.id, !item.pinned)
}

// Track the dragged item for re-selection after drag
const draggedItemId = ref<string | null>(null)

async function handleDragEnd() {
  if (multiSelectMode.value) return

  // Re-select the dragged item at its new position
  if (draggedItemId.value && isMobile.value) {
    const newIndex = items.value.findIndex(item => item.id === draggedItemId.value)
    if (newIndex !== -1) {
      selectIndex(newIndex)
    }
  }
  draggedItemId.value = null

  try {
    await reorderItems([...items.value])
  } catch (error) {
    console.error('保存排序失败', error)
  }
}

function handleDragStart(e: any) {
  if (multiSelectMode.value) return

  // Remember which item is being dragged
  const draggedIndex = e.oldIndex
  if (draggedIndex !== undefined && items.value[draggedIndex]) {
    draggedItemId.value = items.value[draggedIndex].id
  }

  // Vibrate on mobile
  if (navigator.vibrate) {
    navigator.vibrate(50)
  }
}

function handleSelectOnly(index: number) {
  const item = items.value[index]
  if (!item) return
  if (multiSelectMode.value) return
  selectIndex(index)
}

function toggleSelect(index: number) {
  const item = items.value[index]
  if (!item) return
  const next = new Set(selectionIds.value)
  if (next.has(item.id)) {
    next.delete(item.id)
  } else {
    next.add(item.id)
  }
  selectionIds.value = next
  selectIndex(index)
}

function handleClick(index: number) {
  if (multiSelectMode.value) {
    toggleSelect(index)
    return
  }
  handleSelectOnly(index)
  if (copyMode.value === 'single-tap') {
    handleCopy(index)
  }
}

function handleDblClick(index: number) {
  if (multiSelectMode.value) return
  handleSelectOnly(index)
  if (copyMode.value === 'double-tap') {
    handleCopy(index)
  }
}

async function handleBulkDelete() {
  if (selectionIds.value.size === 0) return
  bulkDialogVisible.value = true
}

function clearSelectionState() {
  selectionIds.value = new Set()
  selectedIndex.value = -1
  multiSelectMode.value = false
}

const bulkDialogVisible = ref(false)

async function confirmBulkDelete() {
  const ids = Array.from(selectionIds.value)
  for (const id of ids) {
    await deleteItem(id)
  }
  selectionIds.value = new Set()
  selectedIndex.value = -1
  bulkDialogVisible.value = false
}

function cancelBulkDelete() {
  bulkDialogVisible.value = false
}

// Setup keyboard shortcuts
useKeyboardShortcuts({
  items,
  selectedIndex,
  onNavigate: (direction) => {
    if (direction === 'up') {
      selectPrevious()
    } else {
      selectNext()
    }
  },
  onCopy: handleCopy,
  onEdit: handleEdit,
  onDelete: handleDelete,
  onFocusInput: focusInput,
  isModalOpen: isModalOpen as any
})

// Drag options - use handle for mobile, free drag for desktop
const dragOptions = computed(() => ({
  animation: 200,
  group: 'clipboard-items',
  disabled: multiSelectMode.value || syncLock.value,
  ghostClass: 'ghost',
  // Mobile: use drag handle, Desktop: drag anywhere
  handle: isMobile.value ? '.drag-handle' : undefined,
  forceFallback: true,
  fallbackTolerance: 5
}))

watch(
  () => items.value,
  () => {
    if (selectionIds.value.size === 0) return
    const next = new Set<string>()
    for (const item of items.value) {
      if (selectionIds.value.has(item.id)) {
        next.add(item.id)
      }
    }
    selectionIds.value = next
}
)

function enterMultiSelect() {
  selectionIds.value = new Set()
  multiSelectMode.value = true
}

function exitMultiSelect() {
  clearSelectionState()
}

function toggleMultiSelect() {
  if (multiSelectMode.value) {
    exitMultiSelect()
  } else {
    skipNextDocumentExit.value = true
    enterMultiSelect()
  }
}

defineExpose({
  enterMultiSelect,
  exitMultiSelect,
  toggleMultiSelect
})

function handleBackgroundClick(e: MouseEvent) {
  const target = e.target as HTMLElement
  if (bulkDialogVisible.value) return
  if (target.closest('.clipboard-item')) return
  if (target.closest('.multi-select-bar')) return

  // In multiSelectMode, exit multi select
  if (multiSelectMode.value) {
    exitMultiSelect()
    return
  }

  // Otherwise, just deselect all items
  selectedIndex.value = -1
}

function handleDocumentClick(e: MouseEvent) {
  if (!multiSelectMode.value || bulkDialogVisible.value) return
  if (skipNextDocumentExit.value) {
    skipNextDocumentExit.value = false
    return
  }
  const target = e.target as Node
  const container = containerRef.value
  if (container && container.contains(target)) return
  exitMultiSelect()
}

onMounted(() => {
  window.addEventListener('click', handleDocumentClick)
})

onUnmounted(() => {
  window.removeEventListener('click', handleDocumentClick)
})
</script>

<template>
  <div
    :class="['clipboard-list', { 'h-full': items.length === 0 || isLoading }]"
    @click.self="multiSelectMode && exitMultiSelect()"
    @click="handleBackgroundClick"
    ref="containerRef"
  >
    <Teleport to="body">
      <Transition name="modal">
        <div
          v-if="bulkDialogVisible"
          class="fixed inset-0 z-50 flex items-center justify-center px-4"
        >
          <div class="absolute inset-0 bg-black/30 backdrop-blur-sm" @click="cancelBulkDelete" />
          <div class="relative bg-white rounded-[var(--radius-apple-lg)] shadow-[var(--shadow-apple-lg)] w-full max-w-sm overflow-hidden">
            <div class="p-4 border-b border-[var(--color-apple-gray-100)] flex items-center justify-between">
              <div class="text-base font-semibold text-[var(--color-apple-gray-900)]">批量删除</div>
              <button
                class="p-1 rounded-lg hover:bg-[var(--color-apple-gray-100)] transition-colors"
                @click="cancelBulkDelete"
              >
                <svg class="w-5 h-5 text-[var(--color-apple-gray-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div class="p-4 space-y-2 text-[var(--color-apple-gray-700)]">
              <div>确定删除已选择的 {{ selectionIds.size }} 条内容吗？</div>
              <div class="text-sm text-[var(--color-apple-gray-500)]">删除后不可恢复。</div>
            </div>
            <div class="p-4 border-t border-[var(--color-apple-gray-100)] flex justify-end gap-2">
              <button
                class="px-4 py-2 text-[var(--color-apple-gray-600)] rounded-[var(--radius-apple)] hover:bg-[var(--color-apple-gray-100)] transition-colors"
                @click="cancelBulkDelete"
              >
                取消
              </button>
              <button
                class="px-4 py-2 bg-red-500 text-white rounded-[var(--radius-apple)] hover:bg-red-600 transition-colors"
                @click="confirmBulkDelete"
              >
                删除
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>

    <div
      class="flex items-center justify-between mb-2 md:mb-3 multi-select-bar"
      v-if="!isLoading && multiSelectMode"
    >
      <div class="flex-1 flex items-center gap-2 bg-white rounded-[var(--radius-apple-lg)] shadow-[var(--shadow-apple)] px-4 py-3 border border-[var(--color-apple-gray-100)]">
        <div class="text-sm text-[var(--color-apple-gray-700)]">多选模式 · 已选择 {{ selectionIds.size }} 项</div>
        <div class="ml-auto flex items-center gap-2">
          <button
            class="px-3 py-1.5 text-sm text-[var(--color-apple-gray-600)] rounded-[var(--radius-apple)] hover:bg-[var(--color-apple-gray-100)] transition-colors"
            @click="exitMultiSelect"
          >
            退出
          </button>
          <button
            class="px-3 py-1.5 text-sm text-white bg-red-500 hover:bg-red-600 rounded-[var(--radius-apple)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            :disabled="selectionIds.size === 0"
            @click="handleBulkDelete"
          >
            删除
          </button>
        </div>
      </div>
    </div>

    <div v-if="isLoading" class="flex items-center justify-center h-full text-[var(--color-apple-gray-500)]">
      加载中...
    </div>

    <div v-else-if="items.length === 0" class="flex flex-col items-center justify-center h-full text-center">
      <p class="text-[var(--color-apple-gray-500)]">欢迎使用懒猫剪切板</p>
      <p class="hidden md:block text-sm text-[var(--color-apple-gray-500)] mt-1">请在左边添加文字或图片到剪切板</p>
      <p class="block md:hidden text-sm text-[var(--color-apple-gray-500)] mt-1">点击右下角添加文字或图片</p>
    </div>

    <draggable
      v-else
      v-model="items"
      v-bind="dragOptions"
      item-key="id"
      @start="handleDragStart"
      @end="handleDragEnd"
      class="space-y-3 pb-24 md:pb-0"
    >
      <template #item="{ element, index }">
        <ClipboardItemComponent
          :item="element"
          :is-selected="multiSelectMode ? selectionIds.has(element.id) : selectedIndex === index"
          :multi-select-mode="multiSelectMode"
          :copy-mode="copyMode"
          :enable-pin="pinEnabled"
          @copy="handleCopy(index)"
          @edit="handleEdit(index)"
          @toggle-pin="handleTogglePin(index)"
          @click="handleClick(index)"
          @dblclick="handleDblClick(index)"
        />
      </template>
    </draggable>
  </div>
</template>

<style scoped>
.ghost {
  opacity: 0.5;
  background: var(--color-apple-gray-100);
}
</style>
