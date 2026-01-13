import { MiniDB } from '@lazycatcloud/minidb'

// 初始化 MiniDB
const db = new MiniDB()

// 获取剪贴板项目集合
export const clipboardCollection = db.getCollection('clipboard-items')

// 导出 db 实例以便调试使用
export { db }
