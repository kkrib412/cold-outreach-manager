import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY || 're_placeholder_key')

function interpolateTemplate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] || '')
}

export async function POST(request: NextRequest) {
  try {
    const { prospectId, fromEmail } = await request.json()

    if (!prospectId || !fromEmail) {
      return NextResponse.json(
        { error: 'Prospect ID and from email required' },
        { status: 400 }
      )
    }

    // Get prospect with campaign
    const { data: prospect, error: prospectError } = await supabase
      .from('prospects')
      .select('*, campaigns(*)')
      .eq('id', prospectId)
      .single()

    if (prospectError || !prospect || !prospect.email) {
      return NextResponse.json(
        { error: 'Prospect not found or missing email' },
        { status: 404 }
      )
    }

    const campaign = prospect.campaigns

    // Interpolate templates
    const vars = {
      name: prospect.name,
      business: prospect.business,
      url: prospect.url,
      personalized_opener: prospect.personalized_opener || ''
    }

    const subject = interpolateTemplate(campaign.subject_template, vars)
    const body = interpolateTemplate(campaign.body_template, vars)

    // Send via Resend
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: fromEmail,
      to: prospect.email,
      subject,
      text: body
    })

    if (emailError) {
      // Mark as failed
      await supabase
        .from('prospects')
        .update({ status: 'failed' })
        .eq('id', prospectId)

      return NextResponse.json(
        { error: 'Failed to send email', details: emailError },
        { status: 500 }
      )
    }

    // Log email
    await supabase.from('email_logs').insert({
      prospect_id: prospectId,
      campaign_id: campaign.id,
      resend_id: emailData?.id || '',
      status: 'sent'
    })

    // Update prospect status
    await supabase
      .from('prospects')
      .update({ status: 'sent' })
      .eq('id', prospectId)

    // Update campaign sent count
    await supabase.rpc('increment_sent_count', { campaign_id: campaign.id })

    return NextResponse.json({
      success: true,
      emailId: emailData?.id
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}
