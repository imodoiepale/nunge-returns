import fs from 'fs'
import path from 'path'
import https from 'https'

export async function downloadImage(url: string, filename: string): Promise<string> {
  const publicDir = path.join(process.cwd(), 'public', 'blog')
  const localPath = path.join(publicDir, filename)
  
  // Check if directory exists, if not create it
  if (!fs.existsSync(publicDir)) {
    fs.mkdirSync(publicDir, { recursive: true })
  }

  // Check if file already exists
  if (fs.existsSync(localPath)) {
    return `/blog/${filename}` // Return local path if file exists
  }

  return new Promise((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode === 200) {
        const file = fs.createWriteStream(localPath)
        response.pipe(file)
        file.on('finish', () => {
          file.close()
          resolve(`/blog/${filename}`)
        })
      } else {
        reject(new Error(`Failed to download image: ${response.statusCode}`))
      }
    }).on('error', (err) => {
      reject(err)
    })
  })
}

export async function downloadImages(images: { url: string; filename: string }[]): Promise<string[]> {
  try {
    const downloadPromises = images.map(({ url, filename }) => 
      downloadImage(url, filename).catch(err => {
        console.error(`Failed to download ${url}:`, err)
        return url // Fallback to original URL if download fails
      })
    )
    
    return await Promise.all(downloadPromises)
  } catch (error) {
    console.error('Error downloading images:', error)
    return images.map(img => img.url) // Fallback to original URLs
  }
}
