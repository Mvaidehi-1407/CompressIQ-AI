import { useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { AlertTriangle, CheckCircle, Copy, FileText, ShieldCheck, Trash2 } from 'lucide-react'
import { FileRecord } from '../store/fileStore'

function fmt(bytes: number) {
  if (!bytes) return '0 B'
  const k = 1024, sizes = ['B','KB','MB','GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

export interface DuplicateGroup {
  original: FileRecord
  duplicates: FileRecord[]
}

interface Props {
  open: boolean
  groups: DuplicateGroup[]
  deleting: boolean
  success: { preserved: number; deleted: number; recovered: number } | null
  onKeepAll: () => void
  onDeleteAll: () => Promise<void>
  onCloseSuccess: () => void
}

export default function DuplicateCleanupModal({ open, groups, deleting, success, onKeepAll, onDeleteAll, onCloseSuccess }: Props) {
  const [confirming, setConfirming] = useState(false)
  const totals = useMemo(() => ({
    preserved: groups.length,
    deleted: groups.reduce((sum, group) => sum + group.duplicates.length, 0),
    recovered: groups.reduce((sum, group) => sum + group.duplicates.reduce((inner, file) => inner + file.original_size, 0), 0),
  }), [groups])

  const close = () => {
    setConfirming(false)
    success ? onCloseSuccess() : onKeepAll()
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
          <motion.div className="glass-dark w-full max-w-3xl rounded-2xl border border-orange-500/20 shadow-2xl" initial={{ opacity: 0, y: 18, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 12, scale: 0.98 }}>
            <div className="border-b border-white/5 p-5">
              <div className="flex items-start gap-3">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl bg-orange-500/15 text-orange-300">
                  {success ? <CheckCircle size={21} /> : <Copy size={21} />}
                </div>
                <div>
                  <h2 className="text-xl font-black text-slate-100">{success ? 'Duplicate Cleanup Completed' : 'Duplicate Files Detected'}</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    {success ? 'Original files were preserved and duplicate copies were removed.' : `${totals.deleted} duplicate file${totals.deleted === 1 ? '' : 's'} found across ${totals.preserved} group${totals.preserved === 1 ? '' : 's'}.`}
                  </p>
                </div>
              </div>
            </div>

            {success ? (
              <div className="grid gap-3 p-5 sm:grid-cols-3">
                {[
                  { label: 'Original Files Preserved', value: success.preserved },
                  { label: 'Duplicate Files Deleted', value: success.deleted },
                  { label: 'Storage Recovered', value: fmt(success.recovered) },
                ].map(item => (
                  <div key={item.label} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <div className="text-2xl font-black text-slate-100">{item.value}</div>
                    <div className="mt-1 text-xs font-medium uppercase tracking-wider text-slate-500">{item.label}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="max-h-[52vh] space-y-3 overflow-y-auto p-5">
                {groups.map(group => (
                  <div key={group.original.id} className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
                        <ShieldCheck size={17} />
                      </div>
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="truncate text-sm font-semibold text-slate-100">{group.original.original_filename}</span>
                          <span className="badge-green text-[10px]">Original Kept</span>
                        </div>
                        <div className="mt-0.5 text-xs text-slate-500">{fmt(group.original.original_size)}</div>
                      </div>
                    </div>
                    <div className="mt-4 space-y-2 border-l border-white/10 pl-4">
                      {group.duplicates.map(file => (
                        <div key={file.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-slate-950/25 px-3 py-2">
                          <div className="flex min-w-0 items-center gap-2">
                            <FileText size={14} className="flex-shrink-0 text-orange-300" />
                            <span className="truncate text-sm text-slate-300">{file.original_filename}</span>
                          </div>
                          <span className="text-xs text-slate-500">{fmt(file.original_size)}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}

                {confirming && (
                  <div className="rounded-2xl border border-red-500/25 bg-red-500/10 p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={18} className="mt-0.5 flex-shrink-0 text-red-300" />
                      <div>
                        <h3 className="font-bold text-red-200">Delete all duplicate files?</h3>
                        <p className="mt-1 text-sm text-slate-400">The system will keep one original file from each duplicate group and permanently remove all duplicate copies.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-white/5 p-5">
              <div className="text-sm text-slate-400">
                Storage recoverable: <span className="font-bold text-orange-300">{fmt(totals.recovered)}</span>
              </div>
              {success ? (
                <button onClick={close} className="btn-primary px-4 py-2 text-xs">Done</button>
              ) : (
                <div className="flex flex-wrap gap-2">
                  <button onClick={confirming ? () => setConfirming(false) : onKeepAll} className="btn-secondary px-4 py-2 text-xs">
                    {confirming ? 'Cancel' : 'Keep All'}
                  </button>
                  <button
                    onClick={confirming ? onDeleteAll : () => setConfirming(true)}
                    disabled={deleting}
                    className="inline-flex items-center gap-2 rounded-xl border border-orange-500/40 bg-orange-500/15 px-4 py-2 text-xs font-semibold text-orange-200 transition-colors hover:bg-orange-500/25 disabled:opacity-60"
                  >
                    <Trash2 size={13} /> {confirming ? (deleting ? 'Deleting...' : 'Confirm Delete') : 'Delete Them All'}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
