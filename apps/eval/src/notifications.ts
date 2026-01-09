/**
 * Eval completion notifications
 */

import {
  isSlackEnabled,
  sendSlackBlocks,
  slackContext,
  slackDivider,
  slackFields,
  slackHeader,
  slackSection,
} from './slack'
import type { EvalRun } from './types'

/**
 * Send a Slack notification when an eval run completes.
 */
export async function notifyEvalComplete(run: EvalRun): Promise<void> {
  if (!isSlackEnabled()) {
    return
  }

  const modelSummaries = Object.values(run.summary.byModel)
  const totalSolved = modelSummaries.reduce((sum, m) => sum + m.puzzlesSolved, 0)
  const totalPuzzles = modelSummaries.reduce((sum, m) => sum + m.puzzlesTotal, 0)
  const totalCost = modelSummaries.reduce((sum, m) => sum + m.totalCost, 0)
  const totalOutputTokens = modelSummaries.reduce((sum, m) => sum + m.totalOutputTokens, 0)

  // Calculate duration
  const durationMs = (run.completedAt ?? Date.now()) - run.startedAt
  const durationMin = Math.round((durationMs / 1000 / 60) * 10) / 10

  // Determine emoji based on solve rate
  const solveRate = totalPuzzles > 0 ? totalSolved / totalPuzzles : 0
  const emoji = solveRate >= 0.7 ? ':tada:' : solveRate >= 0.3 ? ':thinking_face:' : ':skull:'

  // Build model results section
  const modelResults = modelSummaries
    .map((m) => {
      const rate = m.puzzlesTotal > 0 ? Math.round((m.puzzlesSolved / m.puzzlesTotal) * 100) : 0
      const words = Math.round(m.totalOutputTokens * 0.75).toLocaleString()
      return `*${m.modelName}*: ${m.puzzlesSolved}/${m.puzzlesTotal} (${rate}%) · ${words} words · $${m.totalCost.toFixed(2)}`
    })
    .join('\n')

  const totalWords = Math.round(totalOutputTokens * 0.75).toLocaleString()

  await sendSlackBlocks([
    slackHeader(`${emoji} Eval Complete: ${run.puzzleFile}`),
    slackFields({
      Puzzles: `${run.puzzleCount}`,
      Duration: `${durationMin} min`,
      Solved: `${totalSolved}/${totalPuzzles} (${Math.round(solveRate * 100)}%)`,
      'Total Cost': `$${totalCost.toFixed(2)}`,
    }),
    slackDivider(),
    slackSection(modelResults),
    slackDivider(),
    slackContext(`Output: ${totalWords} words · ${totalOutputTokens.toLocaleString()} tokens`),
  ])
}

/**
 * Send a Slack notification when an eval fails.
 */
export async function notifyEvalFailed(error: string, puzzleFile: string): Promise<void> {
  if (!isSlackEnabled()) {
    return
  }

  await sendSlackBlocks([
    slackHeader(':x: Eval Failed'),
    slackSection(`*Dataset:* ${puzzleFile}\n*Error:* ${error}`),
    slackContext(new Date().toISOString()),
  ])
}
