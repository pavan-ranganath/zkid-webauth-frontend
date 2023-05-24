const asn1 = require('asn1.js');

const eddsa = require('elliptic');
const tweetNacl = require('tweetnacl');
const tweetNaclUtil = require('tweetnacl-util');

var _ed2curve = require('ed2curve');
let ed25519EllipticLib = new eddsa.eddsa('ed25519')
export const readKeysFromPem = (privateKey: any, publicKey: any) => {

    const publicKeyBuffer = readOpenSslPublicKeys(publicKey);
    const privateKeyBuffer = readOpenSslPrivateKeys(privateKey);

    return {
        publicKey: publicKeyBuffer,
        privateKey: privateKeyBuffer,
    };
};

export const readPublicKeyFromPem = (publicKey: any) => {
    const pemToBuffer = (pem: string) => Buffer.from(pem
        .replace('-----BEGIN PUBLIC KEY-----', '')
        .replace('-----END PUBLIC KEY-----', '')
        .replace(/\n/g, ''), 'base64');

    return pemToBuffer(publicKey);
};

export const readPrivateKeyFromPem = (privateKey: any) => {
    const pemToBuffer = (pem: string) => Buffer.from(pem
        .replace('-----BEGIN PRIVATE KEY-----', '')
        .replace('-----END PRIVATE KEY-----', '')
        .replace(/\n/g, ''), 'base64');

    return pemToBuffer(privateKey);

};

// Define the ASN.1 schema for Ed25519 private keys
export const Ed25519PrivateKey = asn1.define('Ed25519PrivateKey', function (this:any) {
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
export const Ed25519PublicKey = asn1.define('PublicKey', function (this:any) {
    this.seq().obj(
        this.key('tbsCertificate').seq().obj(
            this.key('signatureAlgorithm').objid(),
        ),
        this.key('signatureValue').bitstr()
    );
});

export const readOpenSslKeys = (OpensslEd25519PrivateKey: any, OpensslEd25519PublicKey: any) => {

    try {
        const parsedOnlyOpensslKeys = readKeysFromPem(OpensslEd25519PrivateKey, OpensslEd25519PublicKey);
        return { privateKey: parsedOnlyOpensslKeys.privateKey, publicKey: parsedOnlyOpensslKeys.publicKey }
    } catch (error) {
        console.error('Failed to Read the keys', error);
        throw new Error('Failed to Read the keys');
    }


}


export const readOpenSslPublicKeys = (OpensslEd25519PublicKey: any) => {

    try {
        const extractedOnlyOpensslPublicKey = readPublicKeyFromPem(OpensslEd25519PublicKey);
        // Parse the ASN.1 public key
        const parsedServerPublicKey = Ed25519PublicKey.decode(extractedOnlyOpensslPublicKey, 'der');
        return parsedServerPublicKey.signatureValue.data
    } catch (error) {
        console.error('Failed to Read public keys', error);
        throw new Error('Failed to Read public the keys');
    }


}

export const readOpenSslPrivateKeys = (OpensslEd25519PrivateKey: any) => {

    try {
        const extractedOnlyOpensslPrivateKey = readPrivateKeyFromPem(OpensslEd25519PrivateKey);
        // Parse the ASN.1 private key
        const parsedServerPrivateKey = Ed25519PrivateKey.decode(Buffer.from(extractedOnlyOpensslPrivateKey), 'der');
        return parsedServerPrivateKey.key.privateKey
    } catch (error) {
        console.error('Failed to Read private keys', error);
        throw new Error('Failed to Read private the keys');
    }


}

export const sign = (msg: any, privateKey: any) => {
    try {
        return ed25519EllipticLib.sign(msg, privateKey)
    } catch (error) {
        console.error('Failed to sign the msg', error);
        throw new Error('Failed to sign the msg');
    }
}

export const generateKeyPair = () => {
    try {
        return tweetNacl.sign.keyPair()
    } catch (error) {
        console.error('Error generating keypair', error);
        throw new Error('Error generating keypair');
    }

}
export const verifySign = (signedMsg: any, plainMsg: any, clientPublicKey: { toString: (arg0: string) => any; }) => {
        return ed25519EllipticLib.verify(plainMsg,signedMsg,clientPublicKey.toString('hex'))
}

export const getSharedKey = (privateKey: any, publicKey: any) => {
    try {
        return tweetNacl.box.before(publicKey, privateKey)
    } catch (error) {
        console.error('Error generating shared key', error);
        throw new Error('Error generating shared key');
    }
    
}

export const convertEd25519PrivateKeyToCurve25519 = (privateKey: Uint8Array) => {
    return _ed2curve.convertSecretKey(privateKey)
}
export const convertEd25519PublicKeyToCurve25519 = (publicKey: Uint8Array) => {
    return _ed2curve.convertPublicKey(publicKey)
}

// Encrypt the message using the shared key
export const encryptWithSharedKey = (message: any, sharedKey: any) => {
    const nonce = tweetNacl.randomBytes(tweetNacl.box.nonceLength);
    const messageUint8 = tweetNaclUtil.decodeUTF8(message);
    const encrypted = tweetNacl.box.after(messageUint8, nonce, sharedKey);
    const encryptedMessage = new Uint8Array(nonce.length + encrypted.length);
    encryptedMessage.set(nonce);
    encryptedMessage.set(encrypted, nonce.length);
    return tweetNaclUtil.encodeBase64(encryptedMessage);
}

// Decrypt the encrypted message using the shared key
export const decryptWithSharedKey = (encryptedMessage: any, sharedKey: any) => {
    const encryptedMessageUint8 = tweetNaclUtil.decodeBase64(encryptedMessage);
    const nonce = encryptedMessageUint8.slice(0,tweetNacl.box.nonceLength);
    const message = encryptedMessageUint8.slice(tweetNacl.box.nonceLength);
    const decrypted = tweetNacl.box.open.after(message, nonce, sharedKey);
    if (!decrypted) {
        throw new Error('Failed to decrypt message.');
    }
    return tweetNaclUtil.encodeUTF8(decrypted);
}
