# Canvas Schema Documentation

## Overview

The `canvas` schema serves as the core application database for the **NOOR Canvas** real-time Islamic content sharing and learning platform. It contains all application-specific tables, relationships, and stored procedures needed to support the interactive learning experience.

## Schema Purpose

The canvas schema is designed to:

- **Isolate Application Data**: Separate NOOR Canvas application data from the existing Islamic content in the `dbo` schema
- **Support Real-time Features**: Enable live sessions, annotations, Q&A, and participant management through SignalR hubs
- **Ensure Data Integrity**: Maintain referential integrity between sessions, users, and learning activities
- **Enable Session Management**: Provide comprehensive session lifecycle management with secure token-based access
- **Track Learning Analytics**: Capture detailed audit logs and participation metrics for continuous improvement

## Architecture

The canvas schema follows a **hub-and-spoke** pattern centered around the `Sessions` table, which connects to:

- **User Management**: User registration and profile management
- **Security Layer**: Token-based authentication and session access control
- **Learning Activities**: Questions, annotations, and shared content
- **Operational Data**: Audit logs, issue tracking, and participant analytics

## Database Integration

### Dual Schema Design

- **`canvas.*`**: Application-specific tables (sessions, users, tokens, activities)
- **`dbo.*`**: Islamic content repository (read-only in application context)

### Cross-Schema Relationships

The canvas schema maintains foreign key relationships to `dbo.Sessions` for integration with historical Islamic content while keeping application data isolated for independent management.

## Key Features

### 🔐 Security & Access Control

- 8-character friendly token system (`SecureTokens`)
- Host and user role separation
- Session-based access control with expiration
- IP tracking and usage analytics

### 🎯 Real-time Learning

- Live Q&A system with voting (`Questions`, `QuestionVotes`)
- Real-time annotations and highlights (`Annotations`)
- Shared asset management (`SharedAssets`)
- Participant tracking and analytics (`SessionParticipants`)

### 📊 Analytics & Monitoring

- Comprehensive audit logging (`AuditLog`)
- Issue tracking and reporting (`Issues`)
- Session analytics and participation metrics
- Usage patterns and access tracking

### 🔄 Session Lifecycle

- Pre-session setup and configuration
- Live session management with participant limits
- Post-session data retention and analysis
- Session expiration and cleanup processes

---

_This schema supports the NOOR Canvas mission of making Islamic learning more interactive, accessible, and engaging through modern web technologies._
