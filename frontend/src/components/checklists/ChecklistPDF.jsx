/**
 * ChecklistPDF.jsx
 * 
 * React-PDF component for generating beautiful, branded checklists
 * Styled like Pet Wrapped with soul personalization
 * 
 * Created: March 12, 2026
 * Updated: March 12, 2026 - Fixed font loading for mobile compatibility
 */

import React from 'react';
import { 
  Document, 
  Page, 
  Text, 
  View, 
  StyleSheet, 
  Image
} from '@react-pdf/renderer';

// Styles for the PDF document - Using Helvetica (built-in, no external fonts needed)
const styles = StyleSheet.create({
  page: {
    padding: 40,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  header: {
    marginBottom: 20,
    borderBottom: 2,
    borderBottomColor: '#9333ea',
    paddingBottom: 15,
  },
  logo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#9333ea',
    letterSpacing: 0.5,
  },
  logoSubtext: {
    fontSize: 8,
    color: '#6b7280',
    marginLeft: 5,
  },
  titleContainer: {
    backgroundColor: '#f3e8ff',
    borderRadius: 8,
    padding: 15,
    marginBottom: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 11,
    color: '#6b7280',
  },
  petInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
    padding: 12,
    backgroundColor: '#faf5ff',
    borderRadius: 6,
    borderLeftWidth: 4, borderLeftColor: '#9333ea',
  },
  petName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#7c3aed',
  },
  petDetails: {
    fontSize: 10,
    color: '#6b7280',
  },
  soulScore: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  soulScoreText: {
    fontSize: 10,
    color: '#9333ea',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    paddingBottom: 4,
    borderBottomWidth: 1, borderBottomColor: '#e5e7eb',
  },
  sectionIcon: {
    fontSize: 14,
    marginRight: 8,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#374151',
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
    paddingLeft: 5,
  },
  checkbox: {
    width: 12,
    height: 12,
    borderRadius: 2,
    borderWidth: 1.5, borderColor: '#9ca3af',
    marginRight: 10,
    marginTop: 2,
  },
  itemText: {
    fontSize: 10,
    color: '#4b5563',
    flex: 1,
    lineHeight: 1.4,
  },
  personalizedBadge: {
    backgroundColor: '#ddd6fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginLeft: 5,
  },
  personalizedText: {
    fontSize: 8,
    color: '#7c3aed',
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1, borderTopColor: '#e5e7eb',
  },
  footerText: {
    fontSize: 8,
    color: '#9ca3af',
  },
  footerBrand: {
    fontSize: 8,
    color: '#9333ea',
    fontWeight: 'bold',
  },
  inputLine: {
    borderBottom: '1 dotted #9ca3af',
    minWidth: 100,
    marginLeft: 5,
    flex: 1,
  },
  noteBox: {
    backgroundColor: '#fef3c7',
    padding: 10,
    borderRadius: 6,
    marginTop: 10,
    borderLeftWidth: 3, borderLeftColor: '#f59e0b',
  },
  noteText: {
    fontSize: 9,
    color: '#92400e',
  },
  noteLabel: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#b45309',
    marginBottom: 3,
  },
});

// Emergency Card specific styles (wallet-sized)
const cardStyles = StyleSheet.create({
  page: {
    padding: 20,
    backgroundColor: '#ffffff',
    fontFamily: 'Helvetica',
  },
  card: {
    borderWidth: 2, borderColor: '#ef4444',
    borderRadius: 10,
    padding: 15,
    backgroundColor: '#fef2f2',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#fecaca',
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#dc2626',
  },
  cardPetName: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  cardSection: {
    marginBottom: 10,
  },
  cardSectionTitle: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#991b1b',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  cardItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
    paddingBottom: 3,
    borderBottomWidth: 0.5, borderBottomColor: '#fecaca', borderStyle: 'dotted',
  },
  cardLabel: {
    fontSize: 9,
    color: '#6b7280',
  },
  cardValue: {
    fontSize: 9,
    fontWeight: 'bold',
    color: '#1f2937',
    textAlign: 'right',
    maxWidth: '60%',
  },
  emergencyNote: {
    backgroundColor: '#fee2e2',
    padding: 8,
    borderRadius: 4,
    marginTop: 8,
  },
  emergencyNoteText: {
    fontSize: 8,
    color: '#991b1b',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

// Main Checklist PDF Component
export const ChecklistPDF = ({ checklist, personalization, pillar }) => {
  const formatDate = () => {
    return new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const getPillarColor = () => {
    const colors = {
      adopt: '#22c55e',
      emergency: '#ef4444',
      travel: '#0ea5e9',
      farewell: '#a855f7',
      care: '#14b8a6',
      celebrate: '#ec4899',
      dine: '#f97316',
      fit: '#22c55e',
      learn: '#6366f1',
    };
    return colors[pillar] || '#9333ea';
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header with branding */}
        <View style={styles.header}>
          <View style={styles.logo}>
            <Text style={styles.logoText}>THE DOGGY COMPANY</Text>
            <Text style={styles.logoSubtext}>Pet Concierge®</Text>
          </View>
        </View>

        {/* Title Section */}
        <View style={[styles.titleContainer, { backgroundColor: `${getPillarColor()}15` }]}>
          <Text style={styles.title}>
            {checklist.icon} {checklist.title}
          </Text>
          <Text style={styles.subtitle}>{checklist.subtitle}</Text>
        </View>

        {/* Pet Info (if personalized) */}
        {personalization?.pet_name && (
          <View style={styles.petInfo}>
            <View>
              <Text style={styles.petName}>
                Made with love for {personalization.pet_name}
              </Text>
              <Text style={styles.petDetails}>
                {personalization.breed || 'Pet'} {personalization.life_stage ? `• ${personalization.life_stage}` : ''}
              </Text>
            </View>
            {personalization.soul_score && (
              <View style={styles.soulScore}>
                <Text style={styles.soulScoreText}>
                  Soul Score: {personalization.soul_score}%
                </Text>
              </View>
            )}
          </View>
        )}

        {/* Checklist Sections */}
        {checklist.sections?.map((section, sectionIndex) => (
          <View key={sectionIndex} style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionIcon}>{section.icon}</Text>
              <Text style={styles.sectionTitle}>{section.title}</Text>
            </View>
            
            {section.items?.map((item, itemIndex) => (
              <View key={itemIndex} style={styles.checklistItem}>
                <View style={styles.checkbox} />
                <Text style={styles.itemText}>
                  {item.text}
                  {item.personalized && personalization?.[item.field] && (
                    ` (${personalization[item.field]})`
                  )}
                </Text>
                {item.input && <View style={styles.inputLine} />}
              </View>
            ))}
          </View>
        ))}

        {/* Breed-specific note */}
        {personalization?.grooming_note && checklist.id === 'grooming_schedule' && (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>
              Note for {personalization.breed || 'your pet'}:
            </Text>
            <Text style={styles.noteText}>{personalization.grooming_note}</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Generated on {formatDate()}</Text>
          <Text style={styles.footerBrand}>thedoggycompany.com</Text>
        </View>
      </Page>
    </Document>
  );
};

// Emergency Card PDF (Wallet-sized format)
export const EmergencyCardPDF = ({ checklist, personalization }) => {
  const formatDate = () => {
    return new Date().toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <Document>
      <Page size={[252, 360]} style={cardStyles.page}>
        <View style={cardStyles.card}>
          {/* Card Header */}
          <View style={cardStyles.cardHeader}>
            <Text style={cardStyles.cardTitle}>EMERGENCY CARD</Text>
            <Text style={cardStyles.cardPetName}>
              {personalization?.pet_name || 'My Pet'}
            </Text>
          </View>

          {/* Emergency Contacts Section */}
          <View style={cardStyles.cardSection}>
            <Text style={cardStyles.cardSectionTitle}>Emergency Contacts</Text>
            <View style={cardStyles.cardItem}>
              <Text style={cardStyles.cardLabel}>Primary Vet:</Text>
              <Text style={cardStyles.cardValue}>
                {personalization?.vet_name || '_____________'}
              </Text>
            </View>
            <View style={cardStyles.cardItem}>
              <Text style={cardStyles.cardLabel}>Vet Phone:</Text>
              <Text style={cardStyles.cardValue}>
                {personalization?.vet_phone || '_____________'}
              </Text>
            </View>
            <View style={cardStyles.cardItem}>
              <Text style={cardStyles.cardLabel}>24/7 Emergency:</Text>
              <Text style={cardStyles.cardValue}>
                {personalization?.emergency_clinic || '_____________'}
              </Text>
            </View>
            <View style={cardStyles.cardItem}>
              <Text style={cardStyles.cardLabel}>Poison Helpline:</Text>
              <Text style={cardStyles.cardValue}>1800-123-4567</Text>
            </View>
          </View>

          {/* Critical Health Info */}
          <View style={cardStyles.cardSection}>
            <Text style={cardStyles.cardSectionTitle}>Health Info</Text>
            <View style={cardStyles.cardItem}>
              <Text style={cardStyles.cardLabel}>Allergies:</Text>
              <Text style={cardStyles.cardValue}>
                {personalization?.allergies || 'None known'}
              </Text>
            </View>
            <View style={cardStyles.cardItem}>
              <Text style={cardStyles.cardLabel}>Medications:</Text>
              <Text style={cardStyles.cardValue}>
                {personalization?.medications || 'None'}
              </Text>
            </View>
            <View style={cardStyles.cardItem}>
              <Text style={cardStyles.cardLabel}>Microchip:</Text>
              <Text style={cardStyles.cardValue}>
                {personalization?.microchip || '_____________'}
              </Text>
            </View>
          </View>

          {/* Emergency Note */}
          <View style={cardStyles.emergencyNote}>
            <Text style={cardStyles.emergencyNoteText}>
              If found, please call: {personalization?.emergency_contact || 'Owner\'s Number'}
            </Text>
          </View>
        </View>
      </Page>
    </Document>
  );
};

export default ChecklistPDF;
