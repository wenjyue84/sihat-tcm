/**
 * Mocked Demo Accounts
 * 
 * Test accounts for development/demo purposes.
 * These allow quick login to test different user roles.
 */

export const MOCKED_ACCOUNTS = [
    { label: 'Pt', role: 'Patient', email: 'patient@sihat.tcm', pass: 'Patient123' },
    { label: 'Dr', role: 'Doctor', email: 'doctor@sihat.tcm', pass: 'Doctor123' },
    { label: 'Adm', role: 'Admin', email: 'admin@sihat.tcm', pass: 'Admin123' },
    { label: 'Dev', role: 'Developer', email: 'dev@sihat.tcm', pass: 'Dev123' },
];

export default MOCKED_ACCOUNTS;
