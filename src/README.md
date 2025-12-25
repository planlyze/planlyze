# Planlyze Frontend

React 18 + Vite frontend for the Planlyze AI business analysis platform.

## Tech Stack

- **Framework**: React 18 with Vite bundler
- **Styling**: TailwindCSS + shadcn/ui components
- **State Management**: React Query for server state, React Context for auth
- **Routing**: React Router DOM v6
- **Internationalization**: i18next (Arabic/English)
- **Charts**: Recharts
- **Forms**: React Hook Form + Zod validation
- **Animations**: Framer Motion

## Project Structure

```
src/
├── api/                    # API client and services
│   └── client.js          # Main API client with all endpoints
├── components/             # Reusable UI components
│   ├── admin/             # Admin dashboard components
│   ├── analysis/          # Analysis wizard and loader
│   ├── common/            # Shared components (FilterBar, PageHeader)
│   ├── credits/           # Credit purchase modals
│   ├── dashboard/         # Dashboard widgets
│   ├── notifications/     # Notification components
│   ├── onboarding/        # User onboarding guide
│   ├── results/           # Analysis result tab components
│   ├── sharing/           # Report sharing modal
│   ├── ui/                # shadcn/ui base components
│   └── utils/             # Utility functions and helpers
├── pages/                  # Page components (routes)
├── landing/                # Landing page sections
├── hooks/                  # Custom React hooks
├── i18n/                   # i18next configuration
├── locales/                # Translation files (ar.json, en.json)
├── lib/                    # Context providers (AuthContext)
├── config/                 # App configuration and shared styles
└── utils/                  # Shared utility functions
```

## Key Components

### Pages
- `Dashboard.jsx` - Main user dashboard with stats and recent activity
- `NewAnalysis.jsx` - Analysis creation wizard
- `AnalysisResult.jsx` - 6-tab lazy-loaded analysis report viewer
- `Credits.jsx` - Credit purchase page with packages
- `Profile.jsx` - User profile and settings
- `AdminPayments.jsx` - Admin payment management
- `AdminUsers.jsx` - Admin user management

### Common Components
- `FilterBar` - Reusable filter bar with search and dropdowns
- `PageHeader` - Consistent page headers with back navigation
- `StarRating` - Rating component for report feedback
- `MarkdownText` - Markdown renderer for AI content

### Result Components (Lazy-loaded tabs)
- `ExecutiveSummary` - Overview and score card
- `MarketSection` - Market analysis and opportunity
- `BusinessSection` - Business model and strategy
- `TechnicalSection` - Tech stack and implementation
- `FinancialSection` - Financial projections
- `StrategySection` - Go-to-market and recommendations

## API Client

The `src/api/client.js` provides typed API access:

```javascript
import { auth, Analysis, User, Payment } from '@/api/client';

// Authentication
await auth.login({ email, password });
await auth.register({ email, password, full_name });
const user = await auth.me();

// Analyses
const analyses = await Analysis.list();
const analysis = await Analysis.get(id);

// Users (admin)
const users = await User.list();
await User.update(id, { credits: 10 });
```

## Styling Conventions

- Mobile-first responsive design using Tailwind breakpoints (sm, md, lg)
- RTL support via `dir` attribute and `flex-row-reverse` classes
- Theme support via next-themes (light/dark mode)
- Consistent color scheme: orange (primary), purple (accent)

### Responsive Patterns
```jsx
// Stack on mobile, row on desktop
<div className="flex flex-col sm:flex-row gap-4">

// Hide text on mobile, show on desktop
<span className="hidden sm:inline">Full Text</span>
<span className="sm:hidden">Short</span>

// Responsive grid
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
```

## Environment Variables

- `VITE_API_URL` - Backend API URL (defaults to `/api`)

## Development

```bash
# Install dependencies
npm install

# Start dev server (port 5000)
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Internationalization

Translations are in `src/locales/`:
- `en.json` - English translations
- `ar.json` - Arabic translations

Use the `useTranslation` hook:
```jsx
import { useTranslation } from 'react-i18next';

function MyComponent() {
  const { t, i18n } = useTranslation();
  const isArabic = i18n.language === 'ar';
  
  return <h1>{t('dashboard.title')}</h1>;
}
```

## Code Conventions

- Components use PascalCase (e.g., `FilterBar.jsx`)
- Utilities use camelCase (e.g., `excelExport.jsx`)
- Pages are in `src/pages/` and use PascalCase
- UI components from shadcn/ui are in `src/components/ui/`
- Custom components extend shadcn/ui patterns
