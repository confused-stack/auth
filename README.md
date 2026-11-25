# auth

TODO:
- [X] Find best way to access Session File Store to execute HAProxy Check
- [X] Find best way to retain original url intent, and apply it during callback hits
- [ ] Determine how to support configurable authentication provider without excess dependencies
- [X] Confirm authentication logic when creating User Object
- [ ] Determine how to test
- [ ] Review Passport session regeneration and determine whether to replace `keepSessionInfo` with manual handling that preserves only necessary session data
- [ ] Verify Google profile fields before accessing them
- [ ] Validate the user's organization/domain when authentication should be restricted to a specific workspace
- [ ] Implement graceful handling of authentication failures
- [ ] Determine how to handle simultaneous authentication attemps from different browser tabs
- [ ] Prevent Open Redirect vulns by validating `returnTo`
- [ ] Validate `X-Original-Host` and `X-Original-URI` before constructing redirect URLs
- [ ] Remove hardcoded `http://` scheme when reconstructing original URLs
- [ ] Ensure malformed URLs return an appropriate response
- [ ] Define which authenticated user attributes should be returned as response headers by `/check`
