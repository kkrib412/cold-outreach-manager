export interface Prospect {
  id: string
  campaign_id: string
  name: string
  business: string
  url: string
  email?: string
  research_summary?: string
  personalized_opener?: string
  status: 'pending' | 'researched' | 'queued' | 'sent' | 'opened' | 'replied' | 'failed'
  created_at: string
  updated_at: string
}

export interface Campaign {
  id: string
  name: string
  subject_template: string
  body_template: string
  status: 'draft' | 'active' | 'paused' | 'completed'
  total_prospects: number
  sent_count: number
  opened_count: number
  replied_count: number
  created_at: string
  updated_at: string
}

export interface EmailLog {
  id: string
  prospect_id: string
  campaign_id: string
  sent_at: string
  opened_at?: string
  replied_at?: string
  resend_id: string
  status: 'sent' | 'delivered' | 'opened' | 'replied' | 'bounced' | 'failed'
}
