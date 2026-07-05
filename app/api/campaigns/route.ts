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
    const parsed = Papa.parse(text, { header: true, skipEmptyLines: 'greedy' })

    // Filter valid rows (must have name, business, and url)
    const validRows = parsed.data.filter((row: any) => {
      return row.name && row.business && row.url
    })

    if (validRows.length === 0) {
      return NextResponse.json(
        { 
          error: 'CSV contains no valid prospect rows. Ensure columns name, business, and url are filled.', 
          details: parsed.errors 
        },
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
        total_prospects: validRows.length,
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
    const prospects = validRows.map((row: any) => ({
      campaign_id: campaign.id,
      name: String(row.name).trim(),
      business: String(row.business).trim(),
      url: String(row.url).trim(),
      email: row.email ? String(row.email).trim() : null,
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
