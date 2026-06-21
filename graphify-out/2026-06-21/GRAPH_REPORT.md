# Graph Report - .  (2026-06-21)

## Corpus Check
- cluster-only mode — file stats not available

## Summary
- 83 nodes · 80 edges · 16 communities (12 shown, 4 thin omitted)
- Extraction: 94% EXTRACTED · 6% INFERRED · 0% AMBIGUOUS · INFERRED: 5 edges (avg confidence: 0.8)
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

## God Nodes (most connected - your core abstractions)
1. `scripts` - 5 edges
2. `App()` - 3 edges
3. `roundLabel()` - 3 edges
4. `MatchCard()` - 3 edges
5. `SetupWizard()` - 3 edges
6. `backupSubcollections()` - 2 edges
7. `backup()` - 2 edges
8. `cn()` - 2 edges
9. `BracketColumn()` - 2 edges
10. `FinalColumn()` - 2 edges

## Surprising Connections (you probably didn't know these)
- `Panduan Operasional Wasit (MD)` --semantically_similar_to--> `Panduan Operasional Wasit (PDF)`  [INFERRED] [semantically similar]
  panduan_wasit.md → panduan_wasit.pdf

## Import Cycles
- None detected.

## Communities (16 total, 4 thin omitted)

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
Cohesion: 0.29
Nodes (5): Favicon Icon, Hero Graphic (Stacked Isometric Squares), src/main.jsx, Panduan Operasional Wasit (MD), Panduan Operasional Wasit (PDF)

### Community 7 - "Subcollection Backup Utilities"
Cohesion: 0.50
Nodes (4): backup(), backupSubcollections(), db, serviceAccount

## Knowledge Gaps
- **48 isolated node(s):** `envPath`, `envContent`, `env`, `firebaseConfig`, `app` (+43 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **4 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Project Production Dependencies` to `Project Package Configuration`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **Why does `devDependencies` connect `Development Tooling and Types` to `Project Package Configuration`?**
  _High betweenness centrality (0.065) - this node is a cross-community bridge._
- **What connects `envPath`, `envContent`, `env` to the rest of the system?**
  _48 weakly-connected nodes found - possible documentation gaps or missing edges._