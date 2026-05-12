# Glow Studio - AI Development Guidelines

## Project Overview

Glow Studio is an academic web development project for managing a gym studio.

The platform allows users to:

* register and login,
* view available classes,
* reserve classes,
* purchase class packages,
* manage reservations,
* validate package availability.

The system must remain aligned with the official project documentation located inside `/docs`.

This is an academic project. Prioritize:

* clarity,
* maintainability,
* organization,
* consistency,
* simplicity.

Avoid unnecessary complexity or overengineering.

---

# Current Technologies

Frontend:

* HTML5
* CSS3
* JavaScript

Backend:

* Node.js
* Express.js

Database:

* PostgreSQL

Version Control:

* Git
* GitHub

Development Environment:

* Visual Studio Code

---

# Project Structure Rules

Respect the existing structure of the repository.

Do NOT:

* rewrite the entire project unnecessarily,
* replace technologies unless explicitly requested,
* create duplicated files,
* create duplicated CSS,
* create duplicated JavaScript logic.

Always reuse existing components and styles whenever possible.

Maintain separation between:

* frontend,
* backend,
* database,
* assets.

---

# Frontend Guidelines

The interface should:

* look modern and elegant,
* maintain visual consistency,
* be responsive,
* use semantic HTML,
* preserve the Glow Studio branding.

Prioritize:

* clean spacing,
* readable typography,
* organized layouts,
* reusable styles.

Avoid:

* excessive animations,
* unnecessary visual effects,
* inconsistent colors,
* inline styles when avoidable.

---

# Backend Guidelines

Use RESTful architecture.

Always validate:

* user inputs,
* reservation rules,
* package availability,
* class capacity,
* authentication data.

Respect the business logic defined in the SQL scripts and project documentation.

Do not bypass validations.

---

# Database Rules

The PostgreSQL structure defined in `/docs` is the source of truth.

Respect:

* relationships,
* triggers,
* constraints,
* validations,
* business rules.

Important validations include:

* maximum class capacity,
* package expiration,
* remaining classes,
* reservation uniqueness.

---

# Git Workflow

Branch strategy:

* main → stable production branch
* develop → integration branch
* feature/* → isolated feature branches

Before making changes:

1. Analyze the current implementation.
2. Check reusable code.
3. Avoid modifying unrelated files.

Always explain:

* modified files,
* implemented logic,
* possible impacts.

---

# Coding Style

Prioritize:

* readability,
* modularity,
* descriptive naming,
* maintainable code.

Avoid:

* unnecessary abstractions,
* giant files,
* magic numbers,
* duplicated logic.

Use comments only when necessary.

---

# Important Instructions

Before implementing any feature:

1. Read the current project structure.
2. Analyze existing code.
3. Verify compatibility with current design.
4. Keep consistency with project documentation.

If uncertain:

* ask for clarification,
* or generate recommendations before implementing.

Do not make destructive changes without confirmation.
