import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface ElasticBeanstalkArgs {
  appName: string;
  environmentName: string;
  solutionStackName: string;
  dockerrunPath: string; // path to folder that contains Dockerrun.aws.json
  s3Bucket: pulumi.Input<string>;
  settings: { namespace: string; name: string; value: pulumi.Input<string> }[];
}

export class ElasticBeanstalkApp extends pulumi.ComponentResource {
  constructor(
    name: string,
    args: ElasticBeanstalkArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:elasticbeanstalk:ElasticBeanstalkApp", name, {}, opts);

    const app = new aws.elasticbeanstalk.Application(`${name}-app`, {
      name: args.appName,
    }, { parent: this });

    const versionLabel = `${args.appName}-${pulumi.getStack()}-${Date.now()}`;

    // Upload zip to S3
    const zipArchive = new pulumi.asset.FileArchive(args.dockerrunPath);
    const bucketObject = new aws.s3.BucketObject(`${versionLabel}.zip`, {
      bucket: args.s3Bucket,
      source: zipArchive,
      contentType: "dockerrun/zip",
    }, { parent: this });

    const appVersion = pulumi
      .all([bucketObject.key, args.s3Bucket])
      .apply(([key, bucket]) => new aws.elasticbeanstalk.ApplicationVersion(`${name}-v`, {
        application: app.name,
        bucket,
        key,
        name: versionLabel,
      }, { parent: this }));

    const env = new aws.elasticbeanstalk.Environment(`${name}-env`, {
      name: args.environmentName,
      application: app.name,
      solutionStackName: args.solutionStackName,
      version: appVersion,
      settings: args.settings,
    }, { parent: this });

    this.registerOutputs({
      application: app,
      environment: env,
    });
  }
}