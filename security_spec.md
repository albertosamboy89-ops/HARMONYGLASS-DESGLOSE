# Security Specification - Harmony Glass

## Data Invariants
1. A `Project` must belong to the authenticated user who created it (`userId == request.auth.uid`).
2. A `Project` document ID must match the `id` field in its data (for integrity).
3. `Pricing` data is private to the user.

## The "Dirty Dozen" Payloads
1. **Identity Theft**: Attempting to create a project with another user's `userId`.
2. **Resource Poisoning**: Injecting a 2MB string into the `name` field.
3. **Ghost Fields**: Adding `isAdmin: true` to a project document.
4. **ID Mismatch**: Document ID `ABC` but `id` field in data is `XYZ`.
5. **Type Poisoning**: Sending `width: "sixty"` instead of `number`.
6. **Immutable Breach**: Attempting to change `createdAt` of an existing project.
7. **Cross-User Read**: Authenticated user B trying to read user A's projects.
8. **Unauthenticated Write**: Trying to create a project without being logged in.
9. **Role Escalation**: Trying to write into the `admins` collection (if it existed).
10. **Array Explosion**: Sending a `completedCuts` array with 10,000 elements.
11. **Status Shortcut**: A non-owner attempting to mark a project as `completed`.
12. **Negative Dimensions**: Sending `width: -100`.

## Test Runner (Draft)
```typescript
// firestore.rules.test.ts
// Tests will verify that all illegal payloads return PERMISSION_DENIED.
```
