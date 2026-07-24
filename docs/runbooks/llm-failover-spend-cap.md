# E2 — LLM spend cap + secondary provider

## Platform spend cap (vendor bill)

Env (AI service):

- `LLM_DAILY_SPEND_CAP_USD` — soft/hard daily  
- `LLM_MONTHLY_SPEND_CAP_USD` — monthly  
- Tracking: approximate from token usage × unit cost table in config  

Khi vượt: process-message escalate / 429; không gọi Gemini.

## Per-org quota (đã có)

`entitlements.ai_monthly_token_limit` + `AiTokenUsageService` — tách biệt với cap vendor.

## Secondary provider

- Primary: Gemini (`GeminiLlmProvider`)  
- Secondary: OpenAI-compatible stub when `OPENAI_API_KEY` set and primary fails / allowlist  

Failover: thử secondary một lần; nếu cả hai fail → escalate.

## Prove cap

1. Set daily cap rất thấp trên staging  
2. Gửi vài process-message  
3. Expect escalate / reject trước khi gọi LLM tiếp  

## Status

Code path shipped in Plan E implementation; live prove on staging = operator.
