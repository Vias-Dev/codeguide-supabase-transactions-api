# App Flow Document

## Onboarding and Sign-In/Sign-Up

When a new developer wants to use the transactional API system, they arrive at the public landing page where a clear call to action invites them to create an account or sign in if they already have one. The sign-up page allows them to register with their email and password or use a social login provider such as GitHub or Google. After completing the email and password form or authorizing via social login, the system sends a verification link to their email address. Once verified, the user is automatically redirected to the sign-in page and can enter their credentials to access the dashboard. If the user ever forgets their password, a “Forgot Password” link is available on the sign-in screen. Clicking this link prompts the user to provide their email address, which triggers a secure email with a password reset link. Following that link lets the user choose a new password, after which they are redirected back to the sign-in page. Signing out is always accessible from a prominent button in the header of each authenticated page, and it immediately clears the user session and returns them to the public landing page.

## Main Dashboard or Home Page

After signing in, the user lands on the main dashboard. The dashboard features a left-hand navigation bar containing links to Overview, API Keys, Usage Logs, Subscription, and Account Settings. At the top, a header displays the user’s name, current plan status, and a sign-out button. The center panel shows a summary widget that reports the user’s current balance, monthly usage, and any recent transactions. Below the summary, there are cards that preview the user’s active API keys and upcoming invoice date. From this home page, the user can click on the API Keys link in the sidebar to manage keys, click Usage Logs to inspect activity, click Subscription to view or change billing plans, or click Account Settings to update their profile details.

## Detailed Feature Flows and Page Transitions

### API Keys Management

When the user selects the API Keys link, they go to the API Keys management page. This page lists all existing keys in a table that displays the key name, creation date, and status. At the top of the page, a button labeled "Create New Key" opens a modal dialog where the user enters a descriptive name for the key. After the user confirms, the system generates a new API key string and displays it once in a secure modal. The user can copy the key to the clipboard. Returning to the keys list, they can revoke any key by clicking the revoke icon next to it and confirming the action, which immediately disables that key in the backend and removes it from the list.

### Balance Inquiry

When the user clicks on the Usage Logs link in the sidebar, they are taken to a page where they can view their current balance and transaction history. The page shows a summary at the top with the current balance pulled from the `/api/balance` endpoint. Below the summary, a table lists each transaction with date, amount, counterpart, and transaction ID. If the user wants to refresh the data, they can click the refresh icon in the summary widget, which triggers a new request to the balance endpoint and updates the display without reloading the entire page.

### Payment Processing

The user navigates to the Subscription page to manage their billing plan and payment methods. On this page, the user sees their current plan and a button to "Add Funds." Clicking that button opens a form where they specify an amount and confirm with a payment method on file. Submitting the form sends a request to the `/api/pay` endpoint with the amount and user context derived from the validated API key. The page then displays a notification indicating success or failure. If the transaction succeeds, the balance summary updates automatically. The user can also view their Payment History section on this page, which lists all fund additions and their statuses.

### Subscription and Billing Portal

Within the Subscription page, the user sees a link to launch the Stripe Billing Portal. Clicking this link opens the billing portal in a new tab, where the user can update payment methods, view invoices, and change their subscription tier. After finishing in the billing portal, closing that tab returns them to the main application, with the subscription status automatically refreshed when they return.

### Webhook Event Viewer

In the Usage Logs section, the user can also switch to an Event Viewer tab that displays incoming webhook events processed by the system. Each event entry shows the event type, timestamp, and payload id. This lets users debug synchronization issues with external services like Stripe. The user can filter events by type or date range using dropdowns that automatically apply filters to the log table.

## Settings and Account Management

When the user clicks on Account Settings in the sidebar, they access a page divided into Profile, Security, and Notifications. In the Profile section, they can update their name, email address, and contact information. Changing the email requires re-verification by sending a confirmation link. The Security section allows the user to change their password or enable two-factor authentication, which involves scanning a QR code with an authenticator app and entering a generated code to confirm sharing. The Notifications section lets the user choose which email alerts they receive, such as low balance warnings or transaction confirmations. After saving changes in any section, a success message appears at the top, and the user remains on the same tab, allowing further adjustments or quick navigation back to the dashboard via the sidebar.

## Error States and Alternate Paths

If the user submits invalid data at any point, descriptive error messages appear inline. For example, attempting to generate a new API key without a name shows a red error below the input. If the user’s session expires or they lose network connectivity, a persistent banner appears at the top indicating the issue and offering to retry or sign in again. In the event that a payment request fails due to insufficient funds, the system returns a 402 error and displays an inline alert stating "Insufficient funds to complete this transaction." For invalid API key usage, the `/api/*` endpoints return a 401 error, and the dashboard shows a modal prompting the user to check their key or create a new one. If the user tries to access an admin-only page without proper permissions (in the case of an admin panel extension), they are redirected to a "403 Forbidden" page that provides a link back to the home dashboard.

## Conclusion and Overall App Journey

A typical developer signs up via email or social login, verifies their account, and lands on the home dashboard. From there, they create API keys, view their balance and transaction history, and add funds through the Subscription page. They can manage their subscription and payment methods through the integrated Stripe Billing Portal. In Account Settings, they update personal details and security preferences. Throughout their journey, helpful error messages and retry options keep the experience smooth. By the time the developer integrates the transactional API into their own application, they have a clear understanding of their API keys, current balance, transaction history, and subscription status, ensuring a seamless end-to-end experience.