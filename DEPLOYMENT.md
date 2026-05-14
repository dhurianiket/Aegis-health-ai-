# Deployment Guide

This document tracks constraints and procedures around moving local changes into production.

## The Deployment Gap
There is a strict separation between **local code compilation** and **production resolution**. An issue is not considered fixed until it is verified running in the target deployed environment (e.g., Preview or Production URLs).

## Key Procedures
1. **Frontend Hosting**: Modifying React code or `firebase.json` headers requires a complete frontend redeploy (`firebase deploy --only hosting` or GitHub Actions). 
2. **Security Rules**: Modifying `firestore.rules` requires a discrete backend deployment rule execution (`firebase deploy --only firestore:rules` or GitHub Actions).
3. **Verification Constraints**: Never update an issue's status to "Fixed" from a lint/build success. Only production console confirmation is acceptable proof of finality.

## GitHub Actions CI/CD
On every push to the `main` branch, a GitHub Action automatically triggers to run:
- Linting checks
- Build step (`npm run build`)
- Deployment of Firebase Hosting
- Deployment of Firebase Rules

Always verify the deployed state on the live URLs when the Actions complete.
