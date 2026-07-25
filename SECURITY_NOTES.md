# Security Notes

## Known Issue: Unauthenticated API Access

**Status**: Unresolved / Technical Debt
**Impact**: High (Unauthorized Data Access)

### Description
The application currently lacks a robust authentication and authorization mechanism. Both the old Q&A feature (`/ask`) and the new Hybrid Search endpoint (`/search/v2`) rely entirely on trusting the `userEmail` field provided in the plaintext JSON request body. 

```javascript
// Example insecure pattern in use
const { query, userEmail } = req.body;
```

This means any user can query or retrieve emails belonging to any other user by simply altering the `userEmail` field in their API request. 

### Required Remediation
Before this application is exposed to a production environment with sensitive user data, a proper authentication layer must be implemented:
1. Issue secure tokens (e.g., JWT) to clients upon login.
2. Validate the token in a backend middleware.
3. Extract the `userEmail` (or user ID) directly from the verified token context, ignoring any user-provided email claims in the request body.
