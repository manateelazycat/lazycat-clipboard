<script setup lang="ts">
import { ref, provide } from 'vue'
import ClipboardInput from '@/components/input/ClipboardInput.vue'
import ClipboardList from '@/components/clipboard/ClipboardList.vue'

const clipboardInputRef = ref<InstanceType<typeof ClipboardInput> | null>(null)

function focusInput() {
  clipboardInputRef.value?.focusInput()
}

provide('focusInput', focusInput)
</script>

<template>
  <div class="flex h-screen max-w-6xl mx-auto p-6 gap-6">
    <!-- Left Panel - Input -->
    <div class="w-80 flex-shrink-0">
      <ClipboardInput ref="clipboardInputRef" />
    </div>

    <!-- Right Panel - List -->
    <div class="flex-1 overflow-y-auto hide-scrollbar">
      <ClipboardList />
    </div>
  </div>
</template>
