import type { MoveDirection, Position, SokobanLevel } from '../types'

export interface SolverResult {
  solvable: boolean
  solution: MoveDirection[] | null
  moveCount: number
  nodesExplored: number
  /** True if solver hit node limit without finding solution (puzzle may still be solvable) */
  hitLimit: boolean
}

interface SolverState {
  playerPos: Position
  boxes: Position[]
  moves: MoveDirection[]
}

const DIRECTIONS: { direction: MoveDirection; dx: number; dy: number }[] = [
  { direction: 'UP', dx: 0, dy: -1 },
  { direction: 'DOWN', dx: 0, dy: 1 },
  { direction: 'LEFT', dx: -1, dy: 0 },
  { direction: 'RIGHT', dx: 1, dy: 0 },
]

/**
 * Precompute all "dead squares" - positions where a box can never be part of a solution.
 * A square is dead if:
 * 1. It's not a goal
 * 2. It forms a corner with walls (box would be stuck)
 *
 * Returns a Set of position keys "x,y" for O(1) lookup.
 */
function computeDeadSquares(level: SokobanLevel): Set<string> {
  const deadSquares = new Set<string>()

  for (let y = 0; y < level.height; y++) {
    for (let x = 0; x < level.width; x++) {
      const cell = level.terrain[y]?.[x]

      // Skip walls and goals
      if (cell === 'wall' || cell === 'goal') continue

      // Skip non-floor cells
      if (cell !== 'floor') continue

      // Check if this floor cell is a dead square (corner)
      const pos = { x, y }
      if (isCornerWithWalls(pos, level)) {
        deadSquares.add(`${x},${y}`)
      }
    }
  }

  // Also mark squares along walls that lead only to dead corners (simple dead lanes)
  // This is a simplified version - we mark squares along walls with no goals
  expandDeadLanes(deadSquares, level)

  return deadSquares
}

/**
 * Check if a position forms a corner with walls.
 */
function isCornerWithWalls(pos: Position, level: SokobanLevel): boolean {
  const up = level.terrain[pos.y - 1]?.[pos.x]
  const down = level.terrain[pos.y + 1]?.[pos.x]
  const left = level.terrain[pos.y]?.[pos.x - 1]
  const right = level.terrain[pos.y]?.[pos.x + 1]

  const wallUp = up === 'wall' || up === undefined
  const wallDown = down === 'wall' || down === undefined
  const wallLeft = left === 'wall' || left === undefined
  const wallRight = right === 'wall' || right === undefined

  return (
    (wallUp && wallLeft) ||
    (wallUp && wallRight) ||
    (wallDown && wallLeft) ||
    (wallDown && wallRight)
  )
}

/**
 * Expand dead squares along wall edges that have no goals.
 * If a box is pushed along a wall and there's no goal along that wall segment,
 * and both ends are corners/walls, the entire segment is dead.
 */
function expandDeadLanes(deadSquares: Set<string>, level: SokobanLevel): void {
  // Check horizontal lanes along top and bottom walls
  for (let y = 1; y < level.height - 1; y++) {
    // Check if this row has a wall above or below for its entire playable width
    let hasWallAbove = true
    let hasWallBelow = true
    let hasGoalInRow = false
    let rowStart = -1
    let rowEnd = -1

    for (let x = 0; x < level.width; x++) {
      const cell = level.terrain[y]?.[x]
      if (cell === 'floor' || cell === 'goal') {
        if (rowStart === -1) rowStart = x
        rowEnd = x
        if (cell === 'goal') hasGoalInRow = true

        const above = level.terrain[y - 1]?.[x]
        const below = level.terrain[y + 1]?.[x]
        if (above !== 'wall') hasWallAbove = false
        if (below !== 'wall') hasWallBelow = false
      }
    }

    // If entire row has wall above or below and no goals, mark non-corner cells as dead
    if ((hasWallAbove || hasWallBelow) && !hasGoalInRow && rowStart !== -1) {
      // Check if both ends are dead corners
      const leftEnd = deadSquares.has(`${rowStart},${y}`)
      const rightEnd = deadSquares.has(`${rowEnd},${y}`)

      if (leftEnd && rightEnd) {
        for (let x = rowStart; x <= rowEnd; x++) {
          const cell = level.terrain[y]?.[x]
          if (cell === 'floor') {
            deadSquares.add(`${x},${y}`)
          }
        }
      }
    }
  }

  // Check vertical lanes along left and right walls
  for (let x = 1; x < level.width - 1; x++) {
    let hasWallLeft = true
    let hasWallRight = true
    let hasGoalInCol = false
    let colStart = -1
    let colEnd = -1

    for (let y = 0; y < level.height; y++) {
      const cell = level.terrain[y]?.[x]
      if (cell === 'floor' || cell === 'goal') {
        if (colStart === -1) colStart = y
        colEnd = y
        if (cell === 'goal') hasGoalInCol = true

        const left = level.terrain[y]?.[x - 1]
        const right = level.terrain[y]?.[x + 1]
        if (left !== 'wall') hasWallLeft = false
        if (right !== 'wall') hasWallRight = false
      }
    }

    if ((hasWallLeft || hasWallRight) && !hasGoalInCol && colStart !== -1) {
      const topEnd = deadSquares.has(`${x},${colStart}`)
      const bottomEnd = deadSquares.has(`${x},${colEnd}`)

      if (topEnd && bottomEnd) {
        for (let y = colStart; y <= colEnd; y++) {
          const cell = level.terrain[y]?.[x]
          if (cell === 'floor') {
            deadSquares.add(`${x},${y}`)
          }
        }
      }
    }
  }
}

/**
 * Check for freeze deadlock - a 2x2 area where boxes/walls form an immovable block.
 * Returns true if the current box configuration creates a freeze deadlock.
 * @param newBoxes - The box positions AFTER the push (not before)
 */
function isFreezeDeadlock(newBoxes: Position[], level: SokobanLevel): boolean {
  const boxSet = new Set(newBoxes.map((b) => `${b.x},${b.y}`))

  // Check all 2x2 squares that contain any box
  for (const box of newBoxes) {
    // Check all four 2x2 squares that include this box
    const offsets = [
      { dx: 0, dy: 0 }, // box is top-left
      { dx: -1, dy: 0 }, // box is top-right
      { dx: 0, dy: -1 }, // box is bottom-left
      { dx: -1, dy: -1 }, // box is bottom-right
    ]

    for (const { dx, dy } of offsets) {
      const topLeft = { x: box.x + dx, y: box.y + dy }

      // Get all 4 cells of this 2x2 square
      const cells = [
        { x: topLeft.x, y: topLeft.y },
        { x: topLeft.x + 1, y: topLeft.y },
        { x: topLeft.x, y: topLeft.y + 1 },
        { x: topLeft.x + 1, y: topLeft.y + 1 },
      ]

      // Count boxes and walls, track if any box is on a goal
      let boxCount = 0
      let wallCount = 0
      let allBoxesOnGoals = true

      for (const cell of cells) {
        const terrain = level.terrain[cell.y]?.[cell.x]
        const isBox = boxSet.has(`${cell.x},${cell.y}`)

        if (terrain === 'wall' || terrain === undefined) {
          wallCount++
        } else if (isBox) {
          boxCount++
          if (terrain !== 'goal') {
            allBoxesOnGoals = false
          }
        }
      }

      // Freeze deadlock: 2x2 is filled with boxes/walls and not all boxes are on goals
      // Need at least 2 boxes for a freeze (1 box + walls is a corner, already detected)
      if (boxCount + wallCount === 4 && boxCount >= 2 && !allBoxesOnGoals) {
        return true
      }
    }
  }

  return false
}

/**
 * Solve a Sokoban puzzle using BFS (Breadth-First Search).
 * Returns the optimal (shortest) solution if one exists.
 *
 * @param level - The Sokoban level to solve
 * @param maxNodes - Maximum nodes to explore before giving up (default: 50000)
 * @returns SolverResult with solution if found
 */
export function solvePuzzle(level: SokobanLevel, maxNodes = 50000): SolverResult {
  // Precompute dead squares for this level
  const deadSquares = computeDeadSquares(level)

  const initialState: SolverState = {
    playerPos: { ...level.playerStart },
    boxes: level.boxStarts.map((b) => ({ ...b })),
    moves: [],
  }

  // Check if already solved
  if (isGoalState(initialState.boxes, level)) {
    return {
      solvable: true,
      solution: [],
      moveCount: 0,
      nodesExplored: 1,
      hitLimit: false,
    }
  }

  // Check if initial state has boxes on dead squares (unsolvable)
  for (const box of initialState.boxes) {
    if (deadSquares.has(`${box.x},${box.y}`)) {
      return {
        solvable: false,
        solution: null,
        moveCount: 0,
        nodesExplored: 1,
        hitLimit: false,
      }
    }
  }

  const visited = new Set<string>()
  visited.add(stateToHash(initialState))

  const queue: SolverState[] = [initialState]
  let nodesExplored = 0

  while (queue.length > 0 && nodesExplored < maxNodes) {
    const current = queue.shift()
    if (!current) break
    nodesExplored++

    // Try each direction
    for (const { direction, dx, dy } of DIRECTIONS) {
      const newPlayerPos = {
        x: current.playerPos.x + dx,
        y: current.playerPos.y + dy,
      }

      // Check if player can move there
      if (!isValidCell(newPlayerPos, level)) continue

      // Check if there's a box at the new player position
      const boxIndex = findBoxAt(newPlayerPos, current.boxes)

      let newBoxes = current.boxes
      if (boxIndex !== -1) {
        // There's a box - try to push it
        const newBoxPos = {
          x: newPlayerPos.x + dx,
          y: newPlayerPos.y + dy,
        }

        // Check if box can be pushed there
        if (!isValidCell(newBoxPos, level)) continue
        if (findBoxAt(newBoxPos, current.boxes) !== -1) continue

        // Check if pushing to a dead square
        if (deadSquares.has(`${newBoxPos.x},${newBoxPos.y}`)) continue

        // Push is valid - create new box array
        newBoxes = current.boxes.map((b, i) => (i === boxIndex ? newBoxPos : b))

        // Check for freeze deadlock (2x2 box/wall patterns)
        if (isFreezeDeadlock(newBoxes, level)) continue
      }

      const newState: SolverState = {
        playerPos: newPlayerPos,
        boxes: newBoxes,
        moves: [...current.moves, direction],
      }

      const hash = stateToHash(newState)
      if (visited.has(hash)) continue
      visited.add(hash)

      // Check if this is a goal state
      if (isGoalState(newBoxes, level)) {
        return {
          solvable: true,
          solution: newState.moves,
          moveCount: newState.moves.length,
          nodesExplored,
          hitLimit: false,
        }
      }

      queue.push(newState)
    }
  }

  // Determine if we hit the limit or exhausted all possibilities
  const hitLimit = nodesExplored >= maxNodes

  return {
    solvable: false,
    solution: null,
    moveCount: 0,
    nodesExplored,
    hitLimit,
  }
}

/**
 * Create a canonical hash string for a state.
 * Boxes are sorted to ensure same state produces same hash regardless of box order.
 */
function stateToHash(state: SolverState): string {
  const sortedBoxes = [...state.boxes].sort((a, b) => {
    if (a.y !== b.y) return a.y - b.y
    return a.x - b.x
  })
  const boxStr = sortedBoxes.map((b) => `${b.x},${b.y}`).join('|')
  return `${state.playerPos.x},${state.playerPos.y}:${boxStr}`
}

/**
 * Check if all boxes are on goal positions.
 */
function isGoalState(boxes: Position[], level: SokobanLevel): boolean {
  return boxes.every((box) => level.terrain[box.y]?.[box.x] === 'goal')
}

/**
 * Check if a position is a valid (non-wall) cell.
 */
function isValidCell(pos: Position, level: SokobanLevel): boolean {
  if (pos.x < 0 || pos.x >= level.width || pos.y < 0 || pos.y >= level.height) {
    return false
  }
  const cell = level.terrain[pos.y]?.[pos.x]
  return cell === 'floor' || cell === 'goal'
}

/**
 * Find the index of a box at the given position, or -1 if none.
 */
function findBoxAt(pos: Position, boxes: Position[]): number {
  return boxes.findIndex((b) => b.x === pos.x && b.y === pos.y)
}
