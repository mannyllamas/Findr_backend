const AWS = require("aws-sdk");

const s3 = new AWS.S3({ signatureVersion: "v4" });

interface APIGatewayEvent {
  queryStringParameters: {
    fileName: string;
    fileType: string;
  };
}

export const handler = async (event: APIGatewayEvent) => {
  try {
    const { fileName, fileType } = event.queryStringParameters || {};

    if (!fileName || !fileType) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing fileName or fileType" }),
      };
    }

    const bucketName = process.env.BUCKET_NAME;
    const params = {
      Bucket: bucketName!,
      Key: `profile-backgrounds/${fileName}`,
      Expires: 60, // URL expires in 60 seconds
      ContentType: fileType,
    };

    const uploadUrl = await s3.getSignedUrlPromise("putObject", params);

    return {
      statusCode: 200,
      body: JSON.stringify({ uploadUrl }),
    };
  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: (error as Error).message }),
    };
  }
};
