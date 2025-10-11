# Introduction

Welcome to **ftry** - A modern Salon & Spa Management SaaS platform built for the Indian market.

## What is ftry?

ftry is a comprehensive salon and spa management solution designed specifically for Indian businesses. Built with cutting-edge technologies and best practices, it provides a scalable, secure, and feature-rich platform for managing all aspects of salon operations.

## Key Features

- **Multi-tenant Architecture** - Isolated data per tenant with Row-Level Security
- **Authentication & Authorization** - JWT-based auth with refresh tokens and CSRF protection
- **Admin CRUD Interface** - Configuration-based admin panels (93% code reduction)
- **Modern Tech Stack** - React 19, NestJS 11, PostgreSQL 18, Nx monorepo
- **TDD Approach** - Test-driven development with comprehensive test coverage
- **Type-Safe** - Full TypeScript coverage across frontend and backend

## Target Market

- **Primary**: Indian salon and spa businesses
- **Location**: Starting in Pune, expanding nationally
- **Features**: GST compliance, Indian payment gateways, mobile-first design

## Tech Stack

### Frontend

- React 19 with Vite
- Tailwind CSS 4.1
- shadcn/ui components
- Zustand for state management
- TanStack Query for data fetching

### Backend

- NestJS 11 on Bun runtime
- Prisma 6 ORM
- PostgreSQL 18
- JWT authentication with refresh tokens
- CSRF protection

### Infrastructure

- Nx 21.6.3 monorepo
- Bun 1.3.0 package manager
- Vitest (frontend) / Jest (backend)
- Grafana Cloud monitoring

## Documentation Structure

- **Getting Started** - Setup, quick start, project structure
- **Architecture** - System design, patterns, decisions
- **API Reference** - REST API endpoints and schemas
- **Guides** - Development workflows, best practices

## Quick Links

- [Quick Start Guide](./quick-start)
- [Project Structure](./project-structure)
- [Development Workflow](./development-workflow)
- [Architecture Overview](../architecture/overview)

## Development Philosophy

ftry is built with a **quality-first, incremental approach**:

1. **Test-Driven Development** - Tests before implementation
2. **Incremental Changes** - Small, atomic commits
3. **Zero-Tolerance for Errors** - No TypeScript errors, all tests passing
4. **Comprehensive Documentation** - Every feature documented in Docusaurus

## Getting Help

- **GitHub Repository**: [ftry/ftry](https://github.com/ftry/ftry)
- **Issues**: Report bugs and feature requests on GitHub
- **Contributing**: See [Contributing Guide](../guides/contributing)

---

Ready to get started? Head to the [Quick Start Guide](./quick-start) to set up your development environment.
