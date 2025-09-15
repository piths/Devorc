# Using OpenRouter with DevOrch Suite

DevOrch Suite supports OpenRouter as an alternative to OpenAI's API. OpenRouter provides access to multiple AI models through a single API, often at lower costs and better availability. This is particularly useful for the AI Chat Assistant feature with its Cursor-like interface.

## Setup Instructions

### 1. Get an OpenRouter API Key

1. Visit [OpenRouter.ai](https://openrouter.ai/)
2. Sign up for an account
3. Go to your API Keys section
4. Create a new API key (starts with `sk-or-v1-...`)

### 2. Configure Environment Variables

Add these variables to your `.env.local` file:

```bash
# OpenRouter Configuration
OPENAI_API_KEY=sk-or-v1-your-openrouter-api-key-here
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=openai/gpt-4o-mini
```

### 3. Available Models

OpenRouter supports many models. Here are some popular options:

#### OpenAI Models (via OpenRouter)
```bash
OPENAI_MODEL=openai/gpt-4o-mini          # Recommended for cost-effectiveness
OPENAI_MODEL=openai/gpt-4o               # More capable, higher cost
OPENAI_MODEL=openai/gpt-3.5-turbo        # Budget option
```

#### Anthropic Models (via OpenRouter)
```bash
OPENAI_MODEL=anthropic/claude-3-haiku    # Fast and affordable
OPENAI_MODEL=anthropic/claude-3-sonnet   # Balanced performance
OPENAI_MODEL=anthropic/claude-3-opus     # Most capable
```

#### Other Models
```bash
OPENAI_MODEL=meta-llama/llama-3.1-8b-instruct    # Open source option
OPENAI_MODEL=google/gemini-pro                    # Google's model
OPENAI_MODEL=mistralai/mistral-7b-instruct       # Mistral option
```

### 4. Cost Optimization

OpenRouter often provides better pricing than direct API access:

- **gpt-4o-mini**: ~$0.15/1M input tokens (vs $0.15 direct)
- **claude-3-haiku**: ~$0.25/1M input tokens
- **llama-3.1-8b**: ~$0.07/1M input tokens

### 5. Features Supported

All DevOrch Suite AI features work seamlessly with OpenRouter:

- ✅ **Cursor-like Chat Interface** - File-aware conversations with code context
- ✅ **Code Analysis and Insights** - Intelligent code review and suggestions
- ✅ **Contextual Chat Responses** - AI understands currently open files
- ✅ **Code Reference Linking** - Direct references to specific code sections
- ✅ **File Navigation Integration** - AI context updates with file selection
- ✅ **Codebase Analysis** - Upload and analyze entire project structures
- ✅ **Fallback Handling** - Graceful degradation when API is unavailable
- ✅ **Error Handling and Retries** - Robust error recovery and request queuing

### 6. Switching Back to OpenAI

To use OpenAI directly, simply update your `.env.local`:

```bash
# OpenAI Direct Configuration
OPENAI_API_KEY=sk-your-openai-api-key-here
OPENAI_BASE_URL=https://api.openai.com/v1
OPENAI_MODEL=gpt-4o-mini
```

Or remove the `OPENAI_BASE_URL` variable to use the default OpenAI endpoint.

### 7. Troubleshooting

#### Common Issues:

1. **Invalid API Key**: Make sure your OpenRouter key starts with `sk-or-v1-`
2. **Model Not Found**: Check the [OpenRouter models page](https://openrouter.ai/models) for available models
3. **Rate Limits**: OpenRouter has different rate limits per model
4. **Costs**: Monitor your usage on the OpenRouter dashboard

#### Debug Mode:

To see API requests in development, check the browser console for any error messages.

### 8. Benefits of OpenRouter

- **Multiple Models**: Access to OpenAI, Anthropic, Meta, Google, and more
- **Better Pricing**: Often cheaper than direct API access
- **Unified API**: Same interface for all models
- **Reliability**: Built-in failover and load balancing
- **Transparency**: Clear pricing and usage tracking

## Example Configuration

Here's a complete `.env.local` example for OpenRouter:

```bash
# GitHub OAuth Configuration
NEXT_PUBLIC_GITHUB_CLIENT_ID=your_github_client_id
GITHUB_CLIENT_SECRET=your_github_client_secret

# OpenRouter AI Configuration
OPENAI_API_KEY=sk-or-v1-your-openrouter-key-here
OPENAI_BASE_URL=https://openrouter.ai/api/v1
OPENAI_MODEL=openai/gpt-4o-mini

# Optional: Slack Integration
SLACK_WEBHOOK_URL=your_slack_webhook_url
```

That's it! Your DevOrch Suite will now use OpenRouter for all AI features.