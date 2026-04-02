# Changelog

All notable changes to this project will be documented in this file.

The format is based on Keep a Changelog,
and this project follows Semantic Versioning.

## [Unreleased]

### Added
- Governance and operations documentation set:
  - ROADMAP.md
  - CONTRIBUTING.md
  - TESTING.md
  - GOVERNANCE.md
  - DIAGRAMS.md
  - GLOSARIO.md
- Global favicon integration across project pages.

### Changed
- Security posture documentation expanded for architectural governance.

### Fixed
- None.

### Removed
- None.

### Security
- Threat modeling and security review documentation expanded and aligned.

## [0.3.0] - 2026-04-02

### Added
- Dynamic blog listing and post rendering flow (`blog.html`, `blog.js`, `post.html`, `markdown.js`).
- Global theme management with dark mode by default and user preference persistence.
- Global footer with official inline SVG social icons.

### Changed
- UI cohesion across pages through shared global CSS/JS.
- Security headers and CSP tightened across core pages.

### Fixed
- Theme toggle consistency and footer rendering conflicts.
- Relative route handling for nested blog pages.

### Removed
- Insecure inline JS patterns in key pages.

### Security
- Markdown render sanitization hardened.
- CSP updated to reduce script/style attack surface.
- External links normalized with `noopener noreferrer`.

## [0.2.0] - 2026-04-01

### Added
- Initial security documentation (`SECURITY.md`, `SECURITY_REVIEW.md`).
- Initial architecture and threat docs baseline.

### Changed
- Site structure prepared for security-first static delivery.

### Fixed
- Basic hardening gaps identified during review.

### Removed
- None.

### Security
- Initial control baseline aligned to OWASP/CIS/NIST practices.

## [0.1.0] - 2026-03-31

### Added
- Initial static site skeleton for SEC_ARCHITECT.
- Core landing page, blog section scaffolding, and assets structure.

### Changed
- None.

### Fixed
- None.

### Removed
- None.

### Security
- Baseline security intent established.

[Unreleased]: https://github.com/JulioCesarAbreuP/sec-architect/compare/v0.3.0...HEAD
[0.3.0]: https://github.com/JulioCesarAbreuP/sec-architect/compare/v0.2.0...v0.3.0
[0.2.0]: https://github.com/JulioCesarAbreuP/sec-architect/compare/v0.1.0...v0.2.0
[0.1.0]: https://github.com/JulioCesarAbreuP/sec-architect/releases/tag/v0.1.0
