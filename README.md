# GUEST AI - Your Intelligent Virtual FOH Assistant

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

**GUEST AI is an innovative, AI-powered virtual assistant designed to revolutionize the customer experience in restaurants. Acting as a virtual Front-of-House (FOH), customer service assistant, or wait staff, GUEST AI capably handles menu inquiries, takes detailed orders with customizations, and provides a seamless, interactive user experience.**

https://github.com/user/guest-ai-project/assets/1234567/your-demo-video-or-gif-link-here # Placeholder for a GIF/Video

## The Problem: Modern Dining Challenges

Traditional restaurant FOH operations face several challenges:
*   **Staffing Demands:** High reliance on staff for basic inquiries (menu details, item availability) can lead to stretched teams, especially during peak hours.
*   **Inconsistent Service:** Information delivery and upselling can vary based on individual staff members.
*   **Customer Wait Times:** Guests may wait for simple questions or to place orders, impacting satisfaction.
*   **Missed Opportunities:** Staff might not always have the bandwidth or information readily available for effective upselling or personalized recommendations.
*   **Desire for Modernization:** Customers increasingly expect tech-enhanced, efficient, and personalized service experiences.

## The Solution: GUEST AI - Intelligent, Interactive Service

GUEST AI addresses these challenges by providing:
*   **Instant, Accurate Information:** Access to the full menu, including detailed descriptions, ingredients, allergens, pricing, and customization options.
*   **Efficient Order Taking:** A conversational interface for placing orders, with robust support for complex item customizations through an intuitive modal.
*   **Consistent & Engaging Experience:** Every guest receives polite, knowledgeable, and consistent service, 24/7 (virtually).
*   **Reduced FOH Load:** Frees up human staff to focus on higher-value interactions and complex guest needs.
*   **Interactive Menu Navigation:** Features like clickable category buttons and "Quick Add" functionality streamline browsing and ordering.
*   **Proactive Assistance (Evolving):** The AI is designed to understand context, make relevant suggestions, and guide users effectively.

## Key Features (Current Client-Side Implementation)

*   **Conversational AI Interface:** Powered by Google's Gemini API for natural language understanding and response generation.
*   **Dynamic Menu Database:** Client-side `IndexedDB` stores and manages the full restaurant menu, allowing for rich, structured data access.
*   **Interactive Order Taking:**
    *   Add items to an order via chat.
    *   Visual Customization Modal for selecting item options (e.g., milk type, doneness) and applying modifiers (e.g., extra toppings) with real-time price updates.
*   **Structured Menu Presentation:** AI presents menu categories as interactive buttons for easy exploration.
*   **"Quick Add" Functionality:** Add items directly from AI-listed menu items.
*   **Detailed Item Views:** AI can provide comprehensive information cards for specific menu items.
*   **Order Sidebar:** Persistent view of the current order and subtotal.
*   **Responsive Design:** Optimized for various screen sizes with a sleek, dark-mode UI.
*   **Session Management:** Basic client-side session tracking.
*   **Robust Error Handling:** Graceful management of API errors and unexpected responses.

## Tech Stack & Architecture

*   **Frontend:**
    *   React (with TypeScript)
    *   Tailwind CSS for styling
    *   Lucide React for icons
    *   `IndexedDB` for client-side menu data persistence
*   **AI Model:**
    *   Google Gemini (`gemini-2.5-flash-preview-04-17`) accessed via `@google/genai` SDK.
*   **AI Pipeline & Prompt Engineering:**
    *   **System Prompt:** A comprehensive instruction set defining the AI's persona, rules, knowledge of the menu (dynamically injected summary), available actions (moves), and expected JSON output format.
    *   **Dynamic Menu Injection:** The system prompt includes a summarized version of the menu (fetched from `IndexedDB`) to provide context, with a note that full item details are accessible to the AI.
    *   **Structured JSON Responses:** The AI is prompted to respond in a specific JSON format (`WaiterAIResponse`), detailing its "thought" process, intended "move" (action), textual `response` for the user, and the current state of the `currentOrder`, `orderSubtotal`, and `orderSummaryForReceipt`.
    *   **Client-Side Parsing:** The React frontend parses this JSON to render rich UI elements (item cards, suggestion buttons, order updates) beyond just displaying text.
    *   **Iterative Refinement:** Prompts are designed to handle various conversational flows, including clarifications, customizations, and order confirmations.

## Future Vision (with Backend Integration - Google Cloud)

The long-term vision is to deploy GUEST AI with a robust Google Cloud backend:
*   **Secure API Key Management:** Gemini API key moved to Google Secret Manager.
*   **Server-Side Logic:** Cloud Functions/Run to handle Gemini API calls, session management, and database interactions.
*   **Persistent AI Memory & User Profiles:** Firestore for storing chat history, user preferences, and past orders, enabling more personalized interactions.
*   **Real-time Capabilities:** Potential for live menu updates, order status tracking.
*   **Analytics:** Leveraging Google Cloud for insights into ordering patterns and AI interactions.

## Setup & Running Locally

1.  Clone the repository: `git clone https://github.com/YOUR_USERNAME/guest-ai-project.git`
2.  Navigate to the project directory: `cd guest-ai-project`
3.  Ensure you have a modern web server or use an extension like "Live Server" for VS Code to serve `index.html`.
4.  **Crucial:** Create a `.env` file (or configure environment variables directly if your local server supports it) with your Google Gemini API Key:
    ```
    API_KEY=YOUR_GEMINI_API_KEY
    ```
    *Note: The current project structure loads the API key directly in the client-side `chatService.ts` via `process.env.API_KEY`. For local development with simple static servers, you might need to replace `process.env.API_KEY` with the actual key string in `services/chatService.ts` temporarily, or use a development server that supports `.env` files (like Vite, Create React App - though this project is simpler).*
    **This direct client-side key usage is for development ONLY and is NOT secure for production.**
5.  Open `index.html` in your browser through your local web server.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request or open an Issue.

---
