<script setup lang="ts">
import { computed, ref } from 'vue'
import type { ClipboardMetadata } from '@/types/clipboard'
import { useClipboardItems } from '@/composables/useClipboardItems'

const { clearAll, getMetadata } = useClipboardItems()

const panelOpen = ref(false)
const metaVisible = ref(false)
const metadata = ref<ClipboardMetadata | null>(null)
const metaError = ref('')
const isClearing = ref(false)
const isFetchingMeta = ref(false)

const hasData = computed(() => (metadata.value?.total ?? 0) > 0)

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / 1024 / 1024).toFixed(2)} MB`
}

function formatTime(timestamp?: number) {
  if (!timestamp) return '暂无'
  return new Date(timestamp).toLocaleString()
}

async function handleClear() {
  if (!confirm('确定清空所有剪贴板数据吗？此操作不可恢复。')) {
    return
  }

  isClearing.value = true
  try {
    await clearAll()
    panelOpen.value = false
  } finally {
    isClearing.value = false
  }
}

async function handleShowMetadata() {
  isFetchingMeta.value = true
  metaError.value = ''
  try {
    metadata.value = await getMetadata()
    metaVisible.value = true
  } catch (error) {
    metaError.value = '获取元信息失败，请稍后重试'
    console.error(error)
  } finally {
    isFetchingMeta.value = false
  }
}

function closeMeta() {
  metaVisible.value = false
}
</script>

<template>
  <div class="fixed bottom-4 left-4 right-4 md:right-auto md:w-auto z-40 text-sm">
    <div class="relative inline-block max-w-full">
      <button
        class="px-4 py-2 bg-[var(--color-apple-gray-900)] text-white rounded-full shadow-lg hover:shadow-[var(--shadow-apple-lg)] transition-all"
        @click="panelOpen = !panelOpen"
      >
        调试工具
      </button>

      <div
        v-if="panelOpen"
        class="absolute bottom-12 right-0 md:w-64 w-[min(92vw,360px)] max-w-full bg-white rounded-[var(--radius-apple-lg)] shadow-[var(--shadow-apple-lg)] border border-[var(--color-apple-gray-100)] p-3 space-y-2"
      >
        <button
          class="w-full px-3 py-2 rounded-[var(--radius-apple)] bg-[var(--color-apple-gray-900)] text-white hover:opacity-90 transition-opacity disabled:opacity-50"
          :disabled="isFetchingMeta"
          @click="handleShowMetadata"
        >
          {{ isFetchingMeta ? '读取元信息...' : '查看元信息' }}
        </button>
        <button
          class="w-full px-3 py-2 rounded-[var(--radius-apple)] bg-red-500 text-white hover:bg-red-600 transition-colors disabled:opacity-50"
          :disabled="isClearing"
          @click="handleClear"
        >
          {{ isClearing ? '清空中...' : '一键清空' }}
        </button>
      </div>
    </div>
  </div>

  <Teleport to="body">
    <div
      v-if="metaVisible"
      class="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4"
    >
      <div class="bg-white rounded-[var(--radius-apple-lg)] shadow-[var(--shadow-apple-lg)] w-full max-w-md p-6">
        <div class="flex items-center justify-between mb-4">
          <h3 class="text-lg font-semibold text-[var(--color-apple-gray-900)]">MiniDB 元信息</h3>
          <button
            class="p-1 rounded-lg hover:bg-[var(--color-apple-gray-100)] transition-colors"
            @click="closeMeta"
          >
            <svg class="w-5 h-5 text-[var(--color-apple-gray-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div v-if="metaError" class="text-red-600 text-sm mb-2">
          {{ metaError }}
        </div>

        <div v-if="metadata" class="space-y-2 text-[var(--color-apple-gray-800)]">
          <div class="flex justify-between">
            <span>总记录数</span>
            <span class="font-semibold">{{ metadata.total }}</span>
          </div>
          <div class="flex justify-between">
            <span>文本记录</span>
            <span>{{ metadata.textCount }}</span>
          </div>
          <div class="flex justify-between">
            <span>图片记录</span>
            <span>{{ metadata.imageCount }}</span>
          </div>
          <div class="flex justify-between">
            <span>预计占用空间</span>
            <span>{{ formatBytes(metadata.estimatedBytes) }}</span>
          </div>
          <div class="flex justify-between">
            <span>最近创建</span>
            <span>{{ formatTime(metadata.latestCreatedAt) }}</span>
          </div>
          <div class="flex justify-between">
            <span>最近更新</span>
            <span>{{ formatTime(metadata.latestUpdatedAt) }}</span>
          </div>
          <div v-if="!hasData" class="text-sm text-[var(--color-apple-gray-500)] pt-2">
            当前没有存储的数据。
          </div>
        </div>

        <div class="mt-6 flex justify-end">
          <button
            class="px-4 py-2 rounded-[var(--radius-apple)] bg-[var(--color-apple-gray-900)] text-white hover:opacity-90 transition-opacity"
            @click="closeMeta"
          >
            关闭
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>
