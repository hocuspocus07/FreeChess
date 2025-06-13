# Use a Node.js base image
FROM node:18

# Install Wine and dependencies for Stockfish
RUN apt-get update && \
    apt-get install -y wine && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Set up Wine 
ENV WINEDEBUG=-all
ENV DISPLAY=:0.0
RUN wineboot --init

# Create app directory
WORKDIR /usr/src/app

COPY package*.json ./

RUN npm install

COPY . .

COPY ./stockfish/stockfish.exe ./stockfish/stockfish.exe

RUN npm run build

EXPOSE ${PORT:-8000}

CMD ["node", "index.js"]