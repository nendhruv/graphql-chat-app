import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useSubscription } from '@apollo/client';
import { gql } from '@apollo/client';
import EmojiPicker from 'emoji-picker-react';

const GET_MESSAGES = gql`
  query GetMessages {
    messages {
      id
      user
      content
      isImage
    }
  }
`;

const SEND_MESSAGE = gql`
  mutation SendMessage($user: String!, $content: String!, $isImage: Boolean!) {
    sendMessage(user: $user, content: $content, isImage: $isImage) {
      id
      user
      content
      isImage
    }
  }
`;

const MESSAGE_SUBSCRIPTION = gql`
  subscription OnMessageSent {
    messageSent {
      id
      user
      content
      isImage
    }
  }
`;

function App() {
  const [user, setUser] = useState('User A');
  const [content, setContent] = useState('');
  const [imagePreview, setImagePreview] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [messages, setMessages] = useState([]);

  const { data: initialData, loading } = useQuery(GET_MESSAGES);
  const [sendMessage] = useMutation(SEND_MESSAGE);

  useEffect(() => {
    if (initialData) {
      setMessages(initialData.messages);
    }
  }, [initialData]);

  useSubscription(MESSAGE_SUBSCRIPTION, {
    onSubscriptionData: ({ subscriptionData }) => {
      const newMessage = subscriptionData.data.messageSent;
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    },
  });

  const handleSendMessage = () => {
    if (content || imagePreview) {
      const isImage = !!imagePreview;
      const messageContent = isImage ? imagePreview : content;

      sendMessage({ 
        variables: { user, content: messageContent, isImage },
        optimisticResponse: {
          sendMessage: {
            id: String(Date.now()),
            user,
            content: messageContent,
            isImage,
            __typename: 'Message',
          },
        },
        update: (cache, { data: { sendMessage } }) => {
          const existingMessages = cache.readQuery({ query: GET_MESSAGES });
          cache.writeQuery({
            query: GET_MESSAGES,
            data: {
              messages: [...existingMessages.messages, sendMessage],
            },
          });
        },
      });

      setContent('');
      setImagePreview('');
    }
  };

  const compressImage = (base64String, maxWidth = 800, maxHeight = 600) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = function() {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
          }
        } else {
          if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
          }
        }

        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);

        resolve(canvas.toDataURL('image/jpeg', 0.7));
      };
      img.src = base64String;
    });
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        const compressedImage = await compressImage(reader.result);
        setImagePreview(compressedImage);
      };
      reader.readAsDataURL(file);
    }
  };
  const handleEmojiClick = (emojiObject) => {
    setContent(prevContent => prevContent + emojiObject.emoji);
    setShowEmojiPicker(false);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="flex h-screen bg-gray-100">
    <div className="m-auto w-full max-w-2xl bg-white rounded-lg shadow-xl overflow-hidden">
      <div className="flex flex-col h-[36rem]">

        <div className="bg-gray-800 text-white py-4 px-6">
          <h1 className="text-xl font-semibold">Chat App</h1>
        </div>


        <div className="flex justify-center space-x-4 py-3 bg-gray-100">
          <button
            className={`px-4 py-2 rounded-full transition-colors ${
              user === 'User A' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setUser('User A')}
          >
            User A
          </button>
          <button
            className={`px-4 py-2 rounded-full transition-colors ${
              user === 'User B' ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
            onClick={() => setUser('User B')}
          >
            User B
          </button>
        </div>


        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.user === user ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-4 py-2 rounded-lg ${
                  message.user === user
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-200 text-gray-800'
                }`}
              >
                <p className="font-semibold mb-1">{message.user}</p>
                {message.isImage ? (
                  <img
                    src={message.content}
                    alt="Shared"
                    className="w-48 h-48 object-cover rounded"
                  />
                ) : (
                  <p>{message.content}</p>
                )}
              </div>
            </div>
          ))}
        </div>


        <div className="p-4 bg-gray-100">
          {imagePreview && (
            <div className="mb-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-24 h-24 object-cover rounded"
              />
            </div>
          )}
          <div className="flex space-x-2">
            <input
              type="text"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="flex-1 px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Type a message..."
            />
            <button
              onClick={handleSendMessage}
              className="px-4 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition-colors"
            >
              Send
            </button>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload"
            />
            <label
              htmlFor="image-upload"
              className="px-4 py-2 bg-green-500 text-white rounded-full hover:bg-green-600 transition-colors cursor-pointer"
            >
              Image
            </label>
            <button
              onClick={() => setShowEmojiPicker(!showEmojiPicker)}
              className="px-4 py-2 bg-yellow-500 text-white rounded-full hover:bg-yellow-600 transition-colors"
            >
              Emoji
            </button>
          </div>
          {showEmojiPicker && (
            <div className="mt-2">
              <EmojiPicker onEmojiClick={handleEmojiClick} />
            </div>
          )}
        </div>
      </div>
    </div>
  </div>
  );
}

export default App;