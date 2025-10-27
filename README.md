# steam-to-github

A listening server that reads RSA encrypted smee.io payloads from a Steam game and posts them as GitHub issues

Commenting `!ban {steamid64}` or `!unban {steamid64}` in github comments will block/unblock incoming payloads from that Steam user

Users that are VAC banned from the game, game banned from the game, or do not own the game are automatically blocked

Made to be used with [Godot](https://godotengine.org/) RSA functions

Facilitates secure bug reporting from within your Steam game, using Steam WebAPI token auth to verify incoming reports

Requires [npm](https://www.npmjs.com/), once you install use `npm i` to install dependencies

Requires [tsx](https://tsx.is/), run `npm i -g tsx`

To debug, run `tsx index.ts`

The following command is recommended for production (on Linux): `setsid tsx index.ts > ./steam-to-github.log 2>&1 < /dev/null &`

Your generated pkcs1-pem RSA key should be in the project root as `id_rsa.key`

It is recommended to generate your RSA key with the Godot functions to ensure compatible generation

## Environment variables

All of these are **required** for the program to function normally

Create a `.env` file (example.env as an example) and set them to the following

`GITHUB_ISSUE_AUTH_TOKEN` is your [fine grained PAT token](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/managing-your-personal-access-tokens#creating-a-fine-grained-personal-access-token), which should have read/write on the repo's issues

`SMEE_LINK` is your generated [smee.io](https://smee.io/) link

`STEAM_APPID` is your Steam app's appid i.e. [PEAK](https://store.steampowered.com/app/3527290/PEAK/)'s appid is 3527290 (look at the store URL)

`DEVELOPER_WEBAPI_KEY` is your [Steamworks WebAPI key](https://partner.steamgames.com/doc/webapi_overview/auth)

`WEBAPI_IDENTITY` is your [unique identifier for this program](https://partner.steamgames.com/doc/webapi/ISteamUserAuth#AuthenticateUserTicket). Can be any API-safe string, just make sure it's the same here and in your auth ticket fetch game-side.

`REPO_OWNER` Repo owner i.e. `octocat` from `https://github.com/octocat/Hello-World`

`REPO_NAME` Repo name i.e. `Hello-World` from `https://github.com/octocat/Hello-World`

## Usage game-side

Uses RSA pkcs1-pem and AES-256-CBC

Each is encoded with AES except for "pw" and "iv" which is RSA, [see here for why](https://mbed-tls.readthedocs.io/en/latest/kb/cryptography/rsa-encryption-maximum-data-size/)

It expects payloads to look like this (values are UTF-8 then encrypted to base64-encoded RSA messages with the public key)
```
{
    "title": "encoded_title",
    "description": "encoded_description",
    "steamtoken": "encoded_message",
    "type": "encoded_type",
    "uuid": "encoded_uuidv4",
    "pw": "encoded_password",
    "iv": "encoded_iv"
}
```
Token should be in hex format before encoding

Type should be "bug" or "suggestion" before encoding

## Notes

[Node dislikes using this encryption](https://nodejs.org/en/blog/vulnerability/february-2024-security-releases#nodejs-is-vulnerable-to-the-marvin-attack-timing-variant-of-the-bleichenbacher-attack-against-pkcs1-v15-padding-cve-2023-46809---medium) due to a timing attack ([CVE-2023-46809](https://nvd.nist.gov/vuln/detail/CVE-2023-46809)) but Godot doesn't have another option; It is recommended to take precautions against web-based timing attacks and regenerate your key often

GitHub has a rate limit of 5,000 requests per hour for authenticated users. If you are getting thousands of bug reports an hour, consider using paid or self-hosted services.

