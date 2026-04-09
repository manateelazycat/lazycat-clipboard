<script setup lang="ts">
import { ref, watch, computed, onMounted, onUnmounted, nextTick } from 'vue'
import type { ClipboardItem } from '@/types/clipboard'
import { isTextItem, isImageItem } from '@/types/clipboard'
import ImagePreview from '@/components/clipboard/ImagePreview.vue'

const props = defineProps<{
  item: ClipboardItem | null
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
  save: [content: string]
  delete: []
}>()

const editContent = ref('')
const isTextareaScrollbarVisible = ref(false)
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const deleteButtonRef = ref<HTMLButtonElement | null>(null)
const cancelButtonRef = ref<HTMLButtonElement | null>(null)
const saveButtonRef = ref<HTMLButtonElement | null>(null)
const imageDeleteButtonRef = ref<HTMLButtonElement | null>(null)
const imageCancelButtonRef = ref<HTMLButtonElement | null>(null)
let textareaScrollbarTimer: number | null = null

watch(() => props.item, (newItem) => {
  if (newItem && isTextItem(newItem)) {
    editContent.value = newItem.content
  } else {
    editContent.value = ''
  }
}, { immediate: true })

// Focus first element when modal opens
watch(() => props.visible, (newVal) => {
  if (newVal) {
    nextTick(() => {
      if (isText.value) {
        textareaRef.value?.focus()
      }
      // For image modal, don't auto-focus on the image
    })
  } else {
    hideTextareaScrollbar()
  }
})

const isText = computed(() => props.item && isTextItem(props.item))
const isImage = computed(() => props.item && isImageItem(props.item))

function handleSave() {
  if (isText.value) {
    emit('save', editContent.value)
  }
}

function handleDelete() {
  emit('delete')
}

function handleClose() {
  emit('close')
}

function clearTextareaScrollbarTimer() {
  if (textareaScrollbarTimer !== null) {
    clearTimeout(textareaScrollbarTimer)
    textareaScrollbarTimer = null
  }
}

function hideTextareaScrollbar() {
  clearTextareaScrollbarTimer()
  isTextareaScrollbarVisible.value = false
}

function showTextareaScrollbarTemporarily() {
  isTextareaScrollbarVisible.value = true
  clearTextareaScrollbarTimer()
  textareaScrollbarTimer = window.setTimeout(() => {
    isTextareaScrollbarVisible.value = false
    textareaScrollbarTimer = null
  }, 900)
}

function handleTextareaScroll() {
  showTextareaScrollbarTemporarily()
}

function handleKeyDown(e: KeyboardEvent) {
  if (!props.visible) return

  if (e.key === 'Escape') {
    handleClose()
    return
  }

  // Trap Tab focus within modal
  if (e.key === 'Tab') {
    e.preventDefault()

    if (isText.value) {
      // Text modal: textarea -> delete -> cancel -> save -> textarea
      const focusOrder = [
        textareaRef.value,
        deleteButtonRef.value,
        cancelButtonRef.value,
        saveButtonRef.value
      ].filter(Boolean) as HTMLElement[]

      cycleFocus(focusOrder, e.shiftKey)
    } else if (isImage.value) {
      // Image modal: cancel -> delete -> cancel
      const focusOrder = [
        imageCancelButtonRef.value,
        imageDeleteButtonRef.value
      ].filter(Boolean) as HTMLElement[]

      cycleFocus(focusOrder, e.shiftKey)
    }
  }
}

function cycleFocus(elements: HTMLElement[], reverse: boolean) {
  const currentIndex = elements.findIndex(el => el === document.activeElement)
  let nextIndex: number

  if (reverse) {
    nextIndex = currentIndex <= 0 ? elements.length - 1 : currentIndex - 1
  } else {
    nextIndex = currentIndex >= elements.length - 1 ? 0 : currentIndex + 1
  }

  elements[nextIndex]?.focus()
}

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  clearTextareaScrollbarTimer()
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <Teleport to="body">
    <div
      v-if="visible && item"
      class="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <!-- Backdrop -->
      <div
        class="absolute inset-0 bg-black/30 backdrop-blur-sm modal-backdrop"
        @click="handleClose"
      />

      <!-- Modal -->
      <Transition name="modal">
        <div class="relative flex w-full max-w-lg max-h-[80vh] flex-col overflow-hidden rounded-[var(--radius-apple-lg)] bg-white shadow-[var(--shadow-apple-lg)] md:h-[66.666vh] md:max-h-[66.666vh] md:w-[66.666vw] md:max-w-[66.666vw]">
          <!-- Header -->
          <div class="shrink-0 flex items-center justify-between p-4 border-b border-[var(--color-apple-gray-100)]">
            <h3 class="text-lg font-semibold text-[var(--color-apple-gray-900)]">
              {{ isText ? '编辑内容' : '查看图片' }}
            </h3>
            <button
              @click="handleClose"
              class="p-1 rounded-lg hover:bg-[var(--color-apple-gray-100)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-hermes-orange)]"
              tabindex="-1"
            >
              <svg class="w-5 h-5 text-[var(--color-apple-gray-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div
            :class="[
              'min-h-0 flex-1 overflow-hidden p-4',
              isText ? 'md:p-0' : ''
            ]"
          >
            <textarea
              v-if="isText"
              ref="textareaRef"
              v-model="editContent"
              :class="[
                'edit-textarea w-full h-48 min-h-48 overflow-y-auto p-3 border border-[var(--color-apple-gray-100)] rounded-[var(--radius-apple)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-hermes-orange)] focus:border-transparent text-[var(--color-apple-gray-900)] md:h-full md:border-0 md:rounded-none md:p-4 md:focus:ring-0',
                isTextareaScrollbarVisible ? 'scrollbar-active' : ''
              ]"
              @scroll="handleTextareaScroll"
            />

            <div
              v-else-if="isImage && isImageItem(item)"
              ref="imageRef"
              class="flex h-full items-center justify-center rounded-[var(--radius-apple)]"
            >
              <ImagePreview
                v-if="item.blob"
                :blob="item.blob"
                large
              />
              <p v-else class="text-sm text-[var(--color-apple-gray-500)]">
                图片数据加载中，请稍候再试
              </p>
            </div>
          </div>

          <!-- Footer for Text -->
          <div v-if="isText" class="shrink-0 flex justify-between p-4 border-t border-[var(--color-apple-gray-100)]">
            <button
              ref="deleteButtonRef"
              @click="handleDelete"
              class="px-4 py-2 text-red-600 hover:bg-red-50 rounded-[var(--radius-apple)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-hermes-orange)]"
            >
              删除
            </button>

            <div class="flex gap-2">
              <button
                ref="cancelButtonRef"
                @click="handleClose"
                class="px-4 py-2 text-[var(--color-apple-gray-500)] hover:bg-[var(--color-apple-gray-100)] rounded-[var(--radius-apple)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-hermes-orange)]"
              >
                取消
              </button>
              <button
                ref="saveButtonRef"
                @click="handleSave"
                class="px-4 py-2 bg-[var(--color-hermes-orange)] text-white rounded-[var(--radius-apple)] hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[var(--color-hermes-orange)] focus:ring-offset-2"
              >
                保存
              </button>
            </div>
          </div>

          <!-- Footer for Image -->
          <div v-else class="shrink-0 flex justify-end gap-2 p-4 border-t border-[var(--color-apple-gray-100)]">
            <button
              ref="imageCancelButtonRef"
              @click="handleClose"
              class="px-4 py-2 text-[var(--color-apple-gray-500)] hover:bg-[var(--color-apple-gray-100)] rounded-[var(--radius-apple)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-hermes-orange)]"
            >
              取消
            </button>
            <button
              ref="imageDeleteButtonRef"
              @click="handleDelete"
              class="px-4 py-2 text-red-600 hover:bg-red-50 rounded-[var(--radius-apple)] transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--color-hermes-orange)]"
            >
              删除
            </button>
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.edit-textarea {
  scrollbar-width: none;
}

.edit-textarea::-webkit-scrollbar {
  width: 0;
}

.edit-textarea.scrollbar-active {
  scrollbar-width: thin;
  scrollbar-color: var(--color-apple-gray-200) transparent;
}

.edit-textarea.scrollbar-active::-webkit-scrollbar {
  width: 8px;
}

.edit-textarea.scrollbar-active::-webkit-scrollbar-track {
  background: transparent;
}

.edit-textarea.scrollbar-active::-webkit-scrollbar-thumb {
  background: var(--color-apple-gray-200);
  border-radius: 4px;
}

.edit-textarea.scrollbar-active::-webkit-scrollbar-thumb:hover {
  background: var(--color-apple-gray-500);
}
</style>
