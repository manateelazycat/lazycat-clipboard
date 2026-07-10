<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = withDefaults(defineProps<{
  visible: boolean
  title?: string
  message?: string
  confirmLabel?: string
  showCancelButton?: boolean
}>(), {
  title: '确认删除',
  message: '确定要删除这条内容吗？此操作无法撤销。',
  confirmLabel: '删除',
  showCancelButton: false
})

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()

function handleConfirm() {
  emit('confirm')
}

function handleCancel() {
  emit('cancel')
}

function handleKeyDown(e: KeyboardEvent) {
  if (!props.visible) return

  if (e.key === 'Enter') {
    e.preventDefault()
    handleConfirm()
  } else if (e.key === 'Escape') {
    e.preventDefault()
    handleCancel()
  }
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
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        <!-- Backdrop -->
        <div
          class="absolute inset-0 bg-black/30 backdrop-blur-sm"
          @click="handleCancel"
        />

        <!-- Dialog -->
        <div class="relative bg-white rounded-[var(--radius-apple-lg)] shadow-[var(--shadow-apple-lg)] w-full max-w-sm overflow-hidden">
          <!-- Header -->
          <div class="flex items-center justify-between p-4">
            <h3 class="text-lg font-semibold text-[var(--color-apple-gray-900)]">
              {{ title }}
            </h3>
            <button
              @click="handleCancel"
              class="p-1 rounded-lg hover:bg-[var(--color-apple-gray-100)] transition-colors"
            >
              <svg class="w-5 h-5 text-[var(--color-apple-gray-500)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Content -->
          <div class="px-4 pb-2">
            <p class="text-[var(--color-apple-gray-500)]">
              {{ message }}
            </p>
          </div>

          <!-- Footer -->
          <div :class="['flex p-4', showCancelButton ? 'justify-end gap-2' : 'justify-center']">
            <button
              v-if="showCancelButton"
              @click="handleCancel"
              class="px-4 py-2.5 text-[var(--color-apple-gray-600)] rounded-[var(--radius-apple)] hover:bg-[var(--color-apple-gray-100)] transition-colors"
            >
              取消
            </button>
            <button
              @click="handleConfirm"
              :class="[
                showCancelButton ? 'px-4 py-2.5' : 'w-full py-2.5',
                'bg-red-600 text-white rounded-[var(--radius-apple)] font-medium hover:bg-red-700 transition-colors'
              ]"
            >
              {{ confirmLabel }}<template v-if="!showCancelButton"> (Enter)</template>
            </button>
          </div>

          <p v-if="!showCancelButton" class="text-center text-sm text-[var(--color-apple-gray-500)] pb-4">
            按 ESC 取消
          </p>
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
