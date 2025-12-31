/**
 * Shared prompt constants for puzzle generation and solution scripts.
 *
 * These constants ensure consistency between:
 * - Eval generators (which include these instructions in prompts)
 * - Solution generators (which strip these and replace with reasoning instructions)
 */

/**
 * Output format instructions for Sokoban puzzles.
 * Used in eval prompts, stripped by solution generators.
 */
export const SOKOBAN_OUTPUT_FORMAT_INSTRUCTIONS = `Provide moves as: U (up), D (down), L (left), R (right).

Example solution: UUDLRRRDLR

Output your final answer as a list of moves in backticks EXACTLY as follows at the end of your response:

ANSWER: \`<moves>\`

e.g.

ANSWER: \`RRULLDR\``

/**
 * Output format instructions for simple navigation puzzles.
 * Used in eval prompts, stripped by solution generators.
 */
export const SIMPLE_NAV_OUTPUT_FORMAT_INSTRUCTIONS = `## Output Format
Provide any solution path as a single string of moves.
Example format: LDRR

## Important
Adhere to concise reasoning and minimal output to avoid context window limits.

## Your Task
What sequence of moves gets the player from @ to G?

Output your final answer as a list of moves in backticks EXACTLY as follows at the end of your response:

ANSWER: \`<moves>\`

e.g.

ANSWER: \`RRULLDR\``
