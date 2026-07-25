export type ClassValue = string | false | null | undefined | ClassValue[]

export function cx(...values: ClassValue[]): string {
  let result = ''
  for (const value of values) {
    if (!value) continue
    const part = Array.isArray(value) ? cx(...value) : value
    if (part) result = result ? `${result} ${part}` : part
  }
  return result
}
