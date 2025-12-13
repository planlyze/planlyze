# Base44 Application

## Overview
This is a Base44 SDK-powered React application built with Vite. The app appears to be a business analysis platform with features for:
- Business analysis and reporting
- AI-powered assistant
- Credits and subscription management
- User profiles and authentication
- Admin dashboard

## Project Structure
- `src/` - Main source code
  - `api/` - Base44 SDK client and entity configurations
  - `components/` - React components organized by feature
  - `pages/` - Page components
  - `hooks/` - Custom React hooks
  - `lib/` - Utility libraries and context providers
  - `utils/` - Helper utilities
- `functions/` - Server-side functions (Base44 cloud functions)
- `vite.config.js` - Vite configuration
- `tailwind.config.js` - Tailwind CSS configuration

## Tech Stack
- React 18
- Vite 6
- Tailwind CSS
- Radix UI components
- Base44 SDK (`@base44/sdk` and `@base44/vite-plugin`)
- React Router DOM
- Framer Motion
- Recharts (charts)
- Lucide React (icons)

## Environment Variables
- `BASE44_LEGACY_SDK_IMPORTS=true` - Required for legacy SDK import paths
- `VITE_BASE44_APP_ID` - Base44 app ID (configure in Base44 dashboard)
- `VITE_BASE44_BACKEND_URL` - Base44 backend URL

## Development
The app runs on port 5000 with Vite dev server.

## Notes
- The Base44 vite plugin handles special imports like `@/entities/*` and `@/functions/*`
- Authentication is managed through the Base44 SDK
