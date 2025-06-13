# Use a Node.js base image
FROM node:18

# Install Wine and dependencies for Stockfish
RUN apt-get update && \
    apt-get install -y wine && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

COPY ./stockfish/stockfish ./stockfish/stockfish
RUN chmod +x ./stockfish/stockfish

EXPOSE ${PORT:-8000}

CMD ["node", "index.js"]