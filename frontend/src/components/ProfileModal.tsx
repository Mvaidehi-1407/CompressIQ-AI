import { useEffect, useMemo, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Camera, FileText, Mail, Phone, Save, Upload, User, X, Zap } from 'lucide-react'
import { useAuthStore } from '../store/authStore'
import { useFileStore } from '../store/fileStore'

function fmt(bytes: number) {
  if (!bytes) return '0 B'
  const k = 1024, sizes = ['B','KB','MB','GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`
}

interface Props {
  open: boolean
  onClose: () => void
}

export default function ProfileModal({ open, onClose }: Props) {
  const { user } = useAuthStore()
  const { files, fetchFiles } = useFileStore()
  const fileRef = useRef<HTMLInputElement>(null)
  const storageKey = user?.id ? `compressiq-profile-${user.id}` : 'compressiq-profile'
  const [saved, setSaved] = useState(false)
  const [profile, setProfile] = useState({
    photo: '',
    icon: 'SI',
    fullName: user?.username ?? '',
    email: user?.email ?? '',
    phone: '',
    about: 'Cloud Compression User',
  })

  useEffect(() => {
    if (!open) return
    fetchFiles()
    const raw = localStorage.getItem(storageKey)
    if (raw) {
      setProfile(prev => ({ ...prev, ...JSON.parse(raw) }))
    } else {
      setProfile(prev => ({
        ...prev,
        fullName: user?.username ?? '',
        email: user?.email ?? '',
        icon: user?.username?.slice(0, 2).toUpperCase() ?? 'U',
      }))
    }
  }, [open, storageKey, user?.username, user?.email])

  const summary = useMemo(() => {
    const last = files
      .map(file => file.compressed_at ?? file.protected_at ?? file.uploaded_at)
      .filter(Boolean)
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())[0]

    return {
      uploaded: files.length,
      compressed: files.filter(file => file.is_compressed).length,
      restored: files.filter(file => file.is_protected).length,
      storage: fmt(files.reduce((sum, file) => sum + file.original_size, 0)),
      lastActivity: last ? new Date(last).toLocaleString() : 'No activity yet',
    }
  }, [files])

  const save = () => {
    localStorage.setItem(storageKey, JSON.stringify(profile))
    setSaved(true)
    window.setTimeout(() => setSaved(false), 1800)
  }

  const choosePhoto = (file?: File) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setProfile(prev => ({ ...prev, photo: String(reader.result) }))
    reader.readAsDataURL(file)
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 p-4 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            className="glass-dark w-full max-w-3xl rounded-2xl border border-blue-500/20 shadow-2xl"
            initial={{ opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
          >
            <div className="flex items-center justify-between border-b border-white/5 p-5">
              <div>
                <h2 className="text-xl font-black text-slate-100">Profile</h2>
                <p className="mt-1 text-sm text-slate-500">Manage your personal details.</p>
              </div>
              <button onClick={onClose} className="rounded-xl p-2 text-slate-500 transition-colors hover:bg-white/10 hover:text-slate-200">
                <X size={18} />
              </button>
            </div>

            <div className="grid gap-5 p-5 md:grid-cols-[0.85fr_1.15fr]">
              <div className="rounded-2xl border border-white/5 bg-white/[0.03] p-4">
                <div className="flex flex-col items-center text-center">
                  <div className="relative">
                    <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl text-2xl font-black text-white glow-blue" style={{ background: 'linear-gradient(135deg,#2563eb,#7c3aed)' }}>
                      {profile.photo ? <img src={profile.photo} alt="Profile" className="h-full w-full object-cover" /> : profile.icon}
                    </div>
                    <button onClick={() => fileRef.current?.click()} className="absolute -bottom-2 -right-2 rounded-xl bg-blue-600 p-2 text-white shadow-lg transition-colors hover:bg-blue-500" title="Change profile photo">
                      <Camera size={15} />
                    </button>
                    <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={event => choosePhoto(event.target.files?.[0])} />
                  </div>

                  <div className="mt-5 grid w-full grid-cols-4 gap-2">
                    {['SI','AI','CP','UX'].map(icon => (
                      <button
                        key={icon}
                        onClick={() => setProfile(prev => ({ ...prev, icon, photo: '' }))}
                        className={`rounded-xl border px-2 py-2 text-xs font-bold transition-colors ${profile.icon === icon && !profile.photo ? 'border-blue-400 bg-blue-500/15 text-blue-200' : 'border-white/10 bg-white/[0.03] text-slate-400 hover:text-slate-200'}`}
                      >
                        {icon}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-5 space-y-3 text-sm">
                  {[
                    { label: 'Uploaded Files', value: summary.uploaded, icon: Upload },
                    { label: 'Compressed Files', value: summary.compressed, icon: Zap },
                    { label: 'Restored Files', value: summary.restored, icon: FileText },
                    { label: 'Storage Used', value: summary.storage, icon: FileText },
                  ].map(item => (
                    <div key={item.label} className="flex items-center justify-between rounded-xl bg-slate-950/25 px-3 py-2">
                      <span className="flex items-center gap-2 text-slate-500"><item.icon size={13} /> {item.label}</span>
                      <span className="font-semibold text-slate-200">{item.value}</span>
                    </div>
                  ))}
                  <div className="rounded-xl bg-slate-950/25 px-3 py-2 text-left">
                    <div className="text-xs text-slate-500">Last Activity</div>
                    <div className="mt-1 text-sm font-semibold text-slate-200">{summary.lastActivity}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"><User size={13} /> Full Name</span>
                  <input className="input-field" value={profile.fullName} onChange={event => setProfile(prev => ({ ...prev, fullName: event.target.value }))} />
                </label>
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"><Mail size={13} /> Email Address</span>
                  <input className="input-field" value={profile.email} onChange={event => setProfile(prev => ({ ...prev, email: event.target.value }))} />
                </label>
                <label className="block">
                  <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-slate-500"><Phone size={13} /> Phone Number</span>
                  <input className="input-field" value={profile.phone} placeholder="+91 XXXXX XXXXX" onChange={event => setProfile(prev => ({ ...prev, phone: event.target.value }))} />
                </label>
                <label className="block">
                  <span className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-slate-500">About</span>
                  <textarea className="input-field min-h-28 resize-none" value={profile.about} onChange={event => setProfile(prev => ({ ...prev, about: event.target.value }))} />
                </label>

                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  <span className={`text-xs transition-opacity ${saved ? 'text-emerald-400 opacity-100' : 'opacity-0'}`}>Profile saved</span>
                  <button onClick={save} className="btn-primary px-4 py-2 text-xs">
                    <Save size={13} /> Save Profile
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
