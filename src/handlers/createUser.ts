import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoDbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);
const TABLE_NAME = process.env.DYNAMODB_TABLE || '';

interface User {
    userId: string;
    firstName: string;
    lastName: string;
    lastLogin: string;
    email: string;
}

export const handler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid request: No body provided' }),
            };
        }

        const clerkEvent = JSON.parse(event.body);
        const clerkUser = clerkEvent.data;

        const user: User = {
            userId: clerkUser.id,
            firstName: clerkUser.first_name,
            lastName: clerkUser.last_name,
            lastLogin: new Date(clerkUser.last_sign_in_at).toISOString(),
            email: clerkUser.email_addresses[0]?.email_address || '',
        };

        if (!user.userId || !user.firstName || !user.email || !user.lastLogin || !user.lastName) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid request: Missing required user properties' }),
            };
        }

        const params = {
            TableName: TABLE_NAME,
            Item: {
                id: user.userId,  // Updated to match the new partition key
                firstName: user.firstName,
                lastName: user.lastName,
                lastLogin: user.lastLogin,
                email: user.email,
            },
        };

        await ddbDocClient.send(new PutCommand(params));

        return {
            statusCode: 201,
            body: JSON.stringify({ message: 'User created successfully', user }),
        };
    } catch (error) {
        console.error('Error creating user:', error);

        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error' }),
        };
    }
};