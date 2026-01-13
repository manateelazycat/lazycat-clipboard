<script setup lang="ts">
import { provide, ref } from 'vue'
import ClipboardInput from '@/components/input/ClipboardInput.vue'
import ClipboardList from '@/components/clipboard/ClipboardList.vue'
import { useClipboardItems } from '@/composables/useClipboardItems'

const emit = defineEmits<{
  'open-settings': []
}>()
const clipboardInputRef = ref<InstanceType<typeof ClipboardInput> | null>(null)
const clipboardListRef = ref<InstanceType<typeof ClipboardList> | null>(null)

function focusInput() {
  clipboardInputRef.value?.focusInput()
}

provide('focusInput', focusInput)

const { isSyncing } = useClipboardItems()
</script>

<template>
  <div class="flex h-screen max-w-6xl mx-auto p-6 gap-6">
    <!-- Left Panel - Input -->
    <div
      id="left-panel"
      class="w-80 flex-shrink-0 relative"
    >
      <div
        v-if="isSyncing"
        class="absolute top-0 right-0 pt-3 pr-3 z-20"
      >
        <div class="flex items-center gap-2 bg-white px-3 py-2 text-xs text-[var(--color-apple-gray-700)]">
          <svg class="w-4 h-4 text-[var(--color-hermes-orange)] animate-spin-smooth" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="9" stroke="currentColor" stroke-width="2" opacity="0.2" />
            <path d="M12 3a9 9 0 0 1 9 9" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
          </svg>
        </div>
      </div>

      <div class="sticky">
        <div class="panel-shell">
          <ClipboardInput
            ref="clipboardInputRef"
            @open-settings="emit('open-settings')"
            @toggle-multi="clipboardListRef?.toggleMultiSelect()"
          />
        </div>
      </div>
    </div>

    <!-- Right Panel - List -->
    <div class="flex-1 overflow-y-auto hide-scrollbar">
      <ClipboardList ref="clipboardListRef" />
    </div>
  </div>
</template>

<style scoped>
.panel-shell {
  border-radius: 18px;
  padding: 6px;
  padding-top: 0px;
  transition: background 0.2s ease;
}

.panel-shell > * {
  position: relative;
  z-index: 1;
}

.panel-shell::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  pointer-events: none;
  z-index: 0;
}

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
