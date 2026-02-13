# Use Ubuntu as base
FROM ubuntu:22.04

# Install basic tools
RUN apt-get update && apt-get install -y \
    curl git cmake clang libssl-dev build-essential libpq-dev ca-certificates

# Install Sui Binary (Downloads pre-built binary to save time)
# NOTE: In production, verify the SHA.
RUN curl -fL https://github.com/MystenLabs/sui/releases/download/mainnet-v1.16.2/sui-mainnet-v1.16.2-ubuntu-x86_64.tgz -o sui.tgz \
    && tar -xzf sui.tgz \
    && mv sui /usr/local/bin/ \
    && rm sui.tgz

# Configure Sui Client
WORKDIR /root
RUN sui client --yes

# Expose RPC port
EXPOSE 9000