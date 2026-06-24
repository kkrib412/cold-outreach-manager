import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import Papa from 'papaparse'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const campaignName = formData.get('campaignName') as string
    const subjectTemplate = formData.get('subjectTemplate') as string
    const bodyTemplate = formData.get('bodyTemplate') as string

    if (!file || !campaignName || !subjectTemplate || !bodyTemplate) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Parse CSV
    const text = await file.text()
    const parsed = Papa.parse(text, { header: true })

    if (parsed.errors.length > 0) {
      return NextResponse.json(
        { error: 'CSV parsing failed', details: parsed.errors },
        { status: 400 }
      )
    }

    // Create campaign
    const { data: campaign, error: campaignError } = await supabase
      .from('campaigns')
      .insert({
        name: campaignName,
        subject_template: subjectTemplate,
        body_template: bodyTemplate,
        total_prospects: parsed.data.length,
        status: 'draft'
      })
      .select()
      .single()

    if (campaignError) {
      return NextResponse.json(
        { error: 'Failed to create campaign', details: campaignError },
        { status: 500 }
      )
    }

    // Insert prospects
    const prospects = parsed.data.map((row: any) => ({
      campaign_id: campaign.id,
      name: row.name || '',
      business: row.business || '',
      url: row.url || '',
      email: row.email || null,
      status: 'pending'
    }))

    const { error: prospectsError } = await supabase
      .from('prospects')
      .insert(prospects)

    if (prospectsError) {
      // Rollback campaign if prospects fail
      await supabase.from('campaigns').delete().eq('id', campaign.id)
      return NextResponse.json(
        { error: 'Failed to create prospects', details: prospectsError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      campaign: campaign,
      prospectsCount: prospects.length
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}
