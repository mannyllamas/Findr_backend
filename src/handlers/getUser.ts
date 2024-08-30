import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, GetCommand } from '@aws-sdk/lib-dynamodb';

const dynamoDbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);
const TABLE_NAME = process.env.DYNAMODB_TABLE || '';

export const handler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        const email = event.pathParameters?.email;

        if (!email) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid request: Missing email parameter' }),
            };
        }

        const params = {
            TableName: TABLE_NAME,
            Key: { email },
        };

        const { Item } = await ddbDocClient.send(new GetCommand(params));

        if (!Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'User not found' }),
            };
        }

        return {
            statusCode: 200,
            body: JSON.stringify(Item),
        };
    } catch (error) {
        console.error('Error retrieving user:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};
