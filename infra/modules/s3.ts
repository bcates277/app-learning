import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface S3BucketComponentArgs {
  bucketName: string;
  fileName?: string; // Make optional
  fileContent?: string;
  acl?: string;
  tags?: { [key: string]: string };
}

export class S3BucketComponent extends pulumi.ComponentResource {
  public readonly bucket: aws.s3.Bucket;
  public readonly bucketObject?: aws.s3.BucketObject;

  constructor(
    name: string,
    args: S3BucketComponentArgs,
    opts?: pulumi.CustomResourceOptions
  ) {
    super("custom:resource:S3BucketComponent", name, {}, opts);

    this.bucket = new aws.s3.Bucket(
      name,
      {
        bucket: args.bucketName,
        acl: args.acl || "private",
        tags: args.tags,
      },
      { parent: this }
    );

    if (args.fileName) {
      this.bucketObject = new aws.s3.BucketObject(
        args.fileName,
        {
          bucket: this.bucket.id,
          key: args.fileName,
          content: args.fileContent ?? "placeholder content",
          acl: args.acl || "private",
        },
        { parent: this }
      );
    }

    this.registerOutputs({
      bucketName: this.bucket.bucket,
      bucketObjectKey: this.bucketObject?.key,
    });
  }
}
