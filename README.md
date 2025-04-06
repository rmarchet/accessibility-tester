# Accessibility Test API

This project is a REST API built with Node.js that performs accessibility tests on HTML content using axe as accessibility rules test tool. The API accepts HTML input and returns a JSON response detailing the accessibility criteria that are satisfied and those that are not.

## Features

- Accepts HTML input for accessibility testing.
- Utilizes Sa11y or axe for running accessibility tests.
- Returns a structured JSON response with satisfied and unsatisfied criteria.

## Project Structure

```
accessibility-test-api
├── src
│   ├── app.js                  # Entry point of the application
│   ├── controllers
│   │   └── accessibilityController.js  # Handles accessibility test requests
│   ├── services
│   │   └── accessibilityService.js     # Contains logic for running accessibility tests
│   └── routes
│       └── index.js            # Defines API routes
│  
├── package.json                 # NPM configuration file
├── .env                         # Environment variables
├── .gitignore                   # Files to ignore by Git
└── README.md                    # Project documentation
```

## Installation

1. Clone the repository:
   ```
   git clone https://github.com/rmarchet/accessibility-tester.git
   ```

2. Navigate to the project directory:
   ```
   cd accessibility-tester
   ```

3. Install the dependencies:
   ```
   yarn install
   ```

4. Create a `.env` file in the root directory and add any necessary environment variables, in particular `PORT=3010` or any TCP you want to use to run the server.

## Usage

To start the server locally, run:
```
yarn dev
```

The API will be available at `http://localhost:3010`.

### API Endpoints

- **POST /api/accessibility/test**
  - Request Body: 
    ```json
    {
      "html": "<html>Your HTML content here</html>"
    }
    ```
  - Response:
    ```json
    {
      "satisfied": ["Criterion 1", "Criterion 2"],
      "unsatisfied": ["Criterion 3"]
    }
    ```

## Front-end

This tool comes with a very simple front-end to test the API.
It can be loaded in the browser ath the URL:

http://localhost:3010/frontend

## Contributing

Contributions are welcome! Please open an issue or submit a pull request for any improvements or bug fixes.

## License

This project is licensed under the MIT License.