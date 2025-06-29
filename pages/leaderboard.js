import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  FlatList,
  Dimensions,
  Image,
  Animated,
} from 'react-native';
import { Text, Avatar } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { FontAwesome, Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import api from '../utils/api';
import { theme } from '../utils/theme';

const { width } = Dimensions.get('window');

export default function LeaderboardScreen() {
  const { user } = useUser();
  const [individualStats, setIndividualStats] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();

  // Animation values
  const podiumAnim = useRef(new Animated.Value(0)).current;
  const currentUserAnim = useRef(new Animated.Value(0)).current;
  const listAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchLeaderboard = async () => {
      setLoading(true);
      try {
        const resInd = await api.get('/api/users/leaderboard?type=individual');
        setIndividualStats(resInd.data.data.leaderboard || []);
      } catch (error) {
        // Only log to console, do not show any error UI
        console.error('Error loading leaderboard:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeaderboard();
  }, []);


  // Start animations when data loads
  useFocusEffect(
    React.useCallback(() => {
      if (!loading && individualStats.length > 0) {
        // Use requestAnimationFrame to ensure animations run after render
        requestAnimationFrame(() => {
          // Reset animations first
          podiumAnim.setValue(0);
          currentUserAnim.setValue(0);
          listAnim.setValue(0);

          // Animate podium first
          Animated.timing(podiumAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }).start();

          // Animate current user bar after podium
          setTimeout(() => {
            Animated.timing(currentUserAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }).start();
          }, 400);

          // Animate list after current user bar
          setTimeout(() => {
            Animated.timing(listAnim, {
              toValue: 1,
              duration: 500,
              useNativeDriver: true,
            }).start();
          }, 800);
        });
      }
    }, [loading, individualStats])
  );

  const currentUserRank = individualStats.findIndex(stat => stat.employeeNumber === user?.employeeNumber);
  const currentUserData = individualStats[currentUserRank];

  const top3 = individualStats.slice(0, 3);
  const others = individualStats.slice(3);

  const renderPodium = () => {
    if (loading || top3.length < 3) return null;
  
    const podiumOrder = [top3[1], top3[0], top3[2]]; // 2nd, 1st, 3rd
  
    return (
      <Animated.View 
        style={[
          styles.podiumContainer,
          {
            opacity: podiumAnim,
            transform: [{
              translateY: podiumAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [50, 0],
              })
            }]
          }
        ]}
      >
        {podiumOrder.map((player, index) => {
          const isFirst = player._id === top3[0]._id;
          const position = isFirst ? 1 : (player._id === top3[1]._id ? 2 : 3);
          
          return (
            <Animated.View 
              key={player._id} 
              style={[
                styles.podiumItem, 
                styles[`podiumItem${position}`],
                {
                  opacity: podiumAnim,
                  transform: [{
                    scale: podiumAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0.8, 1],
                    })
                  }]
                }
              ]}
            >
              <View style={styles.podiumAvatarContainer}>
                {isFirst && <FontAwesome name="trophy" size={24} color="#ffc107" style={styles.crown} />}
                <Avatar.Text
                  size={isFirst ? 80 : 60}
                  label={player.name.split(' ').map(n => n[0]).join('')}
                  style={styles.podiumAvatar}
                />
              </View>
              <Text style={styles.podiumName}>{player.name}</Text>
              <Text style={styles.podiumPoints}>{player.creditPoints} points</Text>
              <View style={[styles.podiumPillar, styles[`podiumPillar${position}`]]}>
                <Text style={styles.podiumRank}>{position}</Text>
              </View>
            </Animated.View>
          );
        })}
      </Animated.View>
    );
  };
  
  const renderCurrentUserBar = () => {
    if (loading || currentUserRank < 3 || !currentUserData) return null;
  
    const actualRank = currentUserRank + 1; // Add 1 because array index starts at 0
  
    return (
      <Animated.View 
        style={[
          styles.currentUserBar,
          {
            opacity: currentUserAnim,
            transform: [{
              translateX: currentUserAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [-width, 0],
              })
            }]
          }
        ]}
      >
        <Text style={styles.listRank}>{actualRank}</Text>
        <Avatar.Text
          size={40}
          label={currentUserData.name.split(' ').map(n => n[0]).join('')}
        />
        <View style={{ flex: 1, marginLeft: 12 }}>
          <Text style={styles.currentUserText}>Points: {currentUserData.creditPoints}</Text>
          <Text style={styles.currentUserText}>Level: Silver</Text>
        </View>
        <Text style={styles.currentUserText}>Position: #{actualRank}</Text>
      </Animated.View>
    );
  };

  const renderRankItem = ({ item, index }) => {
    const rank = index + 4;
    return (
      <Animated.View 
        style={[
          styles.listItem,
          {
            opacity: listAnim,
            transform: [{
              translateY: listAnim.interpolate({
                inputRange: [0, 1],
                outputRange: [30, 0],
              })
            }]
          }
        ]}
      >
        <Text style={styles.listRank}>{rank}</Text>
        <Avatar.Text
          size={40}
          label={item.name.split(' ').map(n => n[0]).join('')}
        />
        <Text style={styles.listName}>{item.name}</Text>
        <Text style={styles.listPoints}>{item.creditPoints} points</Text>
        <FontAwesome name="star" size={16} color="#fd7e14" />
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Ionicons name="chevron-back" size={24} color="black" onPress={() => navigation.goBack()} />
        <Text style={styles.headerTitle}>Leaderboard</Text>
        <View style={{width: 24}} />
      </View>
      <FlatList
        data={others}
        renderItem={renderRankItem}
        keyExtractor={item => item._id}
        contentContainerStyle={[styles.list, { paddingBottom: 100 }]}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          <>
            {renderPodium()}
            {renderCurrentUserBar()}
          </>
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#525b61', // A light orange/peach background
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#fff',
  },
  podiumContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    marginBottom: 20,
  },
  podiumItem: {
    alignItems: 'center',
    width: width / 3.5,
  },
  podiumItem1: {
    // Styles for 1st place
  },
  podiumItem2: {
    // Styles for 2nd place
  },
  podiumItem3: {
    // Styles for 3rd place
  },
  podiumAvatarContainer: {
    position: 'relative',
    alignItems: 'center',
    marginBottom: 8,
  },
  crown: {
    position: 'absolute',
    top: -15,
    zIndex: 1,
  },
  podiumAvatar: {
    backgroundColor: '#E0E0E0'
  },
  podiumName: {
    fontSize: 14,
    fontWeight: 'bold',
    textAlign: 'center',
    marginTop: 8,
    color : '#fcebde',
  },
  podiumPoints: {
    fontSize: 12,
    color: '#fff',
  },
  podiumPillar: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '80%',
    backgroundColor: '#ffc107',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  podiumPillar1: {
    height: 120,
  },
  podiumPillar2: {
    height: 90,
  },
  podiumPillar3: {
    height: 60,
  },
  podiumRank: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
  },
  currentUserBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF6F61',
    marginHorizontal: 16,
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
    elevation: 4,
  },
  currentUserText: {
    color: 'white',
    fontWeight: 'bold',
  },
  list: {
    paddingHorizontal: 16,
  },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    elevation: 2,
  },
  listRank: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 30,
    textAlign: 'center',
    marginRight: 12,
  },
  listName: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  listPoints: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
    marginRight: 8,
  },
});