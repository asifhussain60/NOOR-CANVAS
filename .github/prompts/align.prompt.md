---
mode: agent
---
# align.prompt.md

## Objective
Review the application holistically by performing a dry-run trace of all execution paths to ensure correctness, alignment, and consistency across all layers.

## Instructions
- Walk through **every functional path**, simulating execution from input to output.  
- Validate that:  
  - Functions are invoked consistently and without redundancy.  
  - Objects, models, and DTOs (data transfer objects) are correctly mapped across layers (UI → Service → API → DB).  
  - API contracts and SQL queries match documented schema.  
  - Configuration values, constants, and environment variables are consistently referenced.  
- Identify dead code, unused imports, and unreachable paths.  
- Verify error handling is comprehensive and consistent, with clear propagation.  
- Review logging and observability hooks for adequate debugging support.  
- Confirm that data transformations preserve correctness with no silent mismatches.  

## Industry Standard Recommendations
- Validate against **SOLID principles** and separation of concerns.  
- Check for **circular dependencies** or architecture drift.  
- Assess **security practices**: input validation, sanitization, principle of least privilege.  
- Evaluate performance and scalability: avoid N+1 queries, unnecessary blocking, or inefficient loops.  
- Confirm test coverage (unit, integration, end-to-end) aligns with the functional surface of the app.  

## Deliverables
Produce a report that includes:  
1. Confirmed strengths of current implementation.  
2. Misalignments, risks, and bugs discovered.  
3. Recommendations prioritized by impact and feasibility.  
4. Patterns that may require systemic refactoring in the future.  

## Parameters
- **key** (optional): A specific identifier (e.g., datastream, feature module, or service) to focus alignment checks on.  
- **notes** (optional): Freeform notes from the requestor to highlight special areas of concern.  

> **Special Guidance for Copilot**  
> While performing the complete alignment review, pay special attention to the datastream specified in `key` (if provided). All paths, mappings, and contracts involving this datastream should be verified with extra scrutiny to ensure correctness and robustness.  
