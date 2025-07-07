# Natours-BackEnd

A RESTful API for the Natours travel booking application, built with Node.js, Express, and MongoDB. :contentReference[oaicite:0]{index=0}

## Features
- **Tours**: Create, read, update, delete tour data  
- **Users**: Authentication (signup/login), role-based access  
- **Reviews**: Nested review routes for tours  
- Data validation, sanitization, and security middlewares

## Technologies
- **Node.js** & **Express** for server and routing  
- **MongoDB** & **Mongoose** for data storage and modeling  
- Security: `helmet`, `express-rate-limit`, `hpp`, `express-mongo-sanitize`, `xss-clean`  
- Authentication: `jsonwebtoken`, `bcryptjs`  
- Testing: `jest` with coverage reports :contentReference[oaicite:1]{index=1}

## Installation

1. Clone the repo  
   ```bash
   git clone https://github.com/Ella0110/Natours-BackEnd.git
   cd Natours-BackEnd
2. Install dependencies
   ```bash
   npm install

## Configuration
Create a `config.env` file in the root with:
``` bash
PORT=3000
DATABASE=<your-MongoDB-URI>
DATABASE_PASSWORD=<your-password>
JWT_SECRET=<your-secret>
JWT_EXPIRES_IN=90d
EMAIL_USERNAME=<your-smtp-username>
EMAIL_PASSWORD=<your-smtp-password>
