import { ref } from 'vue'
import { AppCommon } from '@lazycatcloud/sdk/dist/extentions'
import LzcApp from '@lazycatcloud/sdk/dist/extentions/base'

const IOS_WEB_SHELL_UA = 'Lazycat_103'
const ANDROID_WEB_SHELL_UA = 'Lazycat_101'
const LZC_NAV_SCHEME_META = 'lzcapp-navigation-bar-scheme'
const LZC_NAV_SCHEME_STATUS_BAR_ONLY = 'statusBarOnly'
const CLOSE_BUTTON_FN = 'SetCloseBtnShowStatus'
const CLOSE_BUTTON_RETRY_DELAYS = [120, 300, 700, 1400]
const CLOSE_BUTTON_FORCE_HIDE_RETRY_DELAYS = [0, 16, 80, 180, 360, 720, 1200]
const CLOSE_BUTTON_VISIBLE_HEARTBEAT_MS = 1200
const LIGHT_APP_HEADER_FULL_PADDING_PX = 64
const LIGHT_APP_HEADER_COMPACT_PADDING_PX = 12
const LIGHT_APP_HEADER_HIDE_DISTANCE_PX = 48

type MaybePromise<T> = T | Promise<T>

type AppCommonCompat = typeof AppCommon & {
  QuitLightApp?: () => MaybePromise<void>
  SetCloseBtnShowStatus?: (show: boolean) => MaybePromise<void>
}

type LightAppBridge = {
  QuitLightApp?: () => MaybePromise<void>
  SetCloseBtnShowStatus?: (show: boolean) => MaybePromise<void>
}

type NativeMessageHandler = {
  postMessage?: (payload: unknown) => unknown
}

type LightAppWindow = Window & {
  sdk?: {
    call?: (name: string, options?: unknown) => Promise<unknown> | unknown
  }
  webkit?: {
    messageHandlers?: Record<string, NativeMessageHandler | undefined>
  }
}

const appCommonCompat = AppCommon as AppCommonCompat

let closeButtonRetryTimers: number[] = []
let closeButtonForceHideTimers: number[] = []
let closeButtonForceHideHeartbeatId: number | null = null
let latestCloseButtonVisible: boolean | null = null
let closeButtonHideGuardsInstalled = false

export const lightAppHeaderRevealProgress = ref(1)

export function isIosLightApp() {
  if (typeof window === 'undefined') return false
  return navigator.userAgent.includes(IOS_WEB_SHELL_UA)
}

export function isAndroidLightApp() {
  if (typeof window === 'undefined') return false
  return navigator.userAgent.includes(ANDROID_WEB_SHELL_UA)
}

export function shouldShowCustomCloseButton() {
  return isIosLightApp()
}

export function shouldShowLightAppHeader() {
  return isIosLightApp() || isAndroidLightApp()
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

export function syncLightAppHeaderByScroll(scrollTop: number) {
  if (!shouldShowLightAppHeader()) {
    lightAppHeaderRevealProgress.value = 1
    return
  }

  if (scrollTop <= 0) {
    lightAppHeaderRevealProgress.value = 1
    return
  }

  const nextProgress = 1 - clamp(scrollTop, 0, LIGHT_APP_HEADER_HIDE_DISTANCE_PX) / LIGHT_APP_HEADER_HIDE_DISTANCE_PX
  lightAppHeaderRevealProgress.value = Math.round(nextProgress * 1000) / 1000
}

export function resetLightAppHeaderByScroll() {
  lightAppHeaderRevealProgress.value = 1
}

export function getLightAppTopPadding() {
  if (!shouldShowLightAppHeader()) return undefined

  const dynamicPaddingPx = LIGHT_APP_HEADER_COMPACT_PADDING_PX +
    (LIGHT_APP_HEADER_FULL_PADDING_PX - LIGHT_APP_HEADER_COMPACT_PADDING_PX) * lightAppHeaderRevealProgress.value

  return `calc(env(safe-area-inset-top, 0px) + ${Math.round(dynamicPaddingPx * 100) / 100}px)`
}

function upsertMeta(name: string, content: string) {
  if (typeof document === 'undefined') return

  let element = document.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute('name', name)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

function clearCloseButtonRetryTimers() {
  while (closeButtonRetryTimers.length > 0) {
    const timerId = closeButtonRetryTimers.pop()
    if (timerId !== undefined) {
      clearTimeout(timerId)
    }
  }
}

function clearCloseButtonForceHideTimers() {
  while (closeButtonForceHideTimers.length > 0) {
    const timerId = closeButtonForceHideTimers.pop()
    if (timerId !== undefined) {
      clearTimeout(timerId)
    }
  }
}

function stopCloseButtonForceHideHeartbeat() {
  if (closeButtonForceHideHeartbeatId === null) return
  clearInterval(closeButtonForceHideHeartbeatId)
  closeButtonForceHideHeartbeatId = null
}

async function getLightAppBridge() {
  if (!isIosLightApp()) return null

  try {
    return await LzcApp.useNativeAsync() as LightAppBridge
  } catch (error) {
    console.warn('获取轻应用原生桥接失败', error)
    return null
  }
}

async function invokeCloseButtonWithBridge(visible: boolean) {
  if (typeof appCommonCompat.SetCloseBtnShowStatus === 'function') {
    try {
      await appCommonCompat.SetCloseBtnShowStatus(visible)
      return true
    } catch (error) {
      console.debug('[lightAppShell] AppCommon.SetCloseBtnShowStatus failed:', error)
    }
  }

  const bridge = await getLightAppBridge()
  if (typeof bridge?.SetCloseBtnShowStatus === 'function') {
    try {
      await bridge.SetCloseBtnShowStatus(visible)
      return true
    } catch (error) {
      console.debug('[lightAppShell] bridge.SetCloseBtnShowStatus failed:', error)
    }
  }

  return false
}

function invokeCloseButton(visible: boolean) {
  if (typeof window === 'undefined') return false

  const win = window as LightAppWindow
  const injectedFn = (globalThis as typeof globalThis & {
    SetCloseBtnShowStatus?: (nextVisible: boolean) => unknown
  })[CLOSE_BUTTON_FN]

  if (typeof injectedFn === 'function') {
    try {
      injectedFn(visible)
      return true
    } catch (error) {
      console.debug('[lightAppShell] SetCloseBtnShowStatus(function) failed:', error)
    }
  }

  const handler = win.webkit?.messageHandlers?.[CLOSE_BUTTON_FN]
  if (handler?.postMessage) {
    try {
      handler.postMessage(visible)
      return true
    } catch (error) {
      console.debug('[lightAppShell] SetCloseBtnShowStatus(handler-bool) failed:', error)
    }

    try {
      handler.postMessage({ params: [visible] })
      return true
    } catch (error) {
      console.debug('[lightAppShell] SetCloseBtnShowStatus(handler-object) failed:', error)
    }
  }

  void invokeCloseButtonWithBridge(visible)
  return false
}

function scheduleForceHideCloseButton() {
  if (typeof window === 'undefined') return

  clearCloseButtonForceHideTimers()

  for (const delay of CLOSE_BUTTON_FORCE_HIDE_RETRY_DELAYS) {
    const timerId = window.setTimeout(() => {
      if (typeof document !== 'undefined' && document.hidden) return
      void hideNativeCloseButton()
    }, delay)
    closeButtonForceHideTimers.push(timerId)
  }

  if (typeof window.requestAnimationFrame === 'function') {
    const frameTimerId = window.setTimeout(() => {
      window.requestAnimationFrame(() => {
        if (typeof document !== 'undefined' && document.hidden) return
        void hideNativeCloseButton()

        window.requestAnimationFrame(() => {
          if (typeof document !== 'undefined' && document.hidden) return
          void hideNativeCloseButton()
        })
      })
    }, 0)
    closeButtonForceHideTimers.push(frameTimerId)
  }
}

function startCloseButtonForceHideHeartbeat() {
  if (typeof window === 'undefined') return
  if (!isIosLightApp()) return
  if (typeof document !== 'undefined' && document.hidden) return
  if (closeButtonForceHideHeartbeatId !== null) return

  closeButtonForceHideHeartbeatId = window.setInterval(() => {
    if (typeof document !== 'undefined' && document.hidden) return
    scheduleForceHideCloseButton()
  }, CLOSE_BUTTON_VISIBLE_HEARTBEAT_MS)
}

function forceHideCloseButtonWhenVisible() {
  if (!isIosLightApp()) return
  if (typeof document !== 'undefined' && document.hidden) return
  startCloseButtonForceHideHeartbeat()
  scheduleForceHideCloseButton()
}

function installCloseButtonHideGuards() {
  if (closeButtonHideGuardsInstalled) return
  if (!isIosLightApp()) return
  if (typeof window === 'undefined' || typeof document === 'undefined') return

  const handleVisibilityChange = () => {
    if (document.hidden) {
      stopCloseButtonForceHideHeartbeat()
      return
    }

    forceHideCloseButtonWhenVisible()
    startCloseButtonForceHideHeartbeat()
  }

  window.addEventListener('focus', forceHideCloseButtonWhenVisible)
  window.addEventListener('pageshow', forceHideCloseButtonWhenVisible)
  window.addEventListener('load', forceHideCloseButtonWhenVisible)
  document.addEventListener('visibilitychange', handleVisibilityChange)

  if (!document.hidden) {
    startCloseButtonForceHideHeartbeat()
  }

  closeButtonHideGuardsInstalled = true
}

export function applyLzcStatusBarOnlyNavigationBar() {
  upsertMeta(LZC_NAV_SCHEME_META, LZC_NAV_SCHEME_STATUS_BAR_ONLY)
}

export async function setNativeCloseButtonVisible(visible: boolean) {
  if (!isIosLightApp()) return

  latestCloseButtonVisible = visible
  clearCloseButtonRetryTimers()

  if (invokeCloseButton(visible)) {
    return
  }

  if (await invokeCloseButtonWithBridge(visible)) {
    return
  }

  if (typeof window === 'undefined') return

  for (const delay of CLOSE_BUTTON_RETRY_DELAYS) {
    const timerId = window.setTimeout(() => {
      if (latestCloseButtonVisible !== visible) return
      void setNativeCloseButtonVisible(visible)
    }, delay)
    closeButtonRetryTimers.push(timerId)
  }
}

export async function hideNativeCloseButton() {
  await setNativeCloseButtonVisible(false)
}

export function syncLightAppShell() {
  if (!shouldShowLightAppHeader()) return
  applyLzcStatusBarOnlyNavigationBar()
  resetLightAppHeaderByScroll()

  if (!isIosLightApp()) return

  installCloseButtonHideGuards()
  forceHideCloseButtonWhenVisible()
}

export async function quitLightApp() {
  if (!isIosLightApp()) return

  if (typeof appCommonCompat.QuitLightApp === 'function') {
    try {
      await appCommonCompat.QuitLightApp()
      return
    } catch (error) {
      console.warn('[lightAppShell] AppCommon.QuitLightApp failed:', error)
    }
  }

  const win = window as LightAppWindow
  if (typeof win.sdk?.call === 'function') {
    try {
      await win.sdk.call('AppCommon.QuitLightApp')
      return
    } catch (error) {
      console.warn('[lightAppShell] sdk.call(AppCommon.QuitLightApp) failed:', error)
    }

    try {
      await win.sdk.call('QuitLightApp')
      return
    } catch (error) {
      console.warn('[lightAppShell] sdk.call(QuitLightApp) failed:', error)
    }
  }

  const handler = win.webkit?.messageHandlers?.QuitLightApp
  if (handler?.postMessage) {
    try {
      handler.postMessage({ params: [] })
      return
    } catch (error) {
      console.warn('[lightAppShell] webkit.messageHandlers.QuitLightApp failed:', error)
    }
  }

  const bridge = await getLightAppBridge()
  if (typeof bridge?.QuitLightApp === 'function') {
    try {
      await bridge.QuitLightApp()
      return
    } catch (error) {
      console.warn('[lightAppShell] bridge.QuitLightApp failed:', error)
    }
  }

  console.warn('当前宿主未提供 QuitLightApp，无法关闭轻应用')
}
