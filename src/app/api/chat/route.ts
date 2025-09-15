import { NextRequest, NextResponse } from 'next/server';
import { OpenAIApiClient } from '@/lib/openai/OpenAIApiClient';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { messages, context, type = 'chat' } = body;

    // Validate required fields
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Messages array is required' },
        { status: 400 }
      );
    }

    // Initialize OpenAI client on server-side where env vars are available
    const openaiClient = new OpenAIApiClient();

    let response;

    switch (type) {
      case 'chat':
        response = await openaiClient.chatCompletion(messages, context);
        break;
      
      case 'contextual':
        const { query, relevantFiles } = body;
        if (!query) {
          return NextResponse.json(
            { error: 'Query is required for contextual responses' },
            { status: 400 }
          );
        }
        response = await openaiClient.generateContextualResponse(query, context, relevantFiles);
        break;
      
      case 'analysis':
        const { code, filePath } = body;
        if (!code || !filePath) {
          return NextResponse.json(
            { error: 'Code and filePath are required for analysis' },
            { status: 400 }
          );
        }
        response = await openaiClient.analyzeCodeWithContext(code, filePath, context);
        break;
      
      default:
        return NextResponse.json(
          { error: 'Invalid request type' },
          { status: 400 }
        );
    }

    return NextResponse.json(response);

  } catch (error) {
    console.error('Chat API error:', error);
    
    // Handle different types of errors
    if (error && typeof error === 'object' && 'type' in error) {
      const chatError = error as { message?: string; type?: string; retryable?: boolean };
      return NextResponse.json(
        { 
          error: chatError.message || 'An error occurred',
          type: chatError.type,
          retryable: chatError.retryable 
        },
        { status: chatError.type === 'quota' ? 429 : 500 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}