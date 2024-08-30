import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand } from '@aws-sdk/lib-dynamodb';

const dynamoDbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);
const TABLE_NAME = process.env.DYNAMODB_TABLE || '';

export const handler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const params = {
            TableName: TABLE_NAME,
        };

        const { Items } = await ddbDocClient.send(new ScanCommand(params));

        return {
            statusCode: 200,
            body: JSON.stringify(Items),
        };
    } catch (error) {
        console.error('Error retrieving users:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};
