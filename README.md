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
