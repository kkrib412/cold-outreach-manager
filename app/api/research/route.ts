import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { GoogleGenerativeAI } from '@google/generative-ai'

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '')
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' })

async function scrapeWebsite(url: string): Promise<string> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; OutreachBot/1.0)'
      }
    })
    const html = await response.text()
    
    // Simple extraction - get text content (could be improved with cheerio)
    const textContent = html
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .slice(0, 3000) // First 3000 chars
    
    return textContent
  } catch (error) {
    console.error('Scrape error:', error)
    return ''
  }
}

async function generateResearch(business: string, url: string, content: string) {
  const prompt = `You are researching a business for a personalized cold email outreach.

Business: ${business}
Website: ${url}
Website Content (excerpt): ${content}

Provide a brief 2-3 sentence summary of:
1. What the business does
2. One specific pain point or opportunity you notice
3. A relevant insight that could be used in outreach

Keep it concise and actionable.`

  const result = await model.generateContent(prompt)
  return result.response.text() || ''
}

async function generateOpener(business: string, research: string) {
  const prompt = `Write a personalized 1-2 sentence email opener for a cold outreach email.

Business: ${business}
Research Summary: ${research}

The opener should:
- Be specific and reference something from the research
- Feel personal, not templated
- Create curiosity
- Be 1-2 sentences max

Write ONLY the opener, no subject, no greeting, no signature.`

  const result = await model.generateContent(prompt)
  return result.response.text() || ''
}

export async function POST(request: NextRequest) {
  try {
    const { prospectId } = await request.json()

    if (!prospectId) {
      return NextResponse.json(
        { error: 'Prospect ID required' },
        { status: 400 }
      )
    }

    // Get prospect
    const { data: prospect, error: fetchError } = await supabase
      .from('prospects')
      .select('*')
      .eq('id', prospectId)
      .single()

    if (fetchError || !prospect) {
      return NextResponse.json(
        { error: 'Prospect not found' },
        { status: 404 }
      )
    }

    // Scrape website
    const content = await scrapeWebsite(prospect.url)

    // Generate research summary
    const research = await generateResearch(
      prospect.business,
      prospect.url,
      content
    )

    // Generate personalized opener
    const opener = await generateOpener(prospect.business, research)

    // Update prospect
    const { error: updateError } = await supabase
      .from('prospects')
      .update({
        research_summary: research,
        personalized_opener: opener,
        status: 'researched'
      })
      .eq('id', prospectId)

    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update prospect', details: updateError },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      research,
      opener
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Internal server error', details: error },
      { status: 500 }
    )
  }
}
