FROM node:18

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy the source code
COPY . .

# Expose the Vite dev server port (default: 5173)
EXPOSE 5173 

# Run the dev server
CMD ["npm", "run", "dev", "--", "--host"]
