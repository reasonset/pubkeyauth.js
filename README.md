# pubkeyauth.js

## Synopsis

A modular client-side library for asymmetric key generation and signature-based authentication.

## Description

This software assumes an authentication flow in which the server sends a challenge token, and the client signs that token with its private key and returns both the signature and the public key.
A reference implementation for the server side is available at [pubkey-auth-handler](https://github.com/reasonset/pubkey-auth-handler).

Despite its simplicity, it is ideal when you want to generate key pairs, sign data, and store keys in IndexedDB with minimal overhead.

## Load pubkeyauth.js

Simply load it as a module from HTML.

```html
<script src="https://cdn.jsdelivr.net/npm/pubkeyauth@0.0.1/pubkeyauth.js" type="module"></script>
```

## Usage

Call `renew()` to regenerate the key pair.

```javascript
import {PubKeyAuth} from 'pubkeyauth'

const pka = new PubKeyAuth()
await pka.renew() // -> undefined
```

If no key is stored in IndexedDB when `auth()` or `sign()` is called, a new key pair will be generated automatically.  
However, if your server requires the public key to be registered beforehand (which is usually the case), you can use `exportKey()`.

`exportKey()` returns `null` if a key pair is already stored in IndexedDB.  
If no key exists, it generates a new pair and returns the Base64‑decoded public key.  
The default export format is `spki`, but you can specify another format via an argument.

> [!IMPORTANT]
> Because `auth()` and `sign()` automatically generate keys, you must call `exportKey()` *before* using them if you want to control the key‑registration sequence.  
> If you simply want to obtain the public key regardless of the current key state, calling `sign("").publicKey` is the easiest approach.

To sign a token, use `sign()`.

```javascript
import {PubKeyAuth} from 'pubkeyauth'

// const token = ...

const pka = new PubKeyAuth()
const signed = await pka.sign(token) // {publicKey, signature}
```

Both `publicKey` and `signature` are returned as Base64‑encoded strings.  
The default encoding format for `publicKey` is `spki`, but you can change it by passing a second argument to `sign()`.

If you pass a URL to the `PubKeyAuth` constructor or set the `endpoint` property, you can use `auth()` to send the signed data directly.  
It simply performs a `POST` request to the configured URL with the result of `sign()`.

The return value of `auth()` is a `Response` object.

```javascript
import {PubKeyAuth} from 'pubkeyauth'

// const token = ...

const pka = new PubKeyAuth("https://example.com/auth")
const response = await pka.auth(token) // -> Response
```
