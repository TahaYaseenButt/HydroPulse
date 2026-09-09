import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Keyboard,
  Animated,
  Platform,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { COLORS, FONTS } from '../constants/theme';
import {
  unifiedLoginAccount,
  registerParentAccount,
  registerChildAccount,
} from '../services/firebaseService';

export const AuthScreen = ({ onLoginSuccess }) => {
  // Main Tab: 'login' | 'register'
  const [tab, setTab] = useState('login');

  // Register sub-type: 'parent' | 'child'
  const [registerType, setRegisterType] = useState('parent');

  // Login Form Fields
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // Registration Wizard Step: 1 (Account) | 2 (Role) | 3 (Device Link)
  const [regStep, setRegStep] = useState(1);
  const [regUsername, setRegUsername] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regConfirmPassword, setRegConfirmPassword] = useState('');
  const [regDeviceId, setRegDeviceId] = useState('TANK-01');
  const [authParentUsername, setAuthParentUsername] = useState('');
  const [authParentPassword, setAuthParentPassword] = useState('');

  // Active Input Highlight Tracking
  const [focusedField, setFocusedField] = useState(null);

  // Native Mobile Keyboard Input Navigation Refs
  const loginPasswordRef = useRef(null);
  const regPasswordRef = useRef(null);
  const regConfirmPasswordRef = useRef(null);
  const authParentUserRef = useRef(null);
  const authParentPassRef = useRef(null);

  // Dynamic Mobile Keyboard Extension & Field Auto-Scroll
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const currentFocusedFieldRef = useRef(null);
  const scrollViewRef = useRef(null);
  const cardLayoutY = useRef(0);
  const fieldLayoutY = useRef({});

  // UI States
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ================= ANIMATIONS =================
  // 1. Water Halo Pulsing Ripple (breathing wave effect)
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const pulseOpacity = useRef(new Animated.Value(0.18)).current;

  // 2. Floating Ambient Glow Orbs
  const orbFloatAnim = useRef(new Animated.Value(0)).current;

  // 3. Card Entrance & Tab Switch Motion
  const cardFadeAnim = useRef(new Animated.Value(0)).current;
  const cardSlideAnim = useRef(new Animated.Value(18)).current;

  // 4. CTA Button Press Elastic Spring
  const btnScaleAnim = useRef(new Animated.Value(1)).current;

  // 5. Registration Wizard Step Transition
  const stepSlideAnim = useRef(new Animated.Value(0)).current;
  const stepFadeAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const showSub = Keyboard.addListener(showEvent, (e) => {
      const kbH = e.endCoordinates ? e.endCoordinates.height : 280;
      setKeyboardHeight(kbH);
      if (currentFocusedFieldRef.current) {
        scrollToField(currentFocusedFieldRef.current);
      }
    });

    const hideSub = Keyboard.addListener(hideEvent, () => {
      setKeyboardHeight(0);
      scrollViewRef.current?.scrollTo({ y: 0, animated: true });
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  const scrollToField = (fieldName) => {
    const fieldY = fieldLayoutY.current[fieldName] || 0;
    const cardY = cardLayoutY.current || 0;
    const targetY = Math.max(0, cardY + fieldY - 50);
    setTimeout(() => {
      scrollViewRef.current?.scrollTo({ y: targetY, animated: true });
    }, 60);
  };

  const handleFieldFocus = (fieldName) => {
    currentFocusedFieldRef.current = fieldName;
    setFocusedField(fieldName);
    if (keyboardHeight > 0) {
      scrollToField(fieldName);
    }
  };

  const handleFieldBlur = () => {
    if (currentFocusedFieldRef.current === focusedField) {
      currentFocusedFieldRef.current = null;
    }
    setFocusedField(null);
  };

  useEffect(() => {
    // A. Pulsing water ripple on logo
    Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1.25,
            duration: 2200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.05,
            duration: 2200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseOpacity, {
            toValue: 0.22,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ])
    ).start();

    // B. Floating ambient orbs
    Animated.loop(
      Animated.sequence([
        Animated.timing(orbFloatAnim, {
          toValue: 10,
          duration: 3200,
          useNativeDriver: true,
        }),
        Animated.timing(orbFloatAnim, {
          toValue: -10,
          duration: 3200,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // C. Initial Card Entrance
    Animated.parallel([
      Animated.timing(cardFadeAnim, {
        toValue: 1,
        duration: 450,
        useNativeDriver: true,
      }),
      Animated.spring(cardSlideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  // Smooth Tab Switch with Animated Fade & Slide
  const handleTabSwitch = (newTab) => {
    if (tab === newTab) return;
    Keyboard.dismiss();
    cardFadeAnim.setValue(0.6);
    cardSlideAnim.setValue(10);
    setTab(newTab);
    if (newTab === 'register') {
      setRegStep(1);
    }
    Animated.parallel([
      Animated.timing(cardFadeAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.spring(cardSlideAnim, {
        toValue: 0,
        friction: 9,
        tension: 65,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Button Press Feedback
  const handlePressIn = () => {
    Animated.spring(btnScaleAnim, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(btnScaleAnim, {
      toValue: 1,
      friction: 4,
      useNativeDriver: true,
    }).start();
  };

  // 1. Sign In (Only Username & Password required)
  const handleLogin = async () => {
    Keyboard.dismiss();
    if (!loginUsername.trim()) {
      Alert.alert('Required', 'Please enter your Username or Email.');
      return;
    }
    if (!loginPassword) {
      Alert.alert('Required', 'Please enter your Password.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await unifiedLoginAccount({
        username: loginUsername.trim(),
        password: loginPassword,
      });

      if (res.success) {
        onLoginSuccess(res.user);
      } else {
        Alert.alert('Sign In Failed', res.error || 'Invalid username or password.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'An error occurred during sign in.');
    } finally {
      setIsLoading(false);
    }
  };

  // Registration Wizard Navigation
  const goToStep = (nextStep, direction = 'forward') => {
    Keyboard.dismiss();
    stepFadeAnim.setValue(0);
    stepSlideAnim.setValue(direction === 'forward' ? 20 : -20);
    setRegStep(nextStep);
    Animated.parallel([
      Animated.timing(stepFadeAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.spring(stepSlideAnim, {
        toValue: 0,
        friction: 8,
        tension: 60,
        useNativeDriver: true,
      }),
    ]).start();
  };

  // Step 1 -> Step 2 Validation
  const handleStep1Next = () => {
    Keyboard.dismiss();
    if (!regUsername.trim()) {
      Alert.alert('Required', 'Please choose a username.');
      return;
    }
    if (!regPassword || regPassword.length < 4) {
      Alert.alert('Password Too Short', 'Password must be at least 4 characters.');
      return;
    }
    if (regPassword !== regConfirmPassword) {
      Alert.alert('Mismatch', 'Passwords do not match.');
      return;
    }
    goToStep(2, 'forward');
  };

  // Step 2 -> Step 3
  const handleStep2Next = () => {
    Keyboard.dismiss();
    goToStep(3, 'forward');
  };

  // Step 3 Final Submission
  const handleCompleteRegistration = async () => {
    Keyboard.dismiss();
    if (!regDeviceId.trim()) {
      Alert.alert('Required', 'Please enter your Tank Device ID (e.g. TANK-01).');
      return;
    }

    if (registerType === 'child') {
      if (!authParentUsername.trim()) {
        Alert.alert('Parent Authorization', 'Enter the registered Parent Username for this tank.');
        return;
      }
      if (!authParentPassword) {
        Alert.alert('Parent Authorization', 'Enter the Parent Password to authorize this child account.');
        return;
      }
    }

    setIsLoading(true);
    try {
      if (registerType === 'parent') {
        const res = await registerParentAccount({
          deviceId: regDeviceId.trim(),
          username: regUsername.trim(),
          password: regPassword,
          displayName: regUsername.trim(),
        });

        if (res.success) {
          Alert.alert('Registered', `Tank "${regDeviceId.toUpperCase()}" registered successfully.`);
          onLoginSuccess(res.user);
        } else {
          Alert.alert('Registration Failed', res.error || 'Could not register tank.');
        }
      } else {
        const res = await registerChildAccount({
          deviceId: regDeviceId.trim(),
          childUsername: regUsername.trim(),
          childPassword: regPassword,
          parentUsername: authParentUsername.trim(),
          parentPassword: authParentPassword,
          displayName: regUsername.trim(),
        });

        if (res.success) {
          Alert.alert('Linked', 'Child account created and linked to tank.');
          onLoginSuccess(res.user);
        } else {
          Alert.alert('Linking Failed', res.error || 'Parent authorization failed.');
        }
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'An error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Floating Animated Ambient Water-Glow Orbs */}
      <Animated.View
        style={[
          styles.ambientOrb1,
          { transform: [{ translateY: orbFloatAnim }] },
        ]}
        pointerEvents="none"
      />
      <Animated.View
        style={[
          styles.ambientOrb2,
          { transform: [{ translateY: Animated.multiply(orbFloatAnim, -1) }] },
        ]}
        pointerEvents="none"
      />
      <View style={styles.ambientOrb3} pointerEvents="none" />

      <ScrollView
        ref={scrollViewRef}
        contentContainerStyle={[
          styles.scrollContent,
          keyboardHeight > 0
            ? { justifyContent: 'flex-start', paddingTop: 16, paddingBottom: keyboardHeight + 80 }
            : { justifyContent: 'center', paddingVertical: 28 },
        ]}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        showsVerticalScrollIndicator={false}
      >
        {/* Brand Hero Header with Living Ripple Pulse */}
        <View style={styles.brandHero}>
          <View style={styles.logoWrapper}>
            {/* Pulsing Ripple Halo */}
            <Animated.View
              style={[
                styles.logoRippleHalo,
                {
                  transform: [{ scale: pulseAnim }],
                  opacity: pulseOpacity,
                },
              ]}
            />
            <View style={styles.logoOuterHalo}>
              <View style={styles.logoInner}>
                <MaterialCommunityIcons name="water" size={30} color={COLORS.white} />
              </View>
            </View>
          </View>

          <Text style={styles.brandTitle}>
            Hydro<Text style={styles.brandAccent}>Pulse</Text>
          </Text>

          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>Water Monitor</Text>
          </View>
        </View>

        {/* Animated Floating Glassmorphic Auth Card */}
        <Animated.View
          onLayout={(e) => {
            cardLayoutY.current = e.nativeEvent.layout.y;
          }}
          style={[
            styles.card,
            {
              opacity: cardFadeAnim,
              transform: [{ translateY: cardSlideAnim }],
            },
          ]}
        >
          {/* Segmented Pill Tab Bar (Sign In vs Register) */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, tab === 'login' && styles.tabItemActive]}
              onPress={() => handleTabSwitch('login')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="login-variant"
                size={15}
                color={tab === 'login' ? COLORS.primary : '#64748b'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabLabel, tab === 'login' && styles.tabLabelActive]}>
                Sign In
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, tab === 'register' && styles.tabItemActive]}
              onPress={() => handleTabSwitch('register')}
              activeOpacity={0.8}
            >
              <MaterialCommunityIcons
                name="account-plus-outline"
                size={15}
                color={tab === 'register' ? COLORS.primary : '#64748b'}
                style={{ marginRight: 6 }}
              />
              <Text style={[styles.tabLabel, tab === 'register' && styles.tabLabelActive]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* ================= TAB 1: SIGN IN ================= */}
          {tab === 'login' && (
            <View style={styles.formBody}>
              {/* Username or Email */}
              <View
                style={styles.fieldGroup}
                onLayout={(e) => {
                  fieldLayoutY.current['loginUser'] = e.nativeEvent.layout.y;
                }}
              >
                <Text style={styles.fieldLabel}>USERNAME OR EMAIL</Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === 'loginUser' && styles.inputContainerFocused,
                  ]}
                >
                  <View style={styles.inputIconBadge}>
                    <MaterialCommunityIcons
                      name="account-outline"
                      size={18}
                      color={focusedField === 'loginUser' ? COLORS.primary : '#64748b'}
                    />
                  </View>
                  <TextInput
                    style={styles.inputField}
                    value={loginUsername}
                    onChangeText={setLoginUsername}
                    placeholder="Enter your username"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    onSubmitEditing={() => loginPasswordRef.current?.focus()}
                    onFocus={() => handleFieldFocus('loginUser')}
                    onBlur={handleFieldBlur}
                  />
                </View>
              </View>

              {/* Password */}
              <View
                style={styles.fieldGroup}
                onLayout={(e) => {
                  fieldLayoutY.current['loginPass'] = e.nativeEvent.layout.y;
                }}
              >
                <Text style={styles.fieldLabel}>PASSWORD</Text>
                <View
                  style={[
                    styles.inputContainer,
                    focusedField === 'loginPass' && styles.inputContainerFocused,
                  ]}
                >
                  <View style={styles.inputIconBadge}>
                    <MaterialCommunityIcons
                      name="lock-outline"
                      size={18}
                      color={focusedField === 'loginPass' ? COLORS.primary : '#64748b'}
                    />
                  </View>
                  <TextInput
                    ref={loginPasswordRef}
                    style={styles.inputField}
                    value={loginPassword}
                    onChangeText={setLoginPassword}
                    placeholder="Enter your password"
                    placeholderTextColor="#94a3b8"
                    autoCapitalize="none"
                    autoCorrect={false}
                    secureTextEntry={!showPassword}
                    returnKeyType="done"
                    onSubmitEditing={handleLogin}
                    onFocus={() => handleFieldFocus('loginPass')}
                    onBlur={handleFieldBlur}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeToggle}
                    hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                  >
                    <MaterialCommunityIcons
                      name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                      size={18}
                      color="#64748b"
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Primary Action Button with Spring Feedback */}
              <Animated.View style={{ transform: [{ scale: btnScaleAnim }] }}>
                <TouchableOpacity
                  style={styles.primaryActionButton}
                  onPress={handleLogin}
                  onPressIn={handlePressIn}
                  onPressOut={handlePressOut}
                  disabled={isLoading}
                  activeOpacity={0.9}
                >
                  {isLoading ? (
                    <ActivityIndicator color={COLORS.white} size="small" />
                  ) : (
                    <View style={styles.actionButtonInner}>
                      <Text style={styles.actionButtonText}>Sign In</Text>
                      <MaterialCommunityIcons name="arrow-right" size={18} color={COLORS.white} />
                    </View>
                  )}
                </TouchableOpacity>
              </Animated.View>

              {/* Minimal Footer Switch Link */}
              <View style={styles.footerSwitchRow}>
                <Text style={styles.footerPrompt}>Don't have an account?</Text>
                <TouchableOpacity onPress={() => handleTabSwitch('register')}>
                  <Text style={styles.footerLinkBold}> Register</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ================= TAB 2: REGISTER (3-Step Guided Flow) ================= */}
          {tab === 'register' && (
            <View style={styles.formBody}>
              {/* Step Progress Pill & Breadcrumb Header */}
              <View style={styles.wizardHeader}>
                <View style={styles.stepIndicatorRow}>
                  {/* Step 1 Bubble */}
                  <View style={[styles.stepBubble, regStep >= 1 && styles.stepBubbleActive]}>
                    <Text style={[styles.stepBubbleText, regStep >= 1 && styles.stepBubbleTextActive]}>
                      1
                    </Text>
                  </View>
                  <View style={[styles.stepLine, regStep >= 2 && styles.stepLineActive]} />
                  {/* Step 2 Bubble */}
                  <View style={[styles.stepBubble, regStep >= 2 && styles.stepBubbleActive]}>
                    <Text style={[styles.stepBubbleText, regStep >= 2 && styles.stepBubbleTextActive]}>
                      2
                    </Text>
                  </View>
                  <View style={[styles.stepLine, regStep >= 3 && styles.stepLineActive]} />
                  {/* Step 3 Bubble */}
                  <View style={[styles.stepBubble, regStep >= 3 && styles.stepBubbleActive]}>
                    <Text style={[styles.stepBubbleText, regStep >= 3 && styles.stepBubbleTextActive]}>
                      3
                    </Text>
                  </View>
                </View>

                <View style={styles.stepTitleWrap}>
                  <Text style={styles.stepTrackerPill}>
                    {regStep === 1 && 'STEP 1 OF 3'}
                    {regStep === 2 && 'STEP 2 OF 3'}
                    {regStep === 3 && 'STEP 3 OF 3'}
                  </Text>
                  <Text style={styles.stepHeadline}>
                    {regStep === 1 && 'Create Account'}
                    {regStep === 2 && 'Select Role'}
                    {regStep === 3 && 'Link Tank'}
                  </Text>
                </View>
              </View>

              {/* Animated Step View */}
              <Animated.View
                style={{
                  opacity: stepFadeAnim,
                  transform: [{ translateX: stepSlideAnim }],
                }}
              >
                {/* ---------------- STEP 1: USERNAME & PASSWORD ---------------- */}
                {regStep === 1 && (
                  <View style={styles.stepContainer}>
                    {/* Username */}
                    <View
                      style={styles.fieldGroup}
                      onLayout={(e) => {
                        fieldLayoutY.current['regUser'] = e.nativeEvent.layout.y;
                      }}
                    >
                      <Text style={styles.fieldLabel}>USERNAME</Text>
                      <View
                        style={[
                          styles.inputContainer,
                          focusedField === 'regUser' && styles.inputContainerFocused,
                        ]}
                      >
                        <View style={styles.inputIconBadge}>
                          <MaterialCommunityIcons
                            name="account-outline"
                            size={18}
                            color={focusedField === 'regUser' ? COLORS.primary : '#64748b'}
                          />
                        </View>
                        <TextInput
                          style={styles.inputField}
                          value={regUsername}
                          onChangeText={setRegUsername}
                          placeholder="Choose username"
                          placeholderTextColor="#94a3b8"
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                          onSubmitEditing={() => regPasswordRef.current?.focus()}
                          onFocus={() => handleFieldFocus('regUser')}
                          onBlur={handleFieldBlur}
                        />
                      </View>
                    </View>

                    {/* Password */}
                    <View
                      style={styles.fieldGroup}
                      onLayout={(e) => {
                        fieldLayoutY.current['regPass'] = e.nativeEvent.layout.y;
                      }}
                    >
                      <Text style={styles.fieldLabel}>PASSWORD</Text>
                      <View
                        style={[
                          styles.inputContainer,
                          focusedField === 'regPass' && styles.inputContainerFocused,
                        ]}
                      >
                        <View style={styles.inputIconBadge}>
                          <MaterialCommunityIcons
                            name="lock-outline"
                            size={18}
                            color={focusedField === 'regPass' ? COLORS.primary : '#64748b'}
                          />
                        </View>
                        <TextInput
                          ref={regPasswordRef}
                          style={styles.inputField}
                          value={regPassword}
                          onChangeText={setRegPassword}
                          placeholder="Create password"
                          placeholderTextColor="#94a3b8"
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="next"
                          onSubmitEditing={() => regConfirmPasswordRef.current?.focus()}
                          onFocus={() => handleFieldFocus('regPass')}
                          onBlur={handleFieldBlur}
                        />
                        <TouchableOpacity
                          onPress={() => setShowPassword(!showPassword)}
                          style={styles.eyeToggle}
                          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                          <MaterialCommunityIcons
                            name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                            size={18}
                            color="#64748b"
                          />
                        </TouchableOpacity>
                      </View>
                    </View>

                    {/* Confirm Password */}
                    <View
                      style={styles.fieldGroup}
                      onLayout={(e) => {
                        fieldLayoutY.current['regConfirm'] = e.nativeEvent.layout.y;
                      }}
                    >
                      <Text style={styles.fieldLabel}>CONFIRM PASSWORD</Text>
                      <View
                        style={[
                          styles.inputContainer,
                          focusedField === 'regConfirm' && styles.inputContainerFocused,
                        ]}
                      >
                        <View style={styles.inputIconBadge}>
                          <MaterialCommunityIcons
                            name="lock-check-outline"
                            size={18}
                            color={focusedField === 'regConfirm' ? COLORS.primary : '#64748b'}
                          />
                        </View>
                        <TextInput
                          ref={regConfirmPasswordRef}
                          style={styles.inputField}
                          value={regConfirmPassword}
                          onChangeText={setRegConfirmPassword}
                          placeholder="Confirm password"
                          placeholderTextColor="#94a3b8"
                          secureTextEntry={!showPassword}
                          autoCapitalize="none"
                          autoCorrect={false}
                          returnKeyType="done"
                          onSubmitEditing={handleStep1Next}
                          onFocus={() => handleFieldFocus('regConfirm')}
                          onBlur={handleFieldBlur}
                        />
                      </View>
                    </View>

                    {/* Next Button */}
                    <TouchableOpacity
                      style={styles.primaryActionButton}
                      onPress={handleStep1Next}
                      activeOpacity={0.88}
                    >
                      <View style={styles.actionButtonInner}>
                        <Text style={styles.actionButtonText}>Next</Text>
                        <MaterialCommunityIcons name="arrow-right" size={18} color={COLORS.white} />
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {/* ---------------- STEP 2: ROLE SELECTION ---------------- */}
                {regStep === 2 && (
                  <View style={styles.stepContainer}>
                    {/* Role Option 1: Parent */}
                    <TouchableOpacity
                      style={[
                        styles.roleSelectBox,
                        registerType === 'parent' && styles.roleSelectBoxActive,
                      ]}
                      onPress={() => setRegisterType('parent')}
                      activeOpacity={0.85}
                    >
                      <View
                        style={[
                          styles.roleSelectIconCircle,
                          registerType === 'parent' && styles.roleSelectIconCircleActive,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="crown-outline"
                          size={24}
                          color={registerType === 'parent' ? COLORS.primary : '#64748b'}
                        />
                      </View>
                      <View style={styles.roleSelectTextCol}>
                        <View style={styles.roleSelectTitleRow}>
                          <Text
                            style={[
                              styles.roleSelectTitle,
                              registerType === 'parent' && styles.roleSelectTitleActive,
                            ]}
                          >
                            Parent
                          </Text>
                          <View style={styles.parentPill}>
                            <Text style={styles.parentPillText}>FULL CONTROL</Text>
                          </View>
                        </View>
                        <Text style={styles.roleSelectDesc}>
                          Full pump control & tank settings.
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.roleRadioCircle,
                          registerType === 'parent' && styles.roleRadioCircleActive,
                        ]}
                      >
                        {registerType === 'parent' && <View style={styles.roleRadioDot} />}
                      </View>
                    </TouchableOpacity>

                    {/* Role Option 2: Child */}
                    <TouchableOpacity
                      style={[
                        styles.roleSelectBox,
                        registerType === 'child' && styles.roleSelectBoxActive,
                      ]}
                      onPress={() => setRegisterType('child')}
                      activeOpacity={0.85}
                    >
                      <View
                        style={[
                          styles.roleSelectIconCircle,
                          registerType === 'child' && styles.roleSelectIconCircleActive,
                        ]}
                      >
                        <MaterialCommunityIcons
                          name="account-child-outline"
                          size={24}
                          color={registerType === 'child' ? COLORS.primary : '#64748b'}
                        />
                      </View>
                      <View style={styles.roleSelectTextCol}>
                        <View style={styles.roleSelectTitleRow}>
                          <Text
                            style={[
                              styles.roleSelectTitle,
                              registerType === 'child' && styles.roleSelectTitleActive,
                            ]}
                          >
                            Child
                          </Text>
                          <View style={styles.childPill}>
                            <Text style={styles.childPillText}>VIEW ONLY</Text>
                          </View>
                        </View>
                        <Text style={styles.roleSelectDesc}>
                          Monitor water levels only.
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.roleRadioCircle,
                          registerType === 'child' && styles.roleRadioCircleActive,
                        ]}
                      >
                        {registerType === 'child' && <View style={styles.roleRadioDot} />}
                      </View>
                    </TouchableOpacity>

                    {/* Wizard Buttons (Back & Next) */}
                    <View style={styles.wizardBtnRow}>
                      <TouchableOpacity
                        style={styles.wizardBackBtn}
                        onPress={() => goToStep(1, 'backward')}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="arrow-left" size={16} color="#475569" />
                        <Text style={styles.wizardBackBtnText}>Back</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.primaryActionButton, { flex: 1, marginTop: 0 }]}
                        onPress={handleStep2Next}
                        activeOpacity={0.88}
                      >
                        <View style={styles.actionButtonInner}>
                          <Text style={styles.actionButtonText}>Next</Text>
                          <MaterialCommunityIcons name="arrow-right" size={18} color={COLORS.white} />
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                )}

                {/* ---------------- STEP 3: TANK DEVICE LINK ---------------- */}
                {regStep === 3 && (
                  <View style={styles.stepContainer}>
                    {/* Device ID */}
                    <View
                      style={styles.fieldGroup}
                      onLayout={(e) => {
                        fieldLayoutY.current['regDevice'] = e.nativeEvent.layout.y;
                      }}
                    >
                      <Text style={styles.fieldLabel}>DEVICE ID</Text>
                      <View
                        style={[
                          styles.inputContainer,
                          focusedField === 'regDevice' && styles.inputContainerFocused,
                        ]}
                      >
                        <View style={styles.inputIconBadge}>
                          <MaterialCommunityIcons
                            name="chip"
                            size={18}
                            color={focusedField === 'regDevice' ? COLORS.primary : '#64748b'}
                          />
                        </View>
                        <TextInput
                          style={styles.inputField}
                          value={regDeviceId}
                          onChangeText={setRegDeviceId}
                          placeholder="e.g. TANK-01"
                          placeholderTextColor="#94a3b8"
                          autoCapitalize="characters"
                          autoCorrect={false}
                          returnKeyType={registerType === 'parent' ? 'done' : 'next'}
                          onSubmitEditing={registerType === 'parent' ? handleCompleteRegistration : () => authParentUserRef.current?.focus()}
                          onFocus={() => handleFieldFocus('regDevice')}
                          onBlur={handleFieldBlur}
                        />
                      </View>
                    </View>

                    {/* If Child: Ask for Parent Authorization */}
                    {registerType === 'child' && (
                      <>
                        <View style={styles.authNoticeCard}>
                          <MaterialCommunityIcons name="shield-lock-outline" size={18} color={COLORS.primary} />
                          <Text style={styles.authNoticeTitle}>Parent Authorization Required</Text>
                        </View>

                        {/* Parent Username */}
                        <View
                          style={styles.fieldGroup}
                          onLayout={(e) => {
                            fieldLayoutY.current['cParentUser'] = e.nativeEvent.layout.y;
                          }}
                        >
                          <Text style={styles.fieldLabel}>PARENT USERNAME</Text>
                          <View
                            style={[
                              styles.inputContainer,
                              focusedField === 'cParentUser' && styles.inputContainerFocused,
                            ]}
                          >
                            <View style={styles.inputIconBadge}>
                              <MaterialCommunityIcons
                                name="shield-account-outline"
                                size={18}
                                color={focusedField === 'cParentUser' ? COLORS.primary : '#64748b'}
                              />
                            </View>
                            <TextInput
                              ref={authParentUserRef}
                              style={styles.inputField}
                              value={authParentUsername}
                              onChangeText={setAuthParentUsername}
                              placeholder="Parent username"
                              placeholderTextColor="#94a3b8"
                              autoCapitalize="none"
                              autoCorrect={false}
                              returnKeyType="next"
                              onSubmitEditing={() => authParentPassRef.current?.focus()}
                              onFocus={() => handleFieldFocus('cParentUser')}
                              onBlur={handleFieldBlur}
                            />
                          </View>
                        </View>

                        {/* Parent Password */}
                        <View
                          style={styles.fieldGroup}
                          onLayout={(e) => {
                            fieldLayoutY.current['cParentPass'] = e.nativeEvent.layout.y;
                          }}
                        >
                          <Text style={styles.fieldLabel}>PARENT PASSWORD</Text>
                          <View
                            style={[
                              styles.inputContainer,
                              focusedField === 'cParentPass' && styles.inputContainerFocused,
                            ]}
                          >
                            <View style={styles.inputIconBadge}>
                              <MaterialCommunityIcons
                                name="key-outline"
                                size={18}
                                color={focusedField === 'cParentPass' ? COLORS.primary : '#64748b'}
                              />
                            </View>
                            <TextInput
                              ref={authParentPassRef}
                              style={styles.inputField}
                              value={authParentPassword}
                              onChangeText={setAuthParentPassword}
                              placeholder="Parent password"
                              placeholderTextColor="#94a3b8"
                              secureTextEntry
                              autoCapitalize="none"
                              autoCorrect={false}
                              returnKeyType="done"
                              onSubmitEditing={handleCompleteRegistration}
                              onFocus={() => handleFieldFocus('cParentPass')}
                              onBlur={handleFieldBlur}
                            />
                          </View>
                        </View>
                      </>
                    )}

                    {/* Wizard Buttons (Back & Complete) */}
                    <View style={styles.wizardBtnRow}>
                      <TouchableOpacity
                        style={styles.wizardBackBtn}
                        onPress={() => goToStep(2, 'backward')}
                        activeOpacity={0.8}
                      >
                        <MaterialCommunityIcons name="arrow-left" size={16} color="#475569" />
                        <Text style={styles.wizardBackBtnText}>Back</Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.primaryActionButton, { flex: 1, marginTop: 0 }]}
                        onPress={handleCompleteRegistration}
                        onPressIn={handlePressIn}
                        onPressOut={handlePressOut}
                        disabled={isLoading}
                        activeOpacity={0.9}
                      >
                        {isLoading ? (
                          <ActivityIndicator color={COLORS.white} size="small" />
                        ) : (
                          <View style={styles.actionButtonInner}>
                            <Text style={styles.actionButtonText}>
                              {registerType === 'parent' ? 'Register Tank' : 'Connect'}
                            </Text>
                            <MaterialCommunityIcons name="check" size={18} color={COLORS.white} />
                          </View>
                        )}
                      </TouchableOpacity>
                    </View>
                  </View>
                )}
              </Animated.View>

              {/* Footer Switch Link */}
              <View style={styles.footerSwitchRow}>
                <Text style={styles.footerPrompt}>Already have an account?</Text>
                <TouchableOpacity onPress={() => handleTabSwitch('login')}>
                  <Text style={styles.footerLinkBold}> Sign In</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </Animated.View>

        {/* Bottom Cloud & Security Badge */}
        <View style={styles.bottomSecurityBadge}>
          <MaterialCommunityIcons name="shield-check" size={13} color="#94a3b8" />
          <Text style={styles.bottomSecurityText}>
            Secured with Firebase IoT
          </Text>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    position: 'relative',
  },
  /* Subtle ambient background glow orbs for high-end depth */
  ambientOrb1: {
    position: 'absolute',
    top: -60,
    left: -60,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: '#dbeafe',
    opacity: 0.65,
  },
  ambientOrb2: {
    position: 'absolute',
    top: 70,
    right: -70,
    width: 230,
    height: 230,
    borderRadius: 115,
    backgroundColor: '#e0f2fe',
    opacity: 0.55,
  },
  ambientOrb3: {
    position: 'absolute',
    bottom: -80,
    left: 40,
    width: 260,
    height: 260,
    borderRadius: 130,
    backgroundColor: '#bae6fd',
    opacity: 0.35,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
  },
  brandHero: {
    alignItems: 'center',
    marginBottom: 18,
  },
  logoWrapper: {
    width: 76,
    height: 76,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  logoRippleHalo: {
    position: 'absolute',
    width: 76,
    height: 76,
    borderRadius: 38,
    backgroundColor: COLORS.primary,
  },
  logoOuterHalo: {
    width: 66,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1.5,
    borderColor: '#bae6fd',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.16,
    shadowRadius: 8,
    elevation: 3,
  },
  logoInner: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  brandTitle: {
    fontFamily: FONTS.bold,
    fontSize: 25,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: COLORS.primary,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 11,
    paddingVertical: 4,
    borderRadius: 20,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10b981',
    marginRight: 6,
  },
  statusText: {
    fontFamily: FONTS.semiBold,
    fontSize: 11,
    fontWeight: '600',
    color: '#0369a1',
    letterSpacing: 0.2,
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 22,
    paddingVertical: 22,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 18,
    elevation: 3,
    maxWidth: 420,
    width: '100%',
    alignSelf: 'center',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f1f5f9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 18,
  },
  tabItem: {
    flex: 1,
    flexDirection: 'row',
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 11,
  },
  tabItemActive: {
    backgroundColor: '#ffffff',
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  tabLabel: {
    fontFamily: FONTS.medium,
    fontSize: 13,
    fontWeight: '500',
    color: '#64748b',
  },
  tabLabelActive: {
    fontFamily: FONTS.bold,
    color: COLORS.primary,
    fontWeight: '700',
  },
  formBody: {
    gap: 14,
  },
  // 3-Step Wizard Styling
  wizardHeader: {
    paddingBottom: 6,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  stepBubble: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f1f5f9',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBubbleActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  stepBubbleText: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: '#94a3b8',
  },
  stepBubbleTextActive: {
    color: '#ffffff',
  },
  stepLine: {
    width: 38,
    height: 2,
    backgroundColor: '#e2e8f0',
    marginHorizontal: 6,
  },
  stepLineActive: {
    backgroundColor: COLORS.primary,
  },
  stepTitleWrap: {
    alignItems: 'center',
    marginBottom: 4,
  },
  stepTrackerPill: {
    fontFamily: FONTS.bold,
    fontSize: 10,
    color: COLORS.primary,
    letterSpacing: 0.8,
    marginBottom: 2,
  },
  stepHeadline: {
    fontFamily: FONTS.bold,
    fontSize: 16,
    color: '#0f172a',
    letterSpacing: -0.3,
  },
  stepContainer: {
    gap: 13,
  },
  roleSelectBox: {
    flexDirection: 'row',
    padding: 13,
    borderRadius: 16,
    backgroundColor: '#f8fafc',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    alignItems: 'center',
  },
  roleSelectBoxActive: {
    backgroundColor: '#f0f9ff',
    borderColor: COLORS.primary,
  },
  roleSelectIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  roleSelectIconCircleActive: {
    backgroundColor: '#e0f2fe',
  },
  roleSelectTextCol: {
    flex: 1,
    marginRight: 8,
  },
  roleSelectTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  roleSelectTitle: {
    fontFamily: FONTS.bold,
    fontSize: 13.5,
    color: '#1e293b',
  },
  roleSelectTitleActive: {
    color: COLORS.primary,
  },
  parentPill: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  parentPillText: {
    fontFamily: FONTS.bold,
    fontSize: 9,
    color: COLORS.primary,
    letterSpacing: 0.3,
  },
  childPill: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 5,
  },
  childPillText: {
    fontFamily: FONTS.bold,
    fontSize: 9,
    color: '#64748b',
    letterSpacing: 0.3,
  },
  roleSelectDesc: {
    fontFamily: FONTS.regular,
    fontSize: 11.5,
    color: '#64748b',
    lineHeight: 16,
  },
  roleRadioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#cbd5e1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleRadioCircleActive: {
    borderColor: COLORS.primary,
  },
  roleRadioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.primary,
  },
  wizardBtnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 4,
  },
  wizardBackBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 15,
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    backgroundColor: '#f8fafc',
  },
  wizardBackBtnText: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    color: '#475569',
    marginLeft: 4,
  },
  authNoticeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#f0f9ff',
    borderWidth: 1,
    borderColor: '#bae6fd',
  },
  authNoticeTitle: {
    fontFamily: FONTS.bold,
    fontSize: 12,
    color: COLORS.primary,
  },
  authNoticeDesc: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: '#0369a1',
    marginTop: 2,
    lineHeight: 15,
  },
  fieldHelpText: {
    fontFamily: FONTS.regular,
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 4,
  },
  fieldGroup: {
    gap: 5,
  },
  fieldLabel: {
    fontFamily: FONTS.bold,
    fontSize: 11,
    fontWeight: '700',
    color: '#475569',
    letterSpacing: 0.5,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e2e8f0',
    borderRadius: 14,
    backgroundColor: '#f8fafc',
    height: 48,
    paddingHorizontal: 12,
  },
  inputContainerFocused: {
    borderColor: COLORS.primary,
    backgroundColor: '#f0f9ff',
  },
  inputIconBadge: {
    marginRight: 10,
  },
  inputField: {
    flex: 1,
    fontFamily: FONTS.medium,
    fontSize: 14,
    color: '#0f172a',
    height: '100%',
  },
  eyeToggle: {
    padding: 6,
  },
  subtleSeparator: {
    height: 1,
    backgroundColor: '#f1f5f9',
    marginVertical: 2,
  },
  primaryActionButton: {
    backgroundColor: COLORS.primary,
    borderRadius: 15,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 5,
  },
  actionButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButtonText: {
    fontFamily: FONTS.bold,
    color: COLORS.white,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.2,
  },
  footerSwitchRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 6,
  },
  footerPrompt: {
    fontFamily: FONTS.regular,
    fontSize: 13,
    color: '#64748b',
  },
  footerLinkBold: {
    fontFamily: FONTS.bold,
    fontSize: 13,
    fontWeight: '700',
    color: COLORS.primary,
  },
  bottomSecurityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  bottomSecurityText: {
    fontFamily: FONTS.medium,
    fontSize: 11,
    color: '#94a3b8',
    fontWeight: '500',
  },
});
