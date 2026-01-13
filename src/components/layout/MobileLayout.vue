<script setup lang="ts">
import ClipboardList from '@/components/clipboard/ClipboardList.vue'
import FloatingAddButton from '@/components/input/FloatingAddButton.vue'
import { useClipboardItems } from '@/composables/useClipboardItems'

const emit = defineEmits<{
  'open-settings': []
}>()

const { isSyncing } = useClipboardItems()
</script>

<template>
    <div class="h-screen flex flex-col pb-24 px-4 pt-4 overflow-y-auto hide-scrollbar relative">
        <ClipboardList ref="clipboardListRef" class="flex-1" />
        <div v-if="isSyncing" class="fixed bottom-4 left-4 z-30">
            <div
                class="flex items-center gap-2 bg-white rounded-[var(--radius-apple)] shadow-[var(--shadow-apple)] px-3 py-2 border border-[var(--color-apple-gray-100)] text-xs text-[var(--color-apple-gray-700)]">
                <svg class="w-4 h-4 text-[var(--color-hermes-orange)] animate-spin-smooth" viewBox="0 0 24 24"
                    fill="none">
                    <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" opacity="0.2" />
                    <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
                </svg>
                同步中…
            </div>
        </div>
        <FloatingAddButton />
    </div>
</template>

<style scoped>
.animate-spin-smooth {
  animation: spin-smooth 0.9s linear infinite;
}

@keyframes spin-smooth {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}
</style>
