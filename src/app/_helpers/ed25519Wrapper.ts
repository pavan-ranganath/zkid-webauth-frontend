import * as libSodiumWrapper from "libsodium-wrappers";
import * as tweetnaclUtil from "tweetnacl-util";

export function encrypt(msg: any, publicKey: any) {
    const msgDecodeutf8 = tweetnaclUtil.decodeUTF8(msg);
    let curve25519publicKey = libSodiumWrapper.crypto_sign_ed25519_pk_to_curve25519(publicKey);
    const encryptedMessage = libSodiumWrapper.crypto_box_seal(msgDecodeutf8, curve25519publicKey);
    return tweetnaclUtil.encodeBase64(encryptedMessage);
}

export function encryptWithSharedKey(msg: any, sharedKey: any, nonce: Uint8Array) {
    console.log('sharedKey',sharedKey)
    const encryptedMessage = libSodiumWrapper.crypto_box_easy_afternm(msg,nonce, sharedKey);
    return tweetnaclUtil.encodeBase64(encryptedMessage);
}

export function decrypt(ciphertext: any, publicKey: any, privateKey: any) {
    const decodedCiphertext = tweetnaclUtil.decodeBase64(ciphertext);
    const curvePublicKey = libSodiumWrapper.crypto_sign_ed25519_pk_to_curve25519(publicKey);
    const curvePrivateKey = libSodiumWrapper.crypto_sign_ed25519_sk_to_curve25519(privateKey);

    const decrypted = libSodiumWrapper.crypto_box_seal_open(decodedCiphertext, curvePublicKey, curvePrivateKey);

    if (!decrypted) {
        return null;
    }
    return tweetnaclUtil.encodeUTF8(decrypted);
}

export function sign(msg: any, privateKey: any) {
    return libSodiumWrapper.crypto_sign_detached(msg, privateKey);
}

export function signEncode(payload: any, privateKey: any) {
    const message = tweetnaclUtil.decodeUTF8(payload);
    const constsignedMsg = sign(message, privateKey)
    // console.log(constsignedMsg);
    return tweetnaclUtil.encodeBase64(constsignedMsg);
}

export function verifySign(signature: any, msg: any, publicKey: any) {
    return libSodiumWrapper.crypto_sign_verify_detached(signature,msg,publicKey);
}

export async function generateKeyPair() {
    return libSodiumWrapper.crypto_sign_keypair()
}

export function generateSharedKey(privateKey: Uint8Array, publicKey: Uint8Array) {
    return libSodiumWrapper.crypto_scalarmult(libSodiumWrapper.crypto_sign_ed25519_sk_to_curve25519(privateKey), libSodiumWrapper.crypto_sign_ed25519_pk_to_curve25519(publicKey))
}
export function decryptWithSharedKey(ciphertext: string, sharedKey: Uint8Array, nonce: Uint8Array) {
    const decodedCiphertext = tweetnaclUtil.decodeBase64(ciphertext);

    const decrypted = libSodiumWrapper.crypto_box_open_easy_afternm(decodedCiphertext, nonce, sharedKey);

    if (!decrypted) {
        return null;
    }
    return tweetnaclUtil.encodeUTF8(decrypted);
}