# Sokoban Evaluation Results Analysis

This document summarizes the evaluation results from testing various LLMs on Sokoban puzzle-solving tasks.

## Overview

**Evaluation Date:** January 8-9, 2026
**Puzzle Sets:**
- **Microban** - 10 simpler puzzles from the classic Microban collection
- **Puzzles** - 10 more complex custom puzzles

**Models Tested:** 8 frontier LLMs across major providers

---

## Summary Results

### Microban Puzzles (Easier)

| Model | Solved | Rate | Avg Steps | Avg Time | Cost |
|-------|--------|------|-----------|----------|------|
| GPT-5.2 | 7/10 | **70%** | 45.4 | 6.5 min | $2.88 |
| Gemini 3 Pro | 4/10 | 40% | 39.8 | 3.3 min | $2.86 |
| Grok 4.1 Fast | 4/10 | 40% | 34.5 | 5.4 min | $0.22 |
| Kimi K2 Thinking | 2/10 | 20% | 24.0 | 8.7 min | $0.83 |
| Claude Opus 4.5 | 1/10 | 10% | 57.0 | 0.9 min | $1.00 |
| DeepSeek V3.2 | 0/10 | 0% | - | 8.0 min | $0.04 |
| GLM 4.7 | 0/10 | 0% | - | 18.6 min | $1.20 |
| MiniMax M2.1 | 0/10 | 0% | - | 8.3 min | $0.47 |

### Custom Puzzles (Harder)

| Model | Solved | Rate | Avg Steps | Avg Time | Cost |
|-------|--------|------|-----------|----------|------|
| GPT-5.2 | 1/10 | **10%** | 88.0 | 18.8 min | $3.64 |
| Claude Opus 4.5 | 0/10 | 0% | - | 0.3 min | $0.26 |
| Gemini 3 Pro | 0/10 | 0% | - | 2.8 min | $2.45 |
| Grok 4.1 Fast | 0/10 | 0% | - | 5.6 min | $0.25 |
| Kimi K2 Thinking | 0/10 | 0% | - | 11.5 min | $0.94 |
| DeepSeek V3.2 | 0/10 | 0% | - | 6.2 min | $0.13 |
| GLM 4.7 | 0/10 | 0% | - | 19.1 min | $1.29 |
| MiniMax M2.1 | 0/10 | 0% | - | 7.7 min | $0.59 |

---

## Key Findings

### 1. GPT-5.2 Leads in Problem-Solving Accuracy

GPT-5.2 significantly outperformed all other models on the Microban puzzles with a **70% solve rate** - nearly double the next best performers (Gemini 3 Pro and Grok 4.1 Fast at 40%). It was also the only model to solve any of the harder custom puzzles.

### 2. Sokoban Remains Extremely Difficult for LLMs

Even the best-performing model (GPT-5.2) only solved 1 out of 10 harder puzzles. The Microban puzzles are considered beginner-level by human standards, yet most models struggled significantly. This highlights that **spatial reasoning and multi-step planning remain major weaknesses** for current LLMs.

### 3. Solution Efficiency vs. Success Rate

Interestingly, models that solved puzzles didn't necessarily use the fewest moves:
- Kimi K2 Thinking had the most efficient solutions (avg 24 steps) but only 20% success
- GPT-5.2 averaged 45.4 steps but had the highest success rate
- This suggests **finding any valid solution is more important than optimal solutions**

### 4. Cost-Effectiveness Analysis

**Best Value:** Grok 4.1 Fast delivered 40% success on Microban for only **$0.22** - excellent cost-efficiency compared to GPT-5.2's $2.88 for 70%.

**Cost per Solved Puzzle (Microban):**
| Model | Cost/Solve |
|-------|------------|
| Grok 4.1 Fast | $0.06 |
| Kimi K2 Thinking | $0.42 |
| GPT-5.2 | $0.41 |
| Gemini 3 Pro | $0.72 |
| Claude Opus 4.5 | $1.00 |

### 5. Common Failure Modes

Analysis of failed attempts reveals several patterns:

1. **Invalid Moves** - Most common failure type. Models generate moves that are physically impossible (walking into walls, pushing boxes into walls).

2. **Incomplete Solutions** - Models return empty solutions or claim puzzles are "unsolvable" when they are not.

3. **Parse Failures** - Some models (especially MiniMax, GLM) frequently returned responses that couldn't be parsed as valid move sequences.

4. **Incorrect State Tracking** - Models often lost track of box/player positions mid-solution, leading to invalid later moves.

### 6. Reasoning Token Usage

Models with extended reasoning capabilities showed interesting patterns:
- Higher reasoning token counts didn't correlate with better success
- GLM 4.7 used the most tokens/time but solved 0 puzzles
- GPT-5.2's success came with moderate reasoning token usage

---

## Model-Specific Observations

### GPT-5.2
- Clear winner in accuracy
- Occasionally claimed solvable puzzles were "unsolvable" (false negatives)
- Generated detailed reasoning about deadlock avoidance
- Longest inference times but highest success

### Gemini 3 Pro
- Solid 40% on Microban
- Good at explaining strategy but execution often failed
- Several invalid move errors mid-solution

### Grok 4.1 Fast
- Best cost-efficiency
- Fast inference times
- Also had false "unsolvable" claims on valid puzzles

### Claude Opus 4.5
- Surprisingly poor performance (10% on Microban)
- Very fast inference but low accuracy
- May benefit from more thinking time/tokens

### Kimi K2 Thinking
- Most efficient solutions when successful
- High rate of parse failures and invalid moves
- Extended reasoning didn't translate to accuracy

### DeepSeek V3.2, GLM 4.7, MiniMax M2.1
- All failed to solve any puzzles in either set
- Various issues: parse failures, invalid moves, premature "unsolvable" claims
- Significantly higher token usage than successful models

---

## Conclusions

1. **Sokoban is an excellent benchmark** for LLM spatial reasoning and planning capabilities. The stark differences between models reveal real capability gaps.

2. **Current LLMs struggle with multi-step spatial reasoning**, even on puzzles considered trivial by human standards.

3. **More tokens ≠ better solutions**. Some of the highest-reasoning models performed worst.

4. **GPT-5.2 demonstrates a meaningful capability advantage** in this domain, though still far from human-level performance.

5. **Cost-conscious users** should consider Grok 4.1 Fast for acceptable performance at ~10x lower cost than GPT-5.2.

---

## Recommendations for Future Evaluation

1. Test with varying puzzle difficulty levels to establish capability curves
2. Evaluate impact of few-shot examples on performance
3. Test chain-of-thought prompting variations
4. Include human baseline solve times for comparison
5. Analyze correlation between puzzle complexity metrics and solve rates

---

*Generated from evaluation data in `/data/eval-results/`*
