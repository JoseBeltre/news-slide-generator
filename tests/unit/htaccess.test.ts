import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

describe('public/.htaccess (§8.6)', () => {
  const ht = readFileSync(new URL('../../public/.htaccess', import.meta.url), 'utf8')

  it('hace fallback del SPA a index.html', () => {
    expect(ht).toMatch(/RewriteRule \. \/index\.html \[L\]/)
  })

  it('no cachea las páginas, los Service Workers ni manifest.webmanifest', () => {
    const files = /<FilesMatch "\^\(([^)]+)\)\$">/.exec(ht)![1]!.split('|')
    for (const f of ['index\\.html', 'publico\\.html', 'sw\\.js', 'publico-sw\\.js', 'manifest\\.webmanifest']) expect(files).toContain(f)
    expect(ht).toContain('Header set Cache-Control "no-cache"')
  })

  it('cachea /assets/ un año e inmutable', () => {
    expect(ht).toContain('max-age=31536000, immutable')
  })
})
