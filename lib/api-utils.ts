import { NextRequest, NextResponse } from 'next/server';
import { z, ZodSchema, ZodError } from 'zod';

export function validateRequest<T extends ZodSchema>(
  schema: T,
  source: 'json' | 'formData' = 'json'
) {
  return async (request: NextRequest) => {
    try {
      let data: unknown;
      
      if (source === 'formData') {
        const formData = await request.formData();
        const dataStr = formData.get('data');
        if (!dataStr || typeof dataStr !== 'string') {
          return NextResponse.json(
            { error: 'Missing or invalid data field in FormData' },
            { status: 400 }
          );
        }
        data = JSON.parse(dataStr);
      } else {
        data = await request.json();
      }
      
      const validated = schema.parse(data);
      return { success: true as const, data: validated };
    } catch (error) {
      if (error instanceof ZodError) {
        const errorDetails = error.issues.map((err) => ({
          path: err.path.join('.'),
          message: err.message,
        }));
        return NextResponse.json(
          { error: 'Validation failed', details: errorDetails },
          { status: 400 }
        );
      }
      
      if (error instanceof SyntaxError) {
        return NextResponse.json(
          { error: 'Invalid JSON in request body' },
          { status: 400 }
        );
      }
      
      throw error;
    }
  };
}

export function createApiResponse<T>(data: T, status = 200) {
  return NextResponse.json(data, { status });
}

export function createErrorResponse(error: string, status = 500, details?: unknown) {
  const response: Record<string, unknown> = { error };
  if (details && process.env.NODE_ENV === 'development') {
    response.details = details;
  }
  return NextResponse.json(response, { status });
}
