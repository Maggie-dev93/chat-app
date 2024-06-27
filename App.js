import React, { useEffect, useRef } from 'react';
import { Alert } from 'react-native'; // Import Alert from react-native
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { initializeApp } from 'firebase/app';
import { getFirestore, disableNetwork, enableNetwork } from 'firebase/firestore';
import { useNetInfo } from '@react-native-community/netinfo';

import Start from './components/Start';
import Chat from './components/Chat';

const firebaseConfig = {
  apiKey: "AIzaSyD1p55YjYeFiU6KGQ8M95Wowmkzv2Mrm5k",
  authDomain: "chat-app-f2aed.firebaseapp.com",
  projectId: "chat-app-f2aed",
  storageBucket: "chat-app-f2aed.appspot.com",
  messagingSenderId: "1088139980915",
  appId: "1:1088139980915:web:e9ad28c6b1977233a43a06"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const Stack = createNativeStackNavigator();

const App = () => {
  const connectionStatus = useNetInfo();
  const hasCheckedConnection = useRef(false);

  useEffect(() => {
    if (connectionStatus.isConnected) {
      enableNetwork(db);
    } else {
      disableNetwork(db);
      if (hasCheckedConnection.current) {
        Alert.alert("Offline", "You are currently offline."); // Show alert when offline
      }
    }
    hasCheckedConnection.current = true;
  }, [connectionStatus.isConnected]);

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Start">
        <Stack.Screen
          name="Start"
          component={Start}
        />
        <Stack.Screen name="Chat">
          {props => <Chat isConnected={connectionStatus.isConnected} db={db} {...props} />}
        </Stack.Screen>
      </Stack.Navigator>
    </NavigationContainer>
  );
}

export default App;
