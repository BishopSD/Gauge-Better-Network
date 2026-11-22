# GBN Five-State Action Hub

**Owner-approved 2026-11-21 expansion** of the Gauge Better Network California Action Hub concept. This is a standalone portable research edition, separate from the ChatGPT Sites-hosted project and from the production GBN backend.

## Markets
- California — original focus
- Texas — Houston, Dallas–Fort Worth, Austin, San Antonio, El Paso
- New York — New York City, Buffalo, Albany, Rochester, Syracuse
- Florida — Miami, Tampa, Orlando, Jacksonville, Fort Lauderdale
- Illinois — Chicago, Aurora, Joliet, Rockford, Peoria

All five markets are expandable. These are **selected expansion priorities**, not a claim that they are a definitive numerical ranking of steel tonnage by state.

## Included
- Searchable state and metro-market cards with sector filters
- Direct public-web research links for finding local commercial builders / contractors
- Editable builder outreach pipeline with company, business contact, website, status, notes and follow-up date
- Worldwide manufacturer / supplier directory, country-of-origin and capability fields
- CSV export/import and JSON backup/import
- Responsive larger-text design, accessible labels, keyboard-friendly navigation
- Zero external dependencies: the entire app is in [index.html](index.html)

## Own and use the app outside ChatGPT

1. Download **index.html** from this folder (open the file on GitHub, click **Raw**, and save it).
2. Double-click the downloaded HTML file. It runs directly in a modern browser, without ChatGPT, a server, or a subscription.
3. For a shareable website, host this file as your site's \`index.html\` on GitHub Pages, Cloudflare Pages, Netlify, or your own web host. A paid backend is not required for this research edition.
4. Export CSV or JSON backups regularly via the **Data & backup** screen. Browser records are stored locally in \`localStorage\` and are **not synchronized**, sent to the GBN website, or backed up automatically.

### GitHub Pages option

To host **only this Action Hub** without publishing unverified GBN website forms or backend assets:
- In your own GitHub account, make a separate Pages repository (for example \`gbn-action-hub\`).
- Copy this \`index.html\` to that repository's root directory.
- Go to repository **Settings → Pages**, choose **Deploy from a branch**, select \`main\` and \`/(root)\`, and save.
- Use the Pages address GitHub displays after deployment. Do not assume deployment or a public URL exists until GitHub confirms it.

This avoids changing or publishing the previously approved GBN main website.

## Limitations / safety

- **No sourced company-contact dataset is included.** The city list is a market research plan, not a list of verified prospects. Research and verify real company contacts before adding them.
- The application **does not contain every global steel manufacturer**, and it does not gather data automatically. That would require ongoing research, deduplication, permission/compliance review, and a maintained data service.
- There is **no working production API, user authentication, cloud storage, lead-sharing, outreach automation, quote processing, or payment integration** in this standalone file.
- Do not store private construction drawings, personal secrets, payment data, confidential supplier prices, or sensitive customer information in browser storage or public GitHub.
- Check suppliers' origin, products, applicable codes/standards, certifications, lead times, tariffs, freight and full landed costs project by project.
- The older GitHub repository is an imported baseline and is **not verified as identical** to the current ChatGPT Sites build. This new Action Hub file has not been merged into that Sites project.

## Future production path

Once the owner approves the research edition, choose an independently managed hosting and database provider; secure accounts, access roles, durable backups, verified business-contact data, and production APIs can then replace local-only storage. Keep all work separated from the approved GBN live website until those integrations have been verified.
