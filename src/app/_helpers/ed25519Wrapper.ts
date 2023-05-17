import * as libSodiumWrapper from "libsodium-wrappers";
import { StringOutputFormat } from "libsodium-wrappers";
import * as tweetnaclUtil from "tweetnacl-util";

export function encrypt(msg: any, publicKey: any) {
    const msgDecodeutf8 = tweetnaclUtil.decodeUTF8(msg);
    let curve25519publicKey = libSodiumWrapper.crypto_sign_ed25519_pk_to_curve25519(hexToUint8Arrray(publicKey));
    const encryptedMessage = libSodiumWrapper.crypto_box_seal(msgDecodeutf8, curve25519publicKey, "base64");
    return encryptedMessage;
}

export function encryptWithSharedKey(msg: any, sharedKey: any, nonce: string) {
    console.log('sharedKey',sharedKey)
    const encryptedMessage = libSodiumWrapper.crypto_box_easy_afternm(msg,hexToUint8Arrray(nonce), sharedKey);
    return tweetnaclUtil.encodeBase64(encryptedMessage);
}

export function decrypt(ciphertext: any, publicKey: any, privateKey: any) {
    const decodedCiphertext = tweetnaclUtil.decodeBase64(ciphertext);

    const curvePublicKey = libSodiumWrapper.crypto_sign_ed25519_pk_to_curve25519(hexToUint8Arrray(publicKey));
    const curvePrivateKey = libSodiumWrapper.crypto_sign_ed25519_sk_to_curve25519(hexToUint8Arrray(privateKey));

    const decrypted = libSodiumWrapper.crypto_box_seal_open(decodedCiphertext, curvePublicKey, curvePrivateKey);

    if (!decrypted) {
        return null;
    }
    return tweetnaclUtil.encodeUTF8(decrypted);
}

export function sign(msg: any, privateKey: any) {
    return libSodiumWrapper.crypto_sign_detached(msg, hexToUint8Arrray(privateKey));
}

export function signEncode(payload: any, privateKey: any) {
    const message = tweetnaclUtil.decodeUTF8(payload);
    const constsignedMsg = sign(message, privateKey)
    // console.log(constsignedMsg);
    return tweetnaclUtil.encodeBase64(constsignedMsg);
}

export function verifySign(signature: any, msg: any, publicKey: any) {
    return libSodiumWrapper.crypto_sign_verify_detached(tweetnaclUtil.decodeBase64(signature), msg, hexToUint8Arrray(publicKey));
}

export async function generateKeyPair(format: StringOutputFormat = "base64") {
    return libSodiumWrapper.crypto_sign_keypair(format)
}

export function generateSharedKey(privateKey: string, publicKey: string) {
    return libSodiumWrapper.crypto_scalarmult(libSodiumWrapper.crypto_sign_ed25519_sk_to_curve25519(hexToUint8Arrray(privateKey)), libSodiumWrapper.crypto_sign_ed25519_pk_to_curve25519(hexToUint8Arrray(publicKey)))
}
export function decryptWithSharedKey(ciphertext: string, sharedKey: Uint8Array, nonce: Uint8Array) {
    const decodedCiphertext = tweetnaclUtil.decodeBase64(ciphertext);

    const decrypted = libSodiumWrapper.crypto_box_open_easy_afternm(decodedCiphertext, hexToUint8Arrray(nonce), sharedKey);

    if (!decrypted) {
        return null;
    }
    return tweetnaclUtil.encodeUTF8(decrypted);
}

function hexToUint8Arrray(publicKey: any): Uint8Array {
    return Uint8Array.from(Buffer.from(publicKey, 'base64'));
}
