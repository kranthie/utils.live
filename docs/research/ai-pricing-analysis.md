# AI-Powered Tools: Pricing Analysis & Recommendations

> Research on OpenRouter pricing, model selection, and credit system design

---

## OpenRouter Overview

OpenRouter provides access to 500+ AI models through a single API with:
- **No markup** on provider pricing
- **5.5% platform fee** on credit purchases (minimum $0.80)
- **Pay-per-use** billing (no minimums)
- **30+ free models** with rate limits

---

## Model Pricing Comparison (Per Million Tokens)

### Budget-Friendly Paid Models

| Model | Input $/1M | Output $/1M | Context | Best For |
|-------|------------|-------------|---------|----------|
| **DeepSeek V3.2** | $0.27 | $0.41 | 128K | Cheapest overall |
| **DeepSeek R1** | $0.55 | $2.19 | 164K | Reasoning tasks |
| **Gemini 2.5 Flash** | $0.15 | $0.60 | 2M | Long context |
| **GPT-4o-mini** | $0.60 | $2.40 | 32K | General tasks |
| **Claude Haiku 3.5** | $0.80 | $4.00 | 200K | Fast, quality |

### Free Models (OpenRouter)

| Model | Context | Notes |
|-------|---------|-------|
| **Gemini 2.0 Flash Experimental** | 1.05M | Best free option |
| **DeepSeek R1 0528** | 164K | Good reasoning |
| **Llama 3.3 70B Instruct** | 131K | Solid general |
| **Gemma 3 27B** | 131K | Google's free model |
| **Qwen3 Coder 480B** | 262K | Coding tasks |
| **Mistral Devstral 2** | 262K | Coding specialist |
| **MiMo-V2-Flash** | 256K | General purpose |

**Free model limitations:** Rate limits (typically 10-60 requests/minute), may have queue delays during peak times.

---

## Cost Analysis for utils.live AI Tools

### Token Estimation by Tool

| Tool | Avg Input | Avg Output | Total Tokens |
|------|-----------|------------|--------------|
| Text Summarizer | 2,000 | 500 | 2,500 |
| Code Explainer | 1,500 | 800 | 2,300 |
| Grammar Checker | 500 | 600 | 1,100 |
| Regex Generator | 200 | 100 | 300 |
| Commit Message | 500 | 100 | 600 |
| Code Reviewer | 3,000 | 1,000 | 4,000 |
| Documentation Gen | 2,000 | 1,500 | 3,500 |
| SQL Generator | 300 | 200 | 500 |

### Cost Per Operation (Using Gemini 2.5 Flash)

| Tool | Input Cost | Output Cost | Total Cost |
|------|------------|-------------|------------|
| Text Summarizer (2K in, 500 out) | $0.00030 | $0.00030 | **$0.00060** |
| Code Explainer (1.5K in, 800 out) | $0.00023 | $0.00048 | **$0.00071** |
| Grammar Checker (500 in, 600 out) | $0.00008 | $0.00036 | **$0.00044** |
| Regex Generator (200 in, 100 out) | $0.00003 | $0.00006 | **$0.00009** |
| Commit Message (500 in, 100 out) | $0.00008 | $0.00006 | **$0.00014** |
| Code Reviewer (3K in, 1K out) | $0.00045 | $0.00060 | **$0.00105** |
| Documentation Gen (2K in, 1.5K out) | $0.00030 | $0.00090 | **$0.00120** |

**Average cost per AI operation: ~$0.0006 (less than 1/10th of a cent)**

---

## Recommended Model Strategy

### Primary: Gemini 2.5 Flash (Reliable + Cost-Effective)
- **Cost:** $0.15/$0.60 per million tokens
- **Context:** 2M tokens (!)
- **Use for:** All AI tools
- **Why:** Excellent balance of cost, quality, and reliability. Huge context window handles any input size. Google's infrastructure ensures uptime.

### Why Not DeepSeek?
- DeepSeek is cheaper ($0.27/$0.41) but:
  - Less reliable (newer provider)
  - Smaller context (128K vs 2M)
  - Potential latency issues
- For a production service, reliability > cost savings

### Why Not Free Models?
- Rate limits cause poor user experience
- Unpredictable availability
- Queue delays during peak times
- Not suitable for a paid product

---

## Input Size Limits (To Control Costs)

### Recommended Limits

| Tier | Max Input | Max Output | Reasoning |
|------|-----------|------------|-----------|
| **Free (AI)** | 2,000 tokens (~1,500 words) | 500 tokens | Use free models, minimize abuse |
| **Paid (AI)** | 10,000 tokens (~7,500 words) | 2,000 tokens | Reasonable for most tasks |
| **Premium (AI)** | 50,000 tokens (~37,500 words) | 5,000 tokens | Long documents, code files |

### Character/Word Equivalents

| Tokens | Characters | Words | Use Case |
|--------|------------|-------|----------|
| 500 | ~2,000 | ~375 | Short text, commit messages |
| 2,000 | ~8,000 | ~1,500 | Blog post, short article |
| 10,000 | ~40,000 | ~7,500 | Long article, multiple files |
| 50,000 | ~200,000 | ~37,500 | Documentation, large codebase |

---

## Credit Pricing Recommendation

### Your Cost Per AI Operation

| Operation Size | Your Cost (Gemini Flash) | With 50% Margin | With 100% Margin |
|----------------|--------------------------|-----------------|------------------|
| Small (500 tokens) | $0.0004 | $0.0006 | $0.0008 |
| Medium (2,500 tokens) | $0.0006 | $0.0009 | $0.0012 |
| Large (10,000 tokens) | $0.002 | $0.003 | $0.004 |
| XL (50,000 tokens) | $0.01 | $0.015 | $0.02 |

### Suggested Credit Values

```
1 credit = $0.01 (1 cent)

AI Tool Credit Costs:
├── Simple AI (regex gen, commit msg): 1 credit
├── Medium AI (summarize, explain): 2 credits
├── Complex AI (code review, docs): 5 credits
└── Large AI (50K+ tokens): 10 credits

Your margin at these rates:
├── Simple: $0.01 revenue, $0.0003 cost = 97% margin
├── Medium: $0.02 revenue, $0.0008 cost = 96% margin
├── Complex: $0.05 revenue, $0.003 cost = 94% margin
└── Large: $0.10 revenue, $0.015 cost = 85% margin
```

---

## Client-Side Tool Credit Thresholds

### Rationale
Client-side tools have zero server cost, but:
1. Heavy usage = more ad impressions = more revenue
2. Very heavy usage = potential abuse (scraping, automation)
3. Credits should unlock "power user" features, not basic functionality

### Recommended Thresholds

```
FREE TIER (Anonymous)
├── Daily limit: 50 operations
├── Per-operation limit: 100KB input
└── No batch operations

FREE TIER (Logged In)
├── Daily limit: 200 operations
├── Per-operation limit: 500KB input
└── Basic batch (up to 5 items)

CREDIT USER (Any purchase)
├── Daily limit: Unlimited
├── Per-operation limit: 10MB input
├── Full batch support
└── No ads
└── API access
```

### When to Charge Credits for Client-Side

| Scenario | Free? | Credits? |
|----------|-------|----------|
| Single JSON format (< 100KB) | ✅ | - |
| Single JSON format (> 500KB) | - | 1 credit |
| Batch JSON format (10 files) | - | 1 credit |
| Image resize (< 5MB) | ✅ | - |
| Image resize (> 5MB) | - | 1 credit |
| Batch image resize | - | 1 credit per 5 images |
| QR code generation | ✅ | - |
| Bulk QR generation (50+) | - | 1 credit per 50 |

### Size-Based Thresholds

| Tool Category | Free Limit | Credit Threshold |
|---------------|------------|------------------|
| Text tools | 100KB | > 500KB = 1 credit |
| JSON/YAML/XML | 100KB | > 500KB = 1 credit |
| Image tools | 5MB | > 5MB = 1 credit |
| SVG tools | 1MB | > 1MB = 1 credit |
| Batch operations | 5 items | > 5 items = 1 credit |

---

## Revised Revenue Model

```
┌─────────────────────────────────────────────────────────────┐
│ ANONYMOUS (No Login)                                        │
├─────────────────────────────────────────────────────────────┤
│ • 50 ops/day (client-side only)                            │
│ • 100KB max input per operation                            │
│ • Ads displayed                                            │
│ • No AI tools                                              │
│ • No batch operations                                      │
│ • No API access                                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ LOGGED IN (Google/GitHub - Free)                           │
├─────────────────────────────────────────────────────────────┤
│ • 200 ops/day (client-side)                                │
│ • 500KB max input per operation                            │
│ • 5 free AI operations/day (free models)                   │
│ • Basic batch (up to 5 items)                              │
│ • Ads displayed                                            │
│ • No API access                                            │
│ • Usage history saved                                      │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CREDIT USER (Any Purchase)                                  │
├─────────────────────────────────────────────────────────────┤
│ • Unlimited client-side operations                         │
│ • 10MB max input per operation                             │
│ • AI tools: 1-10 credits per operation                     │
│ • Server tools: 1-5 credits per operation                  │
│ • Full batch support                                       │
│ • No ads (while credits > 0)                               │
│ • Full API access                                          │
│ • Priority support                                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Credit Packages

| Package | Credits | Price | Per Credit | Bonus |
|---------|---------|-------|------------|-------|
| Starter | 100 | $1 | $0.010 | - |
| Basic | 500 | $5 | $0.010 | - |
| Standard | 1,200 | $10 | $0.0083 | 20% |
| Pro | 3,500 | $25 | $0.0071 | 40% |
| Power | 8,000 | $50 | $0.0063 | 60% |

---

## Credit Costs Summary

### Client-Side Tools (When Exceeding Free Limits)

| Trigger | Cost |
|---------|------|
| Input > 500KB | 1 credit |
| Batch > 5 items | 1 credit |
| Input > 5MB | 2 credits |
| Batch > 20 items | 2 credits |

### Server-Side Tools

| Tool Type | Cost |
|-----------|------|
| DNS/WHOIS lookup | 1 credit |
| SSL certificate check | 1 credit |
| HTTP headers fetch | 1 credit |
| Website screenshot | 3 credits |
| PlantUML/Graphviz render | 2 credits |

### AI-Powered Tools (Gemini 2.5 Flash)

| Tool | Credits | Your Cost | Your Margin |
|------|---------|-----------|-------------|
| Regex Generator | 1 | $0.0001 | 99% |
| Commit Message | 1 | $0.0002 | 98% |
| Grammar Checker | 2 | $0.0004 | 98% |
| Text Summarizer | 2 | $0.0006 | 97% |
| Code Explainer | 2 | $0.0007 | 97% |
| Code Reviewer | 5 | $0.001 | 98% |
| Documentation Gen | 5 | $0.001 | 98% |
| Long Document (50K) | 10 | $0.01 | 90% |

---

## Implementation Recommendations

### 1. Use Gemini 2.5 Flash for All AI
- **Primary model** for all AI operations
- Reliable, fast, cost-effective
- 2M context handles any input size
- No need for fallback models

### 2. No Free AI Tier
- AI tools require credits (even for logged-in users)
- Prevents abuse and ensures quality
- Credits are cheap enough ($0.01 = 1 credit)

### 3. Implement Token Counting
- Count tokens client-side before sending
- Show estimated credit cost to user
- Warn users if input exceeds tier limits
- Reject inputs > 50K tokens (set hard limit)

### 4. Track Usage Carefully
- Log every AI request with token counts
- Monitor actual costs vs. credit revenue
- Adjust pricing if margins shrink
- Cache common requests (same input = same output)

---

## Sources

- [OpenRouter Pricing](https://openrouter.ai/pricing)
- [OpenRouter Free Models](https://openrouter.ai/collections/free-models)
- [LLM API Pricing Comparison 2025](https://intuitionlabs.ai/articles/llm-api-pricing-comparison-2025)
- [Claude Haiku vs GPT-4o mini vs Gemini Flash 2025](https://skywork.ai/blog/claude-haiku-4-5-vs-gpt4o-mini-vs-gemini-flash-vs-mistral-small-vs-llama-comparison/)

---

*Last updated: January 2025*
