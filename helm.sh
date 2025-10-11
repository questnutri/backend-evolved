#!/bin/bash

if [ "$#" -gt 0 ]; then
  while [ "$#" -gt 0 ]; do
    case "$1" in
      -d|--dev)
        helm install questnutri ./helm -f ./helm/dev.yaml
        exit 0
        ;;
      -u|--uninstall)
        helm uninstall questnutri
        exit 0
        ;;
      -r|--reinstall)
        helm uninstall questnutri && helm install questnutri ./helm
        exit 0
        ;;
      -rd|--reinstall-dev)
        helm uninstall questnutri && helm install questnutri ./helm -f ./helm/dev.yaml
        exit 0
        ;;
      *)
        echo "Unknown option: $1"
        exit 1
        ;;
    esac
  done
fi

helm install questnutri ./helm