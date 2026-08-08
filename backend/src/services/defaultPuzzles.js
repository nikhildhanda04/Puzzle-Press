export const puzzleTypes = [
  'crossword',
  'maze',
  'word-search',
  'spelling-bee',
  'connections',
  'trivia',
  'logic',
  'reasoning',
]

export function defaultPuzzle(type, theme = 'Retro Gaming') {
  const titleByType = {
    crossword: `${theme} Crossword`,
    maze: `${theme} Maze`,
    'word-search': `${theme} Word Search`,
    trivia: `${theme} Trivia`,
    logic: `${theme} Logic Puzzle`,
    reasoning: `${theme} Reasoning Page`,
    'spelling-bee': `${theme} Spelling Bee`,
    connections: `${theme} Connections`,
  }

  const puzzleByType = {
    crossword: {
      size: 7,
      entries: [
        { clue: `A key ${theme} word`, answer: theme.replace(/\s+/g, '').slice(0, 7).toUpperCase(), direction: 'across', row: 0, col: 0 },
        { clue: 'A printed puzzle hint', answer: 'CLUE', direction: 'down', row: 0, col: 1 },
      ],
    },
    maze: {
      rows: 7,
      cols: 7,
      start: [0, 0],
      finish: [6, 6],
      walls: [[0, 2], [1, 2], [2, 2], [2, 4], [3, 4], [4, 1], [4, 2], [5, 4]],
    },
    'word-search': {
      grid: ['RETROXX', 'PUZZLEX', 'THEMEXX', 'MAGAZIN', 'ARCADEZ', 'BORDERX', 'CLUEBOX'],
      words: ['RETRO', 'PUZZLE', 'THEME', 'ARCADE', 'CLUE'],
    },
    trivia: {
      questions: [
        {
          question: `Which word best matches this issue theme: ${theme}?`,
          options: [theme, 'Weather report', 'Tax filing', 'Bus ticket'],
          answer: theme,
        },
      ],
    },
    logic: {
      setup: `Three editors arranged the ${theme} pages: article, maze, and trivia. The maze was not first. Trivia came after the article. What was first?`,
      choices: ['Article', 'Maze', 'Trivia'],
      answer: 'Article',
    },
    // Letters A C D E O R T with R required. DECORATE is the pangram.
    'spelling-bee': {
      letters: ['A', 'C', 'D', 'E', 'O', 'R', 'T'],
      center: 'R',
      minLength: 4,
      words: [
        'CARD', 'CART', 'CRATE', 'TRADE', 'ARCADE', 'RECORD', 'DECOR',
        'ACTOR', 'TRACE', 'REACT', 'DOCTOR', 'CARROT', 'DECORATE',
      ],
      pangrams: ['DECORATE'],
    },
    connections: {
      groups: [
        { category: 'Parts of an arcade cabinet', words: ['JOYSTICK', 'MARQUEE', 'TRACKBALL', 'COINBOX'] },
        { category: 'Chess pieces', words: ['KING', 'QUEEN', 'BISHOP', 'ROOK'] },
        { category: 'Card games', words: ['BRIDGE', 'HEARTS', 'RUMMY', 'SOLITAIRE'] },
        { category: 'Board games', words: ['LUDO', 'SCRABBLE', 'CLUEDO', 'MONOPOLY'] },
      ],
    },
    reasoning: {
      questions: [
        {
          difficulty: 'easy',
          question: 'What number continues the series? 2, 6, 12, 20, 30, ?',
          options: ['36', '40', '42', '46'],
          answer: '42',
          explanation: 'The gaps grow by two each step: 4, 6, 8, 10, then 12. So 30 + 12 = 42.',
        },
        {
          difficulty: 'medium',
          question: `All puzzles in this ${theme} issue are themed. No themed puzzle is untitled. Which statement must be true?`,
          options: [
            'No puzzle in this issue is untitled.',
            'Every themed puzzle is in this issue.',
            'Some puzzles in this issue are untitled.',
            'Every untitled puzzle is themed.',
          ],
          answer: 'No puzzle in this issue is untitled.',
          explanation: 'Each puzzle here is themed, and nothing themed is untitled, so nothing here can be untitled. The others reverse the statements or contradict them.',
        },
        {
          difficulty: 'medium',
          question: `The four ${theme} pages are the article, the maze, the crossword, and the trivia, printed in some order. The article is first. The maze is not last. The crossword comes immediately after the maze. The trivia is not second. Which page is last?`,
          options: ['Article', 'Maze', 'Crossword', 'Trivia'],
          answer: 'Trivia',
          explanation: 'The maze sits second or third. If it were third the crossword would be fourth and the trivia second, which is not allowed. So the maze is second, the crossword third, and the trivia last.',
        },
      ],
    },
  }

  return {
    type,
    title: titleByType[type],
    prompt: '',
    puzzle: puzzleByType[type],
    solution: puzzleByType[type],
    hints: [`Keep every clue tied to ${theme}.`],
  }
}
