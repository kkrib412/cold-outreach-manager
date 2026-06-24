'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Campaign, Prospect } from '@/lib/types'

export default function CampaignPage() {
  const params = useParams()
  const campaignId = params.id as string

  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [prospects, setProspects] = useState<Prospect[]>([])
  const [loading, setLoading] = useState(true)
  const [researching, setResearching] = useState<string | null>(null)
  const [sending, setSending] = useState<string | null>(null)

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
        alert('Research failed')
      }
    } catch (error) {
      alert('Research error')
    } finally {
      setResearching(null)
    }
  }

  const handleSend = async (prospectId: string) => {
    const fromEmail = prompt('Enter your verified sender email (Resend):')
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
        alert('Email sent!')
      } else {
        alert('Send failed')
      }
    } catch (error) {
      alert('Send error')
    } finally {
      setSending(null)
    }
  }

  const handleBatchResearch = async () => {
    const pending = prospects.filter(p => p.status === 'pending')
    for (const p of pending) {
      await handleResearch(p.id)
      await new Promise(r => setTimeout(r, 2000)) // Rate limit
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-600">Loading campaign...</div>
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-600">Campaign not found</div>
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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl font-bold text-gray-900">{campaign.name}</h1>
            <button
              onClick={handleBatchResearch}
              disabled={stats.pending === 0}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Research All Pending
            </button>
          </div>
          <p className="text-gray-600">
            Status: <span className="font-semibold">{campaign.status}</span>
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-6 mb-8">
          <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Total Prospects</div>
            <div className="text-3xl font-bold text-gray-900">{stats.total}</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Pending Research</div>
            <div className="text-3xl font-bold text-yellow-600">{stats.pending}</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Researched</div>
            <div className="text-3xl font-bold text-blue-600">{stats.researched}</div>
          </div>
          <div className="bg-white rounded-lg p-6 shadow border border-gray-200">
            <div className="text-sm text-gray-600 mb-1">Sent</div>
            <div className="text-3xl font-bold text-green-600">{stats.sent}</div>
          </div>
        </div>

        {/* Prospects Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Business</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {prospects.map((prospect) => (
                <tr key={prospect.id}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {prospect.name}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {prospect.business}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {prospect.email || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      prospect.status === 'sent' ? 'bg-green-100 text-green-800' :
                      prospect.status === 'researched' ? 'bg-blue-100 text-blue-800' :
                      prospect.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {prospect.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm space-x-2">
                    {prospect.status === 'pending' && (
                      <button
                        onClick={() => handleResearch(prospect.id)}
                        disabled={researching === prospect.id}
                        className="text-indigo-600 hover:text-indigo-900 disabled:opacity-50"
                      >
                        {researching === prospect.id ? 'Researching...' : 'Research'}
                      </button>
                    )}
                    {prospect.status === 'researched' && prospect.email && (
                      <button
                        onClick={() => handleSend(prospect.id)}
                        disabled={sending === prospect.id}
                        className="text-green-600 hover:text-green-900 disabled:opacity-50"
                      >
                        {sending === prospect.id ? 'Sending...' : 'Send'}
                      </button>
                    )}
                    {prospect.personalized_opener && (
                      <button
                        onClick={() => alert(prospect.personalized_opener)}
                        className="text-gray-600 hover:text-gray-900"
                      >
                        View
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
