import { Button } from '@sokoban-eval-toolkit/ui-library/components/button'
import { Separator } from '@sokoban-eval-toolkit/ui-library/components/separator'
import type { GameState, HumanSession } from '@src/types'
import { isSimpleDeadlock } from '@src/utils/gameEngine'
import type { SavedLayout } from '@src/utils/layoutStorage'
import { AlertTriangle, ChevronLeft, ChevronRight, GripVertical, Trash2 } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'

interface ControlPanelProps {
  state: GameState | null
  // Saved layouts props
  savedLayouts?: SavedLayout[]
  layoutName?: string
  onLayoutNameChange?: (name: string) => void
  onSaveLayout?: () => void
  onLoadLayout?: (name: string) => void
  onDeleteLayout?: (name: string) => void
  onReorderLayouts?: (fromIndex: number, toIndex: number) => void
  selectedLayoutName?: string | null
  onSelectedLayoutChange?: (name: string | null) => void
  // Human session props
  humanSession?: HumanSession | null
  onStartSession?: () => void
  onEndSession?: () => void
}

export function ControlPanel({
  state,
  savedLayouts = [],
  layoutName = '',
  onLayoutNameChange,
  onSaveLayout,
  onLoadLayout,
  onDeleteLayout,
  onReorderLayouts,
  selectedLayoutName = null,
  onSelectedLayoutChange,
  humanSession,
  onStartSession,
  onEndSession,
}: ControlPanelProps) {
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null)

  const hasDeadlock = state ? isSimpleDeadlock(state) : false

  // Session elapsed time with live update
  const [sessionTick, setSessionTick] = useState(0)

  useEffect(() => {
    if (!humanSession?.isActive) return
    const interval = setInterval(() => setSessionTick((t) => t + 1), 1000)
    return () => clearInterval(interval)
  }, [humanSession?.isActive])

  const sessionTime = useMemo(() => {
    if (!humanSession?.isActive) return null
    void sessionTick // Trigger recalculation on tick
    const ms = Date.now() - humanSession.startTime
    const seconds = Math.floor(ms / 1000)
    const minutes = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${minutes}:${secs.toString().padStart(2, '0')}`
  }, [humanSession?.isActive, humanSession?.startTime, sessionTick])

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Game Stats
        </span>
      </div>

      {/* Deadlock warning */}
      {hasDeadlock && !state?.isWon && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-md px-3 py-2 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
          <div>
            <div className="text-amber-500 font-medium text-xs">Possible Deadlock</div>
            <div className="text-amber-500/70 text-[10px]">A box may be stuck. Try undoing.</div>
          </div>
        </div>
      )}

      {/* Human Session */}
      {onStartSession &&
        onEndSession &&
        (humanSession?.isActive ? (
          <>
            {/* Session stats */}
            <div className="bg-primary/10 border border-primary/30 rounded-md px-3 py-2 space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted-foreground uppercase tracking-wide">
                  Session Active
                </span>
                <span className="text-xs font-mono text-primary">{sessionTime}</span>
              </div>
              <div className="text-xs">
                <span className="text-muted-foreground">Steps: </span>
                <span className="font-semibold tabular-nums">{humanSession.totalSteps}</span>
              </div>
            </div>
            <Button
              onClick={onEndSession}
              size="sm"
              variant="secondary"
              className="w-full h-8 text-xs"
            >
              End Session
            </Button>
          </>
        ) : (
          <Button
            onClick={onStartSession}
            disabled={!state}
            size="sm"
            variant="secondary"
            className="w-full h-8 text-xs"
          >
            Start Session
          </Button>
        ))}

      {/* Saved Layouts section */}
      {onSaveLayout && onLoadLayout && onDeleteLayout && (
        <>
          <Separator />
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Saved Layouts
              </span>
              {/* Navigation controls */}
              {selectedLayoutName && savedLayouts.length > 1 && (
                <div className="flex items-center gap-0.5">
                  <Button
                    onClick={() => {
                      const currentIndex = savedLayouts.findIndex(
                        (l) => l.name === selectedLayoutName,
                      )
                      if (currentIndex > 0) {
                        const prevLayout = savedLayouts[currentIndex - 1]
                        if (prevLayout) {
                          onLoadLayout(prevLayout.name)
                          onSelectedLayoutChange?.(prevLayout.name)
                        }
                      }
                    }}
                    disabled={savedLayouts.findIndex((l) => l.name === selectedLayoutName) === 0}
                    size="sm"
                    variant="secondary"
                    className="h-5 px-1"
                    title="Previous layout"
                  >
                    <ChevronLeft className="w-3 h-3" />
                  </Button>
                  <Button
                    onClick={() => {
                      const currentIndex = savedLayouts.findIndex(
                        (l) => l.name === selectedLayoutName,
                      )
                      if (currentIndex < savedLayouts.length - 1) {
                        const nextLayout = savedLayouts[currentIndex + 1]
                        if (nextLayout) {
                          onLoadLayout(nextLayout.name)
                          onSelectedLayoutChange?.(nextLayout.name)
                        }
                      }
                    }}
                    disabled={
                      savedLayouts.findIndex((l) => l.name === selectedLayoutName) ===
                      savedLayouts.length - 1
                    }
                    size="sm"
                    variant="secondary"
                    className="h-5 px-1"
                    title="Next layout"
                  >
                    <ChevronRight className="w-3 h-3" />
                  </Button>
                </div>
              )}
            </div>

            {/* Save input and button */}
            <div className="flex gap-1.5">
              <input
                type="text"
                placeholder="Layout name..."
                value={layoutName}
                onChange={(e) => onLayoutNameChange?.(e.target.value)}
                className="flex-1 h-7 px-2 text-xs bg-background border border-border rounded focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <Button
                onClick={onSaveLayout}
                disabled={!layoutName.trim() || !state}
                size="sm"
                variant="secondary"
                className="h-7 px-2 text-xs"
              >
                Save
              </Button>
            </div>

            {/* Saved layouts list */}
            {savedLayouts.length > 0 ? (
              <div className="space-y-1">
                {savedLayouts.map((layout, index) => {
                  const isSelected = selectedLayoutName === layout.name
                  const isDragging = draggedIndex === index
                  const isDragOver = dragOverIndex === index && draggedIndex !== index
                  return (
                    <div
                      key={layout.id}
                      draggable={!!onReorderLayouts}
                      onDragStart={(e) => {
                        setDraggedIndex(index)
                        e.dataTransfer.effectAllowed = 'move'
                      }}
                      onDragEnd={() => {
                        if (draggedIndex !== null && dragOverIndex !== null) {
                          onReorderLayouts?.(draggedIndex, dragOverIndex)
                        }
                        setDraggedIndex(null)
                        setDragOverIndex(null)
                      }}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.dataTransfer.dropEffect = 'move'
                      }}
                      onDragEnter={() => setDragOverIndex(index)}
                      className={`group flex items-center gap-1 px-1.5 py-1.5 rounded-md transition-colors ${
                        isSelected
                          ? 'bg-primary/15 ring-1 ring-primary/30'
                          : 'bg-muted/40 hover:bg-muted/70'
                      } ${isDragging ? 'opacity-50' : ''} ${isDragOver ? 'ring-2 ring-primary/50' : ''}`}
                    >
                      {onReorderLayouts && (
                        <div className="cursor-grab active:cursor-grabbing text-muted-foreground/50 hover:text-muted-foreground flex-shrink-0">
                          <GripVertical className="w-3 h-3" />
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => {
                          onLoadLayout(layout.name)
                          onSelectedLayoutChange?.(layout.name)
                        }}
                        className={`flex-1 min-w-0 text-left flex items-center gap-2 text-[11px] focus:outline-none ${
                          isSelected ? 'text-primary font-medium' : 'text-foreground'
                        }`}
                      >
                        <span className="truncate">{layout.name}</span>
                        <span className="text-muted-foreground flex-shrink-0">
                          {layout.width}×{layout.height}
                        </span>
                        <span className="text-muted-foreground flex-shrink-0">
                          {layout.boxStarts.length} box{layout.boxStarts.length !== 1 ? 'es' : ''}
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteLayout(layout.name)
                          if (isSelected) {
                            onSelectedLayoutChange?.(null)
                          }
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-muted-foreground hover:text-red-500 rounded transition-all hover:bg-red-500/10 flex-shrink-0"
                        title="Delete layout"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-[10px] text-muted-foreground italic py-2">
                No saved layouts yet
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
