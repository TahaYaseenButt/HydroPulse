import AsyncStorage from '@react-native-async-storage/async-storage';
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getDatabase,
  ref,
  set,
  get,
  update,
  onValue,
  off,
} from 'firebase/database';
import {
  getAuth,
  initializeAuth,
  getReactNativePersistence,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from 'firebase/auth';

const STORAGE_KEY_FIREBASE_CONFIG = '@hydropulse_firebase_config_v1';
const STORAGE_KEY_AUTH_USER = '@hydropulse_auth_user_v1';

// Firebase Configuration sourced from environment variables (.env)
export const DEFAULT_FIREBASE_CONFIG = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || '',
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || 'hydroplus-cc36a.firebaseapp.com',
  databaseURL: process.env.EXPO_PUBLIC_FIREBASE_DATABASE_URL || 'https://hydroplus-cc36a-default-rtdb.firebaseio.com',
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || 'hydroplus-cc36a',
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || 'hydroplus-cc36a.firebasestorage.app',
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || '880753722431',
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || '1:880753722431:android:60378b3c57cd272324a48a',
  enabled: true,
};

// Preset demo accounts for instant Parent/Child role testing
export const PRESET_ACCOUNTS = {
  parent: {
    uid: 'parent_user_001',
    email: 'parent@hydropulse.io',
    displayName: 'Parent / Manager',
    role: 'parent',
    canControlMotor: true,
    canEditSettings: true,
  },
  child: {
    uid: 'child_user_002',
    email: 'child@hydropulse.io',
    displayName: 'Child / Family Member',
    role: 'child',
    canControlMotor: false,
    canEditSettings: false,
  },
};

let firebaseApp = null;
let realtimeDb = null;
let firebaseAuth = null;
let isFirebaseReady = false;
let dbListeners = [];

/**
 * Initialize Firebase with saved or default configuration.
 * Gracefully catches network or invalid key errors so app never crashes.
 */
export const initFirebase = async () => {
  try {
    const savedConfigRaw = await AsyncStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    let config = savedConfigRaw ? JSON.parse(savedConfigRaw) : DEFAULT_FIREBASE_CONFIG;

    // Migrate old demo URL if present in local AsyncStorage
    if (!config || !config.databaseURL || config.databaseURL.includes('hydropulse-tank-default-rtdb')) {
      config = { ...DEFAULT_FIREBASE_CONFIG };
      await AsyncStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(DEFAULT_FIREBASE_CONFIG));
    }

    if (!config.enabled) {
      isFirebaseReady = false;
      return { success: false, reason: 'Firebase disabled in settings' };
    }

    if (!getApps().length) {
      firebaseApp = initializeApp(config);
    } else {
      firebaseApp = getApp();
    }

    try {
      realtimeDb = getDatabase(firebaseApp);

      // Initialize Firebase Auth with AsyncStorage persistence to avoid React Native warning
      if (!firebaseAuth) {
        if (typeof getReactNativePersistence === 'function') {
          try {
            firebaseAuth = initializeAuth(firebaseApp, {
              persistence: getReactNativePersistence(AsyncStorage),
            });
          } catch (initErr) {
            firebaseAuth = getAuth(firebaseApp);
          }
        } else {
          firebaseAuth = getAuth(firebaseApp);
        }
      }

      isFirebaseReady = true;
      return { success: true, app: firebaseApp };
    } catch (e) {
      console.warn('[Firebase] DB/Auth init warning (using offline/demo mode):', e.message);
      isFirebaseReady = true;
      return { success: true, warning: e.message };
    }
  } catch (err) {
    console.warn('[Firebase] Init failed, falling back to local simulated state:', err.message);
    isFirebaseReady = false;
    return { success: false, error: err.message };
  }
};

/**
 * Register a new Device ID with a Parent Account (Tank Owner)
 */
export const registerParentAccount = async ({ deviceId, username, email, password, displayName }) => {
  const cleanDeviceId = (deviceId || 'TANK-01').trim().toUpperCase().replace(/[.#$\[\]]/g, '_');
  const cleanUsername = (username || email || 'parent').trim().toLowerCase().replace(/[.#$\[\]]/g, '_');
  const cleanEmail = (email || username || 'parent@hydropulse.io').trim().toLowerCase();
  const cleanName = displayName ? displayName.trim() : 'Parent';

  const userPayload = {
    uid: `parent_${cleanDeviceId}_${cleanUsername}`,
    username: cleanUsername,
    email: cleanEmail,
    displayName: cleanName,
    role: 'parent',
    deviceId: cleanDeviceId,
    canControlMotor: true,
    canEditSettings: true,
    registeredAt: new Date().toISOString(),
  };

  // 1. Save to Firebase Realtime Database (both /users and /devices)
  if (isFirebaseReady && realtimeDb) {
    try {
      const deviceParentRef = ref(realtimeDb, `devices/${cleanDeviceId}/parent`);
      const snapshot = await get(deviceParentRef);

      if (snapshot.exists()) {
        const existing = snapshot.val();
        const existingUser = (existing.username || existing.email || '').toLowerCase();
        if (existingUser && existingUser !== cleanUsername) {
          return {
            success: false,
            error: `Tank "${cleanDeviceId}" is already registered by another parent account (${existingUser}).`,
          };
        }
      }

      // Save parent under device
      await set(deviceParentRef, {
        username: cleanUsername,
        email: cleanEmail,
        password: password,
        displayName: cleanName,
        role: 'parent',
        registeredAt: new Date().toISOString(),
      });

      // Also set device metadata
      await update(ref(realtimeDb, `devices/${cleanDeviceId}`), {
        deviceId: cleanDeviceId,
        lastActive: new Date().toISOString(),
      });

      // Save under global /users lookup so user can log in with username/password only
      await set(ref(realtimeDb, `users/${cleanUsername}`), {
        username: cleanUsername,
        email: cleanEmail,
        password: password,
        displayName: cleanName,
        role: 'parent',
        deviceId: cleanDeviceId,
        registeredAt: new Date().toISOString(),
      });
    } catch (e) {
      console.warn('[Firebase RTDB] Parent registration error:', e.message);
    }
  }

  // 2. Persist active user locally
  await AsyncStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(userPayload));

  // 3. Cache credentials locally for offline support
  try {
    const localUsersRaw = (await AsyncStorage.getItem('@hydropulse_users')) || '{}';
    const localUsers = JSON.parse(localUsersRaw);
    localUsers[cleanUsername] = {
      username: cleanUsername,
      password: password,
      role: 'parent',
      deviceId: cleanDeviceId,
      displayName: cleanName,
    };
    await AsyncStorage.setItem('@hydropulse_users', JSON.stringify(localUsers));

    const localDevicesRaw = (await AsyncStorage.getItem('@hydropulse_local_devices')) || '{}';
    const localDevices = JSON.parse(localDevicesRaw);
    localDevices[cleanDeviceId] = {
      ...localDevices[cleanDeviceId],
      parent: {
        username: cleanUsername,
        email: cleanEmail,
        password: password,
        displayName: cleanName,
      },
    };
    await AsyncStorage.setItem('@hydropulse_local_devices', JSON.stringify(localDevices));
  } catch (err) {}

  return { success: true, user: userPayload };
};

/**
 * Register a new Child Account linked to a Parent Device
 * (Requires Device ID, Parent Username/Email, and Parent Password to authorize)
 */
export const registerChildAccount = async ({
  deviceId,
  childUsername,
  childPassword,
  parentUsername,
  parentPassword,
  displayName,
}) => {
  const cleanDeviceId = (deviceId || 'TANK-01').trim().toUpperCase().replace(/[.#$\[\]]/g, '_');
  const cleanChildUser = childUsername.trim().toLowerCase().replace(/[.#$\[\]]/g, '_');
  const cleanParentUser = parentUsername.trim().toLowerCase().replace(/[.#$\[\]]/g, '_');
  const cleanName = displayName ? displayName.trim() : cleanChildUser;

  let verifiedParent = null;

  // 1. Verify Parent on Firebase RTDB
  if (isFirebaseReady && realtimeDb) {
    try {
      const parentRef = ref(realtimeDb, `devices/${cleanDeviceId}/parent`);
      const snapshot = await get(parentRef);

      if (snapshot.exists()) {
        const parentData = snapshot.val();
        const pUser = (parentData.username || parentData.email || '').toLowerCase();
        const pEmail = (parentData.email || '').toLowerCase();

        if ((pUser === cleanParentUser || pEmail === cleanParentUser) && parentData.password === parentPassword) {
          verifiedParent = parentData;
        } else {
          return {
            success: false,
            error: 'Parent authorization failed. Incorrect Parent username or password for this tank.',
          };
        }
      } else {
        return {
          success: false,
          error: `Tank "${cleanDeviceId}" is not registered. A Parent must register this tank first.`,
        };
      }
    } catch (e) {
      console.warn('[Firebase RTDB] Child registration verification fallback:', e.message);
    }
  }

  // 2. Offline / Local fallback
  if (!verifiedParent) {
    try {
      const localUsersRaw = (await AsyncStorage.getItem('@hydropulse_users')) || '{}';
      const localUsers = JSON.parse(localUsersRaw);
      if (localUsers[cleanParentUser] && localUsers[cleanParentUser].password === parentPassword) {
        verifiedParent = localUsers[cleanParentUser];
      }
    } catch (e) {}
  }

  // Fallback for default demo tank
  if (!verifiedParent) {
    if ((cleanParentUser === 'parent' || cleanParentUser === 'parent@hydropulse.io') && parentPassword === 'parent123') {
      verifiedParent = { username: cleanParentUser, displayName: 'Parent' };
    } else {
      return {
        success: false,
        error: 'Parent authorization failed. Incorrect Parent credentials.',
      };
    }
  }

  // Build Child User Payload (VIEW ONLY)
  const childUserPayload = {
    uid: `child_${cleanDeviceId}_${cleanChildUser}`,
    username: cleanChildUser,
    email: `${cleanChildUser}@tank.local`,
    displayName: cleanName,
    role: 'child',
    deviceId: cleanDeviceId,
    parentUser: cleanParentUser,
    canControlMotor: false,
    canEditSettings: false,
    registeredAt: new Date().toISOString(),
  };

  // 3. Save Child to Firebase RTDB (both in /devices and in /users)
  if (isFirebaseReady && realtimeDb) {
    try {
      const childRef = ref(realtimeDb, `devices/${cleanDeviceId}/children/${cleanChildUser}`);
      await set(childRef, {
        username: cleanChildUser,
        password: childPassword,
        displayName: cleanName,
        role: 'child',
        registeredAt: new Date().toISOString(),
      });

      // Save under global /users lookup so child can log in with username/password only
      await set(ref(realtimeDb, `users/${cleanChildUser}`), {
        username: cleanChildUser,
        password: childPassword,
        displayName: cleanName,
        role: 'child',
        deviceId: cleanDeviceId,
        parentUser: cleanParentUser,
        registeredAt: new Date().toISOString(),
      });
    } catch (e) {}
  }

  // 4. Save Child to local offline storage cache
  try {
    const localUsersRaw = (await AsyncStorage.getItem('@hydropulse_users')) || '{}';
    const localUsers = JSON.parse(localUsersRaw);
    localUsers[cleanChildUser] = {
      username: cleanChildUser,
      password: childPassword,
      role: 'child',
      deviceId: cleanDeviceId,
      displayName: cleanName,
      parentUser: cleanParentUser,
    };
    await AsyncStorage.setItem('@hydropulse_users', JSON.stringify(localUsers));
  } catch (err) {}

  // 5. Persist Child active session
  await AsyncStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(childUserPayload));

  return { success: true, user: childUserPayload };
};

/**
 * Unified Login Account
 * Automatically determines if the user is a PARENT or a CHILD based on their registered account,
 * and retrieves their linked Tank Device ID automatically.
 * The user does NOT need to enter Device ID or select a role when logging in.
 */
export const unifiedLoginAccount = async ({ username, password, deviceId }) => {
  const cleanUser = username.trim().toLowerCase().replace(/[.#$\[\]]/g, '_');

  // 1. Check /users/${cleanUser} in Firebase Realtime Database
  if (isFirebaseReady && realtimeDb) {
    try {
      const userRef = ref(realtimeDb, `users/${cleanUser}`);
      const snapshot = await get(userRef);

      if (snapshot.exists()) {
        const u = snapshot.val();
        if (u.password === password) {
          const userPayload = {
            uid: `${u.role || 'user'}_${u.deviceId || 'TANK-01'}_${cleanUser}`,
            username: cleanUser,
            email: u.email || `${cleanUser}@hydropulse.io`,
            displayName: u.displayName || cleanUser,
            role: u.role || 'parent',
            deviceId: u.deviceId || 'TANK-01',
            canControlMotor: u.role === 'parent',
            canEditSettings: u.role === 'parent',
          };
          await AsyncStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(userPayload));
          return { success: true, user: userPayload };
        } else {
          return { success: false, error: 'Incorrect password.' };
        }
      }

      // If not directly under /users, search across /devices
      const devicesRef = ref(realtimeDb, 'devices');
      const devSnap = await get(devicesRef);
      if (devSnap.exists()) {
        const allDevices = devSnap.val();
        for (const [devId, dev] of Object.entries(allDevices)) {
          // Check parent
          if (dev.parent) {
            const pUser = (dev.parent.username || dev.parent.email || '').toLowerCase();
            if ((pUser === cleanUser || (dev.parent.email && dev.parent.email.toLowerCase() === cleanUser)) && dev.parent.password === password) {
              const userPayload = {
                uid: `parent_${devId}`,
                username: cleanUser,
                email: dev.parent.email || `${cleanUser}@hydropulse.io`,
                displayName: dev.parent.displayName || 'Parent',
                role: 'parent',
                deviceId: devId,
                canControlMotor: true,
                canEditSettings: true,
              };
              await AsyncStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(userPayload));
              return { success: true, user: userPayload };
            }
          }

          // Check children
          if (dev.children) {
            for (const [cKey, c] of Object.entries(dev.children)) {
              const cUser = (c.username || cKey).toLowerCase();
              if ((cUser === cleanUser || (c.email && c.email.toLowerCase() === cleanUser)) && c.password === password) {
                const userPayload = {
                  uid: `child_${devId}_${cKey}`,
                  username: cleanUser,
                  email: c.email || `${cleanUser}@tank.local`,
                  displayName: c.displayName || cleanUser,
                  role: 'child',
                  deviceId: devId,
                  canControlMotor: false,
                  canEditSettings: false,
                };
                await AsyncStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(userPayload));
                return { success: true, user: userPayload };
              }
            }
          }
        }
      }
    } catch (e) {
      console.warn('[Firebase RTDB] Unified login error:', e.message);
    }
  }

  // 2. Check local offline storage (@hydropulse_users)
  try {
    const localUsersRaw = (await AsyncStorage.getItem('@hydropulse_users')) || '{}';
    const localUsers = JSON.parse(localUsersRaw);
    if (localUsers[cleanUser] && localUsers[cleanUser].password === password) {
      const u = localUsers[cleanUser];
      const userPayload = {
        uid: `${u.role}_${u.deviceId}_${cleanUser}`,
        username: cleanUser,
        email: u.email || `${cleanUser}@hydropulse.io`,
        displayName: u.displayName || cleanUser,
        role: u.role || 'parent',
        deviceId: u.deviceId || 'TANK-01',
        canControlMotor: u.role === 'parent',
        canEditSettings: u.role === 'parent',
      };
      await AsyncStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(userPayload));
      return { success: true, user: userPayload };
    }
  } catch (err) {}

  // 3. Demo accounts fallback
  if ((cleanUser === 'parent' || cleanUser === 'parent@hydropulse.io') && password === 'parent123') {
    const demoUser = {
      ...PRESET_ACCOUNTS.parent,
      deviceId: deviceId || 'TANK-01',
    };
    await AsyncStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(demoUser));
    return { success: true, user: demoUser };
  }

  if ((cleanUser === 'child' || cleanUser === 'child@hydropulse.io') && password === 'child123') {
    const demoUser = {
      ...PRESET_ACCOUNTS.child,
      deviceId: deviceId || 'TANK-01',
    };
    await AsyncStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(demoUser));
    return { success: true, user: demoUser };
  }

  return {
    success: false,
    error: 'Incorrect username or password. Please verify your credentials.',
  };
};

// Aliases for compatibility
export const loginParentAccount = unifiedLoginAccount;
export const loginOrRegisterChild = registerChildAccount;

/**
 * Logout User
 */
export const logoutActiveUser = async () => {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY_AUTH_USER);
    return true;
  } catch (err) {
    console.error('[Firebase Auth] Error logging out:', err);
    return false;
  }
};

/**
 * Load active authenticated profile with Parent vs Child Role
 */
export const loadActiveUser = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_AUTH_USER);
    if (raw) {
      const user = JSON.parse(raw);
      return user;
    }
  } catch (err) {
    console.warn('[Firebase Auth] Error reading user:', err);
  }
  return null;
};

/**
 * Switch active role between 'parent' and 'child'
 */
export const switchUserRole = async (role) => {
  const account = role === 'child' ? PRESET_ACCOUNTS.child : PRESET_ACCOUNTS.parent;
  try {
    await AsyncStorage.setItem(STORAGE_KEY_AUTH_USER, JSON.stringify(account));
    return account;
  } catch (err) {
    console.error('[Firebase Auth] Error saving role:', err);
    return account;
  }
};

/**
 * Save custom Firebase credentials
 */
export const saveFirebaseConfig = async (newConfig) => {
  try {
    await AsyncStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(newConfig));
    return true;
  } catch (err) {
    console.error('[Firebase] Error saving config:', err);
    return false;
  }
};

export const loadFirebaseConfig = async () => {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY_FIREBASE_CONFIG);
    if (raw) {
      const cfg = JSON.parse(raw);
      if (!cfg.databaseURL || cfg.databaseURL.includes('hydropulse-tank-default-rtdb')) {
        await AsyncStorage.setItem(STORAGE_KEY_FIREBASE_CONFIG, JSON.stringify(DEFAULT_FIREBASE_CONFIG));
        return { ...DEFAULT_FIREBASE_CONFIG };
      }
      return { ...DEFAULT_FIREBASE_CONFIG, ...cfg };
    }
  } catch (err) {
    console.warn('[Firebase] Error reading config:', err);
  }
  return { ...DEFAULT_FIREBASE_CONFIG };
};

/**
 * Sync Water Tank Telemetry to Firebase Realtime Database (/tank/live)
 */
export const syncTelemetryToFirebase = async (tankData, activeUser) => {
  const payload = {
    percentage: tankData.percentage ?? 50,
    remainingLiters: tankData.remainingLiters ?? 500,
    depthMeters: tankData.depthMeters ?? '1.00',
    depthCm: tankData.depthCm ?? 100,
    motorState: !!tankData.motorState,
    flowStatus: tankData.flowStatus ?? 'stable',
    lastUpdated: new Date().toISOString(),
    updatedBy: activeUser ? `${activeUser.displayName} (${activeUser.role})` : 'System',
  };

  if (!isFirebaseReady || !realtimeDb) {
    return { success: true, offline: true, payload };
  }

  try {
    const tankRef = ref(realtimeDb, 'tank/live');
    await set(tankRef, payload);
    return { success: true, payload };
  } catch (err) {
    // Offline or network warning - silent graceful fallback
    return { success: false, error: err.message, payload };
  }
};

/**
 * Push Motor Control Command to Firebase Realtime Database
 * STRICT RBAC: Only Parent role can turn motor ON or OFF!
 */
export const pushMotorCommandToFirebase = async (command, user) => {
  // 1. Role-Based Access Control Verification
  if (!user || user.role !== 'parent') {
    return {
      success: false,
      blocked: true,
      error: 'Permission Denied: Only Parent accounts have permission to turn the water pump ON or OFF.',
    };
  }

  const cmdPayload = {
    command: command, // 'ON' or 'OFF'
    timestamp: new Date().toISOString(),
    requestedBy: user.email || user.displayName || 'Parent',
    authorizedRole: 'parent',
  };

  if (!isFirebaseReady || !realtimeDb) {
    return { success: true, offline: true, cmdPayload };
  }

  try {
    const cmdRef = ref(realtimeDb, 'tank/motor_command');
    await set(cmdRef, cmdPayload);

    // Also update motorState in tank/live
    const liveMotorRef = ref(realtimeDb, 'tank/live/motorState');
    await set(liveMotorRef, command === 'ON');

    return { success: true, cmdPayload };
  } catch (err) {
    return { success: false, error: err.message, cmdPayload };
  }
};

/**
 * Subscribe to Realtime Database live tank updates
 */
export const subscribeToFirebaseTank = (onDataReceived) => {
  if (!isFirebaseReady || !realtimeDb) return () => {};

  try {
    const tankRef = ref(realtimeDb, 'tank/live');
    const unsubscribe = onValue(
      tankRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data && onDataReceived) {
          onDataReceived(data);
        }
      },
      (error) => {
        console.warn('[Firebase RTDB] Listen error:', error.message);
      }
    );
    return () => off(tankRef);
  } catch (e) {
    return () => {};
  }
};
