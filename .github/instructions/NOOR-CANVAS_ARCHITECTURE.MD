# NOOR-CANVAS_ARCHITECTURE.MD

## Purpose
This document contains the **detailed system design and architecture** for the project.  
It serves as the authoritative reference for developers and Copilot when a deep understanding of the system is required.

---

## Contents

### 1. API Contracts
- Full descriptions of all exposed APIs
- Request/response formats
- Authentication/authorization flows

### 2. Data Transfer Objects (DTOs)
- Complete DTO schemas
- Field-level details, types, and constraints

### 3. Database Schema
- SQL tables with columns, datatypes, indexes, and relationships
- Stored procedures, triggers, and views
- Data integrity rules

### 4. Application Architecture
- Razor views and their dependencies
- Services and components
- Integration between layers

### 5. Interactions and Dependencies
- How API, DTOs, and SQL objects interact
- Known coupling points and contracts

---

## New API Endpoints (September 2025)

### Enhanced KSESSIONS API Integration
As part of architecture modernization, new APIs have been created to eliminate direct database access violations:

#### GET /api/host/ksessions/session/{sessionId}/details
- **Purpose**: Enhanced session details with transcript from KSESSIONS database
- **Response**: `EnhancedSessionDetailsResponse` containing `SessionDetailsDto`
- **Features**: Includes session metadata, transcript content, and navigation data (Group, Category, Speaker)
- **Usage**: Replaces direct KSessionsDb access in HostControlPanel.razor

#### GET /api/host/ksessions/countries/flags
- **Purpose**: Country flag mappings from KSESSIONS database
- **Query Parameters**: `countryCodes[]` (optional) - filter by specific ISO2 codes
- **Response**: `CountryFlagsResponse` with dictionary mapping ISO2 → lowercase flag codes
- **Usage**: Replaces direct database queries for participant country flag display

#### GET /api/host/asset-lookup
- **Purpose**: Asset lookup definitions for database-driven asset detection
- **Response**: `AssetLookupResponse` containing array of `AssetLookupDto`
- **Features**: Active asset definitions with CSS selectors and display metadata
- **Usage**: Dynamic asset detection in transcript processing

### Related DTOs
- `SessionDetailsDto`: Complete session information with transcript
- `EnhancedSessionDetailsResponse`: Standardized API response wrapper
- `CountryFlagDto`: Country flag mapping with ISO codes
- `CountryFlagsResponse`: Response wrapper for country operations
- `AssetLookupDto`: Asset definition with detection metadata
- `AssetLookupResponse`: Response wrapper for asset lookup operations

---

## Update Rules
- Whenever the system architecture changes (new API, altered DTO, schema migration, or new component), update this file.  
- Ensure **SystemStructureSummary.md** contains a summarized snapshot of changes for quick access.  
