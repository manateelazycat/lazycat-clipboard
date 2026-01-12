<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'

const props = defineProps<{
  blob: Blob
}>()

const imageUrl = ref('')

onMounted(() => {
  imageUrl.value = URL.createObjectURL(props.blob)
})

onUnmounted(() => {
  if (imageUrl.value) {
    URL.revokeObjectURL(imageUrl.value)
  }
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
