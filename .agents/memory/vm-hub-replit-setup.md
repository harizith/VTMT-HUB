---
name: VM-HUB Replit setup quirks
description: Package-manager and preview-origin issues encountered while running the imported VM-HUB repository in Replit.
---

- The checked-in Bun lockfile uses a format rejected by the bundled Bun version. The repo README recommends pnpm, but the pinned Next.js release was blocked by Replit's package firewall; using the compatible latest Next.js and eslint-config-next release allowed installation. Do not bypass the firewall.
- Next.js development mode blocks Replit preview origins for HMR unless they are listed in `allowedDevOrigins`. Include `127.0.0.1` and the current `REPLIT_DEV_DOMAIN`.
- Replit's web preview needs `[[ports]]` with `localPort = 5000` and `externalPort = 80`. Workflow configuration can rewrite `.replit`; verify the mapping remains after workflow changes.

**Why:** The app could serve locally while the Replit URL still returned a gateway error until the external port mapping persisted.

**How to apply:** For preview failures, verify the actual bound port, `.replit` port mapping, and allowed HMR origins. For installs, follow the repo's documented package manager and current framework guidance.
