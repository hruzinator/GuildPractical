# Overview
A simple Chat application built with Node.js, using Express.js for routing, MongoDB as a datastore, and Mocha for unit tests. It includes two main files, api.js, which runs the API routes, and app.js, which provides a command-line chat application which uses the API.

# How to run on *nix systems

1) Pull down this repository: `git clone https://github.com/hruzinator/GuildPractical.git`
2) Make sure you have Node.js, NPM, and Mongod. Many of these utilities can be found with most package managers on *nix systems.
  * Using apt:
  ```bash
  sudo apt update && sudo apt install mongod mongod-server-core mongod-clients npm
  ```
  To install node, it is reccomeneded to use the [Node Version Manager](https://github.com/nvm-sh/nvm), or nvm, to manage the version of node for the project. You can check if you have node already by running `node -v`. It is reccomended to user node version 12.16.1 or higher. Install nvm, and the correct version of node, by navigating to the project directory and running:
  
  ```
  curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.38.0/install.sh | bash
  source ~/.bashrc
  nvm install 12.16.1
  nvm use 12.16.1
  ```
  
  Additional help on installation for other package managers and systems:
  * https://docs.mongodb.com/manual/installation/
  * https://nodejs.org/en/download/package-manager/
  * https://github.com/nvm-sh/nvm#installing-and-updating
3) Set up the database

    MongoDB is a file-based datastore, so you will need to define a new, empty directory where can create its database.
    ```bash
    mkdir /path/to/mongo/datastore
    ```
    ...and then run the database using mongod
    ```bash
    mongod --dbpath=/path/to/mongo/datastore --port 27107
    ```
    Leave this running in its own terminal window
  
4) Install node modules by navigating back to the cloned repository and running `npm install` to install all of node's dependencies
5) Run the app with `sudo node app.js`.
 * The app will ask you to specify an IP address and port number to set up your chat server on. You can type _localhost_ as the IP address and any unused port number for the port. Keep in mind that on most Linux systems you need to use sudo to open a port less than 1024.
 * The app will then ask you for a connection to another user. Go ahead and start a new instance of `sudo node app.js` in another terminal window first. The app will not connect to a client that is not online for this MVP.
 * Specify for each user that you want the app to connect with the port and IP address of the other user (again, you can type _localhost_ for the IP address if you are just chatting locally on the same machine). The apps should load any previous messages you had with the peer in previous sessions, limited to 100 messages from each user and less than 30 days old, and sort them based on when they were sent. Chat messages will be real-time. Once a sender sends a message, it should appear in the app of the reciever.
 6) You can quit the application with Ctrl+C
 
 # Other Points to note
* Unit tests can be run with `npm test`. 
* Installing the `mongo` command line utility from your package manager will give you a command line utility to query a running mongodb server.
* The current version of the client application uses the _prompt\_sync_ library for gathering user input during initialization, which does produce blocking code. As a result, if you are testing the application with two clients, both will need to finish initialization (setting up API server host and port, and the remote peer to connect to) before being brought to the chat screen. This is a known issue that might be fixed if time allows.
