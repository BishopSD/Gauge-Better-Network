# Gauge Better Network

## Source status

Initial import from the prepared November 14, 2026 contributor source archive. This is a source baseline; equivalence to the current hosted website has not been verified. Importing this repository does not deploy or change the live website.

The local preview supports layout and navigation review. It does not provide working submissions, payments, or account access. The Worker source references production-generated `ownerDigest` and `files` values and requires authenticated hosting and a `BUCKET` binding; it is not a standalone deployment bundle.

Current sourcing direction includes U.S. and international suppliers, with transparent country of origin and comparisons of fully landed costs. Review older site copy against that direction before launch.

Gauge Better Network connects California builders with steel suppliers and independent installation teams. Read [the vision and project workflow](public/vision.html) or open the page in the local preview.

## Run the website locally

From the repository root, run `python3 -m http.server 8000 --bind 127.0.0.1 --directory public` and open http://localhost:8000. Use this preview to test layouts, links, and browser interactions. Authenticated submissions and private records require the hosted Worker and its storage binding.

## Find the code

The homepage and shared styles live in `public/index.html` and `public/styles.css`. The skilled-professional pages live in `public/labor/`. The hosted API lives in `worker/api.js`. Production identity and deployment configuration are managed separately from the contributor download.

## Propose an improvement

Fork the repository, create a branch, and make one focused change. Test the affected flow locally with fictional examples. Open a pull request against the default branch and complete the review template. For a first contribution, try the homepage workflow on a narrow screen or navigate it using only a keyboard. Keep real plans, contact records, and resumes out of issues and screenshots.
