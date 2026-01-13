<script setup lang="ts">
import { ref, watch, inject, onMounted, onUnmounted } from 'vue'
import { useClipboardItems } from '@/composables/useClipboardItems'

const props = defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  close: []
}>()

const { addText, addImage } = useClipboardItems()
const scrollListToTop = inject<() => void>('scrollListToTop')

const textInput = ref('')

async function handleSubmit() {
  if (textInput.value.trim()) {
    await addText(textInput.value)
    textInput.value = ''
    scrollListToTop?.()
    emit('close')
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
    scrollListToTop?.()
    emit('close')
  }
  input.value = ''
}

function handleClose() {
  textInput.value = ''
  emit('close')
}

function handleKeyDown(e: KeyboardEvent) {
  if (e.key === 'Escape') {
    handleClose()
  }
}

// Handle mobile back button
function handlePopState() {
  if (props.visible) {
    handleClose()
  }
}

// Push history state when modal opens, so back button closes it
watch(() => props.visible, (newVal, oldVal) => {
  if (newVal && !oldVal) {
    // Modal opened - push state
    history.pushState({ modal: 'add' }, '')
  } else if (!newVal && oldVal) {
    // Modal closed - go back if we pushed state
    if (history.state?.modal === 'add') {
      history.back()
    }
  }
})

onMounted(() => {
  window.addEventListener('keydown', handleKeyDown)
  window.addEventListener('popstate', handlePopState)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeyDown)
  window.removeEventListener('popstate', handlePopState)
})
</script>

<template>
  <Teleport to="body">
    <Transition name="modal">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-end justify-center"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/30 backdrop-blur-sm"
          @click="handleClose"
        />

        <!-- Modal -->
        <div id="left-panel" class="relative bg-white rounded-t-[var(--radius-apple-lg)] shadow-[var(--shadow-apple-lg)] w-full max-h-[80vh] overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between p-4 border-b border-[var(--color-apple-gray-100)]">
            <h3 class="text-lg font-semibold text-[var(--color-apple-gray-900)]">
              发送文字
            </h3>
            <button
              @click="handleClose"
              class="p-1 rounded-lg hover:bg-[var(--color-apple-gray-100)] transition-colors"
            >
              <svg class="w-5 h-5 text-[var(--color-apple-gray-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="p-4">
            <textarea
              v-model="textInput"
              placeholder="请输入需要发送的文字"
              class="w-full h-32 p-3 border border-[var(--color-apple-gray-100)] rounded-[var(--radius-apple)] resize-none focus:outline-none focus:ring-1 focus:ring-[var(--color-hermes-orange)] focus:border-transparent text-[var(--color-apple-gray-900)] placeholder-[var(--color-apple-gray-500)]"
            />

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
              <h4 class="text-base font-semibold mb-3 text-[var(--color-apple-gray-900)]">
                发送图片
              </h4>
              <label
                class="flex flex-col items-center justify-center gap-2 py-4 border-2 border-dashed border-[var(--color-apple-gray-200)] rounded-[var(--radius-apple)] cursor-pointer hover:border-[var(--color-hermes-orange)] hover:bg-[var(--color-apple-gray-50)] transition-colors"
              >
                <span class="text-sm text-[var(--color-apple-gray-500)] text-center px-2">
                  选择发送的图片
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
          </div>

          <!-- Safe area padding for mobile -->
          <div class="h-6" />
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
  transition: transform 0.3s ease;
}

.modal-enter-from .relative {
  transform: translateY(100%);
}

.modal-leave-to .relative {
  transform: translateY(100%);
}
</style>
