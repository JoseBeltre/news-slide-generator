// Bots y buscadores (P9, §8.6): Google y Bing indexan solo /anuncios/publico; los robots de vista previa
// de las redes leen la página y la imagen "A"; los bots de IA reciben 403 y Disallow; el resto, Disallow.
import { readFileSync } from 'node:fs'
import { describe, expect, it } from 'vitest'

const read = (path: string) => readFileSync(new URL(`../../${path}`, import.meta.url), 'utf8')
const htaccess = read('public/.htaccess')
const robots = read('public/robots.txt')

const AI_BOTS = [
  'GPTBot', 'OAI-SearchBot', 'ChatGPT-User', 'ClaudeBot', 'Claude-User', 'Claude-SearchBot', 'anthropic-ai',
  'PerplexityBot', 'Perplexity-User', 'CCBot', 'Bytespider', 'Amazonbot', 'meta-externalagent', 'Applebot-Extended',
  'cohere-ai', 'Diffbot', 'YouBot', 'DuckAssistBot', 'MistralAI-User', 'Google-CloudVertexBot',
]
const PREVIEW_BOTS = [
  'facebookexternalhit', 'Facebot', 'WhatsApp', 'Twitterbot', 'Discordbot', 'TelegramBot', 'Slackbot-LinkExpanding',
  'LinkedInBot', 'Pinterestbot', 'SkypeUriPreview', 'Viber',
]

/** robots.txt → reglas por User-agent (un grupo puede nombrar varios agentes seguidos). */
function groups(text: string): Map<string, string[]> {
  const out = new Map<string, string[]>()
  let agents: string[] = []
  let inRules = false
  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/#.*/, '').trim()
    if (!line) continue
    const [key, ...rest] = line.split(':')
    const value = rest.join(':').trim()
    if (key!.toLowerCase() === 'user-agent') {
      if (inRules) agents = []
      inRules = false
      agents.push(value)
      out.set(value, out.get(value) ?? [])
    } else {
      inRules = true
      for (const a of agents) out.get(a)!.push(`${key!.trim()}: ${value}`)
    }
  }
  return out
}

describe('.htaccess', () => {
  const lines = htaccess.split(/\r?\n/).map((l) => l.trim())
  const index = (re: RegExp) => lines.findIndex((l) => re.test(l))

  it('bloquea con 403 a cada bot de IA', () => {
    const cond = lines.find((l) => l.startsWith('RewriteCond %{HTTP_USER_AGENT}'))!
    for (const bot of AI_BOTS) expect(cond, bot).toContain(bot)
    expect(lines[lines.indexOf(cond) + 1]).toBe('RewriteRule ^ - [F,L]')
    expect(index(/^RewriteCond %\{HTTP_USER_AGENT\}/)).toBeLessThan(index(/^RewriteRule \^anuncios\/publico/))
  })

  it('sirve /anuncios/publico con publico.html antes del fallback del SPA', () => {
    const rule = index(/^RewriteRule \^anuncios\/publico\/\?\$ \/publico\.html \[L\]$/)
    expect(rule).toBeGreaterThan(-1)
    expect(rule).toBeLessThan(index(/^RewriteRule \. \/index\.html/))
  })

  it('X-Robots-Tag noindex en todo salvo la página pública, con <If> (sin Header expr=, que LiteSpeed puede rechazar)', () => {
    const open = index(/^<If "%\{REQUEST_URI\} !~ m#\^\/\(anuncios\/publico\/\?\|publico\\\.html\|og-publico\\\.png\)\$#">$/)
    expect(open).toBeGreaterThan(-1)
    expect(lines[open + 1]).toBe('Header set X-Robots-Tag "noindex, nofollow"')
    expect(lines[open + 2]).toBe('</If>')
    expect(htaccess).not.toContain('expr=')
  })
})

describe('robots.txt', () => {
  const g = groups(robots)

  // Google-InspectionTool es la "Prueba de URL publicada" de Search Console: sin su grupo cae en `*` y queda bloqueada.
  it('Googlebot, Google-InspectionTool y Bingbot: solo la página pública, sus archivos y la imagen', () => {
    for (const bot of ['Googlebot', 'Google-InspectionTool', 'Bingbot']) {
      expect(g.get(bot), bot).toEqual(
        expect.arrayContaining(['Allow: /anuncios/publico', 'Allow: /publico.html', 'Allow: /assets/', 'Allow: /og-publico.png', 'Disallow: /']),
      )
    }
  })

  it('robots de vista previa: la página y la imagen', () => {
    for (const bot of PREVIEW_BOTS) {
      expect(g.get(bot), bot).toEqual(expect.arrayContaining(['Allow: /anuncios/publico', 'Allow: /publico.html', 'Allow: /og-publico.png', 'Disallow: /']))
    }
  })

  it('bots de IA y Google-Extended: Disallow sin ningún Allow', () => {
    for (const bot of [...AI_BOTS, 'Google-Extended']) expect(g.get(bot), bot).toEqual(['Disallow: /'])
  })

  it('el resto: Disallow', () => {
    expect(g.get('*')).toEqual(['Disallow: /'])
  })
})
