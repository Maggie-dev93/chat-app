import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Platform, KeyboardAvoidingView } from 'react-native';
import { Bubble, GiftedChat, InputToolbar } from "react-native-gifted-chat";
import { onSnapshot, query, orderBy, collection, addDoc } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';

const Chat = ({ db, route, navigation, isConnected }) => {
  const { userID, name, background } = route.params;

  const [messages, setMessages] = useState([]);

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
    const fetchMessages = async () => {
      if (isConnected) {
        const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));

        const unsubMessages = onSnapshot(q, async (documentsSnapshot) => {
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
          try {
            await AsyncStorage.setItem('messages', JSON.stringify(newMessages));
          } catch (error) {
            console.error("Error saving messages to AsyncStorage:", error);
          }
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
  }, [isConnected, db]); // Trigger fetchMessages when isConnected or db changes

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
