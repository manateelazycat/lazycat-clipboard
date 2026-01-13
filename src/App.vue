<script setup lang="ts">
import { ref, provide, computed, watch, onMounted, onUnmounted } from 'vue'
import AppLayout from '@/components/layout/AppLayout.vue'
import EditModal from '@/components/modals/EditModal.vue'
import DeleteConfirmDialog from '@/components/modals/DeleteConfirmDialog.vue'
import AddItemModal from '@/components/modals/AddItemModal.vue'
import DebugTools from '@/components/debug/DebugTools.vue'
import { useClipboardItems } from '@/composables/useClipboardItems'
import { useClipboard } from '@/composables/useClipboard'
import type { ClipboardItem } from '@/types/clipboard'
import { isTextItem } from '@/types/clipboard'

const { updateText, deleteItem, loadItems, isLoading, syncLock } = useClipboardItems()
const { lastCopyMessage, copyEventId } = useClipboard()
const showDebugTools = import.meta.env.VITE_SHOW_DEBUG_TOOLS === 'true' || import.meta.env.DEV

// Modal states
const editModalVisible = ref(false)
const deleteConfirmVisible = ref(false)
const addModalVisible = ref(false)
const currentEditItem = ref<ClipboardItem | null>(null)
const currentDeleteItem = ref<ClipboardItem | null>(null)

// Toast state
const showToast = ref(false)
const toastMessage = ref('')

// Combined modal state for keyboard shortcuts
const isModalOpen = computed(() =>
  editModalVisible.value || deleteConfirmVisible.value || addModalVisible.value
)

// 定时自动刷新，避免编辑时刷新覆盖内容
let refreshTimer: number | null = null

async function refreshIfIdle() {
  if (isModalOpen.value) return
  if (isLoading.value) return
  if (syncLock.value) return
  await loadItems({ silent: true })
}

onMounted(() => {
  refreshTimer = window.setInterval(() => {
    refreshIfIdle().catch(err => console.warn('自动刷新失败', err))
  }, 3000)
})

onUnmounted(() => {
  if (refreshTimer) {
    clearInterval(refreshTimer)
    refreshTimer = null
  }
})

// Provide modal functions to children
function showEditModal(item: ClipboardItem) {
  currentEditItem.value = item
  editModalVisible.value = true
}

function showDeleteConfirm(item: ClipboardItem) {
  currentDeleteItem.value = item
  deleteConfirmVisible.value = true
}

function showAddModal() {
  addModalVisible.value = true
}

provide('showEditModal', showEditModal)
provide('showDeleteConfirm', showDeleteConfirm)
provide('showAddModal', showAddModal)
provide('isModalOpen', isModalOpen)

// Handle edit modal events
async function handleEditSave(content: string) {
  if (currentEditItem.value && isTextItem(currentEditItem.value)) {
    await updateText(currentEditItem.value.id, content)
  }
  editModalVisible.value = false
  currentEditItem.value = null
}

async function handleEditDelete() {
  if (currentEditItem.value) {
    await deleteItem(currentEditItem.value.id)
    editModalVisible.value = false
    currentEditItem.value = null
  }
}

function handleEditClose() {
  editModalVisible.value = false
  currentEditItem.value = null
}

// Handle delete confirm events
async function handleDeleteConfirm() {
  if (currentDeleteItem.value) {
    await deleteItem(currentDeleteItem.value.id)
  }
  deleteConfirmVisible.value = false
  currentDeleteItem.value = null
  currentEditItem.value = null
}

function handleDeleteCancel() {
  deleteConfirmVisible.value = false
  currentDeleteItem.value = null
}

// Handle add modal events
function handleAddClose() {
  addModalVisible.value = false
}

// Watch for copy events to show toast
watch(copyEventId, () => {
  if (lastCopyMessage.value) {
    toastMessage.value = lastCopyMessage.value
    showToast.value = true
    setTimeout(() => {
      showToast.value = false
    }, 2000)
  }
})
</script>

<template>
  <AppLayout />

  <DebugTools v-if="showDebugTools" />

  <!-- Modals -->
  <EditModal
    :item="currentEditItem"
    :visible="editModalVisible"
    @close="handleEditClose"
    @save="handleEditSave"
    @delete="handleEditDelete"
  />

  <DeleteConfirmDialog
    :visible="deleteConfirmVisible"
    @confirm="handleDeleteConfirm"
    @cancel="handleDeleteCancel"
  />

  <AddItemModal
    :visible="addModalVisible"
    @close="handleAddClose"
  />

  <!-- Toast -->
  <Teleport to="body">
    <Transition name="toast">
      <div
        v-if="showToast"
        class="fixed inset-0 flex items-center justify-center z-50 pointer-events-none"
      >
        <div class="bg-[var(--color-apple-gray-900)]/90 text-white rounded-2xl shadow-lg px-8 py-6 flex flex-col items-center">
          <svg class="w-10 h-10 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
          <span class="text-sm font-medium">{{ toastMessage }}</span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style>
.toast-enter-active,
.toast-leave-active {
  transition: all 0.3s ease;
}

.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: scale(0.9);
}
</style>
