<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  visible: boolean
}>()

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
              确认删除
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
              确定要删除这条内容吗？此操作无法撤销。
            </p>
          </div>

          <!-- Footer -->
          <div class="flex justify-center p-4">
            <button
              @click="handleConfirm"
              class="w-full py-2.5 bg-red-600 text-white rounded-[var(--radius-apple)] font-medium hover:bg-red-700 transition-colors"
            >
              删除 (Enter)
            </button>
          </div>

          <p class="text-center text-sm text-[var(--color-apple-gray-500)] pb-4">
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
