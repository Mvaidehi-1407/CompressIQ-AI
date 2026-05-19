CompressIQ AI — Intelligent Storage Optimization Platform

AI / Systems Engineering | Hackathon 2026

---

PART 1 — THE BIG IDEA

What Is CompressIQ AI?

Imagine if your computer had an intelligent assistant that could automatically organize, compress, optimize, and manage your files without you needing to understand storage engineering or compression algorithms.

CompressIQ AI is that assistant.

Users simply upload files, and the platform:

- detects duplicates,
- recommends optimization strategies,
- compresses files intelligently,
- protects sensitive content,
- visualizes storage savings,
- and allows restoration whenever needed.

The system behaves like an AI-powered storage intelligence platform rather than a simple file compressor.

---

The Real-World Problem

Digital storage waste is growing rapidly:

- duplicate files consume unnecessary space,
- media files become extremely large,
- users rarely optimize storage manually,
- cloud storage costs increase over time,
- and advanced storage workflows are too technical for most people.

Most users:

- do not understand compression,
- do not know which files are safe to optimize,
- and do not know how to manage storage efficiently.

CompressIQ AI solves this by automating storage optimization through intelligent workflows and a premium user experience.

---

The Solution in Three Sentences

1. Users upload files through a modern AI-powered dashboard.
2. The platform analyzes, categorizes, compresses, protects, and optimizes storage automatically.
3. Users retain complete control through guided decisions, restoration tools, and visual analytics.

---

PART 2 — PRODUCT VISION & EXPERIENCE

Vision Statement

To build a next-generation intelligent storage optimization platform that combines AI-driven recommendations, advanced compression workflows, duplicate detection, analytics, and restoration systems into a single premium web experience.

The platform should feel like:

- a modern AI operations dashboard,
- an intelligent storage platform,
- and a polished SaaS product built by a funded startup.

---

Core User Experience Principles

The application must:

- feel fast,
- feel intelligent,
- feel visually premium,
- and feel operationally reliable.

Users should immediately understand:

- how much storage they are saving,
- what files are optimized,
- what files are duplicated,
- what files are protected,
- and how to restore content safely.

---

UI / UX DESIGN DIRECTION

Overall Visual Identity

CompressIQ AI must feel:

- futuristic,
- premium,
- intelligent,
- modern,
- and highly interactive.

The UI should combine:

- AI platform aesthetics,
- modern SaaS styling,
- glassmorphism,
- smooth motion design,
- and enterprise-level polish.

Avoid generic CRUD-app appearance.

---

Design Language

Use:

- layered dark backgrounds,
- subtle glassmorphism,
- soft gradients,
- modern typography,
- smooth shadows,
- and elegant spacing.

The interface should never feel flat or cluttered.

---

Motion & Interaction Design

Animations should feel purposeful:

- smooth transitions,
- hover feedback,
- animated counters,
- staggered entrances,
- progress animations,
- chart animations,
- drag-and-drop interactions,
- modal transitions,
- and responsive UI feedback.

Every interaction should feel satisfying and polished.

---

Landing Page Experience

The landing page should feel like a premium AI startup marketing website.

It must communicate:

- storage optimization,
- intelligent compression,
- duplicate detection,
- file protection,
- analytics visualization,
- restoration reliability,
- and future scalability.

The landing page should include:

- a strong hero section,
- animated product showcases,
- feature highlights,
- dashboard previews,
- compression mode explanations,
- analytics previews,
- and strong call-to-action sections.

The page should prioritize:

- visual storytelling,
- smooth animations,
- premium motion design,
- strong product presentation,
- and demo impact.

---

Dashboard Experience

The dashboard should feel like:

- mission control for storage optimization,
- highly interactive,
- visually modern,
- and operationally powerful.

It should include:

- analytics,
- upload workflows,
- compression controls,
- file protection tools,
- duplicate management,
- and restoration systems.

---

Compression Modes Identity

Lossless Vault

Visual identity:

- calm,
- trustworthy,
- stable,
- cyan/blue styling.

Purpose:

- preserve original quality,
- exact restoration possible,
- moderate optimization.

Smart Shrink

Visual identity:

- powerful,
- aggressive,
- high-efficiency,
- purple/electric styling.

Purpose:

- maximize storage reduction,
- visually usable output,
- non-byte-identical restoration.

The contrast between these two modes should be visually obvious everywhere they appear.

---

PART 3 — CORE FEATURES

Authentication System

Users must be able to:

- register,
- log in,
- maintain authenticated sessions,
- and access only their own files.

Requirements:

- JWT authentication,
- bcrypt password hashing,
- protected API routes,
- session expiration handling,
- secure token storage.

---

Intelligent File Upload System

The platform must support:

- drag-and-drop uploads,
- multi-file upload,
- progress tracking,
- file categorization,
- and duplicate detection.

Supported formats:

- Images: JPG, JPEG, PNG, WEBP
- Videos: MP4, MOV, AVI
- Documents: PDF, DOCX, TXT
- Archives: ZIP

Maximum file size:
100MB per file.

All MIME types must be validated server-side using magic bytes.

---

Duplicate Detection Engine

The backend must:

- compute SHA-256 hashes for uploaded files,
- detect duplicate content,
- isolate duplicates from compression workflows,
- and provide duplicate removal tools.

Duplicates:

- must never enter compression pipelines,
- must never be processed independently,
- and must be visualized separately in analytics.

---

Compression Center

Compression must genuinely reduce file size.

The platform must support:

- intelligent recommendations,
- selectable compression modes,
- per-file progress,
- integrity verification,
- and before/after comparisons.

Compression must support:

- images,
- documents,
- videos,
- text files,
- and archives.

If optimized output becomes larger than the original:

- preserve the original,
- mark the file as already optimized,
- and avoid replacement.

---

Compression Modes

Lossless Vault

- Preserves original quality
- Exact restoration possible
- Moderate storage savings
- Best for important files and documents

Smart Shrink

- Aggressive optimization
- Maximum storage reduction
- Near-original restoration
- Best for large media and old files

---

File Protection System

All protection operations must occur server-side only.

Requirements:

- AES-256-GCM protection,
- secure key storage,
- protected file management,
- restore-on-download,
- and protection status tracking.

Protection keys must never be exposed to the frontend.

---

Analytics Dashboard

Analytics should visualize:

- storage usage,
- compression savings,
- duplicate reduction,
- protection coverage,
- category distribution,
- and compression efficiency.

Charts should be animated and visually polished.

---

Restoration System

Users must be able to:

- download originals,
- download compressed outputs,
- restore protected files,
- and recover optimized content.

Restoration policies:

- Lossless Vault → exact restoration
- Smart Shrink → near-original restoration

---

PART 4 — TECHNICAL REQUIREMENTS

Mandatory Technology Stack

Frontend

- React
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Recharts
- Axios
- Zustand
- React Router DOM

Backend

- Python 3.11+
- Flask
- Flask-CORS
- Flask-JWT-Extended
- Flask-Limiter
- Flask-SQLAlchemy
- SQLAlchemy ORM

Database

- SQLite

Compression & Processing

- Pillow
- PyMuPDF
- python-docx
- ffmpeg-python
- zipfile
- zlib

Protection & Validation

- bcrypt
- cryptography
- hashlib SHA-256

---

Compression Logic Requirements

The implementation must include:

- lossless optimization workflows,
- aggressive optimization workflows,
- video compression using FFmpeg,
- image conversion support,
- archive recompression,
- and integrity verification.

Video compression must gracefully disable itself if FFmpeg is unavailable.

---

Integrity Verification Requirements

Every compressed file must pass validation before acceptance.

Validation examples:

- image verification,
- PDF open tests,
- ZIP integrity checks,
- video ffprobe validation,
- decompression verification.

Corrupted outputs must:

- be deleted automatically,
- preserve originals safely,
- and trigger visible error feedback.

---

Security Requirements

The system must enforce:

- JWT-protected APIs,
- ownership validation,
- MIME validation,
- rate limiting,
- upload size restrictions,
- UUID file storage,
- and restricted CORS access.

Executable uploads must be rejected.

---

PART 5 — AUTOMATED SETUP & DEPENDENCY INSTALLATION

One-Command Setup Requirement

The project must include automated setup scripts so a developer can:

1. clone the repository,
2. run a single setup command,
3. and immediately start the application.

Dependencies must install automatically.

---

Required Setup Scripts

setup.sh

Must:

- install backend dependencies,
- install frontend dependencies,
- prepare the environment automatically.

setup.bat

Windows equivalent of setup.sh.

start.sh

Must:

- start backend server,
- start frontend server,
- and run both concurrently.

start.bat

Windows equivalent of start.sh.

---

Environment Requirements

The project must support:

- ".env" configuration,
- fallback defaults,
- auto-created SQLite database,
- and automatic creation of upload/compression/protection folders.

---

Required Dependency Support

The implementation must automatically install:

- frontend dependencies,
- backend dependencies,
- and all required package managers.

FFmpeg is the only allowed manual dependency.

---

Required Backend Dependencies

Flask==3.0.3
Flask-CORS==4.0.1
Flask-JWT-Extended==4.6.0
Flask-Limiter==3.7.0
Flask-SQLAlchemy==3.1.1
SQLAlchemy==2.0.31
Werkzeug==3.0.3
bcrypt==4.1.3
cryptography==42.0.8
Pillow==10.4.0
PyMuPDF==1.24.9
python-docx==1.1.2
ffmpeg-python==0.2.0
python-magic-bin==0.4.14 ; sys_platform == "win32"
python-magic==0.4.27 ; sys_platform != "win32"

---

Required Frontend Dependencies

react
react-dom
typescript
vite
tailwindcss
framer-motion
lucide-react
recharts
axios
zustand
react-router-dom
@types/react
@types/react-dom
autoprefixer
postcss

---

.gitignore Requirement

# Node
node_modules/
dist/

# Python
__pycache__/
*.pyc
*.db
*.sqlite3
venv/
.env

# Generated Files
uploads/
compressed/
encrypted/
logs/

# IDE
.vscode/
.idea/

# OS
.DS_Store
Thumbs.db

---

PART 6 — CODING AGENT FREEDOM CLAUSE

The coding agent has full freedom to design:

- folder structure,
- component architecture,
- API organization,
- internal abstractions,
- state management structure,
- and implementation details.

As long as:

- all required features,
- security requirements,
- technical constraints,
- and product behaviors

are fully implemented.

The implementation should prioritize:

- maintainability,
- scalability,
- clean architecture,
- polished UX,
- responsive performance,
- and stable compression workflows.

Avoid unnecessary boilerplate and overengineering.

---

PART 7 — HACKATHON DEMO FLOW

1. User opens CompressIQ AI
2. Animated splash screen loads
3. User logs in or creates account
4. Landing page introduces the platform
5. User launches dashboard
6. User uploads mixed files
7. Duplicate files are instantly detected
8. Analytics populate automatically
9. User enters Compression Center
10. AI recommendations appear
11. Compression mode selected
12. Real compression occurs live
13. Storage savings visualized
14. User protects files
15. Restoration system demonstrated
16. Analytics dashboard presented live

---

Closing Statement

CompressIQ AI is not just a file compressor.

It is an intelligent storage optimization ecosystem that combines:

- AI-powered recommendations,
- real compression workflows,
- analytics visualization,
- duplicate management,
- restoration systems,
- and modern storage optimization

into a single premium platform experience.

The goal is to make storage optimization feel intelligent, modern, and accessible — transforming a technical systems problem into a seamless AI-powered workflow.