import * as libSodiumWrapper from "libsodium-wrappers";
import { StringOutputFormat } from "libsodium-wrappers";
import * as tweetnaclUtil from "tweetnacl-util";
const asn1 = require('asn1.js');
import nacl from 'tweetnacl';
import ed2curve from "ed2curve";

// export function encrypt(msg: any, publicKey: any) {
//     const msgDecodeutf8 = tweetnaclUtil.decodeUTF8(msg);
//     let curve25519publicKey = libSodiumWrapper.crypto_sign_ed25519_pk_to_curve25519(keyStringToUint8Arrray(publicKey));
//     const encryptedMessage = libSodiumWrapper.crypto_box_seal(msgDecodeutf8, curve25519publicKey, "base64");
//     return encryptedMessage;
// }
const readKeysFromPem = (publicKey:string, privateKey:string ) => {
    // const pemToBuffer = (pem) => Buffer.from(pem
    //     .replace('-----BEGIN PUBLIC KEY-----', '')
    //     .replace('-----END PUBLIC KEY-----', '')
    //     .replace('-----BEGIN PRIVATE KEY-----', '')
    //     .replace('-----END PRIVATE KEY-----', '')
    //     .replace(/\n/g, ''), 'base64');
    //     const publicKeyBuffer = null;
    //     const privateKeyBuffer = null;
    // if(publicKey) {
    //     publicKeyBuffer = pemToBuffer(Buffer.from(publicKey));
    // }
    // if(privateKey) {
    //     privateKeyBuffer = pemToBuffer(Buffer.from(privateKey));
    // }

    return {
        publicKey: publicKey ? publicKey.split('\n')[1] : null,
        privateKey: privateKey ? privateKey.split('\n')[1] : null,
    };
};
// export function encryptWithSharedKey(msg: any, sharedKey: any, nonce: string) {
//     console.log('sharedKey', sharedKey)
//     const encryptedMessage = libSodiumWrapper.crypto_box_easy_afternm(msg, keyStringToUint8Arrray(nonce), sharedKey);
//     return tweetnaclUtil.encodeBase64(encryptedMessage);
// }

// export function decrypt(ciphertext: any, publicKey: any, privateKey: any) {
//     const decodedCiphertext = tweetnaclUtil.decodeBase64(ciphertext);

//     const curvePublicKey = libSodiumWrapper.crypto_sign_ed25519_pk_to_curve25519(keyStringToUint8Arrray(publicKey));
//     const curvePrivateKey = libSodiumWrapper.crypto_sign_ed25519_sk_to_curve25519(keyStringToUint8Arrray(privateKey));

//     const decrypted = libSodiumWrapper.crypto_box_seal_open(decodedCiphertext, curvePublicKey, curvePrivateKey);

//     if (!decrypted) {
//         return null;
//     }
//     return tweetnaclUtil.encodeUTF8(decrypted);
// }

export function sign(msg: any, privateKey: any) {
    let parsedclientPrivateKey = parsedPrivateKey(readKeysFromPem('', privateKey).privateKey!)
    return libSodiumWrapper.crypto_sign_detached(msg, parsedclientPrivateKey.key.privateKey);
}

export function signEncode(payload: any, privateKey: any) {
    const message = tweetnaclUtil.decodeUTF8(payload);
    const constsignedMsg = sign(message, privateKey)
    // console.log(constsignedMsg);
    return tweetnaclUtil.encodeBase64(constsignedMsg);
}

export function verifySign(signature: any, msg: any, publicKey: any) {
    // return libSodiumWrapper.crypto_sign_verify_detached(tweetnaclUtil.decodeBase64(signature), msg, keyStringToUint8Arrray(publicKey));
}

export async function generateKeyPair(format: StringOutputFormat = "base64") {
    return libSodiumWrapper.crypto_sign_keypair(format)
}

export function generateSharedKey(privateKey: any, publicKey: any) {
    let parsedclientPrivateKey = parsedPrivateKey(readKeysFromPem('', privateKey).privateKey!)
    return nacl.box.before(tweetnaclUtil.decodeBase64(publicKey), privateEd25519ToX25519(parsedclientPrivateKey.key.privateKey))
}
// Define the ASN.1 schema for Ed25519 private keys
const Ed25519PrivateKey = asn1.define('Ed25519PrivateKey', function (this: any) {
    return this.seq().obj(
        this.key('tbsCertificate').int(),
        this.key('signatureAlgorithm').seq().obj(
            this.key('algorithm').objid()
        ),
        this.key('key').octstr().obj(
            this.key('privateKey').octstr()
        ),
    );
});

// ASN.1 schema for Ed25519 public key
const Ed25519PublicKey = asn1.define('PublicKey', function (this: any) {
    this.seq().obj(
        this.key('tbsCertificate').seq().obj(
            this.key('signatureAlgorithm').objid(),
        ),
        this.key('signatureValue').bitstr()
    );
});

const parsedPrivateKey = (privateKey:string) => {
    return Ed25519PrivateKey.decode(Buffer.from(privateKey, 'hex'), 'der');
}


const parsedPublicKey = (publicKey:string) => {
    return Ed25519PublicKey.decode(Buffer.from(publicKey, 'hex'), 'der');
}
export const encryptWithSharedKey = (message:string, sharedKey:Uint8Array) => {
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const messageUint8 = tweetnaclUtil.decodeUTF8(message);
    const encrypted = nacl.box.after(messageUint8, nonce, sharedKey);
    const encryptedMessage = new Uint8Array(nonce.length + encrypted.length);
    encryptedMessage.set(nonce);
    encryptedMessage.set(encrypted, nonce.length);
    return tweetnaclUtil.encodeBase64(encryptedMessage);
}

export const decryptWithSharedKey = (encryptedMessage:string, sharedKey:Uint8Array) => {
    const encryptedMessageUint8 = tweetnaclUtil.decodeBase64(encryptedMessage);
    const nonce = encryptedMessageUint8.slice(0, nacl.box.nonceLength);
    const message = encryptedMessageUint8.slice(nacl.box.nonceLength);
    const decrypted = nacl.box.open.after(message, nonce, sharedKey);
    if (!decrypted) {
        throw new Error('Failed to decrypt message.');
    }
    return tweetnaclUtil.encodeUTF8(decrypted);
}

export const privateEd25519ToX25519 = (privateKey: Uint8Array) => {
    return ed2curve.convertSecretKey(privateKey)
}

export const publicEd25519ToX25519 = (publicKey: Uint8Array) => {
    return ed2curve.convertPublicKey(publicKey)
}