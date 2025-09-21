# NOOR CANVAS Documentation

Welcome to the NOOR CANVAS Islamic Content Sharing Platform documentation.

## Overview

NOOR CANVAS is a real-time Islamic content sharing platform built with ASP.NET Core 8.0 and Blazor Server, featuring:

- **Real-time Annotations**: Live drawing and annotation capabilities using SignalR
- **Session Management**: Host-controlled sessions with participant management
- **Islamic Content Integration**: Support for Qur'an, Hadith, Etymology, and Islamic Poetry
- **Multi-language Support**: Arabic (RTL), English (LTR), and Urdu (RTL)
- **McBeatch Theme**: Beautiful, responsive UI with multiple color variants

## Documentation Sections

### [API Reference](api/)

Complete API documentation for all controllers, services, models, and hubs.

### [Technical Architecture](articles/technical/architecture.md)

Detailed technical architecture including:

- ASP.NET Core 8.0 structure
- SignalR real-time communication
- Entity Framework Core data layer
- Database schema (canvas + dbo integration)

### [Development Guide](articles/development/getting-started.md)

Development environment setup and workflow:

- Project setup and configuration
- Development server (IIS Express x64)
- Database configuration
- Testing framework

### [Deployment Guide](articles/deployment/production-setup.md)

Production deployment instructions:

- IIS production configuration
- Database migration
- Security considerations
- Performance optimization

### [User Guides](articles/user-guides/)

End-user documentation:

- Host session management
- Participant interaction
- Annotation tools
- Q&A system

## Getting Started

1. Review the [Technical Architecture](articles/technical/architecture.md)
2. Set up your [Development Environment](articles/development/getting-started.md)
3. Explore the [API Reference](api/)
4. Follow the [Implementation Phases](articles/development/implementation-phases.md)

## Project Information

- **Version**: Phase 4 (Content & Styling)
- **Framework**: ASP.NET Core 8.0, Blazor Server
- **Database**: SQL Server with canvas schema
- **Real-time**: SignalR WebSocket communication
- **Theme**: McBeatch responsive design
- **Timeline**: 20-week phased implementation

---

_Last Updated: September 13, 2025_
