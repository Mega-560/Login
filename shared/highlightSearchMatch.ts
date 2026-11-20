export interface SearchMatchSegment {
  readonly text: string
  readonly isMatch: boolean
}

export function highlightSearchMatch(text: string, query: string): SearchMatchSegment[] {
  const queryText = query.trim()
  const searchTerm = queryText.toLocaleLowerCase()
  if (!searchTerm) return [{ text, isMatch: false }]

  const normalizedText = text.toLocaleLowerCase()
  const sourceStarts: number[] = []
  const sourceEnds: number[] = []
  let sourceIndex = 0
  for (const character of text) {
    const normalizedCharacter = character.toLocaleLowerCase()
    for (let index = 0; index < normalizedCharacter.length; index += 1) {
      sourceStarts.push(sourceIndex)
      sourceEnds.push(sourceIndex + character.length)
    }
    sourceIndex += character.length
  }
  if (normalizedText.length !== sourceStarts.length) return [{ text, isMatch: false }]

  const highlightedParts: SearchMatchSegment[] = []
  let sourceCursor = 0
  let searchIndex = 0
  let matchIndex = normalizedText.indexOf(searchTerm, searchIndex)

  while (matchIndex !== -1) {
    const sourceStart = sourceStarts[matchIndex]
    const sourceEnd = sourceEnds[matchIndex + searchTerm.length - 1]
    if (sourceStart > sourceCursor) {
      highlightedParts.push({ text: text.slice(sourceCursor, sourceStart), isMatch: false })
    }
    highlightedParts.push({ text: text.slice(sourceStart, sourceEnd), isMatch: true })
    sourceCursor = sourceEnd
    searchIndex = matchIndex + searchTerm.length
    matchIndex = normalizedText.indexOf(searchTerm, searchIndex)
  }

  if (sourceCursor === 0) return [{ text, isMatch: false }]
  if (sourceCursor < text.length) {
    highlightedParts.push({ text: text.slice(sourceCursor), isMatch: false })
  }
  return highlightedParts
}
