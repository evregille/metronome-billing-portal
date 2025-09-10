# Metronome Billing Dashboard

A modern, single-page Next.js application for displaying Metronome billing data.

## Features

- **Balance Overview**: View current balance with usage percentage and progress bar
- **Spend Tracking**: Monitor current period spending with product breakdown
- **Cost Breakdown Chart**: Visual representation of costs by product over time
- **Budget & Alerts**: Create spending alerts and budget notifications

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Metronome API credentials

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd metronome-billing-portal
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your Metronome API credentials:
```
METRONOME_API_TOKEN=YOUR METRONOME API KEY
NEXT_PUBLIC_DEFAULT_BUSINESS_NAME="AcmeCorp"
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## License

MIT License
