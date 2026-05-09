# Security Specification for Aala AI

## Data Invariants
1. A book must belong to a valid user.
2. Only the owner of a book can read or write to it.
3. Users cannot modify their subscription plan directly via the client.
4. Book status is immutable once set to 'completed' unless by an admin.

## The Dirty Dozen Payloads (Rejection Targets)
1. Write a book with `userId` of another user.
2. Read all books without a `userId` filter.
3. Update a book to change its `userId`.
4. Inject a 1MB string into the `title` field.
5. Create a book with negative `pageCount`.
6. Update the `plan` field in the user document.
7. Create a book without being authenticated.
8. Delete a book belonging to another user.
9. Create a book with a non-existent `type`.
10. Update a book manuscript with random junk keys.
11. Read pii of another user.
12. Create a user document for a UID that doesn't match the auth UID.

## Rules Draft
(Implemented in firestore.rules)
