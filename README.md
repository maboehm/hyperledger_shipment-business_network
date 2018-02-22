# Hyperledger Blockchain - Secure Shipment Example

This example network shows how a shipment of a good can be made more secure while requiring less trust, using blockchain technology. It represents a scenario, where an insured shipment is sent with different logistic partners, where there is a high risk of physical damage to the shipment (e.g. a overseas-shipment with multiple handovers). To ensure secure handling of the shipment a IoT-Sensor, that all parties trust, is placed along the shipment. For this demo the Sensor can be simulated using an [Ionic-App](https://github.com/m2hofi94/hyperledger_shipment-container_app).

Along with the simulation app, there also is a [Demo-App](https://github.com/m2hofi94/hyperledger_shipment-demo), that presents a simple User Interface for interacting with the blockchain, seeing the status of the shipment, and securing the handover through the blockchain.

# Set-Up
## Using IBM's Hyperledger Composer Playground
IBM hosts a [Hyperledger Composer Playground](https://composer-playground.mybluemix.net/), which can be used to quickly test some chain-code in a browser sandbox. This does not run on an actual blockchain, but does help to understand the code, and "play around" with it. 

You can either simply copy the file contents to an empty project there, or upload the *.bna*-File. See below for instructions on how to create one using the [composer-cli](https://hyperledger.github.io/composer/reference/commands.html).

## Using a cloud sandbox
This segment is a summary of the steps outlined in the official [IBM Guide](https://ibm-blockchain.github.io/):
1. Carefully follow the setup instructions: https://ibm-blockchain.github.io/setup/
1. Use the Simple Install method, as outlined here: https://ibm-blockchain.github.io/simple/
1. Access the Composer Playground, using the public IP for your cluster (```bx cs workers blockchain```) under: ```http://<<PUBLIC_IP>>:31080```

For the Demo-Apps to work, you need to expose the blockchain using the Composer-REST-Server. Instructions on how to do that can be found [here](https://ibm-blockchain.github.io/interacting/)

### Tipps
While we found the instructions above to fairly comprehensible and easy to follow, here are some troubles we ran into, and how to solve them.
- Kubectl has a pretty web interface, that you can start by running ```kubectl proxy```. You can authenticate there using the access-token retrieved by running ```kubectl config view -o jsonpath='{.users[0].user.auth-provider.config.id-token}'```
- when deploying a new business network you need to provide credentials to authorize the creation of the new network. These are "admin", and "adminpw" by default
- as explained [here](https://ibm-blockchain.github.io/interacting/), you need to download the business card from your new network, to interact with it using the composer cli and to create the REST-Server:
  - They provide a script to update the network admin card with the correct ip: ```scripts/connection-profile/update_card.sh -a <IP> -c <<PATH>>```
  - add card to composer: ```composer card import -f <<FILE>>``` 
  - test it: ```composer network ping -c <<admin@kit-blockchain>>```
  - create rest server: ```./create/create_composer-rest-server.sh --business-network-card <<business-network-card>>```

# Deployment
Assuming you have everything set up, you can easily deploy this business network by fist creating a *.bna*-file, which a network-admin can then deploy to the business network, or which can be uploaded using the Composer-Playground (by using the "Deploy a new business network" option):

```
# create the bna file
composer archive create -t dir -n .

# update the network using the admin-card
composer network update -c admin@kit-blockchain  -a kit-blockchain@0.0.1.bna
```