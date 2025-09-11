import compressionMiddleware from 'compression';
import { Request, Response } from 'express';

const compressionOptions: compressionMiddleware.CompressionOptions = {
  // Only compress responses that are larger than this threshold (in bytes)
  threshold: 1024,
  
  // Compression level (0-9, where 6 is default, 1 is fastest, 9 is best compression)
  level: 6,
  
  // Only compress responses with these MIME types
  filter: (_req: Request, res: Response): boolean => {
    // Don't compress if the response has a Cache-Control header with no-transform
    if (res.getHeader('Cache-Control')?.toString().includes('no-transform')) {
      return false;
    }
    
    // Compress JSON, text, JavaScript, CSS, XML, and HTML responses
    const contentType = res.getHeader('Content-Type')?.toString() || '';
    
    return /json|text|javascript|css|xml|html/i.test(contentType);
  },
  
  // Memory level (1-9, where 8 is default)
  memLevel: 8,
  
  // Window bits (9-15, where 15 is default)
  windowBits: 15,
  
  // Chunk size in bytes
  chunkSize: 16 * 1024, // 16KB
};

const compression = compressionMiddleware(compressionOptions);

export default compression;
