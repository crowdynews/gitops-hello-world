# GitOps Hello World

Hello world REST API used to demonstrate a [GitOps](https://github.com/danillouz/gitops-manifesto)
CI/CD workflow using [Google Container Builder](https://cloud.google.com/container-builder/) to
deploy to a Kubernetes cluster.

This is a reproduced workflow as presented during the [KubeCon Opening Keynote by Kelsey Hightower](https://www.youtube.com/watch?v=07jq-5VbBVQ), using [this repo](https://github.com/kelseyhightower/helloworld) as a blueprint.

## Running locally

```
npm i && npm start
```

The following env vars can be set:

| PROPERTY   | REQUIRED | DEFAULT VALUE                   |
| ---------- | -------- | ------------------------------- |
| `API_HOST` | no       | `0.0.0.0` set in `./src/app.js` |
| `API_PORT` | no       | `8888` set in `./src/app.js`    |

## Caveats

In order to be able to store, retrieve, decrypt and use GitHub credentials, which will allow you to
perform `git` actions in your build steps, follow the following steps:

### 1. GitHub Token

Create a GitHub [personal access token](https://help.github.com/articles/creating-a-personal-access-token-for-the-command-line/).

### 2. Create Hub Config

[Hub](https://hub.github.com/) makes it easier to interact with GitHub repository. The config file
will contain the GitHub _username_ and _personal access token_:

```
cat <<EOF > $HOME/.config/hub
github.com:
  - protocol: https
    user: <USERNAME>
    oauth_token: <GITHUB_PERSONAL_ACCESS_TOKEN>
EOF
```

For more information see the [hub credential helper](https://github.com/kelseyhightower/hub-credential-helper#usage).

### 3. Encrypt Hub Config

To be able to safely store the hub config, we must encrypt it. You can use [Google Cloud Storage](https://cloud.google.com/storage/) and [Google Cloud Key Management Service](https://cloud.google.com/kms/) (KMS).

First create a Keyring:

```
gcloud kms keyrings create some-name-keyring --location=global
```

The create a Key using the Keyring name:

```
gcloud kms keys create some-name-key \
--location=global --keyring=some-name-keyring \
--purpose=encryption
```

Encrypt the hub config by using the Keyring and Key:

```
gcloud kms encrypt --plaintext-file=$HOME/.config/hub \
--ciphertext-file=$HOME/.config/hub.enc \
--location=global --keyring=some-name-keyring --key=some-name-key
```

### 4. Store Encrypted Hub Config

First create a [Cloud Storage Bucket](https://cloud.google.com/storage/docs/quickstart-gsutil) and
then copy the encrypted file:

```
gsutil cp $HOME/.config/hub.enc gs://<CREATED_BUCKET_NAME>
```

### 5. Using Hub Config

Now you can use the `gsutil` command in your `cloudbuild.yaml` to copy the encrypted config and
store it in a mounted volume named `config`:

```yaml
#
# User-defined substitutions:
# _KMS_KEY
# _KMS_KEYRING
#

steps:
  # Retrieve and decrypt the GitHub Hub configuration.
  - name: 'gcr.io/cloud-builders/gcloud'
    entrypoint: 'sh'
    args:
      - '-c'
      - |
        gsutil cp gs://${PROJECT_ID}-gitops-hello-world-configs/hub.enc hub.enc
        gcloud kms decrypt \
          --ciphertext-file hub.enc \
          --plaintext-file /config/hub \
          --location global \
          --keyring ${_KMS_KEYRING} \
          --key ${_KMS_KEY}
    volumes:
      - name: 'config'
        path: /config
```

After this step, use the `gcr.io/hightowerlabs/hub` image to interact with GitHub repos while
mounting the `config` volume:

```yaml
steps:
  - name: 'gcr.io/hightowerlabs/hub'
      env:
        - 'HUB_CONFIG=/config/hub'
      entrypoint: 'sh'
      args:
        - '-c'
        - |
          ACTIVE_ACCOUNT=$(gcloud auth list --filter=status:ACTIVE --format="value(account)")

          hub config --global credential.https://github.com.helper /usr/local/bin/hub-credential-helper
          hub config --global hub.protocol https
          hub config --global user.email "$${ACTIVE_ACCOUNT}"
          hub config --global user.name "Google Container Builder"

          hub clone "https://github.com/crowdynews/gitops-hello-world-infra-staging-gcb.git"
      volumes:
      - name: 'config'
        path: /config
```

### Identity & Access Management Roles

GCP IAM requires `[PROJECT_ID]@cloudbuild.gserviceaccount.com` to have the following roles:

* Cloud Container Builder
* Cloud KMS CryptoKey Decrypter
