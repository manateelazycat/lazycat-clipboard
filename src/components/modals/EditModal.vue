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
const textareaRef = ref<HTMLTextAreaElement | null>(null)
const imageRef = ref<HTMLDivElement | null>(null)
const deleteButtonRef = ref<HTMLButtonElement | null>(null)
const cancelButtonRef = ref<HTMLButtonElement | null>(null)
const saveButtonRef = ref<HTMLButtonElement | null>(null)
const imageDeleteButtonRef = ref<HTMLButtonElement | null>(null)
const imageCancelButtonRef = ref<HTMLButtonElement | null>(null)

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
      } else if (isImage.value) {
        imageRef.value?.focus()
      }
    })
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
      // Image modal: image -> cancel -> delete -> image
      const focusOrder = [
        imageRef.value,
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
  window.removeEventListener('keydown', handleKeyDown)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible && item"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/30 backdrop-blur-sm"
          @click="handleClose"
        />

        <!-- Modal -->
        <div class="relative bg-white rounded-[var(--radius-apple-lg)] shadow-[var(--shadow-apple-lg)] w-full max-w-lg max-h-[80vh] overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b border-[var(--color-apple-gray-100)]">
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
          <div class="p-4 overflow-y-auto max-h-[50vh]">
            <textarea
              v-if="isText"
              ref="textareaRef"
              v-model="editContent"
              class="w-full h-48 p-3 border border-[var(--color-apple-gray-100)] rounded-[var(--radius-apple)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-hermes-orange)] focus:border-transparent text-[var(--color-apple-gray-900)]"
            />

            <div
              v-else-if="isImage && isImageItem(item)"
              ref="imageRef"
              tabindex="0"
              class="rounded-[var(--radius-apple)] focus:outline-none focus:ring-2 focus:ring-[var(--color-hermes-orange)]"
            >
              <ImagePreview :blob="item.blob" />
            </div>
          </div>

          <!-- Footer for Text -->
          <div v-if="isText" class="flex justify-between p-4 border-t border-[var(--color-apple-gray-100)]">
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
          <div v-else class="flex justify-end gap-2 p-4 border-t border-[var(--color-apple-gray-100)]">
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
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-enter-active,
.modal-leave-active {
  transition: opacity 0.2s ease;
}

.modal-enter-from,
.modal-leave-to {
  opacity: 0;
}

.modal-enter-active .relative,
.modal-leave-active .relative {
  transition: transform 0.2s ease;
}

.modal-enter-from .relative,
.modal-leave-to .relative {
  transform: scale(0.95);
}
</style>
