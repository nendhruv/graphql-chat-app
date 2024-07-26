# Chat Application

This is a simple real-time chat application that allows communication between two users, including the ability to send images and emojis.

## Setup Instructions

1. Clone the repository
2. Install dependencies:
    ```cd server && npm install
        cd ../client && npm install```
3. Start the server:
`cd server && node server.js`
4. Start the client:
`cd client && npm start`


5. Open http://localhost:3000 in your browser

## Technical Choices

- Frontend: React with Apollo Client for GraphQL communication

- Backend: Node.js with Apollo Server for GraphQL API
- Real-time updates: GraphQL subscriptions
- Styling: Tailwind CSS for rapid UI development
- Emoji support: emoji-picker-react library

GraphQL was chosen for this chat application for several key reasons:
a) Real-time capabilities: GraphQL subscriptions provide an efficient way to implement real-time features, which is crucial for a chat application. This allows for instant message updates without the need for polling.
b) Flexible data fetching: GraphQL allows the client to request exactly the data it needs, no more and no less. This is particularly useful in a chat application where you might need different data for different views or components.
c) Strong typing: GraphQL's type system provides clear contract between the client and server, reducing the likelihood of runtime errors and making the API self-documenting.
d) Single endpoint: Unlike REST, which typically requires multiple endpoints for different resources, GraphQL uses a single endpoint. This simplifies the API structure and reduces the number of network requests.
e) Easy to evolve: As the application grows, GraphQL makes it easier to add new fields and types without breaking existing queries.

Tailwind CSS was used for styling because it allows for rapid UI development with its utility-first approach. It's highly customizable and results in smaller CSS bundle sizes compared to traditional CSS frameworks.

## Assumptions and Limitations

- This is a basic implementation without user authentication or message persistence.
- The app uses in-memory storage, so messages are lost when the server restarts.
- The app is designed for two users only (User A and User B).
- Image sharing is implemented using base64 encoding, which may not be suitable for large images or high traffic.