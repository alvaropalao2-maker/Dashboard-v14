import { createContext, useCallback, useContext } from 'react'
import es from '../i18n/es'

/** 'en' | 'es' — provided by App from the Language setting. */
export const LangContext = createContext('en')

const MONTHS_ES = { Jan: 'Ene', Feb: 'Feb', Mar: 'Mar', Apr: 'Abr', May: 'May', Jun: 'Jun', Jul: 'Jul', Aug: 'Ago', Sep: 'Sep', Oct: 'Oct', Nov: 'Nov', Dec: 'Dic' }
const DAYS_ES = { Mon: 'Lun', Tue: 'Mar', Wed: 'Mié', Thu: 'Jue', Fri: 'Vie', Sat: 'Sáb', Sun: 'Dom' }
const HAS_MONTH = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/

/** Dictionary keys that hold {placeholders} also match text that was already filled in and stored. */
let patterns
const getPatterns = () => {
  if (patterns) return patterns
  patterns = Object.keys(es)
    .filter((k) => /\{\w+\}/.test(k))
    .map((k) => {
      const names = []
      const source = k
        .split(/(\{\w+\})/)
        .map((part) => {
          const m = /^\{(\w+)\}$/.exec(part)
          if (!m) return part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
          names.push(m[1])
          return '(.+?)'
        })
        .join('')
      return { re: new RegExp(`^${source}$`), tpl: es[k], names }
    })
  return patterns
}

/** Months and weekdays that slip through the dictionary ("17 Apr, 2026", "Mon"). */
const localizeDates = (text) => {
  if (DAYS_ES[text]) return DAYS_ES[text]
  return text.replace(/(\d{1,2}\s)?\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/g, (all, day, m) =>
    day ? day + MONTHS_ES[m].toLowerCase() : MONTHS_ES[m],
  )
}

const lookup = (text) => {
  if (es[text] !== undefined) return es[text]
  for (const { re, tpl, names } of getPatterns()) {
    const m = re.exec(text)
    if (m) return tpl.replace(/\{(\w+)\}/g, (_, k) => lookup(m[names.indexOf(k) + 1] ?? ''))
  }
  return HAS_MONTH.test(text) || DAYS_ES[text] ? localizeDates(text) : text
}

const fill = (text, vars) => text.replace(/\{(\w+)\}/g, (all, k) => (k in vars ? vars[k] : all))

/** Translate `text` (English source) into `lang`. Unknown text and non-strings pass through untouched. */
export function translate(lang, text, vars) {
  if (typeof text !== 'string') return text
  const out = lang === 'es' ? lookup(text) : text
  return vars ? fill(out, vars) : out
}

export const useLang = () => useContext(LangContext)

/** `const tr = useTr()` then `tr('Save changes')` or `tr('Hello {name}', { name })`. */
export function useTr() {
  const lang = useContext(LangContext)
  return useCallback((text, vars) => translate(lang, text, vars), [lang])
}
