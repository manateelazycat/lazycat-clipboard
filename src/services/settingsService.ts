import type { AppSettings } from '@/types/clipboard'
import { db } from './db'

const SETTINGS_COLLECTION = 'app-settings'
const SETTINGS_ID = 'app-settings'

const collection = db.getCollection(SETTINGS_COLLECTION)

const defaultSettings: AppSettings = {
  enablePin: true,
  copyMode: 'single-tap'
}

export async function loadSettings(): Promise<AppSettings> {
  try {
    const docs = await collection.find({ id: SETTINGS_ID }).fetch()
    if (docs && docs.length > 0) {
      const latest = docs.sort((a: any, b: any) => String(b._id || '').localeCompare(String(a._id || '')))[0]
      return normalizeSettings(latest as Partial<AppSettings>)
    }
  } catch (error) {
    console.warn('加载设置失败，使用默认值', error)
  }
  return { ...defaultSettings }
}

export async function saveSettings(settings: Partial<AppSettings>): Promise<void> {
  const merged = normalizeSettings(settings)
  try {
    const existing = await collection.find({ id: SETTINGS_ID }).fetch()
    const base = existing && existing.length > 0 ? existing[0] : undefined
    await collection.upsert(
      {
        ...(base || {}),
        ...merged,
        id: SETTINGS_ID
      },
      base
    )
  } catch (error) {
    console.error('保存设置失败', error)
    throw error
  }
}

function normalizeSettings(data: Partial<AppSettings>): AppSettings {
  return {
    enablePin: typeof data.enablePin === 'boolean' ? data.enablePin : defaultSettings.enablePin,
    copyMode: data.copyMode === 'double-tap' ? 'double-tap' : defaultSettings.copyMode
  }
}
