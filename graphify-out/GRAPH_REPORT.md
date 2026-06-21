# Graph Report - Bagan-Turnamen  (2026-06-21)

## Corpus Check
- 19 files · ~31,225 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 101 nodes · 97 edges · 17 communities (13 shown, 4 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8362fe22`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Tournament Bracket Views|Tournament Bracket Views]]
- [[_COMMUNITY_Application Setup Wizard|Application Setup Wizard]]
- [[_COMMUNITY_Project Package Configuration|Project Package Configuration]]
- [[_COMMUNITY_Project Production Dependencies|Project Production Dependencies]]
- [[_COMMUNITY_Development Tooling and Types|Development Tooling and Types]]
- [[_COMMUNITY_Database Backup Configuration|Database Backup Configuration]]
- [[_COMMUNITY_Documentation and Static Assets|Documentation and Static Assets]]
- [[_COMMUNITY_Subcollection Backup Utilities|Subcollection Backup Utilities]]
- [[_COMMUNITY_Vercel Deployment Routing|Vercel Deployment Routing]]
- [[_COMMUNITY_Custom SVG Assets|Custom SVG Assets]]
- [[_COMMUNITY_React Logo Asset|React Logo Asset]]
- [[_COMMUNITY_Vite Logo Asset|Vite Logo Asset]]
- [[_COMMUNITY_Community 16|Community 16]]

## God Nodes (most connected - your core abstractions)
1. `📖 PANDUAN OPERASIONAL WASIT` - 8 edges
2. `scripts` - 5 edges
3. `Bagan Turnamen Layangan` - 5 edges
4. `App()` - 3 edges
5. `roundLabel()` - 3 edges
6. `MatchCard()` - 3 edges
7. `SetupWizard()` - 3 edges
8. `⚔️ 3. Manajemen Pertandingan Live (Match Controls)` - 3 edges
9. `🏆 4. Pencatatan Pemenang & Skor` - 3 edges
10. `backupSubcollections()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `Panduan Operasional Wasit (MD)` --semantically_similar_to--> `Panduan Operasional Wasit (PDF)`  [INFERRED] [semantically similar]
  panduan_wasit.md → panduan_wasit.pdf

## Import Cycles
- None detected.

## Communities (17 total, 4 thin omitted)

### Community 0 - "Tournament Bracket Views"
Cohesion: 0.21
Nodes (8): page, params, BracketColumn(), CLR, FinalColumn(), firebaseConfig, PrintPage(), roundLabel()

### Community 1 - "Application Setup Wizard"
Cohesion: 0.27
Nodes (7): cn(), MatchCard(), cn(), SetupWizard(), App(), cn(), firebaseConfig

### Community 2 - "Project Package Configuration"
Cohesion: 0.20
Nodes (9): name, private, scripts, build, dev, lint, preview, type (+1 more)

### Community 3 - "Project Production Dependencies"
Cohesion: 0.20
Nodes (10): dependencies, autoprefixer, clsx, firebase, lucide-react, postcss, react, react-dom (+2 more)

### Community 4 - "Development Tooling and Types"
Cohesion: 0.20
Nodes (10): devDependencies, eslint, @eslint/js, eslint-plugin-react-hooks, eslint-plugin-react-refresh, globals, @types/react, @types/react-dom (+2 more)

### Community 5 - "Database Backup Configuration"
Cohesion: 0.22
Nodes (7): app, auth, db, env, envContent, envPath, firebaseConfig

### Community 6 - "Documentation and Static Assets"
Cohesion: 0.17
Nodes (10): Favicon Icon, Hero Graphic (Stacked Isometric Squares), src/main.jsx, Panduan Operasional Wasit (MD), Panduan Operasional Wasit (PDF), Bagan Turnamen Layangan, Cara Hosting di Vercel, Fitur Utama (+2 more)

### Community 7 - "Subcollection Backup Utilities"
Cohesion: 0.50
Nodes (4): backup(), backupSubcollections(), db, serviceAccount

### Community 16 - "Community 16"
Cohesion: 0.15
Nodes (12): 🔐 1. Hak Akses & Login Wasit, ⚙️ 2. Membuat Bagan Otomatis (Setup Wizard), ⚔️ 3. Manajemen Pertandingan Live (Match Controls), 🏆 4. Pencatatan Pemenang & Skor, ⚙️ 5. Fitur Khusus & Koreksi Darurat, 🗃️ 6. Pengarsipan & Riwayat Turnamen, A. Jika Mode Normal (1 Nyawa) Aktif:, A. Tombol Kontrol Pertandingan (Hanya Wasit) (+4 more)

## Knowledge Gaps
- **61 isolated node(s):** `envPath`, `envContent`, `env`, `firebaseConfig`, `app` (+56 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Project Production Dependencies` to `Project Package Configuration`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Development Tooling and Types` to `Project Package Configuration`?**
  _High betweenness centrality (0.044) - this node is a cross-community bridge._
- **What connects `envPath`, `envContent`, `env` to the rest of the system?**
  _61 weakly-connected nodes found - possible documentation gaps or missing edges._