import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  Alert,
  Animated,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Button,
  Searchbar,
  Badge,
  Menu,
  Divider,
  Modal,
  Portal,
  Dialog,
  Provider as PaperProvider,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { useIdeas } from '../context/IdeaContext';
import { theme, spacing } from '../utils/theme';

const AnimatedListItem = ({ children, index }) => {
  const slideUp = useRef(new Animated.Value(50)).current;
  const opacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Use requestAnimationFrame to ensure animations run after render
    requestAnimationFrame(() => {
      Animated.timing(opacity, {
        toValue: 1,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
      Animated.timing(slideUp, {
        toValue: 0,
        duration: 500,
        delay: index * 100,
        useNativeDriver: true,
      }).start();
    });
  }, [slideUp, opacity, index]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY: slideUp }] }}>
      {children}
    </Animated.View>
  );
};

const STATUS_FILTERS = [
  { value: 'all', label: 'All Ideas' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'implementing', label: 'Implementing' },
];

export default function TrackerScreen() {
  const { user } = useUser();
  const { ideas, loadIdeas } = useIdeas();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);

  const userIdeas = ideas.filter(idea => idea.submittedBy?.employeeNumber === user?.employeeNumber);
  
  const filteredIdeas = userIdeas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         idea.problem.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || idea.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'approved': return theme.colors.success;
      case 'rejected': return theme.colors.error;
      case 'implementing': return theme.colors.tertiary;
      default: return theme.colors.secondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'approved': return 'Approved';
      case 'rejected': return 'Rejected';
      case 'implementing': return 'Implementing';
      default: return 'Under Review';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved': return 'check-circle';
      case 'rejected': return 'cancel';
      case 'implementing': return 'build';
      default: return 'schedule';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const renderIdeaCard = ({ item, index }) => (
    <AnimatedListItem index={index}>
      <Card style={styles.ideaCard}>
        <Card.Content>
          <View style={styles.cardHeader}>
            <Text variant="titleMedium" style={styles.ideaTitle}>
              {item.title}
            </Text>
            <Badge 
              style={[
                styles.statusBadge,
                { backgroundColor: getStatusColor(item.status) }
              ]}
            >
              {getStatusText(item.status)}
            </Badge>
          </View>
          
          <Text variant="bodyMedium" style={styles.ideaProblem} numberOfLines={2}>
            {item.problem}
          </Text>
          
          <View style={styles.cardFooter}>
            <View style={styles.ideaMetadata}>
              <MaterialIcons 
                name="business" 
                size={16} 
                color={theme.colors.onSurfaceVariant} 
              />
              <Text variant="bodySmall" style={styles.metadataText}>
                {item.department}
              </Text>
            </View>
            
            <View style={styles.ideaMetadata}>
              <MaterialIcons 
                name="calendar-today" 
                size={16} 
                color={theme.colors.onSurfaceVariant} 
              />
              <Text variant="bodySmall" style={styles.metadataText}>
                {item.createdAt ? formatDate(item.createdAt) : ''}
              </Text>
            </View>
          </View>
          
          <Chip 
            mode="outlined" 
            style={styles.benefitChip}
          >
            {item.benefit.replace('_', ' ').toUpperCase()}
          </Chip>
          
          {item.estimatedSavings && (
            <View style={styles.savingsContainer}>
              <MaterialIcons 
                name="attach-money" 
                size={16} 
                color={theme.colors.tertiary} 
              />
              <Text variant="bodySmall" style={styles.savingsText}>
                Est. Savings: ${item.estimatedSavings}
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    </AnimatedListItem>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons 
        name="lightbulb-outline" 
        size={64} 
        color={theme.colors.primary} 
      />
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        No ideas found
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        {statusFilter === 'all' 
          ? "You haven't submitted any ideas yet. Start your Sakthi Spark journey today!"
          : `No ideas with "${STATUS_FILTERS.find(f => f.value === statusFilter)?.label}" status found.`
        }
      </Text>
    </View>
  );

  return (
    <PaperProvider>
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            My Ideas
          </Text>
          <Text variant="bodyMedium" style={styles.headerSubtitle}>
            {filteredIdeas.length} of {userIdeas.length} ideas
          </Text>
        </View>

        <View style={styles.filters}>
          <Searchbar
            placeholder="Search ideas..."
            onChangeText={setSearchQuery}
            value={searchQuery}
            style={styles.searchbar}
          />
          
          <Menu
            visible={menuVisible}
            onDismiss={() => setMenuVisible(false)}
            anchor={
              <Button
                mode="outlined"
                onPress={() => setMenuVisible(true)}
                style={styles.filterButton}
                icon="filter"
              >
                {STATUS_FILTERS.find(f => f.value === statusFilter)?.label}
              </Button>
            }
          >
            {STATUS_FILTERS.map((filter) => (
              <Menu.Item
                key={filter.value}
                onPress={() => {
                  setStatusFilter(filter.value);
                  setMenuVisible(false);
                }}
                title={filter.label}
              />
            ))}
          </Menu>
        </View>

        <FlatList
          data={filteredIdeas}
          renderItem={renderIdeaCard}
          keyExtractor={(item) => item._id}
          contentContainerStyle={[
            styles.list,
            filteredIdeas.length === 0 && styles.emptyList,
            { paddingBottom: 100 }
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
      </SafeAreaView>
    </PaperProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  header: {
    padding: spacing.lg,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  headerSubtitle: {
    color: theme.colors.onSurfaceVariant,
    marginTop: spacing.xs,
  },
  filters: {
    padding: spacing.lg,
    backgroundColor: theme.colors.surface,
    elevation: 1,
  },
  searchbar: {
    marginBottom: spacing.md,
  },
  filterButton: {
    alignSelf: 'flex-start',
  },
  list: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  ideaCard: {
    marginBottom: spacing.md,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  ideaTitle: {
    fontWeight: 'bold',
    flex: 1,
    marginRight: spacing.sm,
    color: theme.colors.onSurface,
  },
  statusBadge: {
    // Badge styles handled by backgroundColor prop
  },
  ideaProblem: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.md,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  ideaMetadata: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metadataText: {
    marginLeft: spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
  benefitChip: {
    alignSelf: 'flex-start',
    marginBottom: spacing.sm,
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.xs,
  },
  savingsText: {
    marginLeft: spacing.xs,
    color: theme.colors.tertiary,
    fontWeight: 'bold',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    marginTop: spacing.lg,
    marginBottom: spacing.md,
    fontWeight: 'bold',
    color: theme.colors.onSurface,
  },
  emptyText: {
    textAlign: 'center',
    color: theme.colors.tertiary,
    lineHeight: 20,
  },
  emptyList: {
    flexGrow: 1,
    justifyContent: 'center',
  },
});