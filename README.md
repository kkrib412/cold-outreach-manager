# Cold Outreach Manager

AI-powered email outreach platform that researches prospects, generates personalized openers, and manages campaigns with tracking.

## Features

- 📊 **CSV Upload** - Import prospect lists with name, business, URL, email
- 🤖 **AI Research** - Auto-scrape websites and generate personalized openers via OpenAI
- 📧 **Email Sending** - Queue and send emails via Resend API
- 📈 **Dashboard** - Track campaign performance (sent, opened, replied)
- ⚡ **Batch Processing** - Research multiple prospects with rate limiting

## Tech Stack

- **Frontend**: Next.js 14, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes, Supabase (PostgreSQL)
- **AI**: OpenAI GPT-4 for research and personalization
- **Email**: Resend API for transactional emails
- **Deployment**: Vercel (recommended)

## Prerequisites

- Node.js 18+ and npm
- Supabase account (free tier works)
- Resend account with verified sender domain
- OpenAI API key

## Setup

### 1. Clone and Install

```bash
git clone https://github.com/kkrib412/cold-outreach-manager.git
cd cold-outreach-manager
npm install
```

### 2. Configure Supabase

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor and run `supabase-schema.sql`
3. Then run `supabase-helpers.sql`
4. Copy your project URL and anon key from Settings > API

### 3. Configure Resend

1. Sign up at https://resend.com
2. Verify your sending domain
3. Generate an API key from the dashboard

### 4. Environment Variables

Copy `.env.example` to `.env.local`:

```bash
cp .env.example .env.local
```

Fill in your credentials:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Resend API
RESEND_API_KEY=re_xxxxxxxxxxxx

# OpenAI
OPENAI_API_KEY=sk-xxxxxxxxxxxx
```

### 5. Run Development Server

```bash
npm run dev
```

Open http://localhost:3000

## Usage

### 1. Prepare CSV File

Create a CSV with these columns:

```csv
name,business,url,email
John Smith,Smith & Co,https://smithco.com,john@smithco.com
Jane Doe,Doe Industries,https://doeindustries.com,jane@doeindustries.com
```

### 2. Create Campaign

1. Go to homepage
2. Enter campaign name
3. Upload CSV file
4. Set email subject template (use `{{business}}`, `{{name}}` for personalization)
5. Set email body template (use `{{personalized_opener}}` for AI-generated content)
6. Click "Create Campaign"

### 3. Research Prospects

On the campaign page:
- Click "Research" on individual prospects, or
- Click "Research All Pending" to batch process

The AI will:
- Scrape each prospect's website
- Generate a 2-3 sentence research summary
- Create a personalized opener for your email

### 4. Send Emails

1. Once prospects are researched, click "Send" on each row
2. Enter your verified Resend sender email when prompted
3. Email is queued and sent via Resend API
4. Status updates to "sent"

### 5. Track Performance

Monitor campaign stats in real-time:
- Total prospects
- Pending research
- Researched (ready to send)
- Sent emails

## API Endpoints

### POST /api/campaigns
Upload CSV and create campaign

**Body (FormData):**
- `file`: CSV file
- `campaignName`: string
- `subjectTemplate`: string
- `bodyTemplate`: string

### POST /api/research
Research a single prospect

**Body:**
```json
{
  "prospectId": "uuid"
}
```

### POST /api/send
Send email to prospect

**Body:**
```json
{
  "prospectId": "uuid",
  "fromEmail": "you@yourdomain.com"
}
```

## Database Schema

See `supabase-schema.sql` for full schema.

**Tables:**
- `campaigns` - Campaign metadata and stats
- `prospects` - Individual prospects with research data
- `email_logs` - Email delivery tracking

## Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel dashboard
3. Add environment variables
4. Deploy

### Environment Variables for Production

Make sure to set all `.env.local` variables in your Vercel project settings.

## Roadmap

- [ ] Webhook integration for Resend open/reply tracking
- [ ] Email scheduling and drip campaigns
- [ ] A/B testing for subject lines
- [ ] LinkedIn profile enrichment
- [ ] Export reports to PDF
- [ ] Team collaboration features

## Contributing

Contributions welcome! Please open an issue or PR.

## License

MIT License - see LICENSE file

## Author

Built by [Kenny Kriberney](https://github.com/kkrib412)

Part of **The AI Forge** portfolio

## Support

For issues or questions:
- Open a GitHub issue
- Email: [Your email]

---

**Note**: This is a portfolio project demonstrating full-stack development with AI integration. For production use, add rate limiting, error handling, and email deliverability monitoring.
