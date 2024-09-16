import { PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import s3Client from '../config/s3';

export const uploadFileToS3 = async (file: Express.Multer.File, filename: string) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: filename,
    Body: file.buffer,
  };

  try {
    return await s3Client.send(new PutObjectCommand(params));
  } catch (err) {
    console.log(err);
    throw Error('No se pudo subir la imagen al repositorio');
  }
};

export const deleteFile = async (filename: string) => {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: filename,
  };
  try {
    return await s3Client.send(new DeleteObjectCommand(params));
  } catch (error) {
    console.log(error);
  }
};
