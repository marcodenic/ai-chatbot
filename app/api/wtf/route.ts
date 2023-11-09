import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const greeting = Date.now()
  const json = {
    greeting
  }

  return NextResponse.json(json)
}
