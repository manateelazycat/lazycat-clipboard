<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import DesktopLayout from './DesktopLayout.vue'
import MobileLayout from './MobileLayout.vue'
import SettingsCenter from '@/components/settings/SettingsCenter.vue'

const windowWidth = ref(typeof window !== 'undefined' ? window.innerWidth : 1024)
const showSettings = ref(false)

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
    <MobileLayout v-if="isMobile" @open-settings="showSettings = true" />
    <DesktopLayout v-else @open-settings="showSettings = true" />

    <Teleport to="body">
      <Transition name="slide-up">
        <div
          v-if="showSettings"
          class="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          @click.self="showSettings = false"
        >
          <div class="w-full max-w-xl">
            <SettingsCenter />
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<style scoped>
.slide-up-enter-active,
.slide-up-leave-active {
  transition: transform 0.25s ease, opacity 0.25s ease;
}

.slide-up-enter-from {
  transform: translateY(12px);
  opacity: 0;
}

.slide-up-leave-to {
  transform: translateY(12px);
  opacity: 0;
}
</style>
