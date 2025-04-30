#!/bin/bash

# unlock Bitwarden vault and get session key
export BW_SESSION=$(bw unlock --raw)

# Get credentials item
AWS_CREDS_JSON=$(bw get item aws-my-pulumi-invoicer)

# Parse out fields
AWS_ACCESS_KEY_ID=$(echo "$AWS_CREDS_JSON" | jq -r '.fields[] | select(.name=="aws_access_key_id") | .value')
AWS_SECRET_ACCESS_KEY=$(echo "$AWS_CREDS_JSON" | jq -r '.fields[] | select(.name=="aws_secret_access_key") | .value')
AWS_REGION=$(echo "$AWS_CREDS_JSON" | jq -r '.fields[] | select(.name=="region") | .value')

# Export credentials for Pulumi
export AWS_ACCESS_KEY_ID
export AWS_SECRET_ACCESS_KEY
export AWS_REGION
