# Use official Node.js image
FROM node:20-alpine

# Set working directory inside container
WORKDIR /app

# Copy package files first
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev
RUN npm install

# Copy all project files
COPY --chown=node:node . .
USER node


# Expose application port
EXPOSE 3000

# Start the app
CMD ["npm", "start"]
