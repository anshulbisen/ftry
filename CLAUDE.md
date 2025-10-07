# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ftry** is a Salon & Spa Management SaaS application being developed as a solo founder project. The goal is to build a comprehensive salon management platform that addresses gaps in existing solutions (like Dingg), with a focus on data-driven insights, AI-powered recommendations, and automated customer engagement.

**Target Market**: Indian salon and spa businesses, initially focusing on Pune and expanding to other Indian cities.

**Current Stage**: Development phase - Nx monorepo initialized with React frontend and NestJS backend applications.

## Tech Stack

- **Frontend**: React 19 with Vite bundler
- **Backend**: NestJS 11 with Webpack
- **Runtime & Package Manager**: Bun (exclusively used for all operations)
- **Architecture**: Nx 21.6.3 monorepo with shared libraries
- **Testing**: Vitest for frontend, Jest for backend and libraries
- **Code Quality**: ESLint, Prettier
- **TypeScript**: 5.9.2 across the stack
- **Database**: PostgreSQL (planned for structured data)
- **Infrastructure**: Cloud-based (AWS/GCP/Azure with managed services)
- **Development Approach**: Microservices-ready modular architecture, starting with monolith

## Core Features (MVP Scope)

1. **Appointment Management**: Online booking, scheduling, calendar management
2. **Client Management**: Customer database, profiles, visit history, preferences
3. **Point of Sale**: Billing, invoicing with GST compliance for Indian market
4. **Reminders**: SMS/WhatsApp appointment reminders
5. **Staff Management**: Employee scheduling and basic resource management

## Future Features (Post-MVP)

- AI-driven insights and recommendations
- Automated customer outreach and re-engagement campaigns
- Analytics dashboard with business intelligence
- Loyalty programs and promotional tools
- Multi-location support
- Inventory management
- Mobile app for clients and staff

## Development Philosophy

This project follows a **lean, iterative, customer-focused approach**:

- Start with focused MVP solving core pain points
- Avoid feature creep - defer nice-to-haves
- Test early with real salons (dogfooding approach)
- Build incrementally with frequent releases
- Prioritize simplicity and maintainability (solo developer context)

## Key Architectural Decisions

- **Nx Monorepo**: Use Nx workspace to manage frontend, backend, and shared libraries in a single repository
- **Modular Design**: Structure code in clear modules/services even if starting as monolith
- **Cloud-First**: Leverage managed services and serverless where possible to minimize ops overhead
- **Multi-tenancy**: Design data isolation for multiple salon clients from the start
- **Mobile-Friendly**: Ensure UI works well on tablets and mobile devices (salon reception context)

## Indian Market Considerations

- **GST Compliance**: All invoicing and billing must support GST
- **Payment Integration**: Use Indian payment gateways (Razorpay, Instamojo) supporting UPI, cards, net banking
- **Language Support**: Plan for Hindi/regional language UI (future)
- **Pricing**: Sensitive to Indian SMB budgets, consider tiered subscription model
- **Local Infrastructure**: Design for variable internet connectivity

## Data Security & Compliance

- Handle sensitive customer PII (names, phone numbers, visit history)
- Secure payment information (use gateway tokenization)
- Plan for data backup and recovery
- Consider future compliance requirements for handling personal data

## Development Guidelines

- Use TypeScript for type safety across the stack
- Implement proper error handling and logging from the start
- Write basic tests for critical business logic
- Use environment variables for configuration
- Follow consistent code formatting (ESLint, Prettier)
- **CRITICAL**: Always use bun - never npm, yarn, pnpm, or node

## Package Manager Policy

**This project uses bun exclusively**. No other package manager or runtime is permitted.

Nx has built-in support for bun (since v19.1). It detects bun via:
1. The `packageManager` field in package.json (set to `bun@1.2.19`)
2. The presence of bun.lock file

**Command Usage:**
- ✅ **DO**: Use `bun install`, `bun add`, `bun remove`, `bun update` for package management
- ✅ **DO**: Use `nx` commands directly (e.g., `nx serve frontend`) - Nx uses bun internally
- ✅ **DO**: Use `bun run` for running package.json scripts directly
- ✅ **DO**: Use `bun` as the runtime for all Node.js scripts
- ❌ **NEVER**: Use npm, npx, yarn, pnpm, or node commands
- ❌ **NEVER**: Prefix nx commands with other package managers (not `npm run nx`, just `nx`)
- ❌ **NEVER**: Create or maintain package-lock.json, yarn.lock, or pnpm-lock.yaml
- ✅ **ONLY**: bun.lock is the legitimate lock file

## Project Structure

```
/apps
  /frontend          # React 19 application with Vite
  /backend           # NestJS 11 application with Webpack
  /backend-e2e       # End-to-end tests for backend
/libs
  /shared
    /types           # Shared data models/types (@ftry/shared/types)
    /utils           # Common utilities (@ftry/shared/utils)
  /features          # Feature libraries (to be created)
    /appointments    # Appointment-related code (future)
    /clients         # Client management (future)
    /billing         # POS and billing (future)
```

## Available Commands

**IMPORTANT**: This project exclusively uses **bun** as both the package manager and runtime. Never use npm, yarn, pnpm, or node.

Nx automatically detects and uses bun based on the `packageManager` field in package.json and the bun.lock file. Simply run `nx` commands directly.

```bash
# Package Management
bun install            # Install dependencies (never use npm/yarn/pnpm)
bun add <package>      # Add a new package
bun remove <package>   # Remove a package
bun update             # Update dependencies

# Development
nx serve frontend      # Start React frontend dev server (Nx uses bun internally)
nx serve backend       # Start NestJS backend dev server

# Build
nx build frontend      # Build frontend for production
nx build backend       # Build backend for production
nx run-many -t build   # Build all projects

# Testing
nx test frontend       # Run frontend tests with Vitest
nx test backend        # Run backend tests with Jest
nx test types          # Run shared types tests
nx test utils          # Run shared utils tests

# Linting
nx lint frontend       # Lint frontend code
nx lint backend        # Lint backend code

# Generate
nx g @nx/react:component --project=frontend    # Generate React component
nx g @nx/nest:resource --project=backend       # Generate NestJS resource
nx g @nx/js:lib --directory=libs/features      # Generate shared library

# Run scripts (alternative syntax)
bun run <script>       # Run package.json scripts directly with bun
```

## Reference Documents

The `knowlege-base/` directory contains three comprehensive planning documents:

1. **Blueprint for Building Your Salon SaaS as a Solo Developer.txt**: Step-by-step guide covering validation, planning, tech stack, MVP development, testing, AI features, marketing, and scaling.

2. **Roadmap for Launching a Salon SaaS Startup as a Solo Developer (Pune, India).txt**: Phased timeline (Months 0-24+) with market research, legal setup, development milestones, pilot testing, launch strategy, and growth plans specific to the Indian market.

3. **Salon & Spa Management App_ Core Features and AI Innovations (2025).txt**: Detailed feature specifications including core functionality (booking, CRM, POS, loyalty) and AI-powered capabilities (24/7 automation, predictive analytics, personalized recommendations).

These documents should be consulted for product decisions, feature priorities, and strategic direction.
