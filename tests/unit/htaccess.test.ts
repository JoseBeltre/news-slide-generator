import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('public/.htaccess (§8.6)', () => {
  const ht = readFileSync(new URL('../../public/.htaccess', import.meta.url), 'utf8')

  it('hace fallback del SPA a index.html', () => {
    expect(ht).toMatch(/RewriteRule \. \/index\.html \[L\]/)
  })

  it('no cachea index.html, sw.js ni manifest.webmanifest', () => {
    expect(ht).toContain('index\\.html|sw\\.js|manifest\\.webmanifest')
    expect(ht).toContain('Header set Cache-Control "no-cache"')
  })

  it('cachea /assets/ un año e inmutable', () => {
    expect(ht).toContain('max-age=31536000, immutable')
  })
})
