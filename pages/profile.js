import React from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import {
  Text,
  Card,
  Avatar,
  Button,
  Divider,
  List,
  Badge,
  Surface,
  IconButton,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useIdeas } from '../context/IdeaContext';
import { theme, spacing } from '../utils/theme';
import { useNavigation } from '@react-navigation/native';

export default function ProfileScreen() {
  const { user, logout, refreshUser } = useUser();
  const { ideas } = useIdeas();
  const navigation = useNavigation();

  if (!user) return null;

  const userIdeas = ideas.filter(idea => idea.submittedBy?.employeeNumber === user.employeeNumber);
  const approvedIdeas = userIdeas.filter(idea => idea.status === 'approved');
  const implementedIdeas = userIdeas.filter(idea => idea.status === 'implemented');
  
  // Calculate credit points breakdown
  const submittedPoints = userIdeas.length * 10;
  const approvedPoints = approvedIdeas.length * 20;
  const implementedPoints = implementedIdeas.length * 30;
  const totalCalculatedPoints = submittedPoints + approvedPoints + implementedPoints;
  
  const handleLogout = async () => {
    try {
      await logout();
      navigation.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      });
    } catch (error) {
      // Only log to console, do not show any error UI
      console.error('Logout error:', error);
    }
  };

  const handleRefreshProfile = async () => {
    try {
      await refreshUser();
      Alert.alert('Success', 'Profile data refreshed successfully!');
    } catch (error) {
      // Only show Alert, do not show any error UI
      Alert.alert('Error', 'Failed to refresh profile data. Please try again.');
      console.error('Profile refresh error:', error);
    }
  };

  const formatJoinDate = () => {
    if (user.createdAt) {
      const joinDate = new Date(user.createdAt);
      return joinDate.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
      });
    }
    return '';
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: 100 }]}>
        
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text 
              size={80} 
              label={user.name.split(' ').map(n => n[0]).join('')}
              style={styles.avatar}
            />
            <View style={styles.profileInfo}>
              <Text variant="headlineSmall" style={styles.userName}>
                {user.name}
              </Text>
              <Text variant="titleMedium" style={styles.userDesignation}>
                {user.designation}
              </Text>
              <Text variant="bodyMedium" style={styles.userDepartment}>
                {user.department} Department
              </Text>
              <Text variant="bodySmall" style={styles.userEmail}>
                {user.email}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Statistics */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Your Impact
            </Text>
            <View style={styles.statsGrid}>
              <View style={styles.statItem}>
                <Surface style={[styles.statIcon, { backgroundColor: theme.colors.tertiaryContainer }]}>
                  <MaterialIcons name="lightbulb" size={24} color={theme.colors.primary} />
                </Surface>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {userIdeas.length}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Ideas Submitted
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Surface style={[styles.statIcon, { backgroundColor: theme.colors.tertiaryContainer }]}>
                  <MaterialIcons name="check-circle" size={24} color={theme.colors.primary} />
                </Surface>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {approvedIdeas.length}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Approved
                </Text>
              </View>
              
              <View style={styles.statItem}>
                <Surface style={[styles.statIcon, { backgroundColor: theme.colors.tertiaryContainer }]}>
                  <MaterialIcons name="build" size={24} color={theme.colors.primary} />
                </Surface>
                <Text variant="headlineSmall" style={styles.statNumber}>
                  {implementedIdeas.length}
                </Text>
                <Text variant="bodyMedium" style={styles.statLabel}>
                  Implemented
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Credit Points */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <View style={styles.creditPointsHeader}>
              <Text variant="titleLarge" style={styles.sectionTitle}>
                Credit Points
              </Text>
              <IconButton
                icon="refresh"
                size={20}
                onPress={handleRefreshProfile}
                iconColor={theme.colors.primary}
              />
            </View>
            <View style={{ alignItems: 'center', marginVertical: spacing.lg }}>
              <Surface style={[styles.statIcon, { backgroundColor: theme.colors.secondaryContainer }]}> 
                <MaterialIcons name="stars" size={32} color={theme.colors.secondary} />
              </Surface>
              <Text variant="displayMedium" style={{ fontWeight: 'bold', color: theme.colors.secondary, marginTop: spacing.md }}>
                {user.creditPoints ?? 0}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.xs }}>
                Total Credit Points
              </Text>
            </View>
            
            {/* Credit Points Breakdown */}
            <View style={styles.breakdownContainer}>
              <Text variant="titleMedium" style={styles.breakdownTitle}>
                Points Breakdown
              </Text>
              <View style={styles.breakdownItem}>
                <MaterialIcons name="lightbulb" size={16} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.breakdownLabel}>
                  Ideas Submitted ({userIdeas.length})
                </Text>
                <Text variant="bodyMedium" style={styles.breakdownPoints}>
                  +{submittedPoints}
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <MaterialIcons name="check-circle" size={16} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.breakdownLabel}>
                  Ideas Approved ({approvedIdeas.length})
                </Text>
                <Text variant="bodyMedium" style={styles.breakdownPoints}>
                  +{approvedPoints}
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <MaterialIcons name="build" size={16} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={styles.breakdownLabel}>
                  Ideas Implemented ({implementedIdeas.length})
                </Text>
                <Text variant="bodyMedium" style={styles.breakdownPoints}>
                  +{implementedPoints}
                </Text>
              </View>
              <Divider style={{ marginVertical: spacing.sm }} />
              <View style={styles.breakdownItem}>
                <Text variant="bodyMedium" style={[styles.breakdownLabel, { fontWeight: 'bold' }]}>
                  Total Calculated
                </Text>
                <Text variant="bodyMedium" style={[styles.breakdownPoints, { fontWeight: 'bold' }]}>
                  {totalCalculatedPoints}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Profile Details */}
        <Card style={styles.detailsCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Profile Details
            </Text>
            
            <List.Item
              title="Employee Number"
              description={user.employeeNumber}
              left={props => <List.Icon {...props} icon="card-account-details" color={theme.colors.primary} />}
            />
            <Divider />
            
            <List.Item
              title="Role"
              description={user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              left={props => <List.Icon {...props} icon="account-circle" color={theme.colors.primary}/>}
            />
            <Divider />
            
            <List.Item
              title="Member Since"
              description={formatJoinDate()}
              left={props => <List.Icon {...props} icon="calendar-today" color={theme.colors.primary}/>}
            />
          </Card.Content>
        </Card>

        {/* Settings */}
        {/* <Card style={styles.settingsCard}>
          <Card.Content>
            <Text variant="titleLarge" style={styles.sectionTitle}>
              Settings
            </Text>
            
            <List.Item
              title="Notifications"
              description="Manage your notification preferences"
              left={props => <List.Icon {...props} icon="bell" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Coming Soon', 'Notification settings will be available in the next update.')}
            />
            <Divider />
            
            <List.Item
              title="Privacy"
              description="Privacy and data settings"
              left={props => <List.Icon {...props} icon="shield-account" />}
              right={props => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => Alert.alert('Coming Soon', 'Privacy settings will be available in the next update.')}
            />
          </Card.Content>
        </Card> */}

        {/* Logout Button */}
        <Button
          mode="outlined"
          onPress={handleLogout}
          style={styles.logoutButton}
          icon="logout"
          textColor={'#FFF7F0'}
        >Sign Out
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  scrollContainer: {
    paddingBottom: spacing.xl,
  },
  profileCard: {
    margin: spacing.lg,
    elevation: 4,
  },
  profileContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  avatar: {
    backgroundColor: theme.colors.secondary,
    marginBottom: spacing.md,
    color : theme.colors.onPrimary,
  },
  profileInfo: {
    alignItems: 'center',
  },
  userName: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
    marginBottom: spacing.xs,
  },
  userDesignation: {
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  userDepartment: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.xs,
  },
  userEmail: {
    color: theme.colors.onSurfaceVariant,
  },
  statsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: theme.colors.primary,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
    elevation: 2,
  },
  statNumber: {
    fontWeight: 'bold',
    color: theme.colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    textAlign: 'center',
    color: theme.colors.onSurfaceVariant,
  },
  detailsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  settingsCard: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    elevation: 2,
  },
  logoutButton: {
    marginHorizontal: spacing.lg,
    marginBottom: spacing.lg,
    borderColor: theme.colors.primary,
    backgroundColor : theme.colors.primary,
  },
  creditPointsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  breakdownContainer: {
    marginTop: spacing.md,
  },
  breakdownTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: theme.colors.onSurface,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  breakdownLabel: {
    flex: 1,
    color: theme.colors.onSurfaceVariant,
  },
  breakdownPoints: {
    fontWeight: 'bold',
    color: theme.colors.primary,
  },
});