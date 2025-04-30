import * as aws from "@pulumi/aws";
import * as pulumi from "@pulumi/pulumi";

export interface ElasticBeanstalkArgs {
    appName: string;
    environmentName: string;
    solutionStackName: string; // e.g., "64bit Amazon Linux 2 v5.8.4 running Node.js 18"
    versionLabel?: string;
    s3Bucket?: pulumi.Input<string>;
    s3Key?: string;
    settings: { namespace: string; name: string; value: pulumi.Input<string>; }[];
  }