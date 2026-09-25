# Registration Website

A website where people create a personal account to access the application. Frontend and backend are separate services (React + TypeScript frontend, NestJS backend).

## Language

**User**:
A person who has created an account (email + password) to access the application.
_Avoid_: Account, Member, Customer

**Registration**:
The act of a person creating a User account for the first time (sign-up).
_Avoid_: Sign-up, Enrollment

**Verification**:
The process of confirming a User's email address by following a link sent after Registration. A User must be verified before they can log in.
_Avoid_: Confirmation, Activation

**Lockout**:
A temporary restriction that prevents a User from attempting to log in again, triggered after repeated failed login attempts.
_Avoid_: Ban, Suspension
