import { put, list } from '@vercel/blob';
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// THIS IS JUST FOR BATCH UPLOADING LOCAL IMAGES TO VERCEL BLOB
// IT IS NOT USED IN THE PROJECT
const BATCH_SIZE = 50; // Process 50 images at a time to avoid memory issues

export async function GET() {
  try {
    const coversDirPath = path.join(process.cwd(), 'book_covers');
    const files = await fs.readdir(coversDirPath);
    const imageFiles = files.filter(
      file =>
        file.endsWith('.jpg') ||
        file.endsWith('.jpeg') ||
        file.endsWith('.png') ||
        file.endsWith('.gif') ||
        file.endsWith('.webp')
    );

    // Get list of existing blobs
    const { blobs } = await list({
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    const existingBlobs = new Set(blobs.map(blob => blob.pathname));

    // Filter out images that already exist in blob storage
    const missingImages = imageFiles.filter(file => !existingBlobs.has(file));

    console.log(
      `Found ${missingImages.length} missing images out of ${imageFiles.length} total images`
    );

    if (missingImages.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All images are already uploaded',
      });
    }

    const results = [];

    // Process missing images in batches
    for (let i = 0; i < missingImages.length; i += BATCH_SIZE) {
      const batch = missingImages.slice(i, i + BATCH_SIZE);
      console.log(
        `Processing batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(missingImages.length / BATCH_SIZE)}`
      );

      const batchPromises = batch.map(async filename => {
        try {
          const filePath = path.join(coversDirPath, filename);
          const fileBuffer = await fs.readFile(filePath);
          const blob = new Blob([fileBuffer], { type: 'image/jpeg' }); // Add MIME type

          const { url } = await put(filename, blob, {
            access: 'public',
            token: process.env.BLOB_READ_WRITE_TOKEN,
            addRandomSuffix: false, // This ensures the original filename is used
          });

          return {
            filename,
            url,
          };
        } catch (err) {
          console.error(`Failed to upload ${filename}:`, err);
          throw err;
        }
      });

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      console.log(
        `Completed batch ${Math.floor(i / BATCH_SIZE) + 1}, uploaded ${results.length}/${missingImages.length} missing images`
      );
      // Optional: Add a small delay between batches to prevent rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    return NextResponse.json({
      success: true,
      message: `Successfully uploaded ${results.length} missing images`,
      urls: results,
    });
  } catch (error) {
    console.error('Error uploading images:', error);
    return NextResponse.json(
      {
        success: false,
        error:
          error instanceof Error ? error.message : 'An unknown error occurred',
      },
      { status: 500 }
    );
  }
}
