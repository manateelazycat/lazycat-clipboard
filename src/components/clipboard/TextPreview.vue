<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue'

const props = defineProps<{
  content: string
}>()

const isExpanded = ref(false)
const textRef = ref<HTMLElement | null>(null)
const isTruncated = ref(false)

function checkTruncation() {
  nextTick(() => {
    if (textRef.value) {
      isTruncated.value = textRef.value.scrollHeight > textRef.value.clientHeight
    }
  })
}

onMounted(() => {
  checkTruncation()
})

function toggleExpand(e: Event) {
  e.stopPropagation()
  isExpanded.value = !isExpanded.value
}
</script>

<template>
  <div class="text-preview">
    <p
      ref="textRef"
      class="text-[var(--color-apple-gray-900)] whitespace-pre-wrap break-words"
      :class="{ 'line-clamp-5 md:line-clamp-3': !isExpanded }"
    >
      {{ content }}
    </p>
    <button
      v-if="isTruncated || isExpanded"
      @click="toggleExpand"
      class="mt-2 p-1 rounded hover:bg-[var(--color-apple-gray-100)] transition-colors"
      :title="isExpanded ? '收起' : '展开'"
    >
      <!-- Down arrow (expand) -->
      <svg
        v-if="!isExpanded"
        class="w-4 h-4 text-[var(--color-apple-gray-500)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
      </svg>
      <!-- Up arrow (collapse) -->
      <svg
        v-else
        class="w-4 h-4 text-[var(--color-apple-gray-500)]"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
      </svg>
    </button>
  </div>
</template>
