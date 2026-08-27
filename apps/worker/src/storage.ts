import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import fs from 'fs';

export async function uploadRenderedVideo(localFilePath: string, filename: string): Promise<string> {
  const provider = (process.env.STORAGE_PROVIDER || process.env.STORAGE_DRIVER || 'local').toLowerCase();

  // If local fallback or missing bucket configuration
  if (provider === 'local' || !process.env.S3_BUCKET_NAME) {
    console.log(`[Storage] STORAGE_PROVIDER is '${provider}'. Using local disk path.`);
    return `/renders/${filename}`;
  }

  try {
    const endpoint = process.env.S3_ENDPOINT; // e.g. https://<accountid>.r2.cloudflarestorage.com
    const region = process.env.S3_REGION || 'auto';
    const accessKeyId = process.env.S3_ACCESS_KEY_ID || '';
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || '';
    const bucketName = process.env.S3_BUCKET_NAME || '';
    const publicDomain = (process.env.S3_PUBLIC_DOMAIN || '').replace(/\/+$/, '');

    const s3 = new S3Client({
      region,
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const fileStream = fs.createReadStream(localFilePath);
    const destinationKey = `renders/${filename}`;

    console.log(`[Storage] Uploading ${filename} to Cloud Storage bucket '${bucketName}'...`);

    await s3.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: destinationKey,
        Body: fileStream,
        ContentType: 'video/mp4',
      })
    );

    console.log(`[Storage] Successfully uploaded ${filename} to Cloud Storage.`);

    // If upload to cloud succeeded, delete local file to free up VPS disk space immediately
    try {
      if (fs.existsSync(localFilePath)) {
        fs.unlinkSync(localFilePath);
        console.log(`[Storage] Deleted local rendered file to save disk space: ${localFilePath}`);
      }
    } catch (e: any) {
      console.warn(`[Storage] Could not delete local file: ${e.message}`);
    }

    if (publicDomain) {
      return `${publicDomain}/${destinationKey}`;
    }

    return `https://${bucketName}.s3.${region}.amazonaws.com/${destinationKey}`;
  } catch (err: any) {
    console.error(`[Storage] Failed to upload to Cloud Storage:`, err.message || err);
    console.log(`[Storage] Falling back to local disk path.`);
    return `/renders/${filename}`;
  }
}
