floodrunner logo here //TODO

# FloodRunner (make this a link to floodrunner.dev //TODO)

A complete framework for monitoring web applications using Flood Element tests. The framework is designed for Kubernetes and leverages Kubernetes jobs to execute Flood Element tests.

-pictures of the homepage and the and results page //TODO

## Deploying your own FloodRunner ecosystem

The architecture of the FloodRunner ecosystem is shown below:

##TODO FloodRunner Ecosystem Architecture

### Connecting to your Kubernetes instance

---

#### Connecting to an AKS instance

Connect to your kubernetes instance by running `az aks get-credentials --subscription <Azure Subscription Id> --resource-group <Resource Group> --name <AKS Instance Name>`

#### Connecting via KubeConfig file

-TODO: Instructions for taking kubeconfig file, I did it manually

---

### Kubernetes deployments

The Kubernetes deployments can either be done by using the Kubernetes command line (kubectl) or by using `Skaffold`.

Setup Traefik:
Run `skaffold run -p traefik` this will setup the Traefik load balancer and a default `WhoAmI` pod which can be used to check that the Traefik integration with Let's Encrypt and routing is working correctly.

Then get the Traefik external IP using `kubectl get services` to see the Traefik service. This IP address can then be put into CloudFlare (Or other DNS Provider) to get traffic into the cluster using an A record set to the External IP Address.

NB. For CloudFlare ensure A record is proxied and SSL Setting is set to `Full`

Setup RabbitMQ:

- Ensure Helm is installed on your machine (https://helm.sh/docs/intro/install/).
- Create a namespace for rabbit to be deployed into using `kubectl create namespace rabbit`
- Install RabbitMq using `helm install rabbit stable/rabbitmq --namespace rabbit`
- Once installed, username will be `user` and password can be obtained using `(kubectl get secret --namespace rabbit rabbit-rabbitmq -o jsonpath="{.data.rabbitmq-password}" | base64 --decode)`. These credentials can then be used in the `api-secrets.yml` file to specify secrets for the API deployment.
- Run `skaffold run -p rabbitmq` to creating the Traefik routes for rabbitMq
- Apply the rabbitmq-management-route.yml file which will create a Traefik rule to allow you to access the RabbitMQ management interface on `http://<traefikExternalIp>:15672/rabbitmq/management/#/` //TODO: how to get this to work with the main domain
- The RabbitMq endpoint can be exposed from within the cluster by using the Traefik rule `rabbitmq-route.yml` and then the amqp connection string will be `amqp://<rabbitmq-user-name>:<rabbitmq-password>@<traefikExternalIp>`
- [OPTIONAL] If you don't want to apply the rule you can create a tunnel to get to RabbitMQ Management Interface `kubectl port-forward --namespace rabbit svc/rabbit-rabbitmq 15672:15672`

Setup MongoDB:
Run `skaffold run -p mongodb` this will setup a MongoDb database that uses a persistent volume to store data in the Kuberenetes cluster.

Setup FloodRunner API:
Run `skaffold run -p api` this will setup the FloodRunner NestJS API. Ensure that you are pulling the correct (and latest) docker image from whichever registry you choose.

Setup FloodRunner Web:
Run `skaffold run -p web` this will setup the FloodRunner ReactJS Frontend. Ensure that you are pulling the correct (and latest) docker image from whichever registry you choose.

### Installing Kubernetes Dashboard

- Install kubernetes dashboard using `kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.0.0/aio/deploy/recommended.yaml` and then executing the configuration scripts using `kubectl apply -f ./k8s/kubernetes-dashboard`
- Access the dashboard on `http://localhost:8001/api/v1/namespaces/kubernetes-dashboard/services/https:kubernetes-dashboard:/proxy/`
- Get a token using powershell with command `kubectl -n kubernetes-dashboard describe secret $(kubectl -n kubernetes-dashboard get secret | sls admin-user | ForEach-Object { $_ -Split '\s+' } | Select -First 1)`

### Setting up Azure Blob Storage

If you choose to use Azure blob storage for storing the Flood Element logs and screenshots, it is important to configure the CORS origins in the portal to include to allow the frontend web portal to fetch the resources. For a broad configuration use:

- Allowed origins: \*
- Allowed methods: GET
- Allowed headers: \*
- Exposed headers: \*
- Max age: 600

If this is not configured you will receive CORS errors when fetching the resources.

### Other Instructions

- Start Minikube using `minikube start`
- Start Minikube tunnel to allow Traefik to setup a local loadbalancer using `minikube tunnel`
- Push images to minikube cache using `minikube cache add <imageName:imageTag>`
- Deploy all kubernetes configuration files using `skaffold dev`. You will need to create a traefik-secrets.yml file
- Deploy initial setup using `skaffold dev -p lis`. Deploys traefik intial along with initial configuration.
- Deploy MongoDb using `skaffold dev -p mongodb`. Deploys MongoDb
- Deploy API using `skaffold dev -p api`. Deploys API
- Generate base64 encoded secrets in Git Bash using `echo <secret> | openssl enc -base64`
- Retrieve Traefik External IP address by running `kubectl get service traefik`
- Connect to mongo database by port forwarding using `kubectl port-forward --namespace default svc/mongodb-cluster-ip-service 29019:27017"

## Mischalleneous

- Kill all node processes using `taskkill /f /im node.exe`