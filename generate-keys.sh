#!/bin/bash

openssl genrsa -out ./helm/files/microservices/auth/keys/jwt_private.pem 2048 && openssl rsa -in ./helm/files/microservices/auth/keys/jwt_private.pem -pubout -out ./helm/files/microservices/auth/keys/jwt_public.pem

PRIVATE_KEY=$(cat ./helm/files/microservices/auth/keys/jwt_private.pem)
PUBLIC_KEY=$(cat ./helm/files/microservices/auth/keys/jwt_public.pem)

sed -i '/^AUTH_PRIVATE_KEY=/,/^$/d' .env
sed -i '/^AUTH_PUBLIC_KEY=/,/^$/d' .env

echo "AUTH_PRIVATE_KEY=\"$PRIVATE_KEY\"" >> .env
echo "AUTH_PUBLIC_KEY=\"$PUBLIC_KEY\"" >> .env

echo "Private and public keys generated and added to .env file."