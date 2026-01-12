<script setup lang="ts">
import type { ClipboardItem } from '@/types/clipboard'
import { isTextItem, isImageItem } from '@/types/clipboard'
import TextPreview from './TextPreview.vue'
import ImagePreview from './ImagePreview.vue'

const props = defineProps<{
  item: ClipboardItem
  isSelected: boolean
}>()

const emit = defineEmits<{
  copy: []
  edit: []
}>()

function handleClick() {
  emit('copy')
}

function handleEdit(e: Event) {
  e.stopPropagation()
  emit('edit')
}
</script>

<template>
  <div
    class="relative bg-white rounded-[var(--radius-apple-lg)] shadow-[var(--shadow-apple)] p-4 cursor-pointer transition-all hover:shadow-[var(--shadow-apple-lg)] group overflow-hidden outline-none"
    @click="handleClick"
    tabindex="0"
    role="button"
    :aria-label="isTextItem(item) ? `复制文字: ${item.content.slice(0, 50)}` : '复制图片'"
  >
    <!-- Selection indicator - orange left border -->
    <div
      v-if="isSelected"
      class="absolute left-1 top-2.5 bottom-2.5 w-1 bg-[var(--color-hermes-orange)] rounded-full"
    />

    <!-- Content -->
    <div :class="isImageItem(item) ? 'pr-24' : 'pr-20'">
      <TextPreview v-if="isTextItem(item)" :content="item.content" />
      <ImagePreview v-else-if="isImageItem(item)" :blob="item.blob" />
    </div>

    <!-- Action Buttons - Desktop (hover) -->
    <div
      class="absolute right-4 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity max-md:hidden"
      :class="isImageItem(item) ? 'top-4' : 'top-1/2 -translate-y-1/2'"
    >
      <button
        @click.stop="handleClick"
        class="p-2.5 rounded-lg hover:bg-[var(--color-apple-gray-100)] active:bg-[var(--color-apple-gray-200)] transition-colors"
        title="复制"
      >
        <svg class="w-5 h-5 text-[var(--color-apple-gray-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>

      <button
        @click="handleEdit"
        class="p-2.5 rounded-lg hover:bg-[var(--color-apple-gray-100)] active:bg-[var(--color-apple-gray-200)] transition-colors"
        title="编辑"
      >
        <svg class="w-5 h-5 text-[var(--color-apple-gray-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    </div>

    <!-- Touch device: show buttons only when selected -->
    <div
      v-if="isSelected"
      class="absolute right-4 flex gap-1 md:hidden"
      :class="isImageItem(item) ? 'top-4' : 'top-1/2 -translate-y-1/2'"
    >
      <button
        @click.stop="handleClick"
        class="p-2.5 rounded-lg hover:bg-[var(--color-apple-gray-100)] active:bg-[var(--color-apple-gray-200)] transition-colors"
        title="复制"
      >
        <svg class="w-5 h-5 text-[var(--color-apple-gray-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      </button>

      <button
        @click="handleEdit"
        class="p-2.5 rounded-lg hover:bg-[var(--color-apple-gray-100)] active:bg-[var(--color-apple-gray-200)] transition-colors"
        title="编辑"
      >
        <svg class="w-5 h-5 text-[var(--color-apple-gray-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      </button>
    </div>
  </div>
</template>
