import { uploadImageToS3 } from "./uploadImageToS3.js";

export const saveImage = async (base64) => {
  try {
    // const { base64 } = req.body; // Get Base64 image from request

    if (!base64) return null;

    const imageUrl = await uploadImageToS3(base64, "png"); // Upload to S3

    return imageUrl;

    // Save image URL in MongoDB
   // const newImage = new ImageModel({ imageUrl });
   // await newImage.save();

    //res.json({ message: 'Image uploaded successfully', imageUrl });
  } catch (error) {
   // res.status(500).json({ message: 'Upload failed', error });
   console.log(error);
  }
};
