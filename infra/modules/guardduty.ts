import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";

export interface GuardDutyComponentArgs {
  tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>;
  orgAccountId: pulumi.Input<string>;
  regionNames?: string[];
  autoEnableOrganizationMembers?: pulumi.Input<string>;
}

export class GuardDutyComponent extends pulumi.ComponentResource {
  public readonly detectors: aws.guardduty.Detector[] = [];
  public readonly organizationAdminAccount: aws.guardduty.OrganizationAdminAccount;

  constructor(
    name: string,
    args: GuardDutyComponentArgs,
    opts?: pulumi.ComponentResourceOptions
  ) {
    super("custom:resource:GuardDutyComponent", name, {}, opts);

    // Create the OrganizationAdminAccount
    this.organizationAdminAccount = new aws.guardduty.OrganizationAdminAccount(
      `${name}-orgAdminAccount`,
      {
        adminAccountId: args.orgAccountId,
      },
      { parent: this }
    );

    // Define the list of region names (default or user-provided)
    const regionNames = args.regionNames || [
      "us-east-1",
      "us-west-2",
      "eu-central-1",
    ];

    // Create an array of regions with providers
    const regions = regionNames.map((regionName) => ({
      name: regionName,
      provider: new aws.Provider(`${name}-${regionName}-provider`, {
        region: regionName as aws.Region,
      }),
    }));

    // Initialize resources in all regions
    this.initializeResources(name, args, regions).then(() => {
      this.registerOutputs({
        organizationAdminAccountId: this.organizationAdminAccount.id,
        detectorIds: this.detectors.map((detector) => detector.id),
      });
    });
  }

  private createDetector(
    name: string,
    region: { name: string; provider: aws.Provider },
    tags?: pulumi.Input<{ [key: string]: pulumi.Input<string> }>
  ): aws.guardduty.Detector {
    return new aws.guardduty.Detector(
      `${name}-${region.name}-detector`,
      {
        enable: true,
        tags: tags,
      },
      { parent: this, provider: region.provider }
    );
  }

  private createOrganizationConfiguration(
    name: string,
    region: { name: string; provider: aws.Provider },
    detectorId: pulumi.Output<string>,
    autoEnableOrganizationMembers?: pulumi.Input<string>
  ): aws.guardduty.OrganizationConfiguration {
    return new aws.guardduty.OrganizationConfiguration(
      `${name}-${region.name}-org-config`,
      {
        detectorId: detectorId,
        autoEnableOrganizationMembers: autoEnableOrganizationMembers || "NEW",
        datasources: {
          s3Logs: {
            autoEnable: true,
          },
          kubernetes: {
            auditLogs: {
              enable: true,
            },
          },
          malwareProtection: {
            scanEc2InstanceWithFindings: {
              ebsVolumes: {
                autoEnable: true,
              },
            },
          },
        },
      },
      { parent: this, provider: region.provider }
    );
  }

  private async initializeResources(
    name: string,
    args: GuardDutyComponentArgs,
    regions: { name: string; provider: aws.Provider }[]
  ): Promise<void> {
    await Promise.all(
      regions.map(async (region) => {
        pulumi.log.info(
          `Creating GuardDuty resources in region: ${region.name}`
        );

        // Create a detector
        const detector = this.createDetector(name, region, args.tags);
        this.detectors.push(detector);

        // Create organization configuration if autoEnableOrganizationMembers is provided
        if (region.name === "us-east-1" && args.autoEnableOrganizationMembers) {
          pulumi.log.info(`Creating OrganizationConfiguration for region: ${region.name}`);
          this.createOrganizationConfiguration(
            name,
            region,
            detector.id,
            args.autoEnableOrganizationMembers
          );
        }
      })
    );
  }
}
