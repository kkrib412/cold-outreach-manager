'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Campaign } from '@/lib/types'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [campaignName, setCampaignName] = useState('')
  const [subjectTemplate, setSubjectTemplate] = useState('Quick question about {{business}}')
  const [bodyTemplate, setBodyTemplate] = useState(
    `Hi {{name}},\n\n{{personalized_opener}}\n\nI noticed your team at {{business}} might benefit from a quick website optimization. We help local businesses double their load speed and fix mobile layout issues.\n\nWould you be open to a 5-minute feedback call next week?\n\nBest,\nKenny\nThe AI Forge`
  )

  // Campaigns list state
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [campaignsLoading, setCampaignsLoading] = useState(true)

  useEffect(() => {
    loadCampaigns()
  }, [])

  const loadCampaigns = async () => {
    try {
      setCampaignsLoading(true)
      const { data, error } = await supabase
        .from('campaigns')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (error) throw error
      if (data) setCampaigns(data)
    } catch (err: any) {
      console.error('Error fetching campaigns:', err)
    } finally {
      setCampaignsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !campaignName || !subjectTemplate || !bodyTemplate) {
      setError('All fields are required to build your campaign.')
      return
    }

    setLoading(true)
    setError('')

    const formData = new FormData()
    formData.append('file', file)
    formData.append('campaignName', campaignName)
    formData.append('subjectTemplate', subjectTemplate)
    formData.append('bodyTemplate', bodyTemplate)

    try {
      const res = await fetch('/api/campaigns', {
        method: 'POST',
        body: formData
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Upload failed')
      }

      router.push(`/campaigns/${data.campaign.id}`)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleDownloadSample = () => {
    const csvContent = "data:text/csv;charset=utf-8,name,business,url,email\nJohn Smith,Smith Plumbing,https://smithplumbing.com,john@smithplumbing.com\nJane Doe,Doe Electricians,https://doeelectric.com,jane@doeelectric.com";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "forge_leads_sample.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Decorative grid background & glow */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f1f2e_1px,transparent_1px),linear-gradient(to_bottom,#1f1f2e_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-30 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-gradient-to-r from-indigo-600/20 to-purple-600/20 blur-[120px] rounded-full pointer-events-none" />

      <div className="container mx-auto px-6 py-12 relative z-10 max-w-7xl flex-1 flex flex-col justify-center">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-semibold uppercase tracking-wider mb-4 animate-pulse">
            ✨ Autonomous Lead Generation
          </div>
          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-gradient-to-r from-white via-neutral-200 to-neutral-400 bg-clip-text text-transparent mb-3">
            The AI Forge
          </h1>
          <p className="text-lg text-neutral-400 max-w-xl mx-auto">
            Upload your prospect lists and watch the pipeline automatically scrape, analyze, and draft highly personalized cold emails.
          </p>
        </div>

        {/* 2-Column Dashboard Grid */}
        <div className="grid lg:grid-cols-3 gap-8 items-start w-full">
          
          {/* Column 1 & 2: Campaign Creation Form */}
          <div className="lg:col-span-2 bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/80 rounded-2xl shadow-2xl p-8 w-full">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-5 mb-6">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">⚡</span>
                Create New Campaign
              </h2>
              <button 
                type="button" 
                onClick={handleDownloadSample}
                className="text-xs text-indigo-400 hover:text-indigo-350 hover:underline border border-indigo-500/20 bg-indigo-500/5 px-2.5 py-1 rounded-lg transition"
              >
                📥 Download CSV Sample
              </button>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-300 px-4 py-3 rounded-xl mb-6 text-sm flex items-center gap-2">
                <span>⚠️</span>
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campaign Name */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-4 py-3.5 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:border-indigo-500 text-white transition-all duration-200 shadow-inner"
                  placeholder="e.g. Q1 Pittsburgh Plumbing Audits"
                />
              </div>

              {/* CSV Upload */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Prospect List (CSV)
                </label>
                <div className={`border border-dashed rounded-xl p-8 text-center transition-all duration-200 ${
                  file 
                    ? 'border-indigo-500/50 bg-indigo-500/5' 
                    : 'border-neutral-800 bg-neutral-950/50 hover:border-neutral-700 hover:bg-neutral-950'
                }`}>
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer block">
                    {file ? (
                      <div className="space-y-2">
                        <div className="text-3xl">📄</div>
                        <p className="text-indigo-400 font-medium text-sm">{file.name}</p>
                        <p className="text-xs text-neutral-500 font-mono">{(file.size / 1024).toFixed(1)} KB</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <div className="text-3xl text-neutral-600 mb-1">📤</div>
                        <p className="text-neutral-300 text-sm font-medium">
                          Drag and drop your CSV file here, or <span className="text-indigo-400 hover:underline">browse</span>
                        </p>
                        <p className="text-xs text-neutral-505">
                          Requires column headers: <code className="bg-neutral-900 px-1 py-0.5 rounded text-neutral-400 text-[10px]">name</code>, <code className="bg-neutral-900 px-1 py-0.5 rounded text-neutral-400 text-[10px]">business</code>, <code className="bg-neutral-900 px-1 py-0.5 rounded text-neutral-400 text-[10px]">url</code>, <code className="bg-neutral-900 px-1 py-0.5 rounded text-neutral-400 text-[10px]">email</code>
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Subject Template */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={subjectTemplate}
                  onChange={(e) => setSubjectTemplate(e.target.value)}
                  className="w-full px-4 py-3.5 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:border-indigo-500 text-white transition-all duration-200"
                  placeholder="Quick question about {{business}}"
                />
                <p className="text-[11px] text-neutral-500 mt-1.5">
                  Merge tags: <code className="bg-neutral-900 px-1 py-0.5 rounded text-neutral-400">{"{{business}}"}</code> or <code className="bg-neutral-900 px-1 py-0.5 rounded text-neutral-400">{"{{name}}"}</code> are replaced dynamically.
                </p>
              </div>

              {/* Body Template */}
              <div>
                <label className="block text-xs font-semibold text-neutral-300 uppercase tracking-wider mb-2">
                  Email Body Template
                </label>
                <textarea
                  value={bodyTemplate}
                  onChange={(e) => setBodyTemplate(e.target.value)}
                  rows={6}
                  className="w-full px-4 py-3.5 bg-neutral-950 border border-neutral-800 rounded-xl focus:outline-none focus:border-indigo-500 text-white font-mono text-sm leading-relaxed transition-all duration-200"
                  placeholder="Hi {{name}}, ..."
                />
                <p className="text-[11px] text-neutral-500 mt-1.5">
                  Ensure you use <code className="bg-neutral-900 px-1 py-0.5 rounded text-indigo-400">{"{{personalized_opener}}"}</code>. The AI will inject custom opening hooks here.
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white font-bold py-4 rounded-xl hover:opacity-95 transition-all duration-300 shadow-lg shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24" fill="none">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Forging Campaign & Analyzing Leads...
                  </span>
                ) : (
                  'Launch Campaign ⚡'
                )}
              </button>
            </form>
          </div>

          {/* Column 3: Campaign History Panel */}
          <div className="bg-neutral-900/40 backdrop-blur-xl border border-neutral-800/80 rounded-2xl shadow-2xl p-6 w-full flex flex-col h-[670px] overflow-hidden">
            <h2 className="text-lg font-bold text-white flex items-center gap-2 border-b border-neutral-800 pb-4 mb-4">
              <span className="text-indigo-400">📂</span>
              Active & Past Campaigns
            </h2>

            {/* Campaign History List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {campaignsLoading ? (
                <div className="flex items-center justify-center h-48">
                  <svg className="animate-spin h-6 w-6 text-indigo-500" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : campaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center text-center h-48 p-4 text-neutral-500 text-sm">
                  <div className="text-3xl mb-2">📁</div>
                  <p>No campaigns found.</p>
                  <p className="text-xs text-neutral-600 mt-1">Upload a lead file to create your first directory.</p>
                </div>
              ) : (
                campaigns.map((camp) => (
                  <div 
                    key={camp.id}
                    onClick={() => router.push(`/campaigns/${camp.id}`)}
                    className="p-4 bg-neutral-950/70 border border-neutral-850 hover:border-indigo-500/40 hover:bg-neutral-950/90 rounded-xl cursor-pointer transition-all duration-200 group"
                  >
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <h3 className="font-semibold text-sm text-neutral-200 group-hover:text-white truncate max-w-[160px] md:max-w-none">
                        {camp.name}
                      </h3>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold border ${
                        camp.status === 'completed' ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' :
                        camp.status === 'active' ? 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20' :
                        'bg-neutral-900 text-neutral-400 border-neutral-800'
                      }`}>
                        {camp.status}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs text-neutral-500 font-mono">
                      <span>{camp.total_prospects || 0} leads</span>
                      <span>{new Date(camp.created_at || '').toLocaleDateString(undefined, {month: 'short', day: 'numeric'})}</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Feature Highlights */}
        <div className="grid md:grid-cols-3 gap-6 mt-16 max-w-5xl mx-auto w-full">
          <div className="bg-neutral-900/20 border border-neutral-800/40 hover:border-neutral-800 rounded-xl p-6 transition duration-300">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center font-bold text-lg mb-4">📊</div>
            <h3 className="font-semibold text-white mb-2">Automated Crawling</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Accepts list files, extracts domains, and triggers stealth crawlers to analyze site diagnostics.
            </p>
          </div>
          <div className="bg-neutral-900/20 border border-neutral-800/40 hover:border-neutral-800 rounded-xl p-6 transition duration-300">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 text-purple-400 flex items-center justify-center font-bold text-lg mb-4">🤖</div>
            <h3 className="font-semibold text-white mb-2">AI Personalization</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Engages Gemini to draft highly specific email intros detailing technical website errors.
            </p>
          </div>
          <div className="bg-neutral-900/20 border border-neutral-800/40 hover:border-neutral-800 rounded-xl p-6 transition duration-300">
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 text-pink-400 flex items-center justify-center font-bold text-lg mb-4">📧</div>
            <h3 className="font-semibold text-white mb-2">Resend Delivery</h3>
            <p className="text-sm text-neutral-400 leading-relaxed">
              Review research output, click send, and track opens and responses directly in the campaign view.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
