import { selectDictOptionByCode } from '@/api/dictoption'

export const toDictValue = (value) => String(value == null ? '' : value).trim()

const normalizeSingleOption = (item) => {
  const label = String(item?.label || item?.name || item?.text || '').trim()
  const value = toDictValue(item?.value ?? item?.code ?? item?.dictValue)
  const sort = Number(item?.sort ?? item?.orderNum ?? 0)
  if (!label || !value) return null
  return { label, value, sort }
}

export const normalizeDictOptions = (list, fallback = []) => {
  const sourceList = Array.isArray(list) ? list : []
  const normalized = sourceList
    .map((item) => normalizeSingleOption(item))
    .filter(Boolean)
    .sort((a, b) => a.sort - b.sort)

  if (normalized.length > 0) return normalized

  return (Array.isArray(fallback) ? fallback : [])
    .map((item) => normalizeSingleOption(item))
    .filter(Boolean)
    .sort((a, b) => a.sort - b.sort)
}

export const buildDictLabelMap = (options) => {
  const map = {}
  ;(options || []).forEach((item) => {
    const key = toDictValue(item?.value)
    if (!key) return
    map[key] = String(item?.label || '').trim()
  })
  return map
}

export const findDictLabel = (options, value, fallbackLabel = '--') => {
  const key = toDictValue(value)
  if (!key) return fallbackLabel
  const option = (options || []).find((item) => toDictValue(item?.value) === key)
  return String(option?.label || '').trim() || fallbackLabel
}

export const loadDictOptionsByCode = async (code, fallback = []) => {
  try {
    const res = await selectDictOptionByCode(code)
    return normalizeDictOptions(res?.data, fallback)
  } catch {
    return normalizeDictOptions([], fallback)
  }
}

export const loadDictOptionBundle = async (bundleConfig) => {
  const entries = Object.entries(bundleConfig || {})
  if (!entries.length) return {}

  const results = await Promise.allSettled(
    entries.map(([, config]) => selectDictOptionByCode(String(config?.code || '').trim())),
  )

  const bundle = {}
  results.forEach((result, index) => {
    const [key, config] = entries[index]
    bundle[key] =
      result.status === 'fulfilled'
        ? normalizeDictOptions(result.value?.data, config?.fallback || [])
        : normalizeDictOptions([], config?.fallback || [])
  })
  return bundle
}
