# Restaurant Management System (RMS)

## Steps to run server:

- Clone or Download the zip file
  - Open the project folder with your favorite IDE (VS Code etc..)
- In your terminal, run the following command: **_npm install_**

  - This will install the dependacy listed in the package.json file

- In your terminal, run the following command: **_node database-initializer.js_**

  - This will initialize the database with the basic 10 users with all public profiles.

- In your terminal, run the following command: **_npm start_**
  - This will start the server and allow it to accept requests from the client.
  - You could also run npm run nodemon, which will update if theres changes to server.js
- After running the server, open http://127.0.0.1:3000/

  - This will run the client-side (webpage)

## Steps to Stop the server:

- Ctrl + C on the terminal running the server - Close the webpage
