import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';
import { useWebSocket } from '../utils/useWebSocket';

interface ChatMessage {
  id: string;
  senderId: string;
  text: string;
  timestamp: string;
  createdAt?: string;
}

export default function ChatScreen() {
  const router = useRouter();
  const { user } = useAuthStore();
  const { requestId, requesterId, requesterName, requestTitle, commitmentId, isFromMessages } =
    useLocalSearchParams();
  const { isConnected, messages: wsMessages } = useWebSocket();

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [commitment, setCommitment] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  // Fetch or create commitment and load messages
  useEffect(() => {
    const initChat = async () => {
      try {
        setIsLoading(true);

        let commitmentData = null;

        // If coming from Messages with existing commitment, use it directly
        if (commitmentId && isFromMessages === 'true') {
          console.log('Loading existing commitment:', commitmentId);
          commitmentData = await api.getCommitment(commitmentId as string);
        } else if (requestId && user?.id) {
          // If coming from request details (new offer), create new commitment
          console.log('Creating new commitment for request:', requestId);
          try {
            // Create new commitment - pass request_id as query param
            commitmentData = await api.createCommitment(requestId as string);
          } catch (createError: any) {
            // If creation fails (e.g., request not open), try to find existing
            console.warn('Failed to create commitment, checking for existing:', createError);
            const allCommitments = await api.getCommitments(0, 100);
            commitmentData = allCommitments.find(
              (c: any) => c.request_id === requestId && c.helper_id === user?.id
            );
            
            if (!commitmentData) {
              throw createError; // Re-throw if no existing commitment found
            }
          }
        } else {
          throw new Error('Missing required parameters: commitmentId or requestId');
        }

        setCommitment(commitmentData);

        // Load messages from new messages endpoint
        try {
          const messagesData = await api.getMessages(commitmentData.id, 0, 50);
          const formattedMessages = messagesData.map((msg: any) => ({
            id: msg.id,
            senderId: msg.sender_id,
            text: msg.text,
            timestamp: msg.created_at,
            createdAt: msg.created_at,
          }));
          setMessages(formattedMessages);
        } catch (msgError) {
          console.warn('Failed to load messages:', msgError);
          // Continue even if messages fail to load
        }
      } catch (error) {
        console.error('Failed to initialize chat:', error);
        Alert.alert('Error', 'Failed to start chat');
        router.back();
      } finally {
        setIsLoading(false);
      }
    };

    initChat();
  }, [requestId, user?.id, commitmentId, isFromMessages]);

  // Listen for WebSocket messages
  useEffect(() => {
    if (!commitment?.id) {
      console.log('Skipping WebSocket listener - commitment not initialized');
      return;
    }

    console.log('WebSocket listener active for commitment:', commitment.id);
    console.log('Received', wsMessages.length, 'messages from WebSocket hook');

    wsMessages.forEach((msg, index) => {
      console.log(`Processing message ${index}:`, msg.type);
      
      if (msg.type === 'message_created') {
        // Use commitment ID from state (always up-to-date)
        const msgCommitmentId = String(msg.data.commitment_id);
        const currentCommitmentId = String(commitment.id);
        
        console.log('Comparing:', {
          msgCommitmentId,
          currentCommitmentId,
          match: msgCommitmentId === currentCommitmentId,
          senderId: msg.data.sender_id,
          userId: user?.id,
        });
        
        if (msgCommitmentId === currentCommitmentId) {
          const newMsg: ChatMessage = {
            id: msg.data.id,
            senderId: msg.data.sender_id,
            text: msg.data.text || '',
            timestamp: msg.data.created_at,
            createdAt: msg.data.created_at,
          };
          
          setMessages((prev) => {
            const exists = prev.some(m => m.id === newMsg.id);
            console.log('Message already in list?', exists, 'Adding:', !exists);
            return exists ? prev : [...prev, newMsg];
          });
        } else {
          console.log('Commitment ID mismatch - ignoring message');
        }
      }
    });
  }, [wsMessages, commitment?.id, user?.id]);

  const handleSendMessage = async () => {
    if (!inputText.trim() || !commitment) return;

    const messageText = inputText.trim();
    setInputText('');
    setIsSending(true);

    try {
      // Send message to new messages endpoint
      const sentMessage = await api.sendMessage(commitment.id, messageText);

      const newMsg: ChatMessage = {
        id: sentMessage.id,
        senderId: sentMessage.sender_id,
        text: sentMessage.text,
        timestamp: sentMessage.created_at,
        createdAt: sentMessage.created_at,
      };

      setMessages((prev) => [...prev, newMsg]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert('Error', 'Failed to send message');
      setInputText(messageText);
    } finally {
      setIsSending(false);
    }
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isOwn = item.senderId === user?.id;
    const timestamp = new Date(item.createdAt || item.timestamp);
    const timeStr = timestamp.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
    });

    return (
      <View
        style={[
          styles.messageContainer,
          isOwn ? styles.ownMessage : styles.theirMessage,
        ]}
      >
        <View
          style={[
            styles.messageBubble,
            isOwn ? styles.ownBubble : styles.theirBubble,
          ]}
        >
          <Text
            style={[
              styles.messageText,
              isOwn ? styles.ownText : styles.theirText,
            ]}
          >
            {item.text}
          </Text>
          <Text
            style={[
              styles.messageTime,
              isOwn ? styles.ownTime : styles.theirTime,
            ]}
          >
            {timeStr}
          </Text>
        </View>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <Text style={styles.emptyText}>Start the conversation</Text>
      <Text style={styles.emptySubText}>
        Send a message to discuss this request
      </Text>
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator size="large" color="#3c6a35" />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle} numberOfLines={1}>
            {requesterName}
          </Text>
          <Text style={styles.headerSubtitle} numberOfLines={1}>
            {requestTitle}
          </Text>
        </View>
        <View style={[styles.statusBadge, isConnected && styles.statusOnline]}>
          <Text style={styles.statusDot}>●</Text>
        </View>
      </View>

      {/* Messages List */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => `${item.id}-${index}`}
        contentContainerStyle={styles.messagesList}
        ListEmptyComponent={renderEmpty}
        onContentSizeChange={() =>
          flatListRef.current?.scrollToEnd({ animated: true })
        }
      />

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="Type your message..."
            placeholderTextColor="#bdbdb0"
            value={inputText}
            onChangeText={setInputText}
            multiline
            maxLength={500}
            editable={!isSending}
          />
          <TouchableOpacity
            style={[styles.sendButton, isSending && styles.sendButtonDisabled]}
            onPress={handleSendMessage}
            disabled={isSending || !inputText.trim()}
          >
            {isSending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text style={styles.sendButtonText}>Send</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fafaf0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e4d4',
    gap: 12,
  },
  backButton: {
    fontSize: 16,
    fontWeight: '600',
    color: '#3c6a35',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#303429',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#797c6f',
    marginTop: 2,
  },
  statusBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f4ed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusOnline: {
    backgroundColor: '#e8f5e9',
  },
  statusDot: {
    fontSize: 12,
    color: '#757575',
  },

  messagesList: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  messageContainer: {
    marginVertical: 6,
  },
  ownMessage: {
    alignItems: 'flex-end',
  },
  theirMessage: {
    alignItems: 'flex-start',
  },
  messageBubble: {
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    maxWidth: '80%',
  },
  ownBubble: {
    backgroundColor: '#3c6a35',
  },
  theirBubble: {
    backgroundColor: '#f4f4e9',
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  ownText: {
    color: '#ffffff',
  },
  theirText: {
    color: '#303429',
  },
  messageTime: {
    fontSize: 11,
    marginTop: 4,
  },
  ownTime: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  theirTime: {
    color: '#797c6f',
  },

  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#303429',
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#797c6f',
    textAlign: 'center',
  },

  inputContainer: {
    borderTopWidth: 1,
    borderTopColor: '#e2e4d4',
    backgroundColor: '#fafaf0',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#e2e4d4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: '#303429',
    backgroundColor: '#ffffff',
    maxHeight: 100,
  },
  sendButton: {
    backgroundColor: '#3c6a35',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
});
