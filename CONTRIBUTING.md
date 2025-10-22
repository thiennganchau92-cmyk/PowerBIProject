# Contributing Guidelines

This document outlines the rules and procedures for contributing to this Power BI project.

## Git Workflow Rules

To maintain code quality and collaboration, follow these steps for any changes. Each step requires explicit permission/confirmation.

### 1. Before Adding Files (`git add`)
- **Review Changes**: Ensure all modified files are intentional and tested.
- **Permission Check**: Confirm with the team lead or project owner before staging changes.
- **Command**: Run `git add <files>` only after approval.

### 2. Commit Message (`git commit -m "message"`)
- **Message Format**: Use clear, descriptive messages following conventional commits (e.g., `feat: add new measure`, `fix: correct data type`).
- **Permission Check**: Get approval for the commit message and changes.
- **Rules**:
  - Keep messages under 50 characters for the subject.
  - Include body if needed for details.
  - Reference issue numbers if applicable (e.g., `Fixes #123`).

### 3. Pushing Changes (`git push`)
- **Branch Check**: Ensure you're on the correct branch (e.g., feature branch, not main).
- **Review**: Have changes reviewed via pull request if on a shared branch.
- **Permission Check**: Obtain approval from maintainers before pushing to protected branches.
- **Command**: Use `git push origin <branch>` after confirmation.

## General Rules
- Always pull latest changes before starting work: `git pull origin main`.
- Create feature branches for new work: `git checkout -b feature/your-feature`.
- Do not push directly to `main` branch without review.
- Run tests or validations before committing (e.g., check TMDL syntax).

## Enforcement
- Pre-commit hooks may be added to enforce these rules locally.
- GitHub branch protection rules are in place to prevent unauthorized pushes.

If you have questions, contact the repository maintainer.
