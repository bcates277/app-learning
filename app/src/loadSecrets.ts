import { config } from 'dotenv';
import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

// Load from .env for local development
config();

export async function loadDBConfig(secretName: string) {
  if (process.env.NODE_ENV === 'development') {
    // Load from .env for local development
    return {
      host: process.env.DB_HOST || '',
      port: Number(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME || '',
      user: process.env.DB_USER || '',
      password: process.env.DB_PASSWORD || '',
    };
  } else {
    // Load from AWS Secrets Manager for production
    const client = new SecretsManagerClient({ region: "us-east-1" });
    const command = new GetSecretValueCommand({ SecretId: secretName });

    const response = await client.send(command);
    if (!response.SecretString) throw new Error("Secret not found");

    const secret = JSON.parse(response.SecretString);
    return {
      host: secret.DB_HOST,    // Updated from secret.host to secret.DB_HOST
      port: Number(secret.DB_PORT),  // Updated from secret.port to secret.DB_PORT
      database: secret.DB_NAME,    // Updated from secret.dbname to secret.DB_NAME
      user: secret.DB_USER,       // Updated from hardcoded 'invoicer' to secret.DB_USER
      password: secret.DB_PASSWORD,  // Updated from secret.password to secret.DB_PASSWORD
    };
  }
}
