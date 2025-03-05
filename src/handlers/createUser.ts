import { APIGatewayProxyEvent, APIGatewayProxyResult, Handler } from 'aws-lambda';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, PutCommand } from '@aws-sdk/lib-dynamodb';

const dynamoDbClient = new DynamoDBClient({});
const ddbDocClient = DynamoDBDocumentClient.from(dynamoDbClient);
const TABLE_NAME = process.env.DYNAMODB_TABLE || '';

interface Profile {
    userId: string;
    first_name: string;
    last_name: string;
    email: string;
    role?: string;
    imageUrl?: string;
    lastSeen?: string;
    lastSeenDateTime?: string;
    isOnline?: boolean;
    interests?: string[];
    school?: string;
    major?: string;
    gender?: string;
}

export const handler: Handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
    try {
        // Log the incoming event for debugging
        console.log('Using DynamoDB Table:', TABLE_NAME);
        console.log('Received event:', JSON.stringify(event));

        if (!event.body) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid request: No body provided' }),
            };
        }

        const userData = JSON.parse(event.body);

        // Validate required fields from the request body
        if (!userData.id || !userData.first_name || !userData.last_name || !userData.email) {
            console.log('Validation failed: Missing required profile properties', userData);
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'Invalid request: Missing required profile properties' }),
            };
        }
        
        if (!userData.id || !userData.first_name || !userData.last_name || !userData.email) {
            console.log('Validation failed: Missing required profile properties', {
                id: userData.id,
                first_name: userData.first_name,
                last_name: userData.last_name,
                email: userData.email,
            });
            return {
                statusCode: 400,
                body: JSON.stringify({ 
                    message: 'Invalid request: Missing required profile properties', 
                    missingFields: {
                        id: !userData.id,
                        first_name: !userData.first_name,
                        last_name: !userData.last_name,
                        email: !userData.email
                    }
                }),
            };
        }

        // Map the request body to the Profile structure
        const profile: Profile = {
            userId: userData.id,
            first_name: userData.first_name,
            last_name: userData.last_name,
            email: userData.email,
            role: userData.role || 'user', // Default role to 'user' if not provided
            imageUrl: userData.imageUrl, // Direct image URL from request
            lastSeen: userData.lastSeen,
            lastSeenDateTime: userData.lastSeenDateTime,
            isOnline: userData.isOnline,
            interests: userData.interests,
            school: userData.school,
            major: userData.major,
            gender: userData.gender,
        };

        const params = {
            TableName: TABLE_NAME,
            Item: {
                id: profile.userId, // DynamoDB partition key
                first_name: profile.first_name,
                last_name: profile.last_name,
                email: profile.email,
                role: profile.role,
                imageUrl: profile.imageUrl,
                lastSeen: profile.lastSeen,
                lastSeenDateTime: profile.lastSeenDateTime,
                isOnline: profile.isOnline,
                interests: profile.interests,
                school: profile.school,
                major: profile.major,
                gender: profile.gender,
            },
        };

        console.log('DynamoDB PutCommand parameters:', JSON.stringify(params));

        // Send PutCommand to DynamoDB
        await ddbDocClient.send(new PutCommand(params));

        return {
            statusCode: 201,
            body: JSON.stringify({ message: 'Profile created successfully', profile }),
        };
    } catch (error) {
        console.error('Error creating profile:', error);

        // Cast error to Error type
        const typedError = error as Error;

        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Internal Server Error', error: typedError.message }),
        };
    }
};