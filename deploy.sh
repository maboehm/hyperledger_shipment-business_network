#!/bin/bash

composer archive create -t dir -n .

composer network update -c admin@kit-blockchain  -a kit-blockchain@0.0.1.bna

exit 0