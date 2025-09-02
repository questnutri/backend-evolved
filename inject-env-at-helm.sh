#!/bin/bash

kubectl delete secret qn-secret
kubectl create secret generic qn-secret --from-env-file=prod.env