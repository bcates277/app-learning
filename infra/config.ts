// config.ts
import * as pulumi from "@pulumi/pulumi";

const config = new pulumi.Config();

export const vpcId = config.requireSecret("vpcId"); // stored securely
export const databasePort = config.getNumber("databasePort") || 5432;
export const rdsPassword = config.requireSecret("rdsPassword"); // stored securely
export const rdsHost = config.requireSecret("rdsHost"); // stored securely
export const rdsUser = config.requireSecret("rdsUser"); // stored securely
export const rdsDBName = config.requireSecret("rdsDBName"); // stored securely
export const orgAccountId = config.requireSecret("orgAccountId");