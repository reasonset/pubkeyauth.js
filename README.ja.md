# pubkeyauth.js

## Synopsis

A modular client-side library for asymmetric key generation and signature-based authentication.

## Description

このソフトウェアは「サーバーがチャレンジトークンを送信し、クライアントはそのチャレンジトークンに秘密鍵で署名した上で署名と公開鍵を送信する」という認証形式を想定しています。
サーバー側のリファレンス実装は[pubkey-auth-handler](https://github.com/reasonset/pubkey-auth-handler)です。

ただし動作は非常にシンプルであり、鍵ペアを使った署名とIndexedDBを使った鍵保存を望む場合は手間を減らすのに最適でしょう。

## Load pubkeyauth.js

HTMLからモジュールとしてロードするだけです。

```html
<script src="https://cdn.jsdelivr.net/npm/pubkeyauth@0.0.1/pubkeyauth.js" type="module"></script>
```

## Usage

キーの再生成には`renew()`を呼びます。

```javascript
import {PubKeyAuth} from 'pubkeyauth'

const pka = new PubKeyAuth()
await pks.renew() // -> undefined
```

`auth()`や`sign()`を呼んだときにキーがIndexedDBに保存されていなければ自動的にキーの生成が行われますが、事前にサーバーに公開鍵を登録しておく必要があるのであれば(ほとんどの場合そうです)`exportKey()`を使うことができます。
`exportKey()`は既にキーがIndexedDBに登録されている場合は`null`を返し、登録されていない場合はキーを生成してBase64デコードされた公開鍵を返します。
エクスポートに使われる形式はデフォルトで`spki`ですが、引数で指定することもできます。

> [!IMPORTANT]
> `auth()`や`sign()`は鍵を自動生成するため、`exportKey()`を使って鍵登録シーケンスを作るのであれば、それらを呼ぶ前に行わなくてはなりません。
> 鍵の状態に関係なく公開鍵を得たいのであれば、`sign("").publicKey`を使うのが簡単な方法です。

トークンに署名するには`sign()`を使います。

```javascript
import {PubKeyAuth} from 'pubkeyauth'

// const token = ...

const pka = new PubKeyAuth()
const signed = await pka.sign(token) // {publicKey, signature}
```

`publicKey`, `signature`ともにBase64エンコードされたものが返ります。
`publicKey`のエンコード形式は通常`spki`ですが、`sign()`の第二引数で指定することで変更することもできます。

`PubKeyAuth`コンストラクターにURLを渡す、または `endpoint`プロパティを設定することで`auth()`を使って送信まで行うことができます。
動作はシンプルに、設定したURLに対して`sign()`の戻り値を`POST`します。

`auth()`の戻り値は`Response`オブジェクトです。

```javascript
import {PubKeyAuth} from 'pubkeyauth'

// const token = ...

const pka = new PubKeyAuth("https://example.com/auth")
const response = await pka.auth(token) // -> Response
```

