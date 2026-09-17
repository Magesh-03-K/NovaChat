/**
 * Compresses an image File client-side using the native HTML5 Canvas API.
 * Resizes the image so its longest dimension is at most maxDimension (default 1600px)
 * and exports as a JPEG File at 0.8 quality.
 * Passes non-image files through unmodified.
 */
export async function compressImage(file, maxDimension = 1600, quality = 0.8) {
  if (!file || !file.type.startsWith('image/')) {
    return file
  }

  if (file.type === 'image/svg+xml' || file.type === 'image/gif') {
    return file
  }

  return new Promise((resolve) => {
    const img = new Image()
    const objectUrl = URL.createObjectURL(file)

    img.onload = () => {
      URL.revokeObjectURL(objectUrl)
      let width = img.width
      let height = img.height

      if (width <= maxDimension && height <= maxDimension && file.size < 400 * 1024) {
        return resolve(file)
      }

      if (width > height) {
        if (width > maxDimension) {
          height = Math.round((height * maxDimension) / width)
          width = maxDimension
        }
      } else {
        if (height > maxDimension) {
          width = Math.round((width * maxDimension) / height)
          height = maxDimension
        }
      }

      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height

      const ctx = canvas.getContext('2d')
      if (!ctx) return resolve(file)

      ctx.drawImage(img, 0, 0, width, height)

      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file)
          const newFileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg'
          const compressedFile = new File([blob], newFileName, {
            type: 'image/jpeg',
            lastModified: Date.now(),
          })
          resolve(compressedFile)
        },
        'image/jpeg',
        quality
      )
    }

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(file)
    }

    img.src = objectUrl
  })
}
