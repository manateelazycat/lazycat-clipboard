<script setup lang="ts">
import { inject } from 'vue'

const showAddModal = inject<() => void>('showAddModal')

function handleClick() {
  if (showAddModal) {
    showAddModal()
  }
}
</script>

<template>
  <button
    @click="handleClick"
    class="fixed bottom-6 right-6 w-14 h-14 bg-[var(--color-hermes-orange)] rounded-full shadow-lg flex items-center justify-center hover:opacity-90 active:scale-95 transition-all z-50"
  >
    <svg class="w-7 h-7 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
    </svg>
  </button>
</template>
