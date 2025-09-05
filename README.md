# AlphaSense Billing Dashboard

A modern, single-page Next.js application for displaying Metronome billing data with AlphaSense branding.

## Features

- **Balance Overview**: View current balance with usage percentage and progress bar
- **Spend Tracking**: Monitor current period spending with product breakdown
- **Cost Breakdown Chart**: Visual representation of costs by product over time
- **Budget & Alerts**: Create spending alerts and budget notifications
- **Call Details**: Detailed view of individual API calls and usage
- **AlphaSense Branding**: Professional UI matching AlphaSense design language
- **Automatic Configuration**: Uses environment variables for API credentials

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Metronome API credentials

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd alpha-sense-billing
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
NEXT_PUBLIC_METRONOME_API_TOKEN=your_metronome_api_token_here
NEXT_PUBLIC_METRONOME_CUSTOMER_ID=your_customer_id_here
```

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

The application automatically loads your Metronome API credentials from environment variables and displays:

- **Current Balance**: Shows your current balance with usage visualization
- **Total Spend**: Displays current period spending with product breakdown
- **Product Breakdown**: Interactive chart showing costs over time
- **Recent Calls**: List of recent API calls with detailed information
- **Budget Alerts**: Form to create spending alerts and notifications

## Components

- `Balance`: Displays current balance with usage percentage
- `Spend`: Shows current period spending with product breakdown
- `CostBreakdownChart`: Interactive chart showing costs over time
- `BudgetAlerts`: Form to create spending alerts and notifications
- `CallDetails`: List of recent API calls with detailed information

## Technology Stack

- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI primitives
- **Charts**: Recharts
- **API Integration**: Metronome SDK
- **TypeScript**: Full type safety

## API Integration

This application integrates with the Metronome API to fetch:
- Customer balance information
- Current period spending
- Invoice breakdowns by product
- Usage data and call details
- Alert management

## Environment Variables

The application uses the following environment variables:

- `NEXT_PUBLIC_METRONOME_API_TOKEN`: Your Metronome API token
- `NEXT_PUBLIC_METRONOME_CUSTOMER_ID`: Your Metronome customer ID

**Note**: These variables are prefixed with `NEXT_PUBLIC_` to make them available on the client side. In a production environment, you should consider using server-side API routes for better security.

## Customization

The application uses AlphaSense branding with:
- Blue color scheme (#3b82f6 primary)
- Professional typography
- Clean, modern UI components
- Responsive design

## License

MIT License
