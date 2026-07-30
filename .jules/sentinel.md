## 2024-03-24 - [HTTP Parameter Pollution in reCAPTCHA verification]
**Vulnerability:** HTTP Parameter Pollution via unencoded token variable in application/x-www-form-urlencoded body.
**Learning:** Variables were interpolated directly into the body without URL encoding, allowing potential injection of additional form fields.
**Prevention:** Always use encodeURIComponent when interpolating dynamic parameters into URL-encoded bodies.
