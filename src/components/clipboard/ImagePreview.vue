<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  blob?: Blob
}>()

const imageUrl = ref('')

function revokeUrl() {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
  }
}

function updateUrl(blob?: Blob) {
  revokeUrl()
  imageUrl.value = blob ? URL.createObjectURL(blob) : ''
}

onMounted(() => {
  updateUrl(props.blob)
})

watch(() => props.blob, (newBlob) => {
  updateUrl(newBlob)
})

onUnmounted(() => {
  revokeUrl()
})
</script>

<template>
  <div class="image-preview">
    <img
      v-if="imageUrl"
      :src="imageUrl"
      alt="Clipboard image"
      class="max-w-full max-h-[250px] rounded-lg object-contain"
    />
  </div>
</template>
