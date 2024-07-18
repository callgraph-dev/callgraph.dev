FROM node:20

# Switch to a new user "node" with UID 1000
USER node

# NB: This folder is bind-mounted in the docker-compose.yml file.
WORKDIR /callgraph.dev/frontend

CMD ["npm", "run", "watch:ts"]
