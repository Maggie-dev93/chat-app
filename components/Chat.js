import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Platform, KeyboardAvoidingView } from 'react-native';
import { Bubble, GiftedChat, InputToolbar } from "react-native-gifted-chat";
import { onSnapshot, query, orderBy, collection, addDoc } from "firebase/firestore";
import AsyncStorage from '@react-native-async-storage/async-storage';
import CustomActions from './CustomActions';
import MapView from 'react-native-maps';

const Chat = ({ db, route, navigation, isConnected, storage }) => {
  const { userID, name, background } = route.params;
  const [messages, setMessages] = useState([]);

  let unsubMessages;
  
  useEffect(() => {
    if (isConnected) {
      if (unsubMessages) unsubMessages();
      unsubMessages = null;

      navigation.setOptions({ title: name });
      const q = query(collection(db, "messages"), orderBy("createdAt", "desc"));
      unsubMessages = onSnapshot(q, (documentSnapshot) => {
        let newMessages = [];
        documentSnapshot.forEach(doc => {
          newMessages.push({
            _id: doc.id,
            ...doc.data(),
            createdAt: new Date(doc.data().createdAt.toMillis())
          });
        });
        cacheMessages(newMessages);
        setMessages(newMessages);
      });
    } else {
      loadCachedMessages();
    }

    return () => {
      if (unsubMessages) unsubMessages();
    }
  }, [isConnected]);

  const loadCachedMessages = async () => {
    const cachedMessages = await AsyncStorage.getItem("messages") || [];
    setMessages(JSON.parse(cachedMessages));
  };

  const cacheMessages = async (messagesToCache) => {
    try {
      await AsyncStorage.setItem('messages', JSON.stringify(messagesToCache));
    } catch (error) {
      console.log(error.message);
    }
  };

  const onSend = (newMessages = []) => {
    newMessages.forEach(async (message) => {
      try {
        await addDoc(collection(db, "messages"), {
          _id: message._id,
          text: message.text || '',
          createdAt: message.createdAt,
          user: message.user,
          image: message.image || null,
          location: message.location || null
        });
      } catch (error) {
        console.error("Error adding document: ", error);
      }
    });
  };

  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: { backgroundColor: "#000" },
          left: { backgroundColor: "#FFF" }
        }}
      />
    );
  };

  const renderInputToolbar = (props) => {
    if (isConnected) return <InputToolbar {...props} />;
    return null;
  };

  const renderCustomActions = (props) => {
    return <CustomActions storage={storage} {...props} userID={userID} />;
  };

  const renderCustomView = (props) => {
    const { currentMessage } = props;
    if (currentMessage.location) {
      return (
        <MapView
          style={{ width: 150, height: 100, borderRadius: 13, margin: 3 }}
          region={{
            latitude: currentMessage.location.latitude,
            longitude: currentMessage.location.longitude,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
        />
      );
    }
    return null;
  };

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <GiftedChat
        messages={messages}
        renderBubble={renderBubble}
        renderInputToolbar={renderInputToolbar}
        renderActions={renderCustomActions}
        renderCustomView={renderCustomView}
        onSend={(messages) => onSend(messages)}
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
