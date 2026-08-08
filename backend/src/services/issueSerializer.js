export function serializeIssue(issue, { includeSolutions = true } = {}) {
  if (!issue) return null

  return {
    id: issue.id,
    number: issue.number,
    slug: issue.slug,
    title: issue.title,
    theme: issue.theme,
    status: issue.status,
    coverImageUrl: issue.coverImageUrl,
    editorNote: issue.editorNote,
    articleTitle: issue.articleTitle,
    articleBody: issue.articleBody,
    teaser: issue.teaser,
    sourceStory: includeSolutions ? issue.sourceStory : undefined,
    publishedAt: issue.publishedAt,
    createdAt: issue.createdAt,
    updatedAt: issue.updatedAt,
    puzzles: [...(issue.puzzles ?? [])]
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map((puzzle) => ({
        id: puzzle.id,
        type: puzzle.type,
        title: puzzle.title,
        prompt: puzzle.prompt,
        puzzle: puzzle.puzzle,
        // ponytail: readers still see answers embedded in `puzzle` for trivia-style types,
        // which is what the client scores against. Move scoring server-side to close that.
        solution: includeSolutions ? puzzle.solution : undefined,
        hints: puzzle.hints,
        sortOrder: puzzle.sortOrder,
      })),
  }
}
