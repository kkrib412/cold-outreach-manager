'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [campaignName, setCampaignName] = useState('')
  const [subjectTemplate, setSubjectTemplate] = useState('')
  const [bodyTemplate, setBodyTemplate] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !campaignName || !subjectTemplate || !bodyTemplate) {
      setError('All fields are required')
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-4">
              Cold Outreach Manager
            </h1>
            <p className="text-xl text-gray-600">
              AI-powered personalized email campaigns
            </p>
          </div>

          {/* Upload Form */}
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-100">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">
              Create New Campaign
            </h2>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Campaign Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Name
                </label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Q1 2026 Pittsburgh SMBs"
                />
              </div>

              {/* CSV Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prospect List (CSV)
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-indigo-400 transition">
                  <input
                    type="file"
                    accept=".csv"
                    onChange={(e) => setFile(e.target.files?.[0] || null)}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    {file ? (
                      <p className="text-indigo-600 font-medium">{file.name}</p>
                    ) : (
                      <>
                        <p className="text-gray-600 mb-2">
                          Drop CSV file or click to upload
                        </p>
                        <p className="text-sm text-gray-400">
                          Required columns: name, business, url, email
                        </p>
                      </>
                    )}
                  </label>
                </div>
              </div>

              {/* Subject Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Subject
                </label>
                <input
                  type="text"
                  value={subjectTemplate}
                  onChange={(e) => setSubjectTemplate(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder="Quick question about {{business}}"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {"{{business}}"} or {"{{name}}"} for personalization
                </p>
              </div>

              {/* Body Template */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email Body
                </label>
                <textarea
                  value={bodyTemplate}
                  onChange={(e) => setBodyTemplate(e.target.value)}
                  rows={8}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                  placeholder={`Hi {{name}},\n\n{{personalized_opener}}\n\nI noticed your team at {{business}} might benefit from...\n\nBest,\nKenny`}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use {"{{personalized_opener}}"} for AI-generated context
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-semibold py-4 rounded-lg hover:opacity-90 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Creating Campaign...' : 'Create Campaign'}
              </button>
            </form>
          </div>

          {/* Info Cards */}
          <div className="grid md:grid-cols-3 gap-6 mt-12">
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="text-3xl mb-3">📊</div>
              <h3 className="font-semibold text-gray-800 mb-2">Upload CSV</h3>
              <p className="text-sm text-gray-600">
                Import prospects with name, business, URL, and email
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="text-3xl mb-3">🤖</div>
              <h3 className="font-semibold text-gray-800 mb-2">AI Research</h3>
              <p className="text-sm text-gray-600">
                Auto-scrape websites and generate personalized openers
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 border border-gray-100">
              <div className="text-3xl mb-3">📧</div>
              <h3 className="font-semibold text-gray-800 mb-2">Send & Track</h3>
              <p className="text-sm text-gray-600">
                Queue emails via Resend and monitor opens/replies
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
