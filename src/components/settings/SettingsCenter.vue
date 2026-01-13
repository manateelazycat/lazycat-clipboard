<script setup lang="ts">
import { computed } from 'vue'
import type { CopyMode } from '@/types/clipboard'
import { useClipboardItems } from '@/composables/useClipboardItems'

const { settings, updateAppSettings, loadAppSettings } = useClipboardItems()

const copyModeOptions: Array<{ label: string; value: CopyMode }> = [
  { label: '单击', value: 'single-tap' },
  { label: '双击', value: 'double-tap' }
]

const enablePin = computed({
  get: () => settings.value?.enablePin ?? true,
  set: (val: boolean) => updateAppSettings({ enablePin: val })
})

const copyMode = computed({
  get: () => settings.value?.copyMode ?? 'single-tap',
  set: (val: CopyMode) => updateAppSettings({ copyMode: val })
})

loadAppSettings()
</script>

<template>
  <div class="settings-card">
    <div class="settings-header">
      <div>
        <div class="settings-title">设置中心</div>
        <div class="settings-subtitle">调整你的使用偏好</div>
      </div>
    </div>

    <div class="settings-group">
      <div class="settings-item">
        <div>
          <div class="item-title">置顶功能</div>
          <div class="item-desc">开启后可将重要内容置顶显示</div>
        </div>
        <label class="switch">
          <input type="checkbox" v-model="enablePin">
          <span class="slider"></span>
        </label>
      </div>

      <div class="settings-item">
        <div>
          <div class="item-title">复制方式</div>
          <div class="item-desc">选择轻点或双击触发复制</div>
        </div>
        <div class="segmented">
          <button
            v-for="option in copyModeOptions"
            :key="option.value"
            :class="['segment-btn', { active: copyMode === option.value }]"
            @click="copyMode = option.value"
          >
            {{ option.label }}
          </button>
        </div>
      </div>

    </div>
  </div>
</template>

<style scoped>
.settings-card {
  background: white;
  border-radius: var(--radius-apple-lg);
  box-shadow: var(--shadow-apple);
  padding: 20px;
  border: 1px solid var(--color-apple-gray-100);
}

.settings-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}

.settings-title {
  font-size: 18px;
  font-weight: 600;
  color: var(--color-apple-gray-900);
}

.settings-subtitle {
  font-size: 13px;
  color: var(--color-apple-gray-500);
}

.settings-group {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.settings-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.item-title {
  font-size: 15px;
  font-weight: 600;
  color: var(--color-apple-gray-900);
}

.item-desc {
  font-size: 12px;
  color: var(--color-apple-gray-500);
  margin-top: 2px;
}

.switch {
  position: relative;
  display: inline-block;
  width: 44px;
  height: 24px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: var(--color-apple-gray-200);
  transition: 0.2s;
  border-radius: 24px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 18px;
  width: 18px;
  left: 3px;
  bottom: 3px;
  background-color: white;
  transition: 0.2s;
  border-radius: 50%;
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.2);
}

input:checked + .slider {
  background-color: var(--color-hermes-orange);
}

input:checked + .slider:before {
  transform: translateX(20px);
}

.segmented {
  background: var(--color-apple-gray-100);
  border-radius: 10px;
  padding: 4px;
  display: inline-flex;
  gap: 4px;
}

.segment-btn {
  border: none;
  background: transparent;
  padding: 6px 10px;
  border-radius: 8px;
  font-size: 13px;
  color: var(--color-apple-gray-600);
  cursor: pointer;
  transition: all 0.2s ease;
}

.segment-btn.active {
  background: white;
  color: var(--color-apple-gray-900);
  box-shadow: 0 1px 4px rgba(0, 0, 0, 0.08);
}
</style>
