import b from 'https://unpkg.com/bss@1?module'
import O from 'https://unpkg.com/patchinko@4/immutable.mjs'

import './linq.js'
import { mount } from './myosis.js'

b.setDebug(true)

b.css(
  'html',
  `
  ff monospace
  bc #999
  c white
  `
)

b.helper(
  'fillParent',
  b`
  position absolute
  top 0
  bottom 0
  left 0
  right 0
  `
)

b.helper(
  'flexCenter',
  b`
  display flex
  align-items center
  justify-content center
  `
)

b.helper(
  'inlineFlexCenter',
  b`
  display inline-flex
  align-items center
  justify-content center
  `
)

b.helper('alignContentBottom', b.d('flex').ai('flex-end'))

const p = (...args) => (console.log(...args), args[0])

const random = x => Math.ceil(Math.random() * x)

const prevent = (_, e) => e.preventDefault()

const parseJson = json => {
  try {
    return JSON.parse(json)
  } catch {
    return {}
  }
}

const processEnum = (name, members) => {
  const out = {}
  members.forEach(m => (out[m] = `${name}(${m})`))
  return Object.freeze(out)
}

const playSound = (sound, volume = 0.2) => {
  const audio = new Audio()
  audio.volume = volume
  audio.src = sound
  audio.play()
}

const sounds = {
  click: () => playSound('https://freesound.org/data/previews/67/67088_931386-lq.mp3'),
  flag: () => playSound('https://freesound.org/data/previews/13/13290_3669-lq.mp3')
}

const Faces = processEnum('Faces', ['Smiling', 'Standby', 'Attentive'])

const colorMap = {
  1: 'blue',
  2: 'red',
  3: 'green',
  4: 'purple',
  5: 'salmon',
  6: 'hotpink',
  7: 'darkgrey',
  8: 'black'
}

function* iterateBoard(board) {
  for (let x = 0; x < board.length; x++) {
    for (let y = 0; y < board[x].length; y++) {
      yield [board[x][y], x, y]
    }
  }
}

function* iterateNeighbors(board, x, y) {
  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      const neighbor = (board[x + i] || [])[y + j]
      if (neighbor) yield [neighbor, x + i, y + j]
    }
  }
}

const GenerateBoard = (height, width, numMines) => {
  if (numMines > height * width) throw 'Too many mines m8'

  const setMine = () => {
    const sq = board[random(board.length - 1)][random(board[0].length - 1)]
    return sq.mine ? false : (sq.mine = true)
  }

  const countNearbyMines = (oX, oY) =>
    iterateNeighbors(board, oX, oY).count(([neighbor]) => neighbor.mine)

  const board = Array(height)
    .fill()
    .map(() =>
      Array(width)
        .fill()
        .map(() => ({
          flagged: false,
          uncovered: false,
          mine: false,
          empty: false
        }))
    )

  while (--numMines) {
    while (!setMine()) {}
  }

  iterateBoard(board)
    .where(([sq]) => !sq.mine)
    .forEach(([sq, x, y]) => {
      let count = countNearbyMines(x, y)
      if (count < 1) sq.empty = true
      sq.nearbyMines = count || '-'
    })

  return board
}

const FlagBlock = (state, sq) => {
  if (sq.uncovered) return
  sounds.flag()
  sq.flagged = !sq.flagged
  return {}
}

const Restart = state => ({
  rows: GenerateBoard(state.height, state.width, state.numMines),
  lost: false,
  numFlags: 0
})

const uncoverBlankNeighbors = (board, x, y, inner = false) => {
  if (!inner && board[x][y].empty) inner = true
  iterateNeighbors(board, x, y)
    .where(([neighbor]) => !neighbor.uncovered && (inner || neighbor.empty))
    .forEach(([neighbor, nX, nY]) => {
      neighbor.uncovered = true
      neighbor.flagged = false
      if (neighbor.empty) {
        uncoverBlankNeighbors(board, nX, nY, true)
      }
    })
}

const UncoverBlock = (state, sq, x, y) => {
  if (sq.flagged) {
    sq.flagged = false
    return {}
  }
  sq.uncovered = true
  if (sq.mine) {
    iterateBoard(state.rows)
      .where(([sq]) => !sq.flagged && sq.mine)
      .forEach(([sq]) => (sq.uncovered = true))
    return { lost: true }
  }
  uncoverBlankNeighbors(state.rows, x, y)
  return {}
}

const ClickBlock = (state, e, sq, x, y) => {
  if (e.button === 2) return FlagBlock(state, sq)
  sounds.click()
  if (sq.uncovered) {
    if (!sq.empty) {
      const neighbors = iterateNeighbors(state.rows, x, y).toArray()
      if (neighbors.count(([neighbor]) => neighbor.flagged) !== sq.nearbyMines) return
      return (
        neighbors
          .where(([neighbor]) => !neighbor.flagged)
          .select(([neighbor, nX, nY]) => UncoverBlock(state, neighbor, nX, nY))
          .find(res => res.lost) || {}
      )
    }
    return
  }
  return UncoverBlock(state, sq, x, y)
}

const SetSmiling = state => ({ face: Faces.Smiling })
const SetAttentive = state => ({ face: Faces.Attentive })
const SetStandby = state => ({ face: Faces.Standby })

const WonLost = state => [
  'div' +
    b`
    z-index 10
    background-color rgba(0,0,0,0.5)
    flex-direction row
    ta center
    fs 400%
    fw bold
    m 2
  `.fillParent.flexCenter,
  {
    onmousedown: SetSmiling,
    onmouseup: SetStandby,
    onclick: Restart
  },
  [
    'div',
    state.lost ? '💩 You Lost 💩' : '🎉 You Won! 🎉',
    ['div' + b.fs('40%'), 'Click to play again.']
  ]
]

const Square = (state, sq, row, col) => [
  'div' +
    b
      .p(2)
      .d('inline-block')
      .cursor(!sq.empty && 'pointer'),
  {
    oncontextmenu: prevent,
    onmouseup: (state, e) => (sq.uncovered && sq.empty) || ClickBlock(state, e, sq, row, col)
  },
  [
    'div' +
      b`
      w 25
      h 25
      lh 25
      fw bold
    `.inlineFlexCenter
        .bc(sq.uncovered && sq.empty ? '#999' : '#eee')
        .c(colorMap[sq.nearbyMines]),
    sq.flagged
      ? ['div' + b.position('absolute').ff('50%'), state.lost ? (sq.mine ? '✔️' : '❌') : '🚩']
      : '',
    [
      'div' +
        b
          .visibility(!sq.uncovered && 'hidden')
          .c(sq.empty && (sq.uncovered && sq.empty ? '#999' : '#eee')),
      sq.mine ? '💣' : sq.nearbyMines
    ]
  ]
]

const MineField = state => [
  'div' +
    b`
    d inline-block
    position relative
    w ${state.width * 29}
  `,
  (state.lost || state.won) && WonLost(state),
  state.rows.map((row, rowIdx) => ['div', row.map((sq, sqIdx) => Square(state, sq, rowIdx, sqIdx))])
]

const StatusBar = state => [
  'div' +
    b`
    d flex
    jc space-between
    fs 250%
  `,
  ['span' + b.alignContentBottom, '💣 ', state.numMines],
  [
    'div' + b.d('inline-block'),
    [
      'div' + b.cursor('pointer'),
      {
        onmousedown: SetSmiling,
        onmouseup: SetStandby,
        onmouseleave: SetStandby,
        onclick: Restart
      },
      state.face === Faces.Smiling
        ? '😊'
        : state.lost
          ? '😴'
          : state.face === Faces.Attentive
            ? '😮'
            : '😑'
    ],
    ['div' + b.fs('120%'), state.remainingSquares]
  ],
  ['span' + b.alignContentBottom, state.numFlags, ' 🚩']
]

const MineSweeper = state => [
  'div' +
    b
      .ta('center')
      .userSelect('none')
      .$media('(min-width: 768px)', b.fillParent.flexCenter),
  {
    onmousedown: SetAttentive,
    onmouseup: SetStandby
  },
  ['div' + b.d('inline-block'), StatusBar(state), MineField(state)]
]

const ls = parseJson(localStorage.v1)

const init = O(
  {
    lost: false,
    won: false,
    face: Faces.Standby
  },
  ls,
  {
    height: 15,
    width: 18,
    numMines: 40
  }
)

if (
  !init.rows ||
  init.rows.length !== init.height ||
  !init.rows[0] ||
  init.rows[0].length !== init.width
)
  init.rows = GenerateBoard(init.height, init.width, init.numMines)

mount({
  init,
  view: MineSweeper,
  onupdate: state => {
    localStorage.v1 = JSON.stringify(state)
    let remainingSquares = 0,
      numFlags = 0
    iterateBoard(state.rows).forEach(([sq]) => {
      if (!sq.uncovered && !sq.mine) remainingSquares += 1
      if (sq.flagged) numFlags += 1
    })
    return {
      remainingSquares,
      numFlags,
      won: remainingSquares === 0
    }
  },
  container: document.body
})
