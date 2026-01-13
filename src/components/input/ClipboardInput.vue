<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { useClipboardItems } from '@/composables/useClipboardItems'

const { addText, addImage } = useClipboardItems()
const emit = defineEmits<{
  'open-settings': []
  'toggle-multi': []
}>()

const textInput = ref('')
const isDragging = ref(false)
const showEmptyTooltip = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)

async function handleSubmit() {
  if (textInput.value.trim()) {
    await addText(textInput.value)
    textInput.value = ''
    showEmptyTooltip.value = false
  } else {
    showEmptyTooltip.value = true
    setTimeout(() => {
      showEmptyTooltip.value = false
    }, 2000)
  }
}

function handleKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault()
    handleSubmit()
  }
  // Shift+Enter allows default behavior (newline)
}

function focusInput() {
  textareaRef.value?.focus()
}

defineExpose({ focusInput, textareaRef })

function handleDragOver(e: DragEvent) {
  e.preventDefault()
  isDragging.value = true
}

function handleDragLeave() {
  isDragging.value = false
}

async function handleDrop(e: DragEvent) {
  e.preventDefault()
  isDragging.value = false

  const files = e.dataTransfer?.files
  if (files && files.length > 0) {
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        await addImage(file, file.type)
      }
    }
  }

  const text = e.dataTransfer?.getData('text/plain')
  if (text) {
    await addText(text)
  }
}

async function handleFileSelect(e: Event) {
  const input = e.target as HTMLInputElement
  const files = input.files
  if (files && files.length > 0) {
    for (const file of Array.from(files)) {
      if (file.type.startsWith('image/')) {
        await addImage(file, file.type)
      }
    }
  }
  input.value = ''
}

// Handle Ctrl+V paste for images
async function handlePaste(e: ClipboardEvent) {
  const items = e.clipboardData?.items
  if (!items) return

  for (const item of Array.from(items)) {
    if (item.type.startsWith('image/')) {
      e.preventDefault()
      const blob = item.getAsFile()
      if (blob) {
        await addImage(blob, item.type)
      }
    }
  }
}

onMounted(() => {
  document.addEventListener('paste', handlePaste)
})

onUnmounted(() => {
  document.removeEventListener('paste', handlePaste)
})
</script>

<template>
  <div class="sticky">
    <div
      class="bg-white rounded-[var(--radius-apple-lg)] shadow-[var(--shadow-apple)] p-6"
      :class="{ 'ring-2 ring-[var(--color-apple-blue)]': isDragging }"
      @dragover="handleDragOver"
      @dragleave="handleDragLeave"
      @drop="handleDrop"
    >
      <h2 class="text-lg font-semibold mb-4 text-[var(--color-apple-gray-900)]">
        发送文字
      </h2>

      <div class="relative">
        <textarea
          ref="textareaRef"
          v-model="textInput"
          placeholder="请输入需要发送的文字"
          class="w-full h-32 p-3 border border-[var(--color-apple-gray-100)] rounded-[var(--radius-apple)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--color-hermes-orange)] focus:border-transparent text-sm text-[var(--color-apple-gray-900)] placeholder-[var(--color-apple-gray-500)]"
          @keydown="handleKeydown"
        />
        <!-- Empty content tooltip -->
        <Transition name="tooltip">
          <div
            v-if="showEmptyTooltip"
            class="absolute -top-10 left-1/2 -translate-x-1/2 px-3 py-1.5 bg-[var(--color-apple-gray-900)] text-white text-xs rounded-[var(--radius-apple)] whitespace-nowrap"
          >
            发送的内容不能为空
            <div class="absolute left-1/2 -translate-x-1/2 -bottom-1 w-2 h-2 bg-[var(--color-apple-gray-900)] rotate-45"></div>
          </div>
        </Transition>
      </div>

      <div class="mt-4">
        <button
          @click="handleSubmit"
          :disabled="!textInput.trim()"
          class="w-full py-2.5 px-4 bg-[var(--color-hermes-orange)] text-white rounded-[var(--radius-apple)] font-medium hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
        >
          发送
        </button>
      </div>

      <div class="mt-6 pt-6 border-t border-[var(--color-apple-gray-100)]">
        <h3 class="text-lg font-semibold mb-4 text-[var(--color-apple-gray-900)]">
          发送图片
        </h3>
        <label
          class="flex flex-col items-center justify-center h-32 border-2 border-dashed border-[var(--color-apple-gray-200)] rounded-[var(--radius-apple)] cursor-pointer hover:border-[var(--color-hermes-orange)] hover:bg-[var(--color-apple-gray-50)] transition-colors"
        >
          <span class="text-sm text-[var(--color-apple-gray-500)] text-center px-2">
            支持图片拖拽或快捷键粘贴
          </span>
          <input
            type="file"
            accept="image/*"
            multiple
            class="hidden"
            @change="handleFileSelect"
          />
        </label>
      </div>

      <!-- Tips Section -->
      <div class="mt-6 pt-6 border-t border-[var(--color-apple-gray-100)]">
        <h3 class="text-lg font-semibold mb-4 text-[var(--color-apple-gray-900)]">
          使用技巧
        </h3>
        <ul class="space-y-1.5 text-sm text-[var(--color-apple-gray-500)]">
          <li>共享文件请用懒猫网盘</li>
          <li>右边列表支持拖拽排序</li>
          <li>点击或回车即复制</li>
          <li>快捷键 ↑、↓、J、K、E</li>
        </ul>
      </div>

      <div class="mt-6 pt-6 border-t border-[var(--color-apple-gray-100)]">
        <h3 class="text-lg font-semibold mb-4 text-[var(--color-apple-gray-900)]">
          其他
        </h3>
        <div class="flex flex-wrap gap-2">
          <button
            class="inline-flex items-center gap-1 px-2 py-1 rounded-[var(--radius-apple)] text-[var(--color-apple-gray-700)] hover:bg-[var(--color-apple-gray-100)] transition-colors text-sm"
            @click="emit('open-settings')"
            title="设置中心"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            设置中心
          </button>
          <button
            class="inline-flex items-center gap-1 px-2 py-1 rounded-[var(--radius-apple)] text-[var(--color-apple-gray-700)] hover:bg-[var(--color-apple-gray-100)] transition-colors text-sm"
            @click="emit('toggle-multi')"
            title="多选编辑"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 6h10M7 10h6M7 14h4M7 18h8" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.5 9.5L18 12l3.5-3.5" />
            </svg>
            多选编辑
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.tooltip-enter-active,
.tooltip-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}
.tooltip-enter-from,
.tooltip-leave-to {
  opacity: 0;
  transform: translate(-50%, 4px);
}
</style>
