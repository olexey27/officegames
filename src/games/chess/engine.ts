// "Sharkfish" — a small chess AI on top of chess.js (which handles all the
// rules). Negamax with alpha-beta, capture-first ordering and iterative
// deepening under a time budget. Difficulty = search depth/time + an
// intentional blunder rate on the friendly levels.

import { Chess, type Move } from 'chess.js'

export type ChessLevel = 'Beginner' | 'Casual' | 'Club' | 'Pro'

export const CHESS_LEVELS: Record<ChessLevel, { timeMs: number; maxDepth: number; blunder: number; label: string }> = {
  Beginner: { timeMs: 150, maxDepth: 1, blunder: 0.45, label: 'makes human mistakes' },
  Casual: { timeMs: 250, maxDepth: 2, blunder: 0.15, label: 'relaxed lunch-break level' },
  Club: { timeMs: 600, maxDepth: 3, blunder: 0, label: 'solid club player' },
  Pro: { timeMs: 1200, maxDepth: 4, blunder: 0, label: 'thinks ahead — good luck' },
}

const PIECE_VALUE: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 }

// Simplified piece-square tables (white perspective, index 0 = a8).
const PST: Record<string, number[]> = {
  p: [
    0, 0, 0, 0, 0, 0, 0, 0,
    50, 50, 50, 50, 50, 50, 50, 50,
    10, 10, 20, 30, 30, 20, 10, 10,
    5, 5, 10, 25, 25, 10, 5, 5,
    0, 0, 0, 20, 20, 0, 0, 0,
    5, -5, -10, 0, 0, -10, -5, 5,
    5, 10, 10, -20, -20, 10, 10, 5,
    0, 0, 0, 0, 0, 0, 0, 0,
  ],
  n: [
    -50, -40, -30, -30, -30, -30, -40, -50,
    -40, -20, 0, 0, 0, 0, -20, -40,
    -30, 0, 10, 15, 15, 10, 0, -30,
    -30, 5, 15, 20, 20, 15, 5, -30,
    -30, 0, 15, 20, 20, 15, 0, -30,
    -30, 5, 10, 15, 15, 10, 5, -30,
    -40, -20, 0, 5, 5, 0, -20, -40,
    -50, -40, -30, -30, -30, -30, -40, -50,
  ],
  b: [
    -20, -10, -10, -10, -10, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 10, 10, 5, 0, -10,
    -10, 5, 5, 10, 10, 5, 5, -10,
    -10, 0, 10, 10, 10, 10, 0, -10,
    -10, 10, 10, 10, 10, 10, 10, -10,
    -10, 5, 0, 0, 0, 0, 5, -10,
    -20, -10, -10, -10, -10, -10, -10, -20,
  ],
  r: [
    0, 0, 0, 0, 0, 0, 0, 0,
    5, 10, 10, 10, 10, 10, 10, 5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    -5, 0, 0, 0, 0, 0, 0, -5,
    0, 0, 0, 5, 5, 0, 0, 0,
  ],
  q: [
    -20, -10, -10, -5, -5, -10, -10, -20,
    -10, 0, 0, 0, 0, 0, 0, -10,
    -10, 0, 5, 5, 5, 5, 0, -10,
    -5, 0, 5, 5, 5, 5, 0, -5,
    0, 0, 5, 5, 5, 5, 0, -5,
    -10, 5, 5, 5, 5, 5, 0, -10,
    -10, 0, 5, 0, 0, 0, 0, -10,
    -20, -10, -10, -5, -5, -10, -10, -20,
  ],
  k: [
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -30, -40, -40, -50, -50, -40, -40, -30,
    -20, -30, -30, -40, -40, -30, -30, -20,
    -10, -20, -20, -20, -20, -20, -20, -10,
    20, 20, 0, 0, 0, 0, 20, 20,
    20, 30, 10, 0, 0, 10, 30, 20,
  ],
}

const MATE = 100000

/** Static evaluation from White's point of view, in centipawns. */
export function evaluate(chess: Chess): number {
  let score = 0
  const board = chess.board()
  for (let row = 0; row < 8; row++) {
    for (let file = 0; file < 8; file++) {
      const piece = board[row][file]
      if (!piece) continue
      const index = row * 8 + file
      const mirrored = (7 - row) * 8 + file
      const value = PIECE_VALUE[piece.type]
      if (piece.color === 'w') score += value + PST[piece.type][index]
      else score -= value + PST[piece.type][mirrored]
    }
  }
  return score
}

function orderedMoves(chess: Chess): Move[] {
  const moves = chess.moves({ verbose: true })
  return moves.sort((a, b) => {
    const av = a.captured ? PIECE_VALUE[a.captured] - PIECE_VALUE[a.piece] / 10 : -1
    const bv = b.captured ? PIECE_VALUE[b.captured] - PIECE_VALUE[b.piece] / 10 : -1
    return bv - av
  })
}

class TimeUp extends Error {}

function negamax(chess: Chess, depth: number, alpha: number, beta: number, sign: number, deadline: number, ply: number): number {
  if (Date.now() > deadline) throw new TimeUp()
  const moves = orderedMoves(chess)
  if (moves.length === 0) {
    if (chess.inCheck()) return -MATE + ply // being mated: worse when sooner
    return 0 // stalemate
  }
  if (depth === 0) return sign * evaluate(chess)
  let best = -Infinity
  for (const move of moves) {
    chess.move(move)
    let score: number
    try {
      score = -negamax(chess, depth - 1, -beta, -alpha, -sign, deadline, ply + 1)
    } finally {
      chess.undo()
    }
    if (score > best) best = score
    if (best > alpha) alpha = best
    if (alpha >= beta) break
  }
  return best
}

/**
 * Pick a move for the side to play. Iterative deepening under a time cap —
 * the last fully searched depth wins. `blunder` sometimes plays a random
 * legal move instead (that's what makes Beginner beatable).
 */
export function bestMove(chess: Chess, level: { timeMs: number; maxDepth: number; blunder: number }): Move | null {
  const moves = orderedMoves(chess)
  if (moves.length === 0) return null
  if (Math.random() < level.blunder) {
    return moves[Math.floor(Math.random() * moves.length)]
  }
  const sign = chess.turn() === 'w' ? 1 : -1
  const deadline = Date.now() + level.timeMs
  let best: Move = moves[0]
  for (let depth = 1; depth <= level.maxDepth; depth++) {
    let depthBest: Move | null = null
    let depthScore = -Infinity
    try {
      for (const move of moves) {
        chess.move(move)
        let score: number
        try {
          score = -negamax(chess, depth - 1, -Infinity, Infinity, -sign, deadline, 1)
        } finally {
          chess.undo()
        }
        if (score > depthScore) {
          depthScore = score
          depthBest = move
        }
      }
      if (depthBest) best = depthBest // depth fully searched
    } catch (error) {
      if (error instanceof TimeUp) break
      throw error
    }
  }
  return best
}

export const PIECE_GLYPHS: Record<string, string> = {
  wk: '♔', wq: '♕', wr: '♖', wb: '♗', wn: '♘', wp: '♙',
  bk: '♚', bq: '♛', br: '♜', bb: '♝', bn: '♞', bp: '♟',
}
