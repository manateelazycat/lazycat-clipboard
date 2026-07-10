<script setup lang="ts">
import type { ThemeMode } from '@/composables/useTheme'
import { useTheme } from '@/composables/useTheme'

defineProps<{
  compact?: boolean
}>()

const { theme, setTheme } = useTheme()

const options: Array<{ value: ThemeMode; label: string }> = [
  { value: 'light', label: '切换到浅色模式' },
  { value: 'dark', label: '切换到暗黑模式' }
]
</script>

<template>
  <div :class="['theme-toggle', { compact }]" role="group" aria-label="主题模式">
    <button
      v-for="option in options"
      :key="option.value"
      type="button"
      class="theme-toggle-button"
      :class="{ active: theme === option.value }"
      :aria-pressed="theme === option.value"
      :aria-label="option.label"
      :title="option.label"
      @click="setTheme(option.value)"
    >
      <svg
        v-if="option.value === 'light'"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="3.75" />
        <path d="M12 2.75v2M12 19.25v2M4.75 12h-2M21.25 12h-2M5.46 5.46 4.05 4.05M19.95 19.95l-1.41-1.41M18.54 5.46l1.41-1.41M4.05 19.95l1.41-1.41" />
      </svg>
      <svg
        v-else
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M20.25 15.2A8.7 8.7 0 0 1 8.8 3.75 8.7 8.7 0 1 0 20.25 15.2Z" />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.theme-toggle {
  display: inline-grid;
  grid-template-columns: repeat(2, 25px);
  flex: none;
  width: 54px;
  height: 29px;
  padding: 2px;
  border: 1px solid color-mix(in srgb, var(--color-apple-gray-900) 7%, transparent);
  border-radius: 15px;
  background: color-mix(in srgb, var(--color-apple-gray-900) 4%, transparent);
}

.theme-toggle-button {
  display: flex;
  width: 25px;
  height: 23px;
  align-items: center;
  justify-content: center;
  border: 0;
  border-radius: 12px;
  color: var(--color-apple-gray-500);
  background: transparent;
  cursor: pointer;
  transition: color 0.18s ease, background-color 0.18s ease, box-shadow 0.18s ease;
}

.theme-toggle-button.active {
  color: var(--color-apple-gray-900);
  background: var(--color-surface);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
}

.theme-toggle-button:first-child.active {
  color: #d97706;
}

.theme-toggle-button svg {
  width: 15px;
  height: 15px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.theme-toggle.compact {
  grid-template-columns: repeat(2, 22px);
  width: 48px;
  height: 26px;
}

.theme-toggle.compact .theme-toggle-button {
  width: 22px;
  height: 20px;
  border-radius: 10px;
}

.theme-toggle.compact .theme-toggle-button svg {
  width: 13px;
  height: 13px;
}
</style>
