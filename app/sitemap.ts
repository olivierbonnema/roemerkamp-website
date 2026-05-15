import type { MetadataRoute } from 'next'
import { execFileSync } from 'child_process'
import path from 'path'

const BASE = 'https://www.nonbancaireleningen.nl'
const root = process.cwd()

function gitDate(file: string): Date {
  try {
    const out = execFileSync('git', ['log', '-1', '--format=%cI', '--', file], {
      encoding: 'utf8',
      cwd: root,
    }).trim()
    if (out) return new Date(out)
  } catch {
    // git not available (e.g. shallow clone without history) — fall through
  }
  return new Date()
}

function p(route: string): string {
  if (route === '') return path.join(root, 'app/page.tsx')
  return path.join(root, `app/${route}/page.tsx`)
}

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: BASE,
      lastModified: gitDate(p('')),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE}/voor-leningnemers`,
      lastModified: gitDate(p('voor-leningnemers')),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/voor-investeerders`,
      lastModified: gitDate(p('voor-investeerders')),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/financieringsaanvraag`,
      lastModified: gitDate(p('financieringsaanvraag')),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/contact`,
      lastModified: gitDate(p('contact')),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/over-ons`,
      lastModified: gitDate(p('over-ons')),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE}/berichten`,
      lastModified: gitDate(p('berichten')),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${BASE}/non-bancaire-hypotheek`,
      lastModified: gitDate(p('non-bancaire-hypotheek')),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/tweede-hypotheek-ondernemer`,
      lastModified: gitDate(p('tweede-hypotheek-ondernemer')),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/onderhandse-hypotheek`,
      lastModified: gitDate(p('onderhandse-hypotheek')),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/hypotheek-zonder-jaarcijfers`,
      lastModified: gitDate(p('hypotheek-zonder-jaarcijfers')),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/dga-hypotheek`,
      lastModified: gitDate(p('dga-hypotheek')),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/overbruggingsfinanciering-verbouwing`,
      lastModified: gitDate(p('overbruggingsfinanciering-verbouwing')),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/zzp-hypotheek`,
      lastModified: gitDate(p('zzp-hypotheek')),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/vastgoedfinanciering-zonder-bank`,
      lastModified: gitDate(p('vastgoedfinanciering-zonder-bank')),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/berichten/hypotheek-afgewezen-wat-nu`,
      lastModified: gitDate(p('berichten/hypotheek-afgewezen-wat-nu')),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE}/berichten/wat-is-non-bancaire-financiering`,
      lastModified: gitDate(p('berichten/wat-is-non-bancaire-financiering')),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE}/berichten/kosten-non-bancaire-hypotheek`,
      lastModified: gitDate(p('berichten/kosten-non-bancaire-hypotheek')),
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${BASE}/nadere-informatie`,
      lastModified: gitDate(p('nadere-informatie')),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    {
      url: `${BASE}/privacy`,
      lastModified: gitDate(p('privacy')),
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ]
}
