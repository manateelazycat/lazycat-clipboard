import { computed, ref } from 'vue'

export type ThemeMode = 'light' | 'dark'

const THEME_STORAGE_KEY = 'lazycat-clipboard-theme'

function getStoredTheme(): ThemeMode {
  if (typeof window === 'undefined') return 'light'

  try {
    return window.localStorage.getItem(THEME_STORAGE_KEY) === 'dark' ? 'dark' : 'light'
  } catch {
    return 'light'
  }
}

const theme = ref<ThemeMode>(getStoredTheme())

function applyTheme(nextTheme: ThemeMode) {
  if (typeof document === 'undefined') return

  document.documentElement.dataset.theme = nextTheme
  document.documentElement.style.colorScheme = nextTheme

  const themeColor = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]')
  themeColor?.setAttribute('content', nextTheme === 'dark' ? '#171719' : '#f5f5f7')
}

export function initializeTheme() {
  applyTheme(theme.value)
}

export function useTheme() {
  const isDark = computed(() => theme.value === 'dark')

  function setTheme(nextTheme: ThemeMode) {
    theme.value = nextTheme
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, nextTheme)
    } catch {
      // Some embedded WebViews may disable local storage; the active session still switches.
    }
    applyTheme(nextTheme)
  }

  return {
    theme,
    isDark,
    setTheme
  }
}
