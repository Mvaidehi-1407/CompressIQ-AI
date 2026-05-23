import { useState, useCallback, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFileStore, FileRecord } from '../store/fileStore'
import DuplicateCleanupModal, { DuplicateGroup } from '../components/DuplicateCleanupModal'
import { Upload, X, CheckCircle, AlertTriangle, Copy, FileText, Image, Video, Archive, Trash2, Download } from 'lucide-react'

const ACCEPTED = '.jpg,.jpeg,.png,.webp,.mp4,.mov,.avi,.pdf,.docx,.txt,.zip'

function fmt(bytes: number) {
  if (!bytes) return '0 B'
  const k = 1024, s = ['B','KB','MB','GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k,i)).toFixed(1)} ${s[i]}`
}

const typeIcon: Record<string,any> = { image: Image, video: Video, document: FileText, archive: Archive }
const typeColor: Record<string,string> = { image:'text-cyan-400', video:'text-violet-400', document:'text-blue-400', archive:'text-orange-400' }

function buildDuplicateGroups(records: FileRecord[]) {
  const byId = new Map(records.map(file => [file.id, file]))
  const groups = new Map<string, DuplicateGroup>()

  records.filter(file => file.is_duplicate).forEach(file => {
    const original = (file.duplicate_of && byId.get(file.duplicate_of))
      || records.find(candidate => !candidate.is_duplicate && candidate.sha256_hash === file.sha256_hash)
    if (!original) return
    const existing = groups.get(original.id) ?? { original, duplicates: [] }
    existing.duplicates.push(file)
    groups.set(original.id, existing)
  })

  return Array.from(groups.values()).filter(group => group.duplicates.length > 0)
}

interface UploadItem {
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  result?: FileRecord
  error?: string
  progress: number
}

export default function UploadCenter() {
  const [items, setItems]     = useState<UploadItem[]>([])
  const [dragging, setDragging] = useState(false)
  const [duplicateGroups, setDuplicateGroups] = useState<DuplicateGroup[]>([])
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false)
  const [deletingDuplicates, setDeletingDuplicates] = useState(false)
  const [cleanupSuccess, setCleanupSuccess] = useState<{ preserved: number; deleted: number; recovered: number } | null>(null)
  const fileInputRef            = useRef<HTMLInputElement>(null)
  const { uploadFile, deleteFile, downloadFile, fetchFiles } = useFileStore()

  const addFiles = (fileList: FileList | null) => {
    if (!fileList) return
    const newItems: UploadItem[] = Array.from(fileList).map(f => ({ file: f, status: 'pending', progress: 0 }))
    setItems(prev => [...prev, ...newItems])
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault(); setDragging(false)
    addFiles(e.dataTransfer.files)
  }, [])

  const uploadAll = async () => {
    const pending = items.filter(i => i.status === 'pending')
    for (const item of pending) {
      setItems(prev => prev.map(i => i.file === item.file ? { ...i, status: 'uploading', progress: 30 } : i))
      try {
        const result = await uploadFile(item.file)
        setItems(prev => prev.map(i => i.file === item.file ? { ...i, status: 'done', result, progress: 100 } : i))
        await fetchFiles()
        if (result.is_duplicate) {
          const groups = buildDuplicateGroups(useFileStore.getState().files)
          if (groups.length > 0) {
            setDuplicateGroups(groups)
            setCleanupSuccess(null)
            setDuplicateModalOpen(true)
          }
        }
      } catch (e: any) {
        const error = e?.response?.data?.error ?? 'Upload failed'
        setItems(prev => prev.map(i => i.file === item.file ? { ...i, status: 'error', error, progress: 0 } : i))
      }
    }
  }

  const removeItem = (idx: number) => setItems(prev => prev.filter((_, i) => i !== idx))
  const clearDone  = () => setItems(prev => prev.filter(i => i.status !== 'done'))

  const allFiles = useFileStore(s => s.files)

  const keepAllDuplicates = () => {
    setDuplicateModalOpen(false)
    setDuplicateGroups([])
    setCleanupSuccess(null)
  }

  const deleteAllDuplicates = async () => {
    const duplicateIds = duplicateGroups.flatMap(group => group.duplicates.map(file => file.id))
    const recovered = duplicateGroups.reduce((sum, group) => sum + group.duplicates.reduce((inner, file) => inner + file.original_size, 0), 0)
    setDeletingDuplicates(true)
    try {
      for (const id of duplicateIds) {
        await deleteFile(id)
      }
      await fetchFiles()
      setCleanupSuccess({
        preserved: duplicateGroups.length,
        deleted: duplicateIds.length,
        recovered,
      })
    } finally {
      setDeletingDuplicates(false)
    }
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity:0, y:-16 }} animate={{ opacity:1, y:0 }}>
        <h1 className="text-3xl font-black text-slate-100">Upload Center</h1>
        <p className="text-slate-400 mt-1">Drag & drop files for instant analysis, duplicate detection, and compression.</p>
      </motion.div>

      {/* Drop Zone */}
      <motion.div initial={{ opacity:0, y:16 }} animate={{ opacity:1, y:0 }} transition={{ delay:0.1 }}>
        <div
          className={`drop-zone p-16 flex flex-col items-center justify-center text-center cursor-pointer select-none ${dragging ? 'drag-active' : ''}`}
          onDragOver={e => { e.preventDefault(); setDragging(true) }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
        >
          <input ref={fileInputRef} type="file" multiple accept={ACCEPTED} className="hidden" onChange={e => addFiles(e.target.files)} />
          <motion.div animate={dragging ? { scale:1.1 } : { scale:1 }} transition={{ type:'spring', stiffness:300 }}>
            <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-5" style={{ background:'linear-gradient(135deg,rgba(37,99,235,0.2),rgba(124,58,237,0.2))', border:'1px solid rgba(37,99,235,0.3)' }}>
              <Upload size={36} className="text-blue-400" />
            </div>
          </motion.div>
          <h3 className="text-xl font-bold text-slate-200 mb-2">{dragging ? 'Release to upload' : 'Drop files here'}</h3>
          <p className="text-slate-500 text-sm mb-4">or click to browse your files</p>
          <div className="flex flex-wrap justify-center gap-2 text-xs text-slate-600">
            {['JPG/PNG/WEBP','MP4/MOV/AVI','PDF/DOCX/TXT','ZIP'].map(t => (
              <span key={t} className="px-2.5 py-1 rounded-lg glass">{t}</span>
            ))}
          </div>
          <p className="text-slate-600 text-xs mt-3">Maximum 100MB per file</p>
        </div>
      </motion.div>

      {/* Upload Queue */}
      <AnimatePresence>
        {items.length > 0 && (
          <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0 }}>
            <div className="flex items-center justify-between mb-3">
              <h2 className="section-header">Upload Queue ({items.length})</h2>
              <div className="flex gap-2">
                <button onClick={clearDone} className="btn-secondary text-xs py-1.5 px-3">Clear Done</button>
                <button onClick={uploadAll} disabled={!items.some(i=>i.status==='pending')} className="btn-primary text-xs py-1.5 px-4">
                  <Upload size={13}/> Upload All
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {items.map((item, idx) => {
                const Icon = typeIcon[item.result?.file_type ?? ''] ?? FileText
                return (
                  <motion.div key={idx} initial={{ opacity:0, x:-12 }} animate={{ opacity:1, x:0 }} exit={{ opacity:0 }} className="card py-3 px-4">
                    <div className="flex items-center gap-4">
                      <div className="w-9 h-9 rounded-xl glass flex items-center justify-center flex-shrink-0">
                        <Icon size={16} className={typeColor[item.result?.file_type??''] ?? 'text-blue-400'} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-slate-200 truncate">{item.file.name}</span>
                          <span className="text-xs text-slate-600 flex-shrink-0">{fmt(item.file.size)}</span>
                        </div>
                        {item.status==='uploading' && (
                          <div className="progress-bar">
                            <motion.div className="progress-fill" style={{ background:'linear-gradient(90deg,#2563eb,#7c3aed)' }} initial={{ width:0 }} animate={{ width:'80%' }} transition={{ duration:1.5 }} />
                          </div>
                        )}
                        {item.status==='done' && item.result && (
                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            {item.result.is_duplicate ? (
                              <><Copy size={11} className="text-orange-400"/><span className="text-orange-400">Duplicate detected</span></>
                            ) : (
                              <><CheckCircle size={11} className="text-emerald-400"/><span className="text-emerald-400">Uploaded successfully</span></>
                            )}
                          </div>
                        )}
                        {item.status==='error' && (
                          <div className="flex items-center gap-1 text-xs text-red-400"><AlertTriangle size={11}/>{item.error}</div>
                        )}
                        {item.status==='pending' && <span className="text-xs text-slate-600">Ready to upload</span>}
                      </div>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {item.status==='done' && item.result && !item.result.is_duplicate && (
                          <button onClick={() => downloadFile(item.result!.id,'original',item.result!.original_filename)} className="p-1.5 rounded-lg glass hover:bg-white/10 transition-colors text-slate-400 hover:text-blue-400">
                            <Download size={14}/>
                          </button>
                        )}
                        <button onClick={() => removeItem(idx)} className="p-1.5 rounded-lg glass hover:bg-white/10 transition-colors text-slate-400 hover:text-red-400">
                          <X size={14}/>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* All Files Table */}
      <div>
        <h2 className="section-header mb-4">Your Files ({allFiles.length})</h2>
        <div className="card p-0 overflow-hidden">
          {allFiles.length === 0 ? (
            <div className="flex flex-col items-center py-14 text-center">
              <Upload size={36} className="text-slate-700 mb-3"/>
              <p className="text-slate-500">No files uploaded yet</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/5">
                    {['File','Type','Original Size','Status','Action'].map(h=>(
                      <th key={h} className="text-left px-5 py-3.5 text-xs font-semibold text-slate-500 uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allFiles.map((f,i)=>{
                    const FIcon = typeIcon[f.file_type]??FileText
                    return (
                      <motion.tr key={f.id} initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:i*0.04 }} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg glass flex items-center justify-center"><FIcon size={14} className={typeColor[f.file_type]??'text-blue-400'}/></div>
                            <span className="text-slate-200 truncate max-w-[200px] font-medium">{f.original_filename}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-slate-500 capitalize">{f.file_type}</td>
                        <td className="px-5 py-3 text-slate-400">{fmt(f.original_size)}</td>
                        <td className="px-5 py-3">
                          <div className="flex flex-wrap gap-1">
                            {f.is_duplicate&&<span className="badge-orange">Duplicate</span>}
                            {f.is_compressed&&<span className="badge-cyan">-{f.compression_ratio.toFixed(1)}%</span>}
                            {f.is_protected&&<span className="badge-violet">Protected</span>}
                            {!f.is_duplicate&&!f.is_compressed&&!f.is_protected&&<span className="badge-green">Ready</span>}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-1">
                            <button onClick={()=>downloadFile(f.id,'original',f.original_filename)} className="p-1.5 rounded-lg glass hover:bg-white/10 transition-colors text-slate-400 hover:text-blue-400" title="Download">
                              <Download size={13}/>
                            </button>
                            <button onClick={()=>deleteFile(f.id)} className="p-1.5 rounded-lg glass hover:bg-white/10 transition-colors text-slate-400 hover:text-red-400" title="Delete">
                              <Trash2 size={13}/>
                            </button>
                          </div>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      <DuplicateCleanupModal
        open={duplicateModalOpen}
        groups={duplicateGroups}
        deleting={deletingDuplicates}
        success={cleanupSuccess}
        onKeepAll={keepAllDuplicates}
        onDeleteAll={deleteAllDuplicates}
        onCloseSuccess={keepAllDuplicates}
      />
    </div>
  )
}
