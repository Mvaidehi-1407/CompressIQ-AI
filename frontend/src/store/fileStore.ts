import { create } from 'zustand'
import api from '../lib/api'

export interface FileRecord {
  id: string
  original_filename: string
  file_type: string
  mime_type: string
  original_size: number
  compressed_size: number
  sha256_hash: string
  is_duplicate: boolean
  duplicate_of: string | null
  is_compressed: boolean
  is_protected: boolean
  is_already_optimized: boolean
  compression_mode: string | null
  compression_ratio: number
  uploaded_at: string
  compressed_at: string | null
  protected_at: string | null
}

interface FileState {
  files: FileRecord[]
  total: number
  loading: boolean
  uploading: boolean
  compressing: string[]
  protecting: string[]
  fetchFiles: (params?: Record<string, string>) => Promise<void>
  uploadFile: (file: File) => Promise<FileRecord>
  deleteFile: (id: string) => Promise<void>
  compressFile: (id: string, mode: string) => Promise<FileRecord>
  protectFile: (id: string) => Promise<FileRecord>
  unprotectFile: (id: string) => Promise<FileRecord>
  downloadFile: (id: string, version?: string, filename?: string) => Promise<void>
  downloadCompressed: (id: string, filename: string) => Promise<void>
  downloadRestored: (id: string, filename: string, protectedFile?: boolean) => Promise<void>
  downloadCompressedBulk: (ids?: string[]) => Promise<void>
  downloadRestoredBulk: (ids?: string[]) => Promise<void>
  restoreProtected: (id: string, filename: string) => Promise<void>
}

function filenameFromDisposition(disposition?: string) {
  if (!disposition) return null
  const utf8 = disposition.match(/filename\*=UTF-8''([^;]+)/i)
  if (utf8?.[1]) return decodeURIComponent(utf8[1])
  const plain = disposition.match(/filename="?([^"]+)"?/i)
  return plain?.[1] ?? null
}

function saveBlob(data: Blob, filename: string) {
  const url = URL.createObjectURL(data)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

export const useFileStore = create<FileState>((set, get) => ({
  files: [],
  total: 0,
  loading: false,
  uploading: false,
  compressing: [],
  protecting: [],

  fetchFiles: async (params = {}) => {
    set({ loading: true })
    try {
      const res = await api.get('/api/files/', { params })
      set({ files: res.data.files, total: res.data.total, loading: false })
    } catch {
      set({ loading: false })
    }
  },

  uploadFile: async (file: File) => {
    set({ uploading: true })
    const form = new FormData()
    form.append('file', file)
    const res = await api.post('/api/files/upload', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
    const newFile: FileRecord = res.data.file
    set((s) => ({ files: [newFile, ...s.files], total: s.total + 1, uploading: false }))
    return newFile
  },

  deleteFile: async (id: string) => {
    await api.delete(`/api/files/${id}`)
    set((s) => ({ files: s.files.filter((f) => f.id !== id), total: s.total - 1 }))
  },

  compressFile: async (id: string, mode: string) => {
    set((s) => ({ compressing: [...s.compressing, id] }))
    const res = await api.post(`/api/compress/${id}`, { mode })
    const updated: FileRecord = res.data.file
    set((s) => ({
      files: s.files.map((f) => (f.id === id ? updated : f)),
      compressing: s.compressing.filter((c) => c !== id),
    }))
    return updated
  },

  protectFile: async (id: string) => {
    set((s) => ({ protecting: [...s.protecting, id] }))
    const res = await api.post(`/api/protect/${id}`)
    const updated: FileRecord = res.data.file
    set((s) => ({
      files: s.files.map((f) => (f.id === id ? updated : f)),
      protecting: s.protecting.filter((p) => p !== id),
    }))
    return updated
  },

  unprotectFile: async (id: string) => {
    const res = await api.delete(`/api/protect/${id}/unprotect`)
    const updated: FileRecord = res.data.file
    set((s) => ({ files: s.files.map((f) => (f.id === id ? updated : f)) }))
    return updated
  },

  downloadFile: async (id: string, version = 'original', filename = 'download') => {
    const res = await api.get(`/api/files/${id}/download`, {
      params: { version },
      responseType: 'blob',
    })
    saveBlob(res.data, filenameFromDisposition(res.headers['content-disposition']) ?? filename)
  },

  downloadCompressed: async (id: string, filename: string) => {
    const res = await api.get(`/api/files/${id}/download/compressed`, { responseType: 'blob' })
    saveBlob(res.data, filenameFromDisposition(res.headers['content-disposition']) ?? filename)
  },

  downloadRestored: async (id: string, filename: string, protectedFile = false) => {
    const endpoint = protectedFile ? `/api/protect/${id}/restore` : `/api/files/${id}/download/restored`
    const res = await api.get(endpoint, { responseType: 'blob' })
    saveBlob(res.data, filenameFromDisposition(res.headers['content-disposition']) ?? `restored_${filename}`)
  },

  downloadCompressedBulk: async (ids = []) => {
    const res = await api.post('/api/files/download/compressed/bulk', { file_ids: ids }, { responseType: 'blob' })
    saveBlob(res.data, filenameFromDisposition(res.headers['content-disposition']) ?? 'compressed_files.zip')
  },

  downloadRestoredBulk: async (ids = []) => {
    const res = await api.post('/api/files/download/restored/bulk', { file_ids: ids }, { responseType: 'blob' })
    saveBlob(res.data, filenameFromDisposition(res.headers['content-disposition']) ?? 'restored_files.zip')
  },

  restoreProtected: async (id: string, filename: string) => {
    const res = await api.get(`/api/protect/${id}/restore`, { responseType: 'blob' })
    saveBlob(res.data, filenameFromDisposition(res.headers['content-disposition']) ?? `restored_${filename}`)
  },
}))
