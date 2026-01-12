<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import DesktopLayout from './DesktopLayout.vue'
import MobileLayout from './MobileLayout.vue'

const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)

const isMobile = computed(() => windowWidth.value < 768)

function handleResize() {
  windowWidth.value = window.innerWidth
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
})

onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
})
</script>

<template>
  <div class="min-h-screen bg-[var(--color-apple-gray-50)]">
    <MobileLayout v-if="isMobile" />
    <DesktopLayout v-else />
  </div>
</template>
