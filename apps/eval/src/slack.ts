/**
 * Slack Webhook Utilities
 *
 * Usage:
 *   import { sendSlackMessage, sendSlackAlert, sendSlackBlocks } from './slack'
 *
 *   await sendSlackMessage('Hello from my app!')
 *   await sendSlackAlert('Something went wrong', 'error')
 */

// ============================================================================
// Configuration
// ============================================================================

function getSlackWebhookUrl(): string | null {
  return process.env.SLACK_WEBHOOK_URL ?? null
}

// ============================================================================
// Types
// ============================================================================

export interface SlackBlock {
  type: 'header' | 'section' | 'divider' | 'context' | 'actions' | 'image' | string
  text?: { type: 'plain_text' | 'mrkdwn'; text: string; emoji?: boolean }
  block_id?: string
  fields?: { type: 'plain_text' | 'mrkdwn'; text: string }[]
  elements?: SlackBlockElement[]
  accessory?: SlackBlockElement
  image_url?: string
  alt_text?: string
}

export interface SlackBlockElement {
  type: string
  text?: { type: 'plain_text' | 'mrkdwn'; text: string; emoji?: boolean }
  action_id?: string
  url?: string
  value?: string
  style?: 'primary' | 'danger'
}

export type AlertSeverity = 'error' | 'warning' | 'success' | 'info'

const SEVERITY_CONFIG: Record<AlertSeverity, { emoji: string }> = {
  error: { emoji: ':x:' },
  warning: { emoji: ':warning:' },
  success: { emoji: ':white_check_mark:' },
  info: { emoji: ':information_source:' },
}

// ============================================================================
// Core Functions
// ============================================================================

/** Check if Slack notifications are enabled */
export function isSlackEnabled(): boolean {
  return !!getSlackWebhookUrl()
}

/** Send a simple text message to Slack */
export async function sendSlackMessage(text: string): Promise<void> {
  await sendToSlack({ text })
}

/** Send a formatted alert with severity level (error, warning, success, info) */
export async function sendSlackAlert(
  message: string,
  severity: AlertSeverity = 'info',
): Promise<void> {
  const { emoji } = SEVERITY_CONFIG[severity]
  const timestamp = new Date().toISOString()

  await sendSlackBlocks([
    {
      type: 'section',
      text: { type: 'mrkdwn', text: `${emoji} *${severity.toUpperCase()}*: ${message}` },
    },
    {
      type: 'context',
      elements: [{ type: 'mrkdwn', text: { type: 'mrkdwn', text: `_${timestamp}_` } }],
    },
  ])
}

/** Send a message with custom Slack Block Kit blocks */
export async function sendSlackBlocks(blocks: SlackBlock[]): Promise<void> {
  await sendToSlack({ blocks })
}

// ============================================================================
// Internal
// ============================================================================

async function sendToSlack(payload: { text?: string; blocks?: SlackBlock[] }): Promise<void> {
  const webhookUrl = getSlackWebhookUrl()
  if (!webhookUrl) {
    return // Silently skip if no webhook configured
  }

  const response = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    console.warn(`Slack webhook failed: ${response.status} ${response.statusText}`)
  }
}

// ============================================================================
// Convenience Builders
// ============================================================================

/** Create a header block */
export function slackHeader(text: string): SlackBlock {
  return { type: 'header', text: { type: 'plain_text', text, emoji: true } }
}

/** Create a text section block */
export function slackSection(markdown: string): SlackBlock {
  return { type: 'section', text: { type: 'mrkdwn', text: markdown } }
}

/** Create a divider block */
export function slackDivider(): SlackBlock {
  return { type: 'divider' }
}

/** Create a context block with muted text */
export function slackContext(text: string): SlackBlock {
  return { type: 'context', elements: [{ type: 'mrkdwn', text: { type: 'mrkdwn', text } }] }
}

/** Create a section with multiple fields (displayed in columns) */
export function slackFields(fields: Record<string, string>): SlackBlock {
  return {
    type: 'section',
    fields: Object.entries(fields).map(([label, value]) => ({
      type: 'mrkdwn' as const,
      text: `*${label}*\n${value}`,
    })),
  }
}
