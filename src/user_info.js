/**
  This module aims to construct a consistent UserInfo object in accordance to
  OpenID Connect Core 1.0 #5.1 Standard Claims.
  Using the same claims fields they define there for appropriate or approximated
  fields provided by whatever provider is in use. Since there is no guaruntee that
  providers will have a standard `profile` object provided.

  https://openid.net/specs/openid-connect-core-1_0.html#rfc.section.5.1
*/
module.exports =
function constructUserInfo(profile, issuer) {
  let userInfo = {};

  if (issuer === "https://accounts.google.com") {
    /**
      With the de-facto scopes of `profile`, `email`, and `openid` in my testing
      Google will return an object like:
      {
        id: "123456",
        displayName: "Jane Doe",
        name: { familyName: "Doe", givenName: "Jane" },
        emails: [ { value: "jane.doe@example.com" } ]
      }
    */
    if (isString(profile.id)) {
      userInfo.sub = profile.id;
    }
    if (isString(profile.displayName)) {
      userInfo.name = profile.displayName;
    }
    if (isString(profile.name?.givenName)) {
      userInfo.given_name = profile.name.givenName;
    }
    if (isString(profile.name?.familyName)) {
      userInfo.family_name = profile.name.familyName;
    }
    if (Array.isArray(profile.emails) && isString(profile.emails[0]?.value)) {
      if (profile.emails.length > 1) {
        console.log("DEBUG: Google Profile contained more than 1 email!");
        console.log(profile);
      }
      userInfo.email = profile.emails[0].value;
    }
  } else {
    console.error("UserInfo only supports Google issuers at this time.");
  }

  console.log(`DEBUG: UserInfo '${issuer}'`);
  console.log("profile:");
  console.log(profile);
  console.log("userInfo:");
  console.log(userInfo);

  return userInfo;
}

function isString(value) {
  return (typeof value === "string" && value.length > 0);
}
