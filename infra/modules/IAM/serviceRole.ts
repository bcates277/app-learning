// modules/iam/IamServiceRoleComponent.ts
import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface IamServiceRoleArgs {
  roleName: string;
  policyArn: string;
}

export class IamServiceRoleComponent extends pulumi.ComponentResource {
  public readonly role: aws.iam.Role;
  
  constructor(name: string, args: IamServiceRoleArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:iam:IamServiceRoleComponent", name, {}, opts);

    this.role = new aws.iam.Role(name, {
      name: args.roleName,
      assumeRolePolicy: aws.iam.assumeRolePolicyForPrincipal({
        Service: "elasticbeanstalk.amazonaws.com",
      }),
    }, { parent: this });

    new aws.iam.RolePolicyAttachment(`${name}-service-policy`, {
      role: this.role.name,
      policyArn: args.policyArn,
    }, { parent: this });

    this.registerOutputs({ role: this.role });
  }
}
