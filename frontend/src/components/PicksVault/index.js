/**
 * CONCIERGE VAULT SYSTEM - Complete Component Exports
 * =====================================================
 * "Mira is the Brain, Concierge® is the Hands"
 * 
 * ALL flows go through the same plumbing:
 * create_signal() → Notification → Ticket → Inbox
 * 
 * Different CONTENT based on pillar & intent:
 * 
 * | Vault Type    | For                                    |
 * |---------------|----------------------------------------|
 * | PicksVault    | Products, Services                     |
 * | TipCardVault  | Advice, Plans, Guides                  |
 * | BookingVault  | Service Appointments                   |
 * | PlacesVault   | Pet-Friendly Locations                 |
 * | CustomVault   | Special/Bespoke Requests               |
 * | EmergencyVault| Urgent Help (vet, lost pet, injury)   |
 * | MemorialVault | Grief & Farewell                       |
 * | AdoptionVault | Finding a New Friend                   |
 */

// Core Vaults
export { default as PicksVault } from './PicksVault';
export { default as PickDetail } from './PickDetail';
export { default as TipCardVault } from './TipCardVault';

// Service Vaults
export { default as BookingVault } from './BookingVault';
export { default as PlacesVault } from './PlacesVault';
export { default as CustomVault } from './CustomVault';

// Special Flow Vaults
export { default as EmergencyVault } from './EmergencyVault';
export { default as MemorialVault } from './MemorialVault';
export { default as AdoptionVault } from './AdoptionVault';

// Configuration & Helpers
export * from './vaultConfig';
