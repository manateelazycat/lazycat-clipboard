<script setup lang="ts">
import { ref } from 'vue'
import ClipboardList from '@/components/clipboard/ClipboardList.vue'
import FloatingAddButton from '@/components/input/FloatingAddButton.vue'
import { useClipboardItems } from '@/composables/useClipboardItems'

const emit = defineEmits<{
  'open-settings': []
}>()

const clipboardListRef = ref<InstanceType<typeof ClipboardList> | null>(null)
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
        <div class="fixed right-7 bottom-22 z-30 flex flex-col items-center gap-2">
            <button
                class="w-12 h-12 rounded-full bg-white shadow-[var(--shadow-apple)] border border-[var(--color-apple-gray-100)] flex items-center justify-center text-[var(--color-apple-gray-700)] hover:shadow-[var(--shadow-apple-lg)] active:scale-95 transition-all"
                @click="clipboardListRef?.toggleMultiSelect()" title="多选编辑">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M7 6h10M7 10h6M7 14h4M7 18h8" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.5 9.5L18 12l3.5-3.5" />
                </svg>
            </button>
            <button
                class="w-12 h-12 rounded-full bg-white shadow-[var(--shadow-apple)] border border-[var(--color-apple-gray-100)] flex items-center justify-center text-[var(--color-apple-gray-700)] hover:shadow-[var(--shadow-apple-lg)] active:scale-95 transition-all"
                @click="emit('open-settings')" title="设置中心">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37a1.724 1.724 0 002.572-1.065z" />
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            </button>
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
