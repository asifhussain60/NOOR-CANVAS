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

## Update Rules
- Whenever the system architecture changes (new API, altered DTO, schema migration, or new component), update this file.  
- Ensure **SystemStructureSummary.md** contains a summarized snapshot of changes for quick access.  
