# Use an official Node.js runtime as a parent image
FROM node:24.4.1-bookworm-slim

# Set the working directory inside the container
WORKDIR /usr/src/app

# Copy the package.json and package-lock.json
COPY package*.json ./

# Install any needed dependencies
RUN npm install

# Copy the rest of the application files
COPY . .

# Build the TypeScript files (if you use TypeScript)
RUN npm run build  # Ensure you have a build script to compile TypeScript

# Set environment variables
ENV NODE_ENV production

# Expose the port your app will run on
EXPOSE 3000

# Start the application
CMD ["npm", "start"]