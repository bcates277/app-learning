import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import { ElasticBeanstalkArgs } from "./types";

export class ElasticBeanstalkApp extends pulumi.ComponentResource {
  public readonly application: aws.elasticbeanstalk.Application;
  public readonly environment: aws.elasticbeanstalk.Environment;

  constructor(name: string, args: ElasticBeanstalkArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:elasticbeanstalk:ElasticBeanstalkApp", name, {}, opts);

    this.application = new aws.elasticbeanstalk.Application(`${name}-app`, {
      name: args.appName,
    }, { parent: this });

    let appVersion: aws.elasticbeanstalk.ApplicationVersion | undefined;

    if (args.versionLabel && args.s3Bucket && args.s3Key) {
      appVersion = new aws.elasticbeanstalk.ApplicationVersion(`${name}-version`, {
        application: this.application.name,
        bucket: args.s3Bucket,
        key: args.s3Key,
        name: args.versionLabel,
      }, { parent: this });
    }

    this.environment = new aws.elasticbeanstalk.Environment(`${name}-env`, {
      name: args.environmentName,
      application: this.application.name,
      solutionStackName: args.solutionStackName,
      version: appVersion ? appVersion : undefined,
      settings: args.settings,
    }, { parent: this });

    this.registerOutputs({
      application: this.application,
      environment: this.environment,
    });
  }
}
