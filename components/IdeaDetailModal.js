import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Modal,
  Image,
  TouchableOpacity, // Add this import
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Button,
  Badge,
  Avatar,
  Portal,
} from 'react-native-paper';
import { MaterialIcons } from '@expo/vector-icons';
import { theme, spacing } from '../utils/theme';
import { getStatusColor, getStatusText } from '../utils/statusUtils';
import { getNetworkConfig } from '../utils/networkConfig';

const IdeaDetailModal = ({ visible, idea, onDismiss }) => {
  if (!idea) return null;

  const [fullScreenImage, setFullScreenImage] = React.useState(null); // Add state



  const getBenefitColor = (benefit) => {
    switch (benefit) {
      case 'cost_saving': return theme.colors.success;
      case 'safety': return theme.colors.error;
      case 'quality': return theme.colors.tertiary;
      case 'productivity': return theme.colors.primary;
      default: return theme.colors.secondary;
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getUserName = (submittedBy) => submittedBy?.name || 'Unknown User';
  const getUserDept = (submittedBy) => submittedBy?.department || '';

  return (
    <Portal>
      <Modal
        visible={visible}
        onDismiss={onDismiss}
        animationType="slide"
        presentationStyle="pageSheet"
      >
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerContent}>
              <Text variant="headlineMedium" style={styles.headerTitle}>
                Idea Details
              </Text>
              <Button
                mode="text"
                onPress={onDismiss}
                icon="close"
                style={styles.closeButton}
              >
                Close
              </Button>
            </View>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <Card style={styles.ideaCard(idea.status)}>
              <Card.Content>
                {/* Title and Status */}
                <View style={styles.titleSection}>
                  <Text variant="headlineSmall" style={styles.ideaTitle}>
                    {idea.title}
                  </Text>
                  <Badge 
                    style={[
                      styles.statusBadge,
                      { backgroundColor: getStatusColor(idea.status) }
                    ]}
                  >
                    {getStatusText(idea.status)}
                  </Badge>
                </View>

                {/* Submitter Info */}
                <View style={styles.submitterSection}>
                  <Avatar.Text 
                    size={40} 
                    label={getUserName(idea.submittedBy).split(' ').map(n => n[0]).join('')}
                    style={styles.submitterAvatar}
                  />
                  <View style={styles.submitterDetails}>
                    <Text variant="titleMedium" style={styles.submitterName}>
                      {getUserName(idea.submittedBy)}
                    </Text>
                    <Text variant="bodyMedium" style={styles.submitterDept}>
                      {getUserDept(idea.submittedBy)}
                    </Text>
                    <Text variant="bodySmall" style={styles.submitDate}>
                      Submitted on {idea.createdAt ? formatDate(idea.createdAt) : 'Unknown date'}
                    </Text>
                  </View>
                </View>

                {/* Department */}
                <View style={styles.section}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Department
                  </Text>
                  <Chip 
                    mode="outlined" 
                    style={styles.departmentChip}
                  >
                    {idea.department}
                  </Chip>
                </View>

                {/* Problem Statement */}
                <View style={styles.section}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Problem Statement
                  </Text>
                  <Text variant="bodyLarge" style={styles.sectionContent}>
                    {idea.problem}
                  </Text>
                </View>

                {/* Proposed Improvement */}
                <View style={styles.section}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Proposed Improvement
                  </Text>
                  <Text variant="bodyLarge" style={styles.sectionContent}>
                    {idea.improvement}
                  </Text>
                </View>

                {/* Expected Benefit */}
                <View style={styles.section}>
                  <Text variant="titleMedium" style={styles.sectionTitle}>
                    Expected Benefit
                  </Text>
                  <Chip 
                    mode="outlined" 
                    style={[
                      styles.benefitChip,
                      { borderColor: getBenefitColor(idea.benefit) }
                    ]}
                    textStyle={{ color: getBenefitColor(idea.benefit) }}
                  >
                    {idea.benefit.replace('_', ' ').toUpperCase()}
                  </Chip>
                </View>

                {/* Images */}
                {(idea.images && idea.images.length > 0) && (
                  <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Images
                    </Text>
                    <ScrollView horizontal style={{ marginVertical: 8 }} showsHorizontalScrollIndicator={false}>
                      {idea.images.map((img, idx) => {
                        const { baseURL } = getNetworkConfig();
                        const imgUri = img.filename ? `${baseURL}/uploads/${img.filename}` : (img.url || img.uri || '');
                        return (
                          <TouchableOpacity key={idx} onPress={() => setFullScreenImage(imgUri)}>
                            <View style={{ marginRight: 12 }}>
                              <Image
                                source={{ uri: imgUri }}
                                style={{ width: 120, height: 120, borderRadius: 8, backgroundColor: '#eee' }}
                                resizeMode="cover"
                              />
                            </View>
                          </TouchableOpacity>
                        );
                      })}
                    </ScrollView>
                  </View>
                )}

                {/* Estimated Savings */}
                {idea.estimatedSavings && (
                  <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Estimated Savings
                    </Text>
                    <View style={styles.savingsContainer}>
                      <MaterialIcons 
                        name="attach-money" 
                        size={24} 
                        color={theme.colors.success} 
                      />
                      <Text variant="headlineSmall" style={styles.savingsText}>
                        ${idea.estimatedSavings.toLocaleString()}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Additional Notes */}
                {idea.notes && (
                  <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Additional Notes
                    </Text>
                    <Text variant="bodyLarge" style={styles.sectionContent}>
                      {idea.notes}
                    </Text>
                  </View>
                )}

                {/* Implementation Status */}
                {idea.status === 'implemented' && (
                  <View style={styles.implementedSection}>
                    <MaterialIcons 
                      name="check-circle" 
                      size={32} 
                      color={theme.colors.success} 
                    />
                    <Text variant="titleMedium" style={styles.implementedTitle}>
                      Successfully Implemented
                    </Text>
                    <Text variant="bodyMedium" style={styles.implementedText}>
                      This idea has been successfully implemented and is delivering results!
                    </Text>
                  </View>
                )}

                {/* Tags */}
                {idea.tags && idea.tags.length > 0 && (
                  <View style={styles.section}>
                    <Text variant="titleMedium" style={styles.sectionTitle}>
                      Tags
                    </Text>
                    <View style={styles.tagsContainer}>
                      {idea.tags.map((tag, index) => (
                        <Chip
                          key={index}
                          mode="outlined"
                          style={styles.tagChip}
                        >
                          {tag}
                        </Chip>
                      ))}
                    </View>
                  </View>
                )}
              </Card.Content>
            </Card>
          </ScrollView>
        </View>
      </Modal>
      {/* Full Screen Image Modal */}
      <Modal
        visible={!!fullScreenImage}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setFullScreenImage(null)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.95)',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <Image
            source={{ uri: fullScreenImage }}
            style={{ width: '90%', height: '70%', resizeMode: 'contain' }}
          />
          <Button
            mode="contained"
            onPress={() => setFullScreenImage(null)}
            style={{ marginTop: 20 }}
          >
            Close
          </Button>
        </View>
      </Modal>
    </Portal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: theme.colors.surface,
    elevation: 2,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  closeButton: {
    marginLeft: spacing.md,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
  },
  ideaCard: (status) => ({
    elevation: 3,
    borderLeftWidth: 6,
    borderLeftColor: getStatusColor(status),
    marginBottom: 16,
    overflow: 'hidden',
  }),
  titleSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  ideaTitle: {
    fontWeight: 'bold',
    flex: 1,
    marginRight: spacing.md,
    color: theme.colors.onSurface,
  },
  statusBadge: {
    // Badge styles handled by backgroundColor prop
  },
  submitterSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    paddingBottom: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.outline,
  },
  submitterAvatar: {
    backgroundColor: theme.colors.primary,
    marginRight: spacing.md,
  },
  submitterDetails: {
    flex: 1,
  },
  submitterName: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  submitterDept: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  submitDate: {
    color: theme.colors.onSurfaceVariant,
    fontStyle: 'italic',
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.sm,
  },
  sectionContent: {
    color: theme.colors.onSurfaceVariant,
    lineHeight: 24,
  },
  departmentChip: {
    alignSelf: 'flex-start',
  },
  benefitChip: {
    alignSelf: 'flex-start',
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    padding: spacing.md,
    borderRadius: spacing.sm,
  },
  savingsText: {
    marginLeft: spacing.sm,
    fontWeight: 'bold',
    color: theme.colors.success,
  },
  implementedSection: {
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceVariant,
    padding: spacing.lg,
    borderRadius: spacing.md,
    marginTop: spacing.lg,
  },
  implementedTitle: {
    fontWeight: 'bold',
    color: theme.colors.success,
    marginTop: spacing.sm,
    marginBottom: spacing.sm,
  },
  implementedText: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    // gap: spacing.sm, // Removed unsupported property
  },
  tagChip: {
    marginBottom: spacing.xs,
    marginRight: spacing.sm, // Added for horizontal spacing
  },
});

export default IdeaDetailModal; 