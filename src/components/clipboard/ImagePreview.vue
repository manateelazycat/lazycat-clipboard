<script setup lang="ts">
import { ref, onMounted, onUnmounted, watch } from 'vue'

const props = defineProps<{
  blob?: Blob
  large?: boolean
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
      :class="[
        'max-w-full rounded-lg object-contain select-none',
        props.large ? 'max-h-[calc(66.666vh-10rem)] md:max-h-full' : 'max-h-[250px]'
      ]"
      draggable="false"
    />
  </div>
</template>

<style scoped>
img {
  -webkit-touch-callout: none;
  -webkit-user-drag: none;
  pointer-events: none;
}
</style>
