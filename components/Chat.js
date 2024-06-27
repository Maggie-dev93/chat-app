import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Platform, KeyboardAvoidingView, Alert } from 'react-native';
import { Bubble, GiftedChat, InputToolbar } from "react-native-gifted-chat";
import { onSnapshot, query, orderBy, collection, addDoc } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNetInfo } from '@react-native-community/netinfo'; // Import useNetInfo

const Chat = ({ db, route, navigation }) => {
  const { userID, name, background } = route.params;

  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(true); // Default to true when component mounts
  const connectionStatus = useNetInfo(); // Get connection status

  const onSend = async (newMessages = []) => {
    const newMessage = newMessages[0];

    if (!userID || !name) {
      console.error("userID or name is undefined");
      return;
    }

    try {
      await addDoc(collection(db, "messages"), {
        _id: newMessage._id,
        text: newMessage.text,
        createdAt: new Date(),
        user: {
          _id: userID,
          name: name
        }
      });
    } catch (error) {
      console.error("Error adding document: ", error);
    }
  };

  const renderBubble = (props) => (
    <Bubble
      {...props}
      wrapperStyle={{
        right: { backgroundColor: "#000" },
        left: { backgroundColor: "#FFF" }
      }}
    />
  );

  const renderInputToolbar = (props) => {
    if (isConnected) return <InputToolbar {...props} />;
    return null;
  };

  useEffect(() => {
    setIsConnected(connectionStatus.isConnected); // Update isConnected state based on connectionStatus
  }, [connectionStatus.isConnected]);

  useEffect(() => {
    // Show alert only when isConnected changes to false (offline)
    if (isConnected === false) {
      Alert.alert("Offline", "You are currently offline.");
    }
  }, [isConnected]);
  

  useEffect(() => {
    const fetchMessages = async () => {
      if (isConnected) {
        const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));

        const unsubMessages = onSnapshot(q, (documentsSnapshot) => {
          let newMessages = [];
          documentsSnapshot.forEach((doc) => {
            newMessages.push({
              _id: doc.id,
              ...doc.data(),
              createdAt: new Date(doc.data().createdAt.toMillis()),
            });
          });
          setMessages(newMessages);

          // Cache messages locally
          AsyncStorage.setItem('messages', JSON.stringify(newMessages));
        });

        return () => {
          if (unsubMessages) unsubMessages();
        };
      } else {
        // Load messages from local storage
        try {
          const cachedMessages = await AsyncStorage.getItem('messages');
          if (cachedMessages) {
            setMessages(JSON.parse(cachedMessages));
          }
        } catch (error) {
          console.error("Error loading cached messages:", error);
        }
      }
    };

    fetchMessages();
  }, [isConnected]); // Trigger fetchMessages when isConnected changes

  useEffect(() => {
    navigation.setOptions({ title: name });
  }, [navigation, name]);



  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <GiftedChat
        messages={messages}
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        onSend={messages => onSend(messages)}
        user={{ _id: userID, name: name }}
      />
      {Platform.OS === "ios" ? <KeyboardAvoidingView behavior="height" /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 }
});

export default Chat;
