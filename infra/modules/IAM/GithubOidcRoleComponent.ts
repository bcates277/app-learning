import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface GithubOidcArgs {
  githubRepo: string; // Format: username/repo
  branch?: string;
  ecrAccess?: boolean;
  tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
}

export class GithubOidcComponent extends pulumi.ComponentResource {
  public readonly oidcProvider: aws.iam.OpenIdConnectProvider;
  public readonly iamRole: aws.iam.Role;

  constructor(name: string, args: GithubOidcArgs, opts?: pulumi.ComponentResourceOptions) {
    super("custom:iam:GithubOidcComponent", name, {}, opts);

    const branch = args.branch ?? "main";

    // 1. Create the GitHub OIDC Identity Provider
    this.oidcProvider = new aws.iam.OpenIdConnectProvider(`${name}-oidc-provider`, {
      url: "https://token.actions.githubusercontent.com",
      clientIdLists: ["sts.amazonaws.com"],
      thumbprintLists: ["6938fd4d98bab03faadb97b34396831e3780aea1"],
    }, { parent: this });

    const awsAccountId = aws.getCallerIdentity().then(id => id.accountId);

    // 2. IAM Role with trust policy for GitHub OIDC
    const assumeRolePolicy = pulumi
      .all([awsAccountId, this.oidcProvider.arn])
      .apply(([accountId, providerArn]) =>
        JSON.stringify({
          Version: "2012-10-17",
          Statement: [
            {
              Effect: "Allow",
              Principal: {
                Federated: providerArn,
              },
              Action: "sts:AssumeRoleWithWebIdentity",
              Condition: {
                StringEquals: {
                  "token.actions.githubusercontent.com:sub": `repo:${args.githubRepo}:ref:refs/heads/${branch}`,
                },
              },
            },
          ],
        })
      );

    this.iamRole = new aws.iam.Role(`${name}-github-role`, {
      assumeRolePolicy: assumeRolePolicy,
      tags: args.tags,
    }, { parent: this });

    // 3. Attach ECR permissions if needed
    if (args.ecrAccess) {
      new aws.iam.RolePolicyAttachment(`${name}-ecr-attach`, {
        role: this.iamRole.name,
        policyArn: "arn:aws:iam::aws:policy/AmazonEC2ContainerRegistryPowerUser",
      }, { parent: this });
    }

    this.registerOutputs({
      oidcProviderArn: this.oidcProvider.arn,
      roleArn: this.iamRole.arn,
    });
  }
}