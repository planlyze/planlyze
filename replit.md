# Planlyze - AI Business Analysis Platform

## Overview
Planlyze is a full-stack, bilingual (Arabic/English) web application offering AI-powered business analysis tools. It aims to provide comprehensive business insights through AI, supporting users from idea validation to detailed market, financial, and strategic analysis. The platform's ambition is to empower entrepreneurs and businesses with accessible and accurate AI-driven analytical capabilities.

## User Preferences
I prefer clear and direct communication. When suggesting code changes, please provide concise explanations of the rationale. For complex features, I appreciate a high-level architectural overview before diving into implementation details. I prefer an iterative development approach, where features are built and reviewed in small, manageable increments. Please ask for confirmation before making significant architectural changes or refactoring large portions of the codebase. I expect the agent to maintain the existing code style and conventions. Do not make changes to the `server/seed.py` file without explicit instructions to increment seed versions.

## System Architecture
Planlyze utilizes a React 18/Vite frontend with TailwindCSS and shadcn/ui for a modern, responsive user interface, emphasizing a mobile-first design. The backend is built with Flask, Flask-SQLAlchemy, and PostgreSQL, providing a robust API and data persistence layer. Key architectural decisions include a 6-tab lazy-loaded report structure for AI analysis results, a credit-based system for premium features, and comprehensive internationalization (i18n) for Arabic/English support. The system incorporates an admin notification system for critical events and a user notification system with customizable preferences. All legal pages (Privacy Policy, Terms of Service, Idea Security) are designed to meet compliance standards for an AI tech startup, featuring strong data privacy and security guarantees. A multi-currency payment system with automatic exchange rate conversion is integrated. Database seeding is version-controlled to protect user data across deployments. Frontend development runs on port 5000 and the Flask API on port 3000.

## External Dependencies
- **AI**: Anthropic Claude API (claude-sonnet-4-5)
- **Database**: PostgreSQL
- **Email**: ZeptoMail API (for email verification)
- **UI Components**: shadcn/ui
- **Styling**: TailwindCSS
- **Internationalization**: i18next
- **Excel Export**: `xlsx` library
- **API Documentation**: Flasgger (Swagger UI)