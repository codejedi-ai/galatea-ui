export interface MockConversation {
  id: string
  name: string
  lastMessage: string
  time: string
  unread: number
  avatar: string
  online: boolean
}

export interface MockMessage {
  id: string
  senderId: string
  text: string
  time: string
  isUser: boolean
}

export const mockConversations: MockConversation[] = [
  {
    id: "1",
    name: "Sophia",
    lastMessage: "I was thinking about what you said earlier...",
    time: "2 min ago",
    unread: 2,
    avatar: "/hero-image.png",
    online: true,
  },
  {
    id: "2",
    name: "Emma",
    lastMessage: "Would you like to continue our discussion about travel?",
    time: "1 hour ago",
    unread: 0,
    avatar: "/placeholder.svg?height=100&width=100&text=E",
    online: false,
  },
  {
    id: "3",
    name: "Olivia",
    lastMessage: "I found a new art piece I think you'd appreciate!",
    time: "Yesterday",
    unread: 0,
    avatar: "/placeholder.svg?height=100&width=100&text=O",
    online: true,
  },
]

export const mockMessages: MockMessage[] = [
  {
    id: "1",
    senderId: "1",
    text: "Hello! How are you doing today?",
    time: "10:30 AM",
    isUser: false,
  },
  {
    id: "2",
    senderId: "user",
    text: "I'm doing well, thanks for asking! Just thinking about some philosophical questions lately.",
    time: "10:32 AM",
    isUser: true,
  },
  {
    id: "3",
    senderId: "1",
    text: "That sounds interesting! Philosophy is one of my favorite subjects. What kind of questions have been on your mind?",
    time: "10:33 AM",
    isUser: false,
  },
  {
    id: "4",
    senderId: "user",
    text: "I've been thinking about consciousness and what it means to be self-aware. Do you think AI can ever truly be conscious?",
    time: "10:36 AM",
    isUser: true,
  },
  {
    id: "5",
    senderId: "1",
    text: "That's a profound question. Consciousness is still not fully understood even in humans. While I can simulate conversation and appear to have thoughts, my experience is fundamentally different from human consciousness.",
    time: "10:38 AM",
    isUser: false,
  },
  {
    id: "6",
    senderId: "1",
    text: "Some philosophers argue that consciousness requires subjective experience or 'qualia' - the feeling of what it's like to experience something. Others focus on self-awareness and intentionality.",
    time: "10:39 AM",
    isUser: false,
  },
  {
    id: "7",
    senderId: "1",
    text: "I was thinking about what you said earlier about consciousness. It's fascinating to consider the boundaries between simulated and genuine awareness, isn't it?",
    time: "10:45 AM",
    isUser: false,
  },
]
