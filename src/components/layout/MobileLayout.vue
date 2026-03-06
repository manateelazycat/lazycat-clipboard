<script setup lang="ts">
import { computed, ref, inject, onMounted, onUnmounted } from 'vue'
import ClipboardList from '@/components/clipboard/ClipboardList.vue'
import FloatingAddButton from '@/components/input/FloatingAddButton.vue'
import {
  getLightAppTopPadding,
  resetLightAppHeaderByScroll,
  shouldShowLightAppHeader,
  syncLightAppHeaderByScroll,
} from '@/services/lightAppShell'

const scrollContainerRef = ref<HTMLElement | null>(null)
const registerScrollToTop = inject<(fn: () => void) => void>('registerScrollToTop')
let latestScrollTop = 0
let scrollFrameId: number | null = null

const containerStyle = computed(() => {
  const paddingTop = getLightAppTopPadding()
  if (!paddingTop) return undefined

  return { paddingTop }
})

function flushHeaderByScroll() {
  scrollFrameId = null
  syncLightAppHeaderByScroll(latestScrollTop)
}

function scheduleHeaderSync(scrollTop: number) {
  if (!shouldShowLightAppHeader()) return

  latestScrollTop = scrollTop
  if (scrollFrameId !== null) return

  scrollFrameId = window.requestAnimationFrame(flushHeaderByScroll)
}

function handleScroll(event: Event) {
  const target = event.target as HTMLElement
  scheduleHeaderSync(target.scrollTop)
}

onMounted(() => {
  if (registerScrollToTop) {
    registerScrollToTop(() => {
      scrollContainerRef.value?.scrollTo({ top: 0, behavior: 'smooth' })
    })
  }

  scheduleHeaderSync(scrollContainerRef.value?.scrollTop ?? 0)
})

onUnmounted(() => {
  if (scrollFrameId !== null) {
    cancelAnimationFrame(scrollFrameId)
    scrollFrameId = null
  }
  resetLightAppHeaderByScroll()
})
</script>

<template>
  <div
    ref="scrollContainerRef"
    :style="containerStyle"
    class="h-screen flex flex-col pb-24 px-4 pt-4 overflow-y-auto hide-scrollbar relative transition-[padding-top] duration-150 ease-out"
    @scroll.passive="handleScroll"
  >
    <ClipboardList ref="clipboardListRef" class="flex-1" />
    <FloatingAddButton />
  </div>
</template>

<style scoped>
</style>
