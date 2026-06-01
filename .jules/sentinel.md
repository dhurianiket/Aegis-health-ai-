## 2024-05-24 - [Firestore Privilege Escalation via Role Modification]
**Vulnerability:** Users had unrestricted write access to their own root user documents in `firestore.rules`, allowing them to arbitrarily set their `role` field to `admin`.
**Learning:** Checking a field for admin privileges in security rules is insecure if the rule also grants the user blanket `write` permissions to the document containing that field.
**Prevention:** Explicitly restrict modifications to privilege-defining fields (like `role`) using `request.resource.data` and `resource.data` to ensure users cannot escalate their own privileges.
