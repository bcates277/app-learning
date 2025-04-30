import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as config from "./config";
import * as fs from "fs";
import * as path from "path";
import { S3BucketComponent, S3BucketComponentArgs } from "./modules/s3";
import { RdsSecurityGroupComponent } from "./modules/securityGroup";
import { RdsComponent } from "./modules/rds";
import { IamInstanceProfileComponent } from "./modules/IAM/instanceProfile";
import { IamServiceRoleComponent } from "./modules/IAM/serviceRole";
import { IamInstanceRoleComponent } from "./modules/IAM/instanceRole";
import { ElasticBeanstalkApp } from "./modules/elasticbeanstalk/ebs";
import { EcrComponent } from "./modules/ecr";
import { GithubOidcComponent } from "./modules/IAM/GithubOidcRoleComponent";

// ECR repository
const ecrRepo = new EcrComponent("app-learner-ecr", {
  repositoryName: "app-learner-backend",
  tags: {
    Environment: "dev",
    Project: "app-learner",
  },
});

const githubOidc = new GithubOidcComponent("github-actions", {
  githubRepo: "bcates277/app-learning",
  branch: "main",
  ecrAccess: true,
});

// This is a JSON file that describes the Docker image and its configuration
const dockerRunnerJson = fs.readFileSync(
  path.join(__dirname, "Dockerrun.aws.json"),
  "utf8"
);

const s3Args: S3BucketComponentArgs = {
  bucketName: "my-invoicer-333",
  fileName: "Dockerrun.aws.json",
  fileContent: dockerRunnerJson,
  acl: "private",
  tags: {
    Environment: "dev",
    Project: "Invoicer",
  },
};

const s3Bucket = new S3BucketComponent("invoicer", s3Args);

// Security group for RDS
const vpcId = config.vpcId;
const rdsSecurityGroup = new RdsSecurityGroupComponent("my-rds-sg", {
  vpcId: vpcId,
  allowedCidrBlocks: ["172.31.0.0/16"],
  port: 5432,
  tags: {
    Name: "RDS security group",
    Environment: "dev",
  },
});

// RDS instance
const db = new RdsComponent("invoicer-rds", {
  instanceIdentifier: "invoicer-rds",
  dbName: "invoicerrds",
  username: "invoicer",
  password: config.rdsPassword,
  subnetIds: ["subnet-0a4b110fd20a406e6", "subnet-07d52a5effbee9c92"],
  vpcSecurityGroupIds: [rdsSecurityGroup.securityGroup.id],
  tags: {
    Environment: "dev",
    Project: "Invoicer",
  },
});

// Instance role
const instanceRole = new IamInstanceRoleComponent("ebs-instance-role", {
  roleName: "ebs-instance-role",
  policyArns: [
    "arn:aws:iam::aws:policy/AWSElasticBeanstalkWebTier",
    "arn:aws:iam::aws:policy/AWSElasticBeanstalkWorkerTier",
    "arn:aws:iam::aws:policy/AWSElasticBeanstalkMulticontainerDocker",
    "arn:aws:iam::aws:policy/AmazonS3FullAccess",
  ],
});

// Instance profile
const instanceProfile = new IamInstanceProfileComponent(
  "ebs-instance-profile",
  {
    profileName: "ebs-instance-profile",
    role: instanceRole.role.name,
  }
);

// Service role
const serviceRole = new IamServiceRoleComponent("ebs-service-role", {
  roleName: "ebs-service-role",
  policyArn:
    "arn:aws:iam::aws:policy/service-role/AWSElasticBeanstalkEnhancedHealth",
});

// // // Elastic Beanstalk

// const beanstalkApp = new ElasticBeanstalkApp("Invoicer-App", {
//   appName: "Invoicer-App",
//   environmentName: "Invoicer-env",
//   solutionStackName: "64bit Amazon Linux 2023 v4.5.1 running Docker",
//   versionLabel: "1.10.0",
//   s3Bucket: s3Args.bucketName,
//   s3Key: "Dockerrun.aws.json",
//   settings: [
//     {
//       namespace: "aws:autoscaling:launchconfiguration",
//       name: "IamInstanceProfile",
//       value: "ebs-instance-profile",
//     },
//     {
//       namespace: "aws:elasticbeanstalk:environment",
//       name: "ServiceRole",
//       value: "ebs-service-role",
//     },
//     {
//       namespace: "aws:elasticbeanstalk:application:environment",
//       name: "INVOICER_POSTGRES_USER",
//       value: config.rdsUser,
//     },
//     {
//       namespace: "aws:elasticbeanstalk:application:environment",
//       name: "INVOICER_POSTGRES_PASSWORD",
//       value: config.rdsPassword,
//     },
//     {
//       namespace: "aws:elasticbeanstalk:application:environment",
//       name: "INVOICER_POSTGRES_DB",
//       value: config.rdsDBName,
//     },
//     {
//       namespace: "aws:elasticbeanstalk:application:environment",
//       name: "INVOICER_POSTGRES_HOST",
//       value: config.rdsHost,
//     },
//   ],
// });

export const dbEndpoint = db.dbInstance.endpoint;
export const dbName = db.dbInstance.dbName;
export const dbInstanceId = db.dbInstance.id;
export const dbInstanceUser = db.dbInstance.username;
export const ecrRepoUrl = ecrRepo.repository.repositoryUrl;
export const bucketName = s3Args.bucketName;
export const securityGroupId = rdsSecurityGroup.securityGroup.id;


const currentCaller = aws.getCallerIdentity({});
currentCaller.then((identity) => {
  console.log("Using AWS Account:", identity.accountId);
});
