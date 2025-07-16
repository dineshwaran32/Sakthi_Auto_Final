import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  FlatList,
  Animated,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Searchbar,
  Badge,
  Menu,
  Button,
  Avatar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useIdeas } from '../context/IdeaContext';
import { theme, spacing } from '../utils/theme';
import IdeaDetailModal from '../components/IdeaDetailModal';
import { useRefreshOnFocus } from '../hooks/useRefreshOnFocus';

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

const DEPARTMENT_FILTERS = [
  { value: 'all', label: 'All Departments' },
  { value: 'Engineering', label: 'Engineering' },
  { value: 'Quality', label: 'Quality' },
  { value: 'Manufacturing', label: 'Manufacturing' },
  { value: 'Management', label: 'Management' },
  { value: 'Administration', label: 'Administration' },
];

export default function ImplementedScreen() {
  const { ideas, loadIdeas } = useIdeas();
  
  // Refresh data when screen comes into focus
  useRefreshOnFocus(loadIdeas);
  const [searchQuery, setSearchQuery] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('all');
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedIdea, setSelectedIdea] = useState(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);

  // Filter for implemented and implementing ideas
  const implementedIdeas = ideas.filter(idea => 
    idea.status === 'implementing' || idea.status === 'implemented'
  );

  const filteredIdeas = implementedIdeas.filter(idea => {
    const matchesSearch = idea.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         idea.improvement.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDepartment = departmentFilter === 'all' || idea.department === departmentFilter;
    return matchesSearch && matchesDepartment;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'implemented': return theme.colors.success;
      case 'implementing': return theme.colors.tertiary;
      default: return theme.colors.secondary;
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'implemented': return 'Implemented';
      case 'implementing': return 'In Progress';
      default: return 'Unknown';
    }
  };

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
      month: 'short',
      day: 'numeric',
    });
  };

  const getUserName = (submittedBy) => submittedBy?.name || 'Unknown User';
  const getUserDept = (submittedBy) => submittedBy?.department || '';

  const handleIdeaPress = (idea) => {
    setSelectedIdea(idea);
    setDetailModalVisible(true);
  };

  const renderIdeaCard = ({ item, index }) => (
    <AnimatedListItem index={index}>
      <Card 
        style={styles.ideaCard}
        onPress={() => handleIdeaPress(item)}
      >
        <Card.Content>
          <View style={styles.cardHeader}>
            <View style={styles.titleContainer}>
              <Text variant="titleLarge" style={styles.ideaTitle}>
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
            
            <View style={styles.submitterInfo}>
              <Avatar.Text 
                size={32} 
                label={getUserName(item.submittedBy).split(' ').map(n => n[0]).join('')}
                style={styles.submitterAvatar}
              />
              <View style={styles.submitterDetails}>
                <Text variant="bodyMedium" style={styles.submitterName}>
                  {getUserName(item.submittedBy)}
                </Text>
                <Text variant="bodySmall" style={styles.submitterDept}>
                  {getUserDept(item.submittedBy)}
                </Text>
              </View>
            </View>
          </View>
          
          <Text variant="bodyLarge" style={styles.ideaDescription} numberOfLines={3}>
            {item.improvement}
          </Text>
          
          <View style={styles.benefitContainer}>
            <Chip 
              mode="outlined" 
              style={[
                styles.benefitChip,
                { borderColor: getBenefitColor(item.benefit) }
              ]}
              textStyle={{ color: getBenefitColor(item.benefit) }}
            >
              {item.benefit.replace('_', ' ').toUpperCase()}
            </Chip>
          </View>
          
          <View style={styles.cardFooter}>
            <View style={styles.metadataRow}>
              <MaterialIcons 
                name="calendar-today" 
                size={16} 
                color={theme.colors.onSurfaceVariant} 
              />
              <Text variant="bodySmall" style={styles.metadataText}>
                Submitted: {item.createdAt ? formatDate(item.createdAt) : ''}
              </Text>
            </View>
            
            {item.estimatedSavings && (
              <View style={styles.savingsContainer}>
                <MaterialIcons 
                  name="attach-money" 
                  size={18} 
                  color={theme.colors.success} 
                />
                <Text variant="bodyMedium" style={styles.savingsText}>
                  Est. Savings: ${item.estimatedSavings.toLocaleString()}
                </Text>
              </View>
            )}
          </View>
          
          {item.status === 'implemented' && (
            <View style={styles.implementedBanner}>
              <MaterialIcons 
                name="check-circle" 
                size={20} 
                color={theme.colors.success} 
              />
              <Text variant="bodyMedium" style={styles.implementedText}>
                Successfully implemented and delivering results!
              </Text>
            </View>
          )}
          
          <View style={styles.viewDetailsContainer}>
            <Text variant="bodySmall" style={styles.viewDetailsText}>
              Tap to view full details
            </Text>
            <MaterialIcons 
              name="chevron-right" 
              size={16} 
              color={theme.colors.primary} 
            />
          </View>
        </Card.Content>
      </Card>
    </AnimatedListItem>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <MaterialIcons 
        name="build-circle" 
        size={64} 
        color={theme.colors.secondary} 
      />
      <Text variant="headlineSmall" style={styles.emptyTitle}>
        No implemented ideas found
      </Text>
      <Text variant="bodyMedium" style={styles.emptyText}>
        {departmentFilter === 'all' 
          ? "No ideas have been implemented yet. Keep submitting great ideas!"
          : `No implemented ideas found for ${DEPARTMENT_FILTERS.find(f => f.value === departmentFilter)?.label}.`
        }
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineMedium" style={styles.headerTitle}>
          Implemented Ideas
        </Text>
        <Text variant="bodyMedium" style={styles.headerSubtitle}>
          {filteredIdeas.length} success stories
        </Text>
      </View>

      <View style={styles.filters}>
        <Searchbar
          placeholder="Search implemented ideas..."
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
            >
              {DEPARTMENT_FILTERS.find(f => f.value === departmentFilter)?.label}
            </Button>
          }
        >
          {DEPARTMENT_FILTERS.map((filter) => (
            <Menu.Item
              key={filter.value}
              onPress={() => {
                setDepartmentFilter(filter.value);
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
          keyExtractor={(item) => item._id || item.id}
          contentContainerStyle={[
            styles.list,
            filteredIdeas.length === 0 && styles.emptyList,
            { paddingBottom: 100 }
          ]}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmptyState}
        />
        
        <IdeaDetailModal
          visible={detailModalVisible}
          idea={selectedIdea}
          onDismiss={() => {
            setDetailModalVisible(false);
            setSelectedIdea(null);
          }}
        />
      </SafeAreaView>
    );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
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
  ideaCard: {
    marginBottom: spacing.lg,
    elevation: 3,
  },
  cardHeader: {
    marginBottom: spacing.md,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
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
  submitterInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitterAvatar: {
    backgroundColor: theme.colors.primary,
    marginRight: spacing.sm,
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
  },
  ideaDescription: {
    color: theme.colors.onSurfaceVariant,
    marginBottom: spacing.md,
    lineHeight: 22,
  },
  benefitContainer: {
    marginBottom: spacing.md,
  },
  benefitChip: {
    alignSelf: 'flex-start',
  },
  cardFooter: {
    marginBottom: spacing.sm,
  },
  metadataRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  metadataText: {
    marginLeft: spacing.xs,
    color: theme.colors.onSurfaceVariant,
  },
  savingsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  savingsText: {
    marginLeft: spacing.xs,
    color: theme.colors.success,
    fontWeight: 'bold',
  },
  implementedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.successContainer,
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.sm,
  },
  implementedText: {
    marginLeft: spacing.sm,
    color: theme.colors.success,
    fontWeight: 'bold',
    flex: 1,
  },
  viewDetailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: theme.colors.outline,
  },
  viewDetailsText: {
    color: theme.colors.primary,
    fontStyle: 'italic',
  },
  emptyState: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    
  },
  emptyTitle: {
    marginTop: spacing.lg,
    textAlign: 'center',
    marginBottom: spacing.md,
    fontWeight: 'bold',
    color: '#fff',
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