import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useFileStore, FileRecord } from '../store/fileStore'
import api from '../lib/api'
import { Zap, CheckCircle, AlertTriangle, Download, FileText, Image, Video, Archive, Sparkles } from 'lucide-react'

function fmt(b: number) {
  if (!b) return '0 B'; const k=1024,s=['B','KB','MB','GB'],i=Math.floor(Math.log(b)/Math.log(k)); return `${(b/k**i).toFixed(1)} ${s[i]}`
}
const typeIcon: Record<string,any> = { image:Image, video:Video, document:FileText, archive:Archive }
const typeColor: Record<string,string> = { image:'text-cyan-400', video:'text-violet-400', document:'text-blue-400', archive:'text-orange-400' }

const MODES = [
  { id:'lossless', name:'Lossless Vault', desc:'Exact restoration. Quality preserved.', color:'cyan', border:'border-cyan-500/30', bg:'rgba(6,182,212,0.08)', badge:'badge-cyan' },
  { id:'smart_shrink', name:'Smart Shrink', desc:'Maximum reduction. Near-original quality.', color:'violet', border:'border-violet-500/30', bg:'rgba(139,92,246,0.08)', badge:'badge-violet' },
]

export default function CompressionCenter() {
  const { files, fetchFiles, compressFile, downloadCompressed, downloadCompressedBulk } = useFileStore()
  const [selectedMode, setSelectedMode] = useState<'lossless'|'smart_shrink'>('smart_shrink')
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [selectedCompressed, setSelectedCompressed] = useState<Set<string>>(new Set())
  const [compressing, setCompressing] = useState<Set<string>>(new Set())
  const [results, setResults] = useState<Record<string,any>>({})
  const [recommendations, setRecommendations] = useState<Record<string,any>>({})
  const [filter, setFilter] = useState<'all'|'ready'|'compressed'>('ready')

  useEffect(() => { fetchFiles() }, [])

  const eligible = files.filter(f => !f.is_duplicate && (filter==='all' ? true : filter==='ready' ? !f.is_compressed : f.is_compressed))
  const visibleReady = eligible.filter(f => !f.is_compressed)
  const visibleCompressed = eligible.filter(f => f.is_compressed)

  const fetchRec = async (fileId: string) => {
    if (recommendations[fileId]) return
    try {
      const r = await api.get(`/api/compress/recommend/${fileId}`)
      setRecommendations(prev => ({ ...prev, [fileId]: r.data }))
    } catch {}
  }

  const toggleReady = (id: string) => {
    const s = new Set(selected)
    if (s.has(id)) {
      s.delete(id)
    } else {
      s.add(id)
      fetchRec(id)
    }
    setSelected(s)
  }

  const toggleCompressed = (id: string) => {
    setSelectedCompressed(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const compressSelected = async () => {
    const ids = Array.from(selected)
    for (const id of ids) {
      setCompressing(prev => new Set([...prev, id]))
      try {
        const rec = await compressFile(id, selectedMode)
        setResults(prev => ({ ...prev, [id]: { success:true, ratio: rec.compression_ratio } }))
      } catch (e:any) {
        setResults(prev => ({ ...prev, [id]: { success:false, error: e?.response?.data?.error ?? 'Failed' } }))
      } finally {
        setCompressing(prev => { const s=new Set(prev); s.delete(id); return s })
        setSelected(prev => { const s=new Set(prev); s.delete(id); return s })
      }
    }
  }

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity:0,y:-16 }} animate={{ opacity:1,y:0 }}>
        <h1 className="text-3xl font-black text-slate-100">Compression Center</h1>
        <p className="text-slate-400 mt-1">Select files, choose your compression mode, and watch savings happen live.</p>
      </motion.div>

      {/* Mode Selector */}
      <motion.div initial={{ opacity:0,y:16 }} animate={{ opacity:1,y:0 }} transition={{ delay:0.1 }} className="grid md:grid-cols-2 gap-4">
        {MODES.map(m => (
          <button key={m.id} onClick={() => setSelectedMode(m.id as any)}
            className={`rounded-2xl p-5 text-left border transition-all duration-300 ${selectedMode===m.id ? m.border : 'border-white/5'}`}
            style={{ background: selectedMode===m.id ? m.bg : 'rgba(255,255,255,0.02)', boxShadow: selectedMode===m.id ? `0 0 30px ${m.color==='cyan'?'rgba(6,182,212,0.2)':'rgba(139,92,246,0.2)'}` : 'none' }}
          >
            <div className="flex items-start gap-4">
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 flex-shrink-0 ${selectedMode===m.id ? (m.color==='cyan'?'border-cyan-400':'border-violet-400') : 'border-slate-600'}`}>
                {selectedMode===m.id && <div className={`w-2.5 h-2.5 rounded-full ${m.color==='cyan'?'bg-cyan-400':'bg-violet-400'}`}/>}
              </div>
              <div>
                <div className={`font-bold text-base ${selectedMode===m.id ? (m.color==='cyan'?'text-cyan-300':'text-violet-300') : 'text-slate-300'}`}>{m.name}</div>
                <div className="text-sm text-slate-500 mt-0.5">{m.desc}</div>
              </div>
              <span className={`ml-auto ${m.badge} self-start`}>{m.id==='lossless'?'PRECISION':'POWER'}</span>
            </div>
          </button>
        ))}
      </motion.div>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          {(['all','ready','compressed'] as const).map(f => (
            <button key={f} onClick={()=>setFilter(f)} className={`px-4 py-2 rounded-xl text-xs font-semibold uppercase tracking-wider transition-all ${filter===f?'btn-primary':'btn-secondary'}`}>
              {f==='ready'?'Uncompressed':f==='compressed'?'Compressed':'All'}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {(selected.size>0 || selectedCompressed.size>0) && (
            <span className="text-xs text-slate-400">
              {selected.size} ready selected
              {selectedCompressed.size > 0 && `, ${selectedCompressed.size} compressed selected`}
            </span>
          )}
          <button onClick={()=>setSelected(new Set(visibleReady.map(f=>f.id)))} disabled={visibleReady.length === 0} className="btn-secondary text-xs py-2 px-3">Select All Ready</button>
          <button onClick={()=>setSelectedCompressed(new Set(visibleCompressed.map(f=>f.id)))} disabled={visibleCompressed.length === 0} className="btn-secondary text-xs py-2 px-3">Select All Compressed</button>
          <button onClick={()=>downloadCompressedBulk(Array.from(selectedCompressed))} disabled={selectedCompressed.size === 0} className="btn-secondary text-xs py-2 px-3">
            <Download size={13}/> Download Selected
          </button>
          <button onClick={()=>downloadCompressedBulk(visibleCompressed.map(f=>f.id))} disabled={visibleCompressed.length === 0} className="btn-secondary text-xs py-2 px-3">
            <Download size={13}/> Download All Compressed
          </button>
          <button onClick={compressSelected} disabled={selected.size===0||compressing.size>0} className="btn-primary text-xs py-2 px-4">
            <Zap size={13}/> Compress ({selected.size})
          </button>
        </div>
      </div>

      {/* File List */}
      <div className="space-y-3">
        <AnimatePresence>
          {eligible.length === 0 && (
            <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="card flex flex-col items-center py-16 text-center">
              <Zap size={40} className="text-slate-700 mb-3"/>
              <p className="text-slate-500 font-medium">No files to compress</p>
              <p className="text-slate-600 text-sm">Upload some files first in the Upload Center</p>
            </motion.div>
          )}
          {eligible.map((f, i) => {
            const Icon = typeIcon[f.file_type]??FileText
            const isComp = compressing.has(f.id)
            const result = results[f.id]
            const rec = recommendations[f.id]
            const isSelected = f.is_compressed ? selectedCompressed.has(f.id) : selected.has(f.id)
            return (
              <motion.div key={f.id} initial={{ opacity:0, x:-16 }} animate={{ opacity:1, x:0 }} transition={{ delay:i*0.04 }}
                className={`card py-4 px-5 cursor-pointer transition-all duration-200 ${isSelected?'border-blue-500/40 bg-blue-500/5':''} ${f.is_compressed?'opacity-90':''}`}
                onClick={()=>f.is_compressed ? toggleCompressed(f.id) : toggleReady(f.id)}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${isSelected?'bg-blue-500 border-blue-500':'border-slate-600'}`}>
                    {isSelected && <CheckCircle size={12} className="text-white"/>}
                  </div>
                  <div className="w-9 h-9 rounded-xl glass flex items-center justify-center flex-shrink-0">
                    <Icon size={16} className={typeColor[f.file_type]??'text-blue-400'}/>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-slate-200 truncate text-sm">{f.original_filename}</span>
                      {f.is_compressed && <span className="badge-cyan text-[10px]">Already Compressed</span>}
                      {f.is_already_optimized && <span className="badge-green text-[10px]">Already Optimal</span>}
                    </div>
                    <div className="text-xs text-slate-500 mt-0.5">
                      {fmt(f.original_size)}
                      {f.is_compressed && f.compressed_size && <> → {fmt(f.compressed_size)} <span className="text-emerald-400 font-bold ml-1">-{f.compression_ratio.toFixed(1)}%</span></>}
                    </div>
                    {isComp && (
                      <div className="mt-2 progress-bar">
                        <motion.div className="progress-fill" style={{ background:'linear-gradient(90deg,#2563eb,#7c3aed)' }} initial={{ width:0 }} animate={{ width:'85%' }} transition={{ duration:2 }}/>
                      </div>
                    )}
                    {result && (
                      <div className={`flex items-center gap-1 text-xs mt-1 ${result.success?'text-emerald-400':'text-red-400'}`}>
                        {result.success ? <><CheckCircle size={11}/> Saved {result.ratio.toFixed(1)}%</> : <><AlertTriangle size={11}/>{result.error}</>}
                      </div>
                    )}
                    {rec && !f.is_compressed && (
                      <div className="flex items-center gap-1 text-xs text-slate-500 mt-1"><Sparkles size={10} className="text-blue-400"/>{rec.recommendation?.[selectedMode]}</div>
                    )}
                  </div>
                  {f.is_compressed && (
                    <button onClick={e=>{e.stopPropagation();downloadCompressed(f.id,'compressed_'+f.original_filename)}} className="p-2 rounded-xl glass hover:bg-white/10 transition-colors text-slate-400 hover:text-blue-400" title="Download compressed file">
                      <Download size={15}/>
                    </button>
                  )}
                  {isComp && <div className="w-5 h-5 border-2 border-blue-500/30 border-t-blue-500 rounded-full animate-spin flex-shrink-0"/>}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}
