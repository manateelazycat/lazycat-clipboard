<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import type { CSSProperties } from 'vue'
import ThemeToggle from '@/components/theme/ThemeToggle.vue'
import {
  lightAppHeaderRevealProgress,
  quitLightApp,
  shouldShowCustomCloseButton,
  shouldShowLightAppHeader,
  syncLightAppShell,
} from '@/services/lightAppShell'

const showHeader = shouldShowLightAppHeader()
const showButton = shouldShowCustomCloseButton()
const isClosing = ref(false)

const headerStyle = computed<CSSProperties>(() => {
  const progress = lightAppHeaderRevealProgress.value
  const offsetY = -18 * (1 - progress)

  return {
    paddingTop: '12px',
    opacity: String(progress),
    transform: `translate3d(0, ${offsetY}px, 0)`,
    willChange: 'transform, opacity'
  }
})

const iconStyle = computed(() => ({
  color: 'var(--color-apple-gray-500)',
  transform: showButton ? 'translateY(1px)' : 'none'
}))

const closeButtonStyle = computed<CSSProperties>(() => ({
  pointerEvents: lightAppHeaderRevealProgress.value > 0.2 ? 'auto' : 'none'
}))

onMounted(() => {
  if (!showHeader) return

  syncLightAppShell()
})

async function handleClose() {
  if (!showButton || isClosing.value) return

  isClosing.value = true
  try {
    await quitLightApp()
  } catch (error) {
    console.warn('关闭轻应用失败', error)
  } finally {
    isClosing.value = false
  }
}
</script>

<template>
  <div
    v-if="showHeader"
    class="pointer-events-none fixed left-0 right-0 top-0 z-40 flex items-center justify-between px-4"
    :style="headerStyle"
  >
    <div
      class="flex h-10 min-w-0 flex-1 items-center truncate pr-3 text-xl font-semibold leading-none tracking-tight text-[var(--color-apple-gray-900)]"
      aria-label="应用标题"
    >
      懒猫剪切板
    </div>

    <div class="pointer-events-auto flex shrink-0 items-center gap-1.5">
      <ThemeToggle />
      <button
        v-if="showButton"
        type="button"
        class="p-2 rounded-full leading-none hover:opacity-70 active:opacity-50 transition-colors disabled:cursor-not-allowed disabled:opacity-60"
        :style="closeButtonStyle"
        :disabled="isClosing"
        aria-label="关闭应用"
        title="关闭应用"
        @click="handleClose"
      >
        <svg
          class="block w-6 h-6"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="1.5"
          :style="iconStyle"
          aria-hidden="true"
        >
          <circle cx="12" cy="12" r="9" />
          <path d="M15 9 9 15M9 9l6 6" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
      </button>
    </div>
  </div>
</template>
