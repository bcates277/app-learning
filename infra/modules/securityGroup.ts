import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface RdsSecurityGroupArgs {
    vpcId: pulumi.Input<string>;
    allowedCidrBlocks?: pulumi.Input<string[]>; // CIDR blocks allowed to access RDS
    port?: number; // Default to PostgreSQL (5432)
    tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

export class RdsSecurityGroupComponent extends pulumi.ComponentResource {
    public readonly securityGroup: aws.ec2.SecurityGroup;

    constructor(name: string, args: RdsSecurityGroupArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:resource:RdsSecurityGroupComponent", name, {}, opts);

        const port = args.port || 5432;

        this.securityGroup = new aws.ec2.SecurityGroup(name, {
            vpcId: args.vpcId,
            description: `Allow inbound RDS access on port ${port}`,
            ingress: [{
                protocol: "tcp",
                fromPort: port,
                toPort: port,
                cidrBlocks: args.allowedCidrBlocks || ["0.0.0.0/0"], // default: open to all (for testing only!)
            }],
            egress: [{
                protocol: "-1", // all traffic
                fromPort: 0,
                toPort: 0,
                cidrBlocks: ["0.0.0.0/0"],
            }],
            tags: args.tags,
        }, { parent: this });

        this.registerOutputs({
            securityGroupId: this.securityGroup.id,
        });
    }
}