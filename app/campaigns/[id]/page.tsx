'use client'

import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Campaign, Prospect } from '@/lib/types'

export default function CampaignPage() {
  const params = useParams()
  const router = useRouter()
  const campaignId = params.id as string

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [researching, setResearching] = useState<string | null>(null)
  const [sending, setSending] = useState<string | null>(null)
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null)

  useEffect(() => {
    loadCampaign()
  }, [campaignId])

  const loadCampaign = async () => {
    setLoading(true)
    
    const { data: campaignData } = await supabase
      .from('campaigns')
      .select('*')
      .eq('id', campaignId)
      .single()

    const { data: prospectsData } = await supabase
      .from('prospects')
      .select('*')
      .eq('campaign_id', campaignId)
      .order('created_at', { ascending: true })

    if (campaignData) setCampaign(campaignData)
    if (prospectsData) setProspects(prospectsData)
    setLoading(false)
  }

  const handleResearch = async (prospectId: string) => {
    setResearching(prospectId)
    try {
      const res = await fetch('/api/research', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectId })
      })

      if (res.ok) {
        await loadCampaign()
      } else {
        alert('Research failed. Make sure your Gemini API key is correct.')
      }
    } catch (error) {
      alert('Research error')
    } finally {
      setResearching(null)
    }
  }

  const handleSend = async (prospectId: string) => {
    const fromEmail = prompt('Enter your verified sender email (Resend):', 'outreach@yourdomain.com')
    if (!fromEmail) return

    setSending(prospectId)
    try {
      const res = await fetch('/api/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prospectId, fromEmail })
      })

      if (res.ok) {
        await loadCampaign()
        alert('Email sent successfully!')
      } else {
        alert('Send failed. Check your Resend API configuration.')
      }
    } catch (error) {
      alert('Send error')
    } finally {
      setSending(null)
    }
  }

  const handleBatchResearch = async () => {
    const pending = prospects.filter(p => p.status === 'pending')
    if (pending.length === 0) return
    
    if (!confirm(`Are you sure you want to run research on all ${pending.length} pending prospects?`)) return

    for (const p of pending) {
      await handleResearch(p.id)
      await new Promise(r => setTimeout(r, 2000)) // Rate limit
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#070709] flex items-center justify-center text-neutral-100">
        <div className="flex flex-col items-center gap-4">
          <svg className="animate-spin h-10 w-10 text-indigo-500" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <div className="text-sm font-semibold tracking-wider text-neutral-400">LOADING CAMPAIGN COCKPIT...</div>
        </div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen bg-[#070709] flex flex-col items-center justify-center text-neutral-100 gap-4">
        <div className="text-4xl">🔍</div>
        <div className="text-xl font-bold text-red-400">Campaign not found</div>
        <button 
          onClick={() => router.push('/')} 
          className="px-4 py-2 bg-neutral-900 border border-neutral-800 rounded-lg hover:bg-neutral-800 transition"
        >
          Back to Dashboard
        </button>
      </div>
    )
  }

  const stats = {
    total: prospects.length,
    pending: prospects.filter(p => p.status === 'pending').length,
    researched: prospects.filter(p => p.status === 'researched').length,
    sent: prospects.filter(p => p.status === 'sent').length
  }

  return (
    <div className="min-h-screen bg-[#070709] text-neutral-100 flex flex-col font-sans selection:bg-indigo-500 selection:text-white">
      {/* Background glow lines */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-[1px] bg-gradient-to-r from-transparent via-neutral-800 to-transparent" />

      {/* Navigation Header */}
      <header className="border-b border-neutral-900 bg-neutral-950/40 backdrop-blur-md sticky top-0 z-30">
        <div className="container mx-auto px-6 py-4 max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => router.push('/')}
              className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 transition-all text-neutral-300 hover:text-white"
            >
              ← Home
            </button>
            <div className="h-6 w-[1px] bg-neutral-800" />
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <span className="p-1 rounded bg-indigo-500/10 text-indigo-400 text-sm">🛠️</span>
              The AI Forge Campaign Cockpit
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-xs text-neutral-400 font-mono">Live Campaign Database</span>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-10 max-w-7xl flex-1 relative z-10">
        {/* Campaign Info */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white mb-2">{campaign.name}</h1>
            <p className="text-sm text-neutral-400 flex items-center gap-2">
              <span>Status:</span>
              <span className="px-2 py-0.5 rounded bg-neutral-900 border border-neutral-850 text-neutral-300 font-mono text-xs uppercase">
                {campaign.status}
              </span>
              <span className="text-neutral-600">•</span>
              <span>Created at: {new Date(campaign.created_at || '').toLocaleDateString()}</span>
            </p>
          </div>

          <div>
            <button
              onClick={handleBatchResearch}
              disabled={stats.pending === 0}
              className="w-full md:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 disabled:from-neutral-800 disabled:to-neutral-900 text-white font-semibold px-6 py-3 rounded-xl hover:opacity-95 active:scale-[0.98] transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-indigo-600/10"
            >
              🚀 Run Research on {stats.pending} Pending Leads
            </button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 mb-8">
          <div className="bg-neutral-900/30 backdrop-blur-md rounded-xl p-5 border border-neutral-800/80">
            <div className="text-xs font-semibold text-neutral-500 uppercase tracking-wider mb-2">Total Prospects</div>
            <div className="text-3xl font-bold text-white">{stats.total}</div>
          </div>
          <div className="bg-neutral-900/30 backdrop-blur-md rounded-xl p-5 border border-neutral-800/80 border-l-yellow-500/20">
            <div className="text-xs font-semibold text-neutral-550 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500" /> Pending Research
            </div>
            <div className="text-3xl font-bold text-yellow-500">{stats.pending}</div>
          </div>
          <div className="bg-neutral-900/30 backdrop-blur-md rounded-xl p-5 border border-neutral-800/80 border-l-indigo-500/20">
            <div className="text-xs font-semibold text-neutral-550 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" /> Researched
            </div>
            <div className="text-3xl font-bold text-indigo-400">{stats.researched}</div>
          </div>
          <div className="bg-neutral-900/30 backdrop-blur-md rounded-xl p-5 border border-neutral-800/80 border-l-emerald-500/20">
            <div className="text-xs font-semibold text-neutral-555 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Sent Outreach
            </div>
            <div className="text-3xl font-bold text-emerald-400">{stats.sent}</div>
          </div>
        </div>

        {/* Prospects Table Wrapper */}
        <div className="bg-neutral-900/30 border border-neutral-800/80 rounded-xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-neutral-850">
              <thead className="bg-neutral-950/60">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-450 uppercase tracking-wider">Prospect Name</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-450 uppercase tracking-wider">Business</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-450 uppercase tracking-wider">Website URL</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-450 uppercase tracking-wider">Email Address</th>
                  <th className="px-6 py-4 text-left text-xs font-bold text-neutral-450 uppercase tracking-wider">Outreach Status</th>
                  <th className="px-6 py-4 text-right text-xs font-bold text-neutral-450 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900 bg-neutral-900/10">
                {prospects.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-sm text-neutral-500">
                      No prospects found. Run your python outreach scraper to inject leads!
                    </td>
                  </tr>
                ) : (
                  prospects.map((prospect) => (
                    <tr key={prospect.id} className="hover:bg-neutral-800/20 transition-colors duration-150">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-white">
                        {prospect.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-300">
                        {prospect.business}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-indigo-400 hover:text-indigo-300 hover:underline">
                        <a href={prospect.url} target="_blank" rel="noopener noreferrer">
                          {prospect.url.replace(/^https?:\/\//i, '').replace(/\/$/i, '').substring(0, 30)}
                          {prospect.url.length > 30 ? '...' : ''}
                        </a>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-400">
                        {prospect.email || <span className="text-neutral-600 font-mono text-xs italic">Not found</span>}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${
                          prospect.status === 'sent' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                          prospect.status === 'researched' ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' :
                          prospect.status === 'pending' ? 'bg-yellow-500/10 text-yellow-550 border border-yellow-550/20' :
                          'bg-neutral-800 text-neutral-400'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            prospect.status === 'sent' ? 'bg-emerald-400' :
                            prospect.status === 'researched' ? 'bg-indigo-400' :
                            prospect.status === 'pending' ? 'bg-yellow-500' :
                            'bg-neutral-400'
                          }`} />
                          {prospect.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-medium space-x-1.5">
                        {prospect.status === 'pending' && (
                          <button
                            onClick={() => handleResearch(prospect.id)}
                            disabled={researching === prospect.id}
                            className="bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {researching === prospect.id ? 'Researching...' : 'Run Audit'}
                          </button>
                        )}
                        {prospect.status === 'researched' && prospect.email && (
                          <button
                            onClick={() => handleSend(prospect.id)}
                            disabled={sending === prospect.id}
                            className="bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 px-3 py-1.5 rounded-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            {sending === prospect.id ? 'Sending...' : 'Send Email'}
                          </button>
                        )}
                        {prospect.personalized_opener && (
                          <button
                            onClick={() => setSelectedProspect(prospect)}
                            className="bg-neutral-800 text-neutral-300 hover:bg-neutral-700 hover:text-white px-3 py-1.5 rounded-lg transition border border-neutral-750"
                          >
                            View Draft
                          </button>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Prospect Draft Modal */}
      {selectedProspect && (
        <div className="fixed inset-0 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
          <div className="bg-neutral-900 border border-neutral-800 rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-neutral-800 flex items-center justify-between">
              <div>
                <h3 className="font-bold text-lg text-white">Email Draft & Research Output</h3>
                <p className="text-xs text-neutral-400">{selectedProspect.business}</p>
              </div>
              <button
                onClick={() => setSelectedProspect(null)}
                className="text-neutral-500 hover:text-white text-xl p-1 hover:bg-neutral-800 rounded-lg transition"
              >
                ✕
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-5 flex-1 font-sans">
              {/* Research Summary */}
              {selectedProspect.research_summary && (
                <div>
                  <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Audit findings</h4>
                  <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/80 text-sm text-neutral-300 leading-relaxed font-mono">
                    {selectedProspect.research_summary}
                  </div>
                </div>
              )}

              {/* Email Templates */}
              <div>
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Subject Line</h4>
                <div className="bg-neutral-950 px-4 py-3 rounded-xl border border-neutral-800/80 text-sm text-white font-medium">
                  {campaign.subject_template.replace('{{business}}', selectedProspect.business).replace('{{name}}', selectedProspect.name)}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-semibold text-neutral-400 uppercase tracking-wider mb-2">Email Body</h4>
                <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800/80 text-sm text-neutral-300 leading-relaxed font-mono whitespace-pre-wrap">
                  {campaign.body_template
                    .replace('{{personalized_opener}}', selectedProspect.personalized_opener || '')
                    .replace('{{business}}', selectedProspect.business)
                    .replace('{{name}}', selectedProspect.name)}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t border-neutral-800 bg-neutral-950/40 flex items-center justify-end gap-3">
              <button
                onClick={() => setSelectedProspect(null)}
                className="px-4 py-2 border border-neutral-800 rounded-xl hover:bg-neutral-800 transition text-sm font-medium"
              >
                Close
              </button>
              {selectedProspect.email && selectedProspect.status !== 'sent' && (
                <button
                  onClick={() => {
                    const id = selectedProspect.id
                    setSelectedProspect(null)
                    handleSend(id)
                  }}
                  className="px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-650 hover:opacity-95 text-white font-bold rounded-xl transition text-sm"
                >
                  Send Now 📧
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
