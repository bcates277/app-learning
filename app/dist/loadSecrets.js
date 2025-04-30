"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.loadDBConfig = loadDBConfig;
const dotenv_1 = require("dotenv");
const client_secrets_manager_1 = require("@aws-sdk/client-secrets-manager");
// Load from .env for local development
(0, dotenv_1.config)();
function loadDBConfig(secretName) {
    return __awaiter(this, void 0, void 0, function* () {
        if (process.env.NODE_ENV === 'development') {
            // Load from .env for local development
            return {
                host: process.env.DB_HOST || '',
                port: Number(process.env.DB_PORT) || 5432,
                database: process.env.DB_NAME || '',
                user: process.env.DB_USER || '',
                password: process.env.DB_PASSWORD || '',
            };
        }
        else {
            // Load from AWS Secrets Manager for production
            const client = new client_secrets_manager_1.SecretsManagerClient({ region: "us-east-1" });
            const command = new client_secrets_manager_1.GetSecretValueCommand({ SecretId: secretName });
            const response = yield client.send(command);
            if (!response.SecretString)
                throw new Error("Secret not found");
            const secret = JSON.parse(response.SecretString);
            return {
                host: secret.DB_HOST, // Updated from secret.host to secret.DB_HOST
                port: Number(secret.DB_PORT), // Updated from secret.port to secret.DB_PORT
                database: secret.DB_NAME, // Updated from secret.dbname to secret.DB_NAME
                user: secret.DB_USER, // Updated from hardcoded 'invoicer' to secret.DB_USER
                password: secret.DB_PASSWORD, // Updated from secret.password to secret.DB_PASSWORD
            };
        }
    });
}
