<script setup lang="ts">
import { computed, provide, ref } from 'vue'
import ClipboardInput from '@/components/input/ClipboardInput.vue'
import ClipboardList from '@/components/clipboard/ClipboardList.vue'
import { getLightAppTopPadding } from '@/services/lightAppShell'

const emit = defineEmits<{
  'open-settings': []
}>()
const clipboardInputRef = ref<InstanceType<typeof ClipboardInput> | null>(null)
const clipboardListRef = ref<InstanceType<typeof ClipboardList> | null>(null)

function focusInput() {
  clipboardInputRef.value?.focusInput()
}

provide('focusInput', focusInput)


const containerStyle = computed(() => {
  const paddingTop = getLightAppTopPadding()
  if (!paddingTop) return undefined

  return { paddingTop }
})
</script>

<template>
  <div :style="containerStyle" class="flex h-screen max-w-6xl mx-auto p-6 gap-6">
    <!-- Left Panel - Input -->
    <div
      id="left-panel"
      class="w-80 flex-shrink-0 relative"
    >

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
