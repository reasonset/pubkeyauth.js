const DB_NAME = "CryptoStore"
const STORE_NAME = "keys"
const INDEXED_DB_KEY = "pubkeyauth"

class PubKeyAuth {
  #keys

  constructor(endpoint="") {
    this.endpoint = endpoint
  }

  async #getDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1)
      request.onupgradeneeded = () => request.result.createObjectStore(STORE_NAME)
      request.onsuccess = () => resolve(request.result)
      request.onerror = () => reject(request.error)
    })
  }

  async saveKeys(key) {
    const db = await this.#getDB()
    const tx = db.transaction(STORE_NAME, "readwrite")
    tx.objectStore(STORE_NAME).put(key, INDEXED_DB_KEY)
    return new Promise((resolve) => (tx.oncomplete = resolve))
  }

  async loadKeys() {
    const db = await this.#getDB()
    const tx = db.transaction(STORE_NAME, "readonly")
    const request = tx.objectStore(STORE_NAME).get(INDEXED_DB_KEY)
    return new Promise((resolve) => (request.onsuccess = () => resolve(request.result)))
  }

  async #generateKeys() {
    return await crypto.subtle.generateKey({ name: "Ed25519" }, true, ["sign"])
  }

  async #setupKeys() {
    let keys = await this.loadKeys()
    if (!keys) { keys = await this.renew() }
    this.#keys = keys
    return keys
  }

  /**
   * Return object of sign()
   * @typedef signobj
   * @property {string} signature Base64 encoded string signed by private key
   * @property {string} publickey Base64 encoded
   */

  /**
   * Sign to token and returns signature and public key
   * @param {string} token String to be signed
   * @param {string=} export_format 1st argument of exportKey()
   * @returns {Promise<signobj>}
   */
  async sign(token, export_format="spki") {
    if (!this.#keys) { await this.#setupKeys() }
    const sig = await crypto.subtle.sign({ name: "Ed25519" }, this.#keys.privateKey, new TextEncoder().encode(token))
    const sig_asc = btoa(String.fromCharCode(...new Uint8Array(sig)))
    const ex_pub = await crypto.subtle.exportKey(export_format, this.#keys.publicKey)
    const ex_pub_t = (btoa(String.fromCharCode(...new Uint8Array(ex_pub))))
    return {
      signature: sig_asc,
      publicKey: ex_pub_t
    }
  }

  /**
   * Re-generate key pair
   * @returns
   */
  async renew() {
    const keys = await this.#generateKeys()
    await this.saveKeys(keys)
  }

  /**
   * Sign to token and POST to endpoint
   * @param {string} token 
   * @returns {Response} API response
   */
  async auth(token) {
    const signobj = await this.sign(token)
    if (!this.endpoint) {
      throw "API endpoint is not defined."
    }
    const response = await fetch(this.endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(signobj)
    })

    return response
  }

  /**
   * Export new public key
   * @param {string=} export_format 1st argument of SubtleCrypto.exportKey()
   * @returns {Promise<string|null>} Base64 decoded new created public key or null
   */
  async exportKey(export_format="spki") {
    let keys = await this.loadKeys()
    if (keys) {
      return null
    } else {
      let public_key = (await this.#setupKeys()).publicKey
      public_key = await crypto.subtle.exportKey(export_format, public_key)
      public_key = btoa(String.fromCharCode(...new Uint8Array(public_key)))
      return public_key
    }
  }
}

export {PubKeyAuth}