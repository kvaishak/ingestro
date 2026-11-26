/**
 * Country knowledge.
 *
 * ISO_ALPHA2: all 249 two-letter codes. Every code is a valid target, not only those that happen
 * to appear in a given file (the data is a black box). Hand-written because the browser cannot
 * enumerate region codes.
 *
 * countryCodeFor(): maps a spelling to its code. The spellings are NOT hand-written per country:
 * the browser's own locale data (Intl.DisplayNames) provides the name of every country in
 * English and in a few other languages. Only a short list of abbreviations is written by hand.
 * Matching is exact after trim and lowercase; anything unknown returns undefined, never a guess.
 */

const CODES = `AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ
CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR
GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP
KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT
MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW
SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG
UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW`

export const ISO_ALPHA2: ReadonlySet<string> = new Set(CODES.split(/\s+/))

/** Languages whose country names we accept. English plus the languages of the countries in the brief's examples. */
const NAME_LANGUAGES = ['en', 'de', 'fr', 'es', 'it', 'nl', 'pl']

/** Common short forms that no locale table contains. */
const ABBREVIATIONS: Record<string, string> = {
  'uk': 'GB',
  'great britain': 'GB',
  'britain': 'GB',
  'usa': 'US',
  'u.s.': 'US',
  'u.s.a.': 'US',
  'united states of america': 'US',
  'holland': 'NL',
  'the netherlands': 'NL',
}

const codeBySpelling: Map<string, string> = buildSpellingTable()

export function countryCodeFor(value: string): string | undefined {
  return codeBySpelling.get(normalise(value))
}

function normalise(value: string): string {
  return value.trim().toLowerCase()
}

function buildSpellingTable(): Map<string, string> {
  const table = new Map<string, string>()

  for (const code of ISO_ALPHA2) table.set(code.toLowerCase(), code)

  for (const language of NAME_LANGUAGES) {
    const names = new Intl.DisplayNames([language], { type: 'region' })
    for (const code of ISO_ALPHA2) {
      const name = names.of(code)
      // Intl returns the code itself when it has no name for it; skip those.
      if (name && name !== code) table.set(normalise(name), code)
    }
  }

  for (const [spelling, code] of Object.entries(ABBREVIATIONS)) table.set(spelling, code)

  return table
}
