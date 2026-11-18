<!-- Gauge Better Network | Contributor README -->
<p align="center">
  <img src="public/assets/gbn-steel-emblem.webp" alt="Gauge Better Network steel emblem" width="170">
</p>

<h1 align="center">Gauge Better Network (GBN)</h1>

<p align="center"><strong>The Best Estimates. The Strongest Partnerships.</strong></p>

<p align="center">
  A California-first connection network for structural-steel sourcing, independent estimates, installation crews, and skilled construction professionals.
</p>

<p align="center">
  <a href="#what-were-building">The vision</a> ·
  <a href="#project-map">Explore the files</a> ·
  <a href="#run-a-local-preview">Run locally</a> ·
  <a href="#help-build-gbn">Contribute</a> ·
  <a href="https://github.com/BishopSD/Gauge-Better-Network/issues">Open issues</a>
</p>

> **Project status: pre-launch / contributor preview.** This repository is a source baseline imported in November 2026. It is **not confirmed to match the current hosted site**. A local preview is useful for design and interaction testing, but **does not provide live project submissions, accounts, supplier quotes, or payments**. Please don't treat a visible form or checkout interface as a working production service.

## What we're building

**Gauge Better Network is a connector, not a steel seller or construction contractor.** We're building a simpler way for a builder with plans to find and compare the businesses and people needed to deliver a steel project.

The network aims to serve:

- **Builders and developers:** submit project requirements, request steel-material estimates, compare defined scopes, and find installation teams.
- **Manufacturers, distributors, fabricators, and suppliers:** be considered for project-specific material opportunities.
- **Independent contractors and crew companies:** respond to installation and labor opportunities, from whole crews to specialized services.
- **Skilled individuals:** superintendents, steel framers, ironworkers, and other tradespeople can join the worker network at no registration charge.

GBN begins with **California projects**, while its intended sourcing reach includes **U.S. and qualified international suppliers**. U.S. options are a priority, but useful comparisons should also identify country of origin, freight, tariffs, import costs, delivery timing, material specifications, and applicable compliance requirements. **Some current interface copy still reflects an older, more restrictive overseas-sourcing policy; it needs owner review before launch.**

### Intended project journey

```text
Builder / developer submits a project (free)
                  |
                  v
GBN reviews plans, scope, schedule and missing details
                  |
                  +----> Steel suppliers quote materials
                  |
                  +----> Independent contractors quote installation
                  |
                  v
GBN reviews estimates and helps compare scope, cost and timing
                  |
                  v
Builder selects the partners they want to work with
```

A project-specific fee **may** apply to access approved comparable supplier estimates, but the amount should be shown **before checkout**. Separate introduction or sourcing-service arrangements are negotiated privately with the relevant parties; they are not preset public commission percentages. **This describes the intended business workflow, not a claim that every step is already functional.**

For a visitor-facing explanation, see [Our vision and project workflow](public/vision.html).

## Project map

| File or folder | What you'll find |
| --- | --- |
| [`public/index.html`](public/index.html) | Main landing page, steel catalog, building applications, project entry points, and navigation |
| [`public/styles.css`](public/styles.css) | Shared layout, colors, responsive styling, and component styles |
| [`public/app.js`](public/app.js) | Main browser-side project, quote, installer, supplier, owner-dashboard, and checkout interface logic |
| [`public/network-ui.js`](public/network-ui.js) | Network/partner interface, public directory and guide UI; depends on hosted API endpoints |
| [`public/material-models.js`](public/material-models.js) | Interactive canvas-based steel/product model illustrations |
| [`public/labor/`](public/labor/) | Worker signup and builder-facing labor search UI |
| [`public/preview-pages/`](public/preview-pages/) | Informational pages for steel systems, building types, estimates, suppliers, and installers |
| [`public/legal/`](public/legal/) | Draft and preview legal/compliance notices — **not final legal approval** |
| [`public/assets/`](public/assets/) | Existing GBN branding, photographs, diagrams and steel images |
| [`public/preview-safety.js`](public/preview-safety.js) | Local-preview safety behavior |
| [`worker/api.js`](worker/api.js) | Partial hosted worker source for labor profiles and approved builder access; **not standalone-deployable** |
| [`.github/workflows/check.yml`](.github/workflows/check.yml) | GitHub Actions JavaScript syntax and visitor-entry checks |
| [`.github/pull_request_template.md`](.github/pull_request_template.md) | Checklist for describing and testing proposed changes |

**Architecture in brief:** the `public/` folder contains the browser interface. Many pages call `/api/...` endpoints whose full production services are **not included** in this contributor archive. The labor worker needs authenticated hosting, a `BUCKET` binding, and generated values such as `ownerDigest` and `files`. Do not add secrets or attempt a production deployment using this source baseline alone.

## Run a local preview

You'll need **Python 3** and a web browser. No package installation is required to preview the static website.

1. Clone the repository:
   ```bash
   git clone https://github.com/BishopSD/Gauge-Better-Network.git
   cd Gauge-Better-Network
   ```
2. Start a local server from the repository root:
   ```bash
   python3 -m http.server 8000 --bind 127.0.0.1 --directory public
   ```
3. Open **http://localhost:8000** in your browser. Check the homepage, catalog, 3D models, mobile navigation, informational pages and accessible interactions.

**Expected limitation:** forms and features requiring server authentication, saved records, private drawings, quote processing, supplier discovery or payments may fail in a local preview. This is not a working end-to-end staging environment. Use only fictional project and contact data while testing.

### Basic code checks

The repository already has a [GitHub Actions check](.github/workflows/check.yml) for JavaScript syntax and the visitor workflow link. To run a similar JavaScript syntax check locally with Node.js:

```bash
find public worker -name '*.js' -exec sh -ec 'for file do node --input-type=module --check < "$file" || exit 1; done' sh {} +
```

That command uses a Unix-like shell and validates syntax, **not** complete application behavior.

## Help build GBN

We welcome focused reviews and pull requests that improve usability, correctness, accessibility, and readiness for a safe first launch. You don't need to understand the whole business to help with one task.

**Good places to start:**

- [#1 — Review project-request forms on mobile and by keyboard](https://github.com/BishopSD/Gauge-Better-Network/issues/1) — marked *good first issue*.
- [#2 — Test the site code for mistakes](https://github.com/BishopSD/Gauge-Better-Network/issues/2).
- [#3 — Verify the builder submission → owner dashboard flow](https://github.com/BishopSD/Gauge-Better-Network/issues/3) — requires an appropriate hosted test environment.
- [#4 — Verify payment unlocks the correct project's estimate](https://github.com/BishopSD/Gauge-Better-Network/issues/4) — requires an appropriate payment-test environment; do **not** use live money for contributor tests.

Browse [all open issues](https://github.com/BishopSD/Gauge-Better-Network/issues) if you'd rather choose another task.

### How to contribute

1. **Open or claim an issue** and describe the specific improvement. Ask before working on anything that changes business rules or sensitive data handling.
2. **Fork** this repository and create a descriptive branch (for example, `fix/mobile-project-form`).
3. Make **one focused change** and avoid unrelated redesigns.
4. Test the affected page or workflow. Include exact reproduction steps, expected vs. actual results, and mobile screenshots when helpful. **Use fictional information only.**
5. Open a [pull request](https://github.com/BishopSD/Gauge-Better-Network/pulls) against `main` using the existing PR template. The owner reviews changes before merging.

**Particularly useful skills:** HTML/CSS, vanilla JavaScript, accessibility, responsive design, API integration, browser testing, security review, and clear technical documentation.

### Important review rules

- **Never commit** passwords, tokens, API keys, production settings, customer data, private construction plans, resumes, or contact lists.
- **Do not expose** project-share links or personal details in screenshots, GitHub issues, sample data, or logs.
- Changes to payments, data access, supplier vetting, sourcing policies, commissions, legal language, or public promises **must be flagged for owner approval**.
- Don't mark an untested submission, payment, or matching workflow as production-ready.
- GBN connects independent parties; the platform should not imply that it fabricates steel, performs engineering, employs crews, or guarantees contractor licensing or project compliance.

## Priorities before launch

- [ ] Verify the hosted site against this repository's current source.
- [ ] Validate project submission and owner receipt using a secure test environment.
- [ ] Validate supplier invitations, quote review and scope comparisons.
- [ ] Validate labor signup, builder authorization, resume privacy and withdrawal.
- [ ] Test project-specific checkout and unlock behavior in a payment sandbox.
- [ ] Reconcile international sourcing rules, origin disclosures, and legacy page copy.
- [ ] Review accessibility, narrow-screen usability, input validation and security.
- [ ] Finalize the legal pages, privacy practices, deployment and production monitoring.

These are **work items, not completed claims**.

## Licensing and contact

**No `LICENSE` file currently exists in this repository.** Public visibility on GitHub does not by itself grant permission to copy, redistribute, or deploy the code. Please contribute through issues and pull requests, and seek the owner's permission before reuse outside this project.

For project discussion, questions, bug reports, and contributions, use [GitHub Issues](https://github.com/BishopSD/Gauge-Better-Network/issues).

---

<p align="center"><strong>Gauge Better Network</strong><br>Better steel estimates. Stronger construction partnerships.<br><em>Built for the people who build.</em></p>
