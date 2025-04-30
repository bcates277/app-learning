// modules/iam/IamInstanceProfileComponent.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface IamInstanceProfileArgs {
  profileName: string;
  role: pulumi.Input<string>;
}

export class IamInstanceProfileComponent extends pulumi.ComponentResource {
  public readonly profile: aws.iam.InstanceProfile;

  constructor(name: string, args: IamInstanceProfileArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:iam:IamInstanceProfileComponent", name, {}, opts);

    this.profile = new aws.iam.InstanceProfile(name, {
      name: args.profileName,
      role: args.role,
    }, { parent: this });

    this.registerOutputs({ profile: this.profile });
  }
}
