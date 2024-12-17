import { NextResponse } from 'next/server'
import { downloadImages } from '@/lib/utils/image-downloader'

export async function POST(request: Request) {
  try {
    const { images } = await request.json()
    
    if (!Array.isArray(images)) {
      return NextResponse.json(
        { error: 'Invalid request format' },
        { status: 400 }
      )
    }

    const imagePaths = await downloadImages(images)
    
    return NextResponse.json({ imagePaths })
  } catch (error) {
    console.error('Error in download-images API:', error)
    return NextResponse.json(
      { error: 'Failed to process images' },
      { status: 500 }
    )
  }
}
