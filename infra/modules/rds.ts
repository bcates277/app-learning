import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface RdsComponentArgs {
    instanceIdentifier: string;
    dbName: string;
    username: string;
    password: pulumi.Input<string>;
    subnetIds: pulumi.Input<string>[];
    vpcSecurityGroupIds: pulumi.Input<string>[];
    instanceClass?: string;
    engine?: string;
    engineVersion?: string;
    tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

export class RdsComponent extends pulumi.ComponentResource {
    public readonly dbInstance: aws.rds.Instance;
    public readonly subnetGroup: aws.rds.SubnetGroup;

    constructor(name: string, args: RdsComponentArgs, opts?: pulumi.ComponentResourceOptions) {
        super("custom:resource:RdsComponent", name, {}, opts);

        this.subnetGroup = new aws.rds.SubnetGroup(`${name}-subnet-group`, {
            subnetIds: args.subnetIds,
            tags: {
                Name: `${name}-subnet-group`,
                ...(args.tags || {}),
            },
        }, { parent: this });

        this.dbInstance = new aws.rds.Instance(name, {
            allocatedStorage: 5,
            engine: args.engine || "postgres",
            engineVersion: args.engineVersion || "17.2",
            instanceClass: args.instanceClass || "db.t3.micro",
            dbName: args.dbName,
            username: args.username,
            password: args.password,
            dbSubnetGroupName: this.subnetGroup.name,
            multiAz: false,
            vpcSecurityGroupIds: args.vpcSecurityGroupIds,
            skipFinalSnapshot: true,
            publiclyAccessible: true,
            tags: args.tags,
        }, { parent: this });

        this.registerOutputs({
            endpoint: this.dbInstance.endpoint,
            instanceId: this.dbInstance.id,
        });
    }
}