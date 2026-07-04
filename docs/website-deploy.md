# Website Deploy

The marketing website lives in `apps/website/` and deploys to the Cloudflare Worker service `writer-computer-website`.

## Configuration

- Worker config: `wrangler.jsonc`
- Worker name: `writer-computer-website`
- Static assets directory: `apps/website/dist/client`
- Production URL: configure a fork-owned domain or use the generated `workers.dev` URL.

The Worker name in Cloudflare must match `name` in `wrangler.jsonc` so local deploys update the intended service.

## Deploy Locally

Deploys are run manually from a local machine using Wrangler CLI. From the repository root:

```sh
vp install
vp run website#build
vp dlx wrangler deploy --config wrangler.jsonc
```

Wrangler must be logged into the Cloudflare account that owns `writer-computer-website`:

```sh
vp dlx wrangler login
```

Verify the deployment:

```sh
curl -I <your fork website URL>
```

## Notes

- Do not use GitHub Pages for this website.
- Do not rely on Cloudflare Git Builds for this website unless this document is updated first.
- Keep `wrangler.jsonc` at the repository root so local Wrangler deploys use the same Worker settings.
- Run `vp check` before deploying source changes when practical.
