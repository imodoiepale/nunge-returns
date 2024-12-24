
3. Error Management

Add error messages to the database with the following requirements:

Errors must have categories (e.g., invalid PIN, invalid password, etc.).

For invalid PIN errors, render a green gradient button with white text labeled "Recover PIN With ID No.".

Create a recovery page:

Input fields for ID number and the generated PIN.

Fetch user details based on the recovery information.

Create a database column for recovery with the following session management categories:

nil-returns

pin-recovery

password-email-reset

pin-download

4. Optimize Data Fetching

Do not refetch data if it has already been fetched in the current session.

5. Session Management

Implement a session timeout warning dialog:

Trigger the warning 5 minutes before the session ends.

Change the colors to warning colors 2 minutes before session ends.

Ensure the warning colors blend well with the primary color theme.

Include a countdown timer in the dialog.

6. Terms and Conditions

On the "File" page:

Add a Terms and Conditions acceptance checkbox below the PIN input field.

Add a clickable link labeled "Click here to read" with an arrow icon.

7. Password Management

On the first step:

Include the password input field.

Disable the password field by default but allow visibility toggling in last step.

Integrate a Password Checker API:

Display a badge labeled "Invalid Password" if the password is invalid.

Show the message "Please input the correct password."

Add a button for "Password Reset" and "Password + Email Reset" if validation fails.

8. Post-Payment Transition

After payment:

Ensure a smooth transition to the "File Returns" page.

Eliminate buffering and delays in displaying the UI.

Reference Code Files

@page.tsx#L1-1041

@page.tsx#L1-155

