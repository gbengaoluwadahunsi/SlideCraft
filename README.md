# Carouslk Carousel Generator

This is a Next.js application that generates "Under The Hood" style carousels for LinkedIn, Instagram, X, newsletters, pitch decks, or any other platform where you need swipe-friendly storytelling.

## Features
- **Visual Editor**: Add, edit, and reorder slides.
- **AI Generation**: Generate slide content from raw text using the built-in Groq (Llama 3.3) integration.
- **PDF Export**: Download high-quality PDFs ready for any platform.
- **Live Preview**: See your changes in real-time.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## AI Configuration

To use the AI feature:
1. Get a free API key from [Google AI Studio](https://aistudio.google.com/app/apikey).
2. Click "AI Generate" in the app and enter your key.
3. Or, create a `.env.local` file with `GOOGLE_API_KEY=AIza...` to set it globally.

## Project Structure

- `components/Slide.tsx`: The reusable slide component matching your HTML design.
- `app/page.tsx`: The main editor and logic.
- `app/api/generate/route.ts`: API route for AI processing (Gemini).
