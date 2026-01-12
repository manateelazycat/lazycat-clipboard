import { onMounted, onUnmounted, type Ref } from 'vue'
import type { ClipboardItem } from '@/types/clipboard'

interface KeyboardShortcutConfig {
  items: Ref<ClipboardItem[]>
  selectedIndex: Ref<number>
  onNavigate: (direction: 'up' | 'down') => void
  onCopy: (index: number) => void
  onEdit: (index: number) => void
  onDelete: (index: number) => void
  onFocusInput?: () => void
  isModalOpen: Ref<boolean>
}

export function useKeyboardShortcuts(config: KeyboardShortcutConfig) {
  const {
    items,
    selectedIndex,
    onNavigate,
    onCopy,
    onEdit,
    onDelete,
    onFocusInput,
    isModalOpen
  } = config

  function handleKeyDown(e: KeyboardEvent) {
    // Don't handle if user is typing in an input or modal is open
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
      return
    }

    if (isModalOpen.value) {
      return
    }

    // Tab key - focus on input
    if (e.key === 'Tab' && !e.shiftKey && !e.ctrlKey && !e.altKey && !e.metaKey) {
      e.preventDefault()
      onFocusInput?.()
      return
    }

    // Navigation
    if (e.key === 'ArrowUp' || e.key === 'k') {
      e.preventDefault()
      onNavigate('up')
      return
    }
    if (e.key === 'ArrowDown' || e.key === 'j') {
      e.preventDefault()
      onNavigate('down')
      return
    }

    // Actions on selected item
    if (selectedIndex.value >= 0 && selectedIndex.value < items.value.length) {
      // Copy
      if (e.key === 'Enter' || (e.ctrlKey && e.key === 'c')) {
        e.preventDefault()
        onCopy(selectedIndex.value)
        return
      }
      // Edit
      if (e.key === 'e') {
        e.preventDefault()
        onEdit(selectedIndex.value)
        return
      }
      // Delete
      if (e.key === 'Delete' || e.key === 'd') {
        e.preventDefault()
        onDelete(selectedIndex.value)
        return
      }
    }
  }

  onMounted(() => {
    window.addEventListener('keydown', handleKeyDown)
  })

  onUnmounted(() => {
    window.removeEventListener('keydown', handleKeyDown)
  })
}
