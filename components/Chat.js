import { useEffect, useState } from 'react';
import { StyleSheet, View, Platform, KeyboardAvoidingView } from 'react-native';
import { Bubble, GiftedChat } from "react-native-gifted-chat";
import { onSnapshot, query, orderBy, collection, addDoc } from "firebase/firestore";

const Chat = ({ db, route, navigation }) => {
  const { userID, name, background } = route.params;

  // Debugging logs
  console.log("userID:", userID);
  console.log("name:", name);

  const [messages, setMessages] = useState([]);

  const onSend = async (newMessages = []) => {
    const newMessage = newMessages[0];
    console.log("New message:", newMessage); // Debugging log

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

  const renderBubble = (props) => {
    return (
      <Bubble
        {...props}
        wrapperStyle={{
          right: {
            backgroundColor: "#000"
          },
          left: {
            backgroundColor: "#FFF"
          }
        }}
      />
    );
  };

  useEffect(() => {
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
    });

    return () => {
      if (unsubMessages) unsubMessages();
    };
  }, [db]);

  useEffect(() => {
    navigation.setOptions({ title: name });
  }, [navigation, name]);

  return (
    <View style={[styles.container, { backgroundColor: background }]}>
      <GiftedChat
        messages={messages}
        renderBubble={renderBubble}
        onSend={messages => onSend(messages)}
        user={{
          _id: userID,
          name: name,
        }}
      />
      {Platform.OS === "ios" ? <KeyboardAvoidingView behavior="height" /> : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  }
});

export default Chat;
