#!/bin/bash

composer runtime install --card PeerAdmin@hlfv1 --businessNetworkName kit-blockchain
composer network start --card PeerAdmin@hlfv1 --networkAdmin admin --networkAdminEnrollSecret adminpw --archiveFile kit-blockchain@0.0.1.bna --file networkadmin.card
composer network ping --card admin@kit-blockchain
