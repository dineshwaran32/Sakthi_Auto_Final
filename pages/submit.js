import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  Platform,
  Linking,
  Image,
  Animated,
  Dimensions,
} from 'react-native';
import {
  Text,
  TextInput,
  Button,
  Card,
  ProgressBar,
  RadioButton,
  Chip,
  Surface,
  Checkbox,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system';
import { useNavigation } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useUser } from '../context/UserContext';
import { useIdeas } from '../context/IdeaContext';
import { theme, spacing } from '../utils/theme';
import { getNetworkConfig } from '../utils/networkConfig';
// import { uploadImageAsync } from '../utils/api';

const { width } = Dimensions.get('window');

const STEPS = [
  'Basic Info',
  'Problem & Solution',
  'Benefits',
  'Images',
  'Review',
];

const BENEFIT_OPTIONS = [
  { value: 'cost_saving', label: 'Cost Saving' },
  { value: 'safety', label: 'Safety' },
  { value: 'quality', label: 'Quality' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'others', label: 'Others' },
];

export default function SubmitIdeaScreen() {
  
  const navigation = useNavigation();
  const { user } = useUser();
  const { submitIdea, loadIdeas } = useIdeas();
  
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [resetCounter, setResetCounter] = useState(0);

  // Animation state
  const slideAnim = useRef(new Animated.Value(0)).current;
  const [contentVisible, setContentVisible] = useState(true);
  const prevStepRef = useRef(currentStep);

  // Memoize initial form data to prevent unnecessary re-renders
  const initialFormData = useMemo(() => ({
    title: '',
    problem: '',
    improvement: '',
    benefits: [],
    othersDescription: '',
    estimatedSavings: '',
    images: [],
    department: user?.department || '',
    submittedBy: user?.employeeNumber || '',
  }), [user?.department, user?.employeeNumber]);

  const [formData, setFormData] = useState(initialFormData);

  const resetForm = useCallback(() => {
    setFormData(initialFormData);
    setCurrentStep(0);
    setResetCounter(prev => prev + 1);
  }, [initialFormData]);

  // Reset form when component mounts or user changes
  useEffect(() => {
    if (user) {
      resetForm();
    }
  }, [user, resetForm]);

  // Monitor form data changes for debugging - only in development
  useEffect(() => {
  }, [formData]);

  // Monitor current step changes for debugging - only in development
  useEffect(() => {
    const isNavigatingForward = currentStep > prevStepRef.current;
    prevStepRef.current = currentStep;

    // Use requestAnimationFrame to ensure this runs after render
    requestAnimationFrame(() => {
      // Hide and slide out
      Animated.timing(slideAnim, {
        toValue: isNavigatingForward ? -width : width,
        duration: 200,
        useNativeDriver: true,
      }).start(() => {
        // After sliding out, update content and slide back in
        setContentVisible(false);
        slideAnim.setValue(isNavigatingForward ? width : -width);
        setContentVisible(true);
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      });
    });
  }, [currentStep, slideAnim]);

  const updateFormData = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, STEPS.length - 1));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const validateCurrentStep = () => {
    switch (currentStep) {
      case 0:
        if (!formData.title.trim()) {
          Alert.alert('Validation Error', 'Please enter a title for your idea');
          return false;
        }
        return true;
      case 1:
        if (!formData.problem.trim() || !formData.improvement.trim()) {
          Alert.alert('Validation Error', 'Please fill in both problem and improvement fields');
          return false;
        }
        return true;
      case 2:
        if (!formData.benefits || formData.benefits.length === 0) {
          Alert.alert('Validation Error', 'Please select at least one expected benefit');
          return false;
        }
        // Check if "Others" is selected but description is missing
        if (formData.benefits.includes('others') && !formData.othersDescription.trim()) {
          Alert.alert('Validation Error', 'Please describe the benefits when selecting "Others" option');
          return false;
        }
        return true;
      default:
        return true;
    }
  };

  const pickImage = async () => {
    if (Platform.OS === 'web') {
      Alert.alert('Info', 'Image picker is not available in web preview');
      return;
    }

    // Check if we've reached the image limit
    if (formData.images.length >= 5) {
      Alert.alert('Image Limit', 'You can add up to 5 images. Please remove some images before adding more.');
      return;
    }

    try {
      // Request permissions for both camera and media library
      const mediaLibraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!mediaLibraryPermission.granted && !cameraPermission.granted) {
        Alert.alert(
          'Permission Required', 
          'Camera and media library permissions are required to add images. Please enable them in your device settings.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Settings', onPress: () => Linking.openSettings() }
          ]
        );
        return;
      }

      // Show action sheet to choose between camera and gallery
      Alert.alert(
        'Select Image',
        'Choose how you want to add an image',
        [
          {
            text: 'Camera',
            onPress: async () => {
              if (cameraPermission.granted) {
                const result = await ImagePicker.launchCameraAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [4, 3],
                  quality: 0.8,
                  base64: false,
                  exif: false
                });

                if (!result.canceled && result.assets && result.assets.length > 0) {
                  try {
                    const newImages = [...formData.images, {
                      uri: result.assets[0].uri,
                      type: result.assets[0].type || 'image/jpeg',
                      name: `image_${Date.now()}.jpg`
                    }];
                    updateFormData('images', newImages);
                  } catch (e) {
                    Alert.alert('Error', 'Failed to process image. Please try again.');
                  }
                }
              } else {
                Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
              }
            }
          },
          {
            text: 'Gallery',
            onPress: async () => {
              if (mediaLibraryPermission.granted) {
                const result = await ImagePicker.launchImageLibraryAsync({
                  mediaTypes: ImagePicker.MediaTypeOptions.Images,
                  allowsEditing: true,
                  aspect: [4, 3],
                  quality: 0.8,
                  allowsMultipleSelection: false,
                  base64: false,
                  exif: false
                });

                if (!result.canceled && result.assets && result.assets.length > 0) {
                  try {
                    const newImages = [...formData.images, {
                      uri: result.assets[0].uri,
                      type: result.assets[0].type || 'image/jpeg',
                      name: `image_${Date.now()}.jpg`
                    }];
                    updateFormData('images', newImages);
                  } catch (e) {
                    Alert.alert('Error', 'Failed to process image. Please try again.');
                  }
                }
              } else {
                Alert.alert('Permission Denied', 'Media library permission is required to select photos.');
              }
            }
          },
          {
            text: 'Cancel',
            style: 'cancel'
          }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to pick image. Please try again.');
    }
  };

  const removeImage = (index) => {
    const newImages = formData.images.filter((_, i) => i !== index);
    updateFormData('images', newImages);
  };

  // Helper function to make API request with retries
  const makeApiRequest = async (url, form, token, retries = 2) => {
    let lastError;
    
    for (let i = 0; i <= retries; i++) {
      try {
        const response = await fetch(url, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Authorization': `Bearer ${token}`,
            // Let fetch set the multipart Content-Type with boundary automatically
            'X-Debug-Request': 'true'
          },
          body: form,
        });
        
        if (response.ok) {
          return response;
        }
        
        // Handle non-OK responses
        let errorData;
        try {
          errorData = await response.json();

        } catch (e) {

          const text = await response.text();
          errorData = { message: text };
        }
        
        // console.error('SubmitIdea makeApiRequest: Non-OK response', {
        //   url,
        //   status: response.status,
        //   statusText: response.statusText,
        //   errorData,
        // });
        lastError = new Error(errorData.message || `HTTP error! status: ${response.status}`);
        
      } catch (error) {
        // console.error('SubmitIdea makeApiRequest: Network/Fetch error', { url, error });
        lastError = error;
        
        // If this was the last retry, rethrow the error
        if (i === retries) {
          throw lastError;
        }
        
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * (i + 1)));
      }
    }
    
    throw lastError || new Error('Request failed after retries');
  };

  const handleSubmit = async () => {
    setLoading(true);

    
    try {
      // 1. Build FormData
      const form = new FormData();

      
      // Add text fields
      form.append('title', formData.title);
      form.append('problem', formData.problem);
      form.append('improvement', formData.improvement);
      form.append('benefit', Array.isArray(formData.benefits) ? formData.benefits.join(',') : '');
      
      // Add others description if "others" is selected
      if (formData.benefits.includes('others') && formData.othersDescription.trim()) {
        form.append('othersDescription', formData.othersDescription.trim());
      }
      
      // form.append('department', formData.department);
      
      // Add estimated savings if provided
      if (formData.estimatedSavings && formData.estimatedSavings.trim() !== '') {
        const savings = Number(formData.estimatedSavings);
        if (!isNaN(savings) && savings >= 0) {
          form.append('estimatedSavings', savings);
        }
      }
      
      // Simple image handling without compression

      
      for (const img of formData.images) {
        const file = {
          uri: img.uri,
          name: `image_${Date.now()}.jpg`,
          type: 'image/jpeg'
        };

        form.append('images', file);
      }
      
      // Get token for auth
      let token = null;
      try {
        // Try to get token from AsyncStorage
        const storedToken = await AsyncStorage.getItem('token');

        
        if (!storedToken) {
          // If no token in AsyncStorage, check if we have a user context with token
          if (user?.token) {

            token = user.token;
          } else {
            throw new Error('No authentication token found. Please log in again.');
          }
        } else {
          token = storedToken;
        }
      } catch (error) {

        Alert.alert('Authentication Error', error.message || 'Please log in again.');
        navigation.navigate('Login');
        throw error;
      }
      
      // 2. Prepare request with retry logic
      const { baseURL, baseURLs = [baseURL] } = getNetworkConfig();
      let lastError = null;
      
      // Try each base URL until one works or all fail
      for (const url of baseURLs) {
        const apiUrl = `${url}/app/api/ideas`;

        try {
          // 3. Make the request with retries
          const response = await makeApiRequest(apiUrl, form, token);
          const result = await response.json();
          // console.log('SubmitIdea: submission success', { apiUrl, result });


          // Refresh the ideas list
          await loadIdeas();
          
          // Success feedback & reset UI
          Alert.alert(
            'Success!', 
            'Your idea has been submitted successfully!',
            [
              {
                text: 'Submit Another Idea',
                onPress: () => resetForm()
              },
              {
                text: 'View My Ideas',
                onPress: () => {
                  resetForm();
                  navigation.navigate('My Ideas');
                }
              }
            ]
          );
          return; // stop after first success
        } catch (error) {
          // console.error('SubmitIdea: attempt failed for URL', { apiUrl, error });
          lastError = error; // keep last error and try next url
        }
      }
        
      
      // If we get here, all URLs failed

      throw lastError || new Error('Failed to connect to the server. Please check your internet connection and try again.');
    } catch (error) {
      // console.error('SubmitIdea: final submission error', { error });
      Alert.alert('Error', error?.message ? String(error.message) : 'Failed to submit idea. Please check your input and try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <Text variant="headlineSmall" style={styles.stepTitle}>
              Basic Information
            </Text>
            <TextInput
              key={`title-${resetCounter}`}
              label="Idea Title *"
              value={formData.title}
              onChangeText={(text) => updateFormData('title', text)}
              mode="outlined"
              style={styles.input}
              placeholder="Enter a clear, descriptive title"
            />
            {/*
            <TextInput
              key={`department-${resetCounter}`}
              label="Department"
              value={formData.department}
              mode="outlined"
              style={styles.input}
              disabled
            />
            */}
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text variant="headlineSmall" style={styles.stepTitle}>
              Problem & Solution
            </Text>
            <TextInput
              key={`problem-${resetCounter}`}
              label="Problem Identified *"
              value={formData.problem}
              onChangeText={(text) => updateFormData('problem', text)}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              placeholder="Describe the current problem or inefficiency"
            />
            <TextInput
              key={`improvement-${resetCounter}`}
              label="Suggested Improvement *"
              value={formData.improvement}
              onChangeText={(text) => updateFormData('improvement', text)}
              mode="outlined"
              multiline
              numberOfLines={4}
              style={styles.input}
              placeholder="Describe your proposed solution"
            />
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text variant="headlineSmall" style={styles.stepTitle}>
              Expected Benefits
            </Text>
            <Text variant="bodyMedium" style={styles.sectionSubtitle}>
              Select one or more benefit categories:
            </Text>
            {BENEFIT_OPTIONS.map((option) => {
              const checked = Array.isArray(formData.benefits) && formData.benefits.includes(option.value);
              return (
                <View key={option.value} style={styles.radioOption}>
                  <Checkbox
                    status={checked ? 'checked' : 'unchecked'}
                    onPress={() => {
                      const current = Array.isArray(formData.benefits) ? formData.benefits : [];
                      const next = checked
                        ? current.filter(v => v !== option.value)
                        : [...current, option.value];
                      updateFormData('benefits', next);
                    }}
                  />
                  <Text variant="bodyLarge" style={styles.radioLabel}>
                    {option.label}
                  </Text>
                </View>
              );
            })}
            
            {/* Others Description Input */}
            {Array.isArray(formData.benefits) && formData.benefits.includes('others') && (
              <View style={styles.othersContainer}>
                <TextInput
                  label="Describe the benefits (Required for Others option)"
                  value={formData.othersDescription}
                  onChangeText={(text) => updateFormData('othersDescription', text)}
                  mode="outlined"
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                  placeholder="Please describe the specific benefits of your idea..."
                />
              </View>
            )}
            
            <TextInput
              key={`savings-${resetCounter}`}
              label="Estimated Savings (Optional)"
              value={formData.estimatedSavings}
              onChangeText={(text) => updateFormData('estimatedSavings', text)}
              mode="outlined"
              keyboardType="numeric"
              style={styles.input}
              placeholder="Enter amount in your local currency"
              left={<TextInput.Icon icon="currency-usd" />}
            />
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <Text variant="headlineSmall" style={styles.stepTitle}>
              Supporting Images
            </Text>
            <Text variant="bodyMedium" style={styles.sectionSubtitle}>
              Add before/after photos or diagrams (optional) - {formData.images.length}/5 images
            </Text>
            
            <Button
              mode="outlined"
              onPress={pickImage}
              style={styles.imageButton}
              icon="camera"
              disabled={formData.images.length >= 5}
            >
              {formData.images.length >= 5 ? 'Image Limit Reached' : 'Add Image'}
            </Button>

            {formData.images.length > 0 && (
              <View style={styles.imageContainer}>
                {formData.images.map((image, index) => (
                  <Surface key={index} style={styles.imageItem}>
                    <Image 
                      source={{ uri: image.uri }} 
                      style={styles.imagePreview}
                      resizeMode="cover"
                    />
                    <View style={styles.imageActions}>
                      <Text variant="bodySmall" style={styles.imageText}>
                        Image {index + 1}
                      </Text>
                      <Button
                        mode="text"
                        onPress={() => removeImage(index)}
                        textColor={theme.colors.error}
                        compact
                      >
                        Remove
                      </Button>
                    </View>
                  </Surface>
                ))}
              </View>
            )}
          </View>
        );

      case 4:
        return (
          <View style={styles.stepContent}>
            <Text variant="headlineSmall" style={styles.stepTitle}>
              Review & Submit
            </Text>
            
            <Card style={styles.reviewCard}>
              <Card.Content>
                <Text variant="titleMedium" style={styles.reviewTitle}>
                  {formData.title}
                </Text>
                
                <View style={styles.reviewSection}>
                  <Text variant="labelLarge" style={styles.reviewLabel}>
                    Problem:
                  </Text>
                  <Text variant="bodyMedium">{formData.problem}</Text>
                </View>
                
                <View style={styles.reviewSection}>
                  <Text variant="labelLarge" style={styles.reviewLabel}>
                    Solution:
                  </Text>
                  <Text variant="bodyMedium">{formData.improvement}</Text>
                </View>
                
                <View style={styles.reviewSection}>
                  <Text variant="labelLarge" style={styles.reviewLabel}>
                    Benefit Categories:
                  </Text>
                  <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
                    {(formData.benefits || []).map((b) => (
                      <Chip key={b} mode="outlined" style={styles.benefitChip}>
                        {BENEFIT_OPTIONS.find(opt => opt.value === b)?.label || b}
                      </Chip>
                    ))}
                  </View>
                </View>
                
                {formData.benefits.includes('others') && formData.othersDescription && (
                  <View style={styles.reviewSection}>
                    <Text variant="labelLarge" style={styles.reviewLabel}>
                      Others Description:
                    </Text>
                    <Text variant="bodyMedium">{formData.othersDescription}</Text>
                  </View>
                )}
                
                {formData.estimatedSavings && (
                  <View style={styles.reviewSection}>
                    <Text variant="labelLarge" style={styles.reviewLabel}>
                      Estimated Savings:
                    </Text>
                    <Text variant="bodyMedium">${formData.estimatedSavings}</Text>
                  </View>
                )}
                
                <View style={styles.reviewSection}>
                  <Text variant="labelLarge" style={styles.reviewLabel}>
                    Images:
                  </Text>
                  <Text variant="bodyMedium">
                    {formData.images.length} image(s) attached
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} key={`form-reset-${resetCounter}`}>
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text variant="headlineMedium" style={styles.headerTitle}>
            Submit Idea
          </Text>
          <Button
            mode="text"
            onPress={() => {
              // Only show confirmation if form has data
              const hasData = formData.title || formData.problem || formData.improvement || formData.benefit || formData.estimatedSavings || formData.images.length > 0;
              
              if (hasData) {
                Alert.alert(
                  'Start New Idea',
                  'Are you sure you want to start a new idea? All current data will be lost.',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { text: 'Start New', onPress: resetForm }
                  ]
                );
              } else {
                resetForm();
              }
            }}
            icon="plus"
            compact
            textColor={formData.title || formData.problem || formData.improvement || formData.benefit || formData.estimatedSavings || formData.images.length > 0 ? theme.colors.primary : theme.colors.onSurfaceVariant}
          >
            {formData.title || formData.problem || formData.improvement || formData.benefit || formData.estimatedSavings || formData.images.length > 0 ? 'New Idea' : 'Clear Form'}
          </Button>
        </View>
        <ProgressBar 
          progress={(currentStep + 1) / STEPS.length} 
          style={styles.progressBar}
        />
        <Text variant="bodySmall" style={styles.stepIndicator}>
          Step {currentStep + 1} of {STEPS.length}: {STEPS[currentStep]}
        </Text>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContainer, { paddingBottom: 100 }]}>
        <Animated.View style={{ transform: [{ translateX: slideAnim }] }}>
          {contentVisible && renderStepContent()}
        </Animated.View>
      </ScrollView>

      <View style={styles.navigation}>
        <Button
          mode="outlined"
          onPress={prevStep}
          disabled={currentStep === 0}
          style={[styles.navButton, styles.prevButton]}
        >
          Previous
        </Button>
        
        {currentStep === STEPS.length - 1 ? (
          <Button
            mode="contained"
            onPress={handleSubmit}
            loading={loading}
            disabled={loading}
            style={[styles.navButton, styles.submitButton]}
          >
            Submit Idea
          </Button>
        ) : (
          <Button
            mode="contained"
            onPress={nextStep}
            style={[styles.navButton, styles.nextButton]}
          >
            Next
          </Button>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    padding: spacing.lg,
    backgroundColor: theme.colors.surface,
    elevation: 2,
  },
  headerTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: theme.colors.onSurface,
  },
  progressBar: {
    marginBottom: spacing.sm,
    height: 6,
  },
  stepIndicator: {
    color: theme.colors.onSurfaceVariant,
  },
  content: {
    flex: 1,
  },
  stepContent: {
    padding: spacing.lg,
  },
  stepTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.lg,
    color: theme.colors.onSurface,
  },
  sectionSubtitle: {
    marginBottom: spacing.md,
    color: theme.colors.onSurfaceVariant,
  },
  input: {
    marginBottom: spacing.md,
    backgroundColor: "#fff",
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  radioLabel: {
    marginLeft: spacing.sm,
  },
  othersContainer: {
    marginTop: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    backgroundColor: theme.colors.surfaceVariant,
    borderRadius: theme.roundness,
  },
  imageButton: {
    marginBottom: spacing.md,
  },
  imageContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  imageItem: {
    flex: 1,
    minWidth: 120,
    maxWidth: '45%',
    aspectRatio: 1,
    elevation: 2,
    borderRadius: theme.roundness,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  imagePreview: {
    width: '100%',
    flex: 1,
  },
  imageActions: {
    padding: spacing.sm,
    backgroundColor: 'rgba(0,0,0,0.4)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  imageText: {
    color: 'white',
    flex: 1,
  },
  reviewCard: {
    elevation: 2,
  },
  reviewTitle: {
    fontWeight: 'bold',
    marginBottom: spacing.md,
    color: theme.colors.primary,
  },
  reviewSection: {
    marginBottom: spacing.md,
  },
  reviewLabel: {
    marginBottom: spacing.xs,
    color: theme.colors.primary,
  },
  benefitChip: {
    alignSelf: 'flex-start',
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.lg,
    marginBottom: 100,
  },
  navButton: {
    flex: 1,
  },
  prevButton: {
    // Additional styles if needed
  },
  nextButton: {
    // Additional styles if needed
  },
  submitButton: {
    // Additional styles if needed
  },
});