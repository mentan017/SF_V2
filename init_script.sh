#! /bin/bash

echo "[INFO] Initializing Springfest Apps V2 (SF_V2)"

echo "[INFO] Installing npm dependencies"
npm i

echo "[INFO] Creating the SSL certificate"
mkdir cert
cd cert
openssl req -newkey rsa:4096 -x509 -sha256 -days 1000 -nodes -subj '/C=BE/ST=Brussels/L=Auderghem/O=Local_App' -out server.crt -keyout server.key
cd ../

echo "[INFO] Creating a resources folder"
mkdir resources

echo "[INFO] Creating a data folder"
mkdir data

echo "[INFO] Creating default environment variables"
touch .env
echo "PROJECT_NAME=\"Springfest_Apps_V2\"" >> .env
echo "PORT=\"2024\"" >> .env
echo "DEFAULT_ADMIN_PASSWORD=\"test\"" >> .env

echo "[INFO] Done!"