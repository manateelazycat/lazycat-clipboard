<script setup lang="ts">
import { computed, inject } from 'vue'
import draggable from 'vuedraggable'
import ClipboardItemComponent from './ClipboardItem.vue'
import { useClipboardItems } from '@/composables/useClipboardItems'
import { useClipboard } from '@/composables/useClipboard'
import { useKeyboardShortcuts } from '@/composables/useKeyboardShortcuts'
import { isTextItem, isImageItem } from '@/types/clipboard'
import type { ClipboardItem } from '@/types/clipboard'

const {
  items,
  selectedIndex,
  isLoading,
  reorderItems,
  selectNext,
  selectPrevious,
  selectIndex
} = useClipboardItems()

const { copyText, copyImage } = useClipboard()

const showEditModal = inject<(item: ClipboardItem) => void>('showEditModal')
const showDeleteConfirm = inject<(item: ClipboardItem) => void>('showDeleteConfirm')
const isModalOpen = inject<{ value: boolean }>('isModalOpen', { value: false })
const focusInput = inject<() => void>('focusInput')

async function handleCopy(index: number) {
  const item = items.value[index]
  if (!item) return

  selectIndex(index)

  if (isTextItem(item)) {
    await copyText(item.content)
  } else if (isImageItem(item)) {
    await copyImage(item.blob)
  }
}

function handleEdit(index: number) {
  const item = items.value[index]
  if (item && showEditModal) {
    selectIndex(index)
    showEditModal(item)
  }
}

function handleDelete(index: number) {
  const item = items.value[index]
  if (item && showDeleteConfirm) {
    selectIndex(index)
    showDeleteConfirm(item)
  }
}

function handleDragEnd() {
  reorderItems([...items.value])
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

const dragOptions = computed(() => ({
  animation: 200,
  group: 'clipboard-items',
  disabled: false,
  ghostClass: 'ghost'
}))
</script>

<template>
  <div class="clipboard-list">
    <div v-if="isLoading" class="text-center py-8 text-[var(--color-apple-gray-500)]">
      加载中...
    </div>

    <div v-else-if="items.length === 0" class="text-center py-12">
      <svg class="w-16 h-16 mx-auto text-[var(--color-apple-gray-200)] mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
      <p class="text-[var(--color-apple-gray-500)]">暂无剪贴内容</p>
      <p class="text-sm text-[var(--color-apple-gray-500)] mt-1">添加文字或图片开始使用</p>
    </div>

    <draggable
      v-else
      v-model="items"
      v-bind="dragOptions"
      item-key="id"
      @end="handleDragEnd"
      class="space-y-3"
    >
      <template #item="{ element, index }">
        <ClipboardItemComponent
          :item="element"
          :is-selected="selectedIndex === index"
          @copy="handleCopy(index)"
          @edit="handleEdit(index)"
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
