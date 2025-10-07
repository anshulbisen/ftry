# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**ftry** is a Salon & Spa Management SaaS application being developed as a solo founder project. The goal is to build a comprehensive salon management platform that addresses gaps in existing solutions (like Dingg), with a focus on data-driven insights, AI-powered recommendations, and automated customer engagement.

**Target Market**: Indian salon and spa businesses, initially focusing on Pune and expanding to other Indian cities.

**Current Stage**: Early planning phase with comprehensive blueprints and roadmaps documented in `knowlege-base/` directory.

## Tech Stack (Planned)

- **Frontend**: React
- **Backend**: NestJS (Node.js)
- **Architecture**: Nx monorepo for managing multiple apps and shared libraries
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

## Project Structure (Future)

```
/apps
  /frontend          # React application
  /backend           # NestJS application
/libs
  /shared
    /models          # Shared data models/types
    /utils           # Common utilities
  /features
    /appointments    # Appointment-related code
    /clients         # Client management
    /billing         # POS and billing
```

## Reference Documents

The `knowlege-base/` directory contains three comprehensive planning documents:

1. **Blueprint for Building Your Salon SaaS as a Solo Developer.txt**: Step-by-step guide covering validation, planning, tech stack, MVP development, testing, AI features, marketing, and scaling.

2. **Roadmap for Launching a Salon SaaS Startup as a Solo Developer (Pune, India).txt**: Phased timeline (Months 0-24+) with market research, legal setup, development milestones, pilot testing, launch strategy, and growth plans specific to the Indian market.

3. **Salon & Spa Management App_ Core Features and AI Innovations (2025).txt**: Detailed feature specifications including core functionality (booking, CRM, POS, loyalty) and AI-powered capabilities (24/7 automation, predictive analytics, personalized recommendations).

These documents should be consulted for product decisions, feature priorities, and strategic direction.
