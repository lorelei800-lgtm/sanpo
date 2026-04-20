/**
 * seed-spots.mjs — Post seed sanpo spots to Re:Earth CMS.
 *
 * Usage:
 *   node scripts/seed-spots.mjs [--limit <n>]
 *
 * Prerequisites:
 *   1. Re:Earth CMS has a `sanpo-spot` model configured with the fields
 *      documented in the repo README.
 *   2. app/.env has VITE_CMS_BASE_URL, VITE_CMS_PROJECT, VITE_CMS_TOKEN set.
 *   3. data/seed-spots.json exists at the repo root.
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const envPath = path.join(__dirname, '..', '.env')
if (!fs.existsSync(envPath)) {
  console.error('.env file not found. Copy .env.example to .env and fill in credentials.')
  process.exit(1)
}

const env = {}
for (const line of fs.readFileSync(envPath, 'utf8').split('\n')) {
  const match = line.match(/^([A-Z_]+)=(.*)$/)
  if (match) env[match[1]] = match[2].trim()
}

const BASE_URL   = env['VITE_CMS_BASE_URL']
const PROJECT    = env['VITE_CMS_PROJECT']
const SPOT_MODEL = env['VITE_CMS_SPOT_MODEL'] || 'sanpo-spot'
const TOKEN      = env['VITE_CMS_TOKEN']

if (!BASE_URL || !PROJECT || !TOKEN) {
  console.error('VITE_CMS_BASE_URL, VITE_CMS_PROJECT, VITE_CMS_TOKEN must all be set in .env')
  process.exit(1)
}

const [WS, PROJ] = PROJECT.split('/')
const ITEMS_URL  = `${BASE_URL}/api/${WS}/projects/${PROJ}/models/${SPOT_MODEL}/items`

console.log('Config:')
console.log(`  BASE_URL: ${BASE_URL}`)
console.log(`  WORKSPACE: ${WS}`)
console.log(`  PROJECT: ${PROJ}`)
console.log(`  MODEL: ${SPOT_MODEL}`)
console.log('')

const args = process.argv.slice(2)
const limitArg = parseInt(args[args.indexOf('--limit') + 1] ?? '50', 10)

const seedPath = path.join(__dirname, '..', '..', 'data', 'seed-spots.json')
if (!fs.existsSync(seedPath)) {
  console.error(`seed-spots.json not found at ${seedPath}`)
  process.exit(1)
}

const spots = JSON.parse(fs.readFileSync(seedPath, 'utf8')).slice(0, limitArg)
console.log(`Seeding ${spots.length} spot(s)`)

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

async function createItem(fields) {
  const res = await fetch(ITEMS_URL, {
    method: 'POST',
    headers: {
      Authorization:  `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ fields }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`${res.status} ${res.statusText}: ${body}`)
  }
  return res.status === 204 ? 'ok' : (await res.json()).id ?? 'ok'
}

let success = 0
let failed  = 0

for (const spot of spots) {
  const fields = [
    { key: 'title',           value: spot.title },
    { key: 'description',     value: spot.description ?? '' },
    { key: 'lat',             value: spot.lat },
    { key: 'lng',             value: spot.lng },
    { key: 'photo_url',       value: spot.photo_url },
    { key: 'category',        value: spot.category },
    { key: 'discovered_at',   value: spot.discovered_at },
    { key: 'discoverer_name', value: spot.discoverer_name },
    { key: 'address_hint',    value: spot.address_hint ?? '' },
    { key: 'vibe',            value: spot.vibe ?? '' },
  ]

  try {
    await createItem(fields)
    console.log(`  ok  ${spot.title}`)
    success++
  } catch (err) {
    console.error(`  err ${spot.title}: ${err.message}`)
    failed++
  }

  await sleep(300)
}

console.log(`\nDone: ${success} succeeded, ${failed} failed`)
