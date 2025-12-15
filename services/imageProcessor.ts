// Real Client-Side Image Processing Service

export const loadImage = (url: string): Promise<HTMLImageElement> => {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = url;
    });
};

export const processImage = async (
    file: File, 
    operation: 'grayscale' | 'resize' | 'watermark' | 'convert',
    options?: { width?: number; text?: string; format?: string }
): Promise<File> => {
    const objectUrl = URL.createObjectURL(file);
    const img = await loadImage(objectUrl);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    if (!ctx) throw new Error("Could not get canvas context");

    // Default Dimensions
    let width = img.width;
    let height = img.height;

    // Logic per operation
    if (operation === 'resize' && options?.width) {
        const scale = options.width / width;
        width = options.width;
        height = height * scale;
    }

    canvas.width = width;
    canvas.height = height;

    // Draw Image
    ctx.drawImage(img, 0, 0, width, height);

    // Apply Effects
    if (operation === 'grayscale') {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg; // R
            data[i + 1] = avg; // G
            data[i + 2] = avg; // B
        }
        ctx.putImageData(imageData, 0, 0);
    }

    if (operation === 'watermark' && options?.text) {
        ctx.font = `bold ${Math.floor(width * 0.05)}px sans-serif`;
        ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
        ctx.textAlign = 'right';
        ctx.textBaseline = 'bottom';
        ctx.fillText(options.text, width - 20, height - 20);
    }

    // Export
    const mimeType = operation === 'convert' && options?.format ? options.format : file.type;
    
    return new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
            if (blob) {
                const newName = operation === 'convert' 
                    ? file.name.replace(/\.[^/.]+$/, "") + (mimeType === 'image/jpeg' ? '.jpg' : '.png')
                    : file.name;
                
                const newFile = new File([blob], newName, { type: mimeType });
                resolve(newFile);
            } else {
                reject(new Error("Canvas to Blob failed"));
            }
            URL.revokeObjectURL(objectUrl);
        }, mimeType, 0.9);
    });
};