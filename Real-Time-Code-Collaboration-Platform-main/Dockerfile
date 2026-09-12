FROM node:alpine

LABEL version="1.0"
LABEL description="Code Editor."
LABEL maintainer="Pratiksha Vaya"

WORKDIR /app

COPY ["package.json", "package-lock.json", "./"]

RUN npm install

COPY . .

# Set environment variables
ENV VITE_BACKEND_URL=http://localhost:5000
ENV SERVER_PORT=5000

# Expose the necessary ports
EXPOSE 5000
EXPOSE 3000

# Run the application
CMD ["npm", "run", "start:docker"]