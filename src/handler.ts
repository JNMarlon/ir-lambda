import { Context, S3Event } from 'aws-lambda';
import AWS from 'aws-sdk';
import { config } from './config';
import sharp, { AvailableFormatInfo, FormatEnum } from 'sharp';

const s3 = new AWS.S3({ region: config.region });
export const handler = async (event: S3Event, context: Context, callback: (a: any) => void) => {
    const evtS3 = event.Records[0].s3;
    const Bucket = evtS3.bucket.name;
    const Key = decodeURIComponent(evtS3.object.key);

    const filename = Key.split('/')[Key.split('/').length - 1];
    const ext = Key.split('.')[Key.split('.').length - 1].toLocaleLowerCase();
    const requiredFormat = ext === 'jpg' ? 'jpeg' : ext;

    try {
        const s3Object = await s3.getObject({ Bucket, Key }).promise();

        const resizedImage = await sharp(s3Object.Body as any)
            .resize(400, 400, { fit: 'inside' })
            .toFormat(requiredFormat as keyof FormatEnum | AvailableFormatInfo)
            .toBuffer();

        await s3.putObject({ Bucket, Key: `thumb/$${filename}`, Body: resizedImage }).promise();
    } catch (e) {
        console.error(e);
        return callback(e);
    }
};
