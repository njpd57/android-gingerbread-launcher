/** Size that fits within `maxSide` on both sides keeping the aspect ratio; never scales up. */
export function fitWithin(width: number, height: number, maxSide: number): { width: number; height: number }
{
    const scale = Math.min(1, maxSide / Math.max(width, height));
    return {
        width: Math.max(1, Math.round(width * scale)),
        height: Math.max(1, Math.round(height * scale)),
    };
}

/** Shrinks a picked image to a JPEG small enough to keep, since phone photos are several MB. */
export async function shrinkImage(file: Blob, maxSide = 800): Promise<Blob>
{
    const bitmap = await createImageBitmap(file);
    const { width, height } = fitWithin(bitmap.width, bitmap.height, maxSide);

    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    canvas.getContext('2d')!.drawImage(bitmap, 0, 0, width, height);
    bitmap.close();

    return new Promise((resolve, reject) =>
        canvas.toBlob(b => b ? resolve(b) : reject(new Error('Could not encode the image')), 'image/jpeg', 0.85));
}
