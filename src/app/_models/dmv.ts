export class DMVRecord {
    id?: string;
    name?: string;
    DL_no?: string;
    dob?: string;
    address?: string;
    attestor?: string;
    attestation_status?: 'ACCEPTED' | 'REJECTED' | 'PENDING'
}
export class DMVAttestors {
    id?: string;
    name?: string;
    publicAddress?: string;
}
