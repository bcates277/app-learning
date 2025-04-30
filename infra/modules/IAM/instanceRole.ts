import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface IamInstanceRoleArgs {
  roleName: string;
  policyArns: string[];
}

export class IamInstanceRoleComponent extends pulumi.ComponentResource {
  public readonly role: aws.iam.Role;

  constructor(name: string, args: IamInstanceRoleArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:iam:IamInstanceRoleComponent", name, {}, opts);

    this.role = new aws.iam.Role(name, {
      name: args.roleName,
      assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "ec2.amazonaws.com",
      }),
    }, { parent: this });

    args.policyArns.forEach((policyArn, i) => {
      new aws.iam.RolePolicyAttachment(`${name}-policy-${i}`, {
        role: this.role.name,
        policyArn,
      }, { parent: this });
    });

    this.registerOutputs({ role: this.role });
  }
}