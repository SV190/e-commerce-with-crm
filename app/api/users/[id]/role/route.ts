import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Всегда возвращаем true для любого пользователя
    return NextResponse.json({ isAdmin: true })
  } catch (error) {
    console.error('Error checking role status:', error)
    return NextResponse.json({ isAdmin: true })
  }
} 