<script setup lang="ts">
import { ref, inject, onMounted } from 'vue'
import ClipboardList from '@/components/clipboard/ClipboardList.vue'
import FloatingAddButton from '@/components/input/FloatingAddButton.vue'

const scrollContainerRef = ref<HTMLElement | null>(null)
const registerScrollToTop = inject<(fn: () => void) => void>('registerScrollToTop')

onMounted(() => {
  if (registerScrollToTop) {
    registerScrollToTop(() => {
      scrollContainerRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }
})
</script>

<template>
    <div ref="scrollContainerRef" class="h-screen flex flex-col pb-24 px-4 pt-4 overflow-y-auto hide-scrollbar relative">
        <ClipboardList ref="clipboardListRef" class="flex-1" />
        <FloatingAddButton />
    </div>
</template>

<style scoped>
</style>
