import s3 from './s3Config.js'; // Import S3 config
import { v4 as uuidv4 } from 'uuid'; // Generate unique file names

export const uploadImageToS3 = async (base64Image, fileType) => {
  try {
    // Extract image format (e.g., "jpeg", "png")
    const matches = base64Image.match(/^data:image\/(\w+);base64,(.+)$/);
    //if (!matches) throw new Error('Invalid Base64 image format');

    //const ext = matches[1]; // Image extension
    //const buffer = Buffer.from(matches[2], 'base64'); // Convert Base64 to Buffer
    const buffer = Buffer.from(base64Image, 'base64');

    const params = {
      Bucket: process.env.AWS_BUCKET_NAME, // S3 Bucket name
      Key: `uploads/${uuidv4()}.${fileType}`, // Unique filename
      Body: buffer,
      ContentType: `image/${fileType}`,
      // ACL: 'public-read', // Makes it publicly accessible
    };

    // Upload to S3
    const uploadResult = await s3.upload(params, {
      progressCallback(progress){
        console.log(`Uploaded: ${progress.loaded}/ ${progress.total}`);
      }
    }).promise();
    return uploadResult.Location; // Returns the file URL
  } catch (error) {
    console.error('S3 Upload Error:', error);
    throw error;
  }
};
