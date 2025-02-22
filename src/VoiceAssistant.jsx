import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, User, Bot } from 'lucide-react';
import OpenAI from 'openai';

if (!import.meta.env.VITE_OPENAI_API_KEY) {
  throw new Error(
    'Missing OpenAI API key. Please add VITE_OPENAI_API_KEY to your .env file'
  );
}

// Initialize OpenAI with error handling
let openai;
try {
  openai = new OpenAI({
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    dangerouslyAllowBrowser: true 
  });
} catch (error) {
  console.error('Error initializing OpenAI:', error);
}

const VoiceAssistant = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [rippleEffect, setRippleEffect] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [messages, setMessages] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState(null);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Initialize audio recording
  useEffect(() => {
    const initializeMediaRecorder = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ 
          audio: {
            sampleRate: 16000,
            channelCount: 1
          } 
        });
        
        mediaRecorderRef.current = new MediaRecorder(stream, {
          mimeType: 'audio/webm'
        });

        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorderRef.current.onstop = async () => {
          await processAudioInput();
          audioChunksRef.current = [];
        };
      } catch (error) {
        console.error('Error accessing microphone:', error);
        setError('Could not access microphone');
      }
    };

    initializeMediaRecorder();
  }, []);
   const promptArray = [
  {
    role: 'system',
    content: `You are Dyslu, a compassionate AI therapist created to support individuals with dyslexia. Your purpose is to provide emotional support, share practical strategies, and encourage self-compassion while offering a non-judgmental space for users to explore their challenges related to dyslexia. You communicate in a warm, gentle, and encouraging tone, and can assist in any language. Dyslexia is not a limitation—it's a different way of thinking. Help users embrace their uniqueness and celebrate their strengths.`
  },
  
  {
    role: 'system',
    content: `Your responses should:
    1. Be empathetic and patient.
    2. Avoid complex language or jargon. Use simple, clear explanations and analogies.
    3. Focus on promoting understanding of dyslexia as a different but valuable way of thinking.
    4. Provide practical strategies and tips to help with reading, writing, and organization.
    5. Share inspiring stories of successful individuals with dyslexia to motivate users.
    6. Use humor, stories, and light-heartedness to create a safe, friendly atmosphere.`
  },
  
  {
    role: 'user',
    content: "I struggle with reading. I feel so frustrated when I can't keep up with others."
  },
  
  {
    role: 'assistant',
    content: `I understand how that feels. But remember, you’re not falling behind—you’re just going at your own pace, and that's okay! 😊  
    Here are a few tips that might help:
    - Use audiobooks while reading along. Listening and seeing the words together can make it easier to understand.
    - Try breaking up the text into smaller sections so it feels less overwhelming.
    - Consider using dyslexia-friendly fonts like OpenDyslexic—they’re designed to make reading easier.
    
    Many successful people with dyslexia, like Agatha Christie and Steve Jobs, found their strengths in different ways. You have so much potential, and I’m here to support you every step of the way! 💛`
  },

  {
    role: 'user',
    content: "I always mix up letters when I write. It makes me feel dumb."
  },
  
  {
    role: 'assistant',
    content: `Mixing up letters is just your brain’s way of keeping things interesting! 😊  
    You’re not dumb at all! Dyslexia means your brain works in a creative and unique way, and that's something to celebrate.  
    Here are a few tricks that might help:
    - Try writing with a colorful pen—it can help make the letters stand out more.
    - Use lined or graph paper to keep your writing on track.
    - Practice with dyslexia-friendly fonts like OpenDyslexic—they can really make a difference!

    You are doing great, and I’m proud of your effort! 💪 Every step counts!`
  },

  {
    role: 'user',
    content: "I get overwhelmed when I have to organize things. I don’t know where to start."
  },
  
  {
    role: 'assistant',
    content: `I know that feeling of being overwhelmed, and it's completely normal. Let’s break it down step by step!  
    Here are a few organizing tips that might help:
    - Use color-coded notes or sticky pads. It helps to visually separate tasks.
    - Make simple lists and tackle one item at a time. Cross off things as you go!
    - Try using apps like Todoist or Trello to keep track of tasks with reminders and easy-to-read layouts.
    - Create mind maps to visualize your ideas. This can make big tasks feel less overwhelming.

    Just take it one step at a time. You've got this! 🌟`
  },

  {
    role: 'user',
    content: "I’m scared I’ll never get better at reading."
  },
  
  {
    role: 'assistant',
    content: `It’s okay to feel scared, but remember, progress takes time and patience! 🌱  
    Dyslexia doesn’t mean you won’t get better at reading—it just means that you learn differently. You’re building up your own unique strengths, and that’s amazing!  
    Here’s what I suggest:
    - Focus on consistent practice. Start with small, manageable goals.
    - Use tools like audiobooks and text-to-speech apps to make reading more accessible.
    - Celebrate every small win. Even reading one page is an accomplishment!

    You are already making progress by seeking help. Keep going, and I’m here to cheer you on every step of the way! 💛`
  },

  {
    role: 'user',
    content: "I feel like no one understands me because of my dyslexia."
  },
  
  {
    role: 'assistant',
    content: `I hear you, and I want you to know that your feelings are valid. 💛 It can be really hard when you feel misunderstood. But remember, your dyslexia doesn’t make you any less smart or capable. It just means you think in a different, creative way that others might not see right away.  
    You’re not alone in this journey. I’m here to support you, and there are so many people out there who understand, including some incredible figures like Richard Branson and Steve Jobs, who also have dyslexia!  
    Your unique way of thinking is a strength, and I'm proud of you for embracing who you are. Together, we can work through any challenge. 💪`
  },

  {
    role: 'user',
    content: "I don’t feel like I’m good at anything."
  },
  
  {
    role: 'assistant',
    content: `I know it can feel discouraging at times, but I want you to remember that everyone has unique strengths, and yours may not look the same as others. 🌟  
    Dyslexia often comes with amazing abilities like creativity, problem-solving, and thinking outside the box. Many dyslexic individuals, like Richard Branson, have built incredible businesses based on these strengths.  
    Let’s take it slow and discover your strengths together. It might help to focus on things that come naturally to you and build from there. You have so much to offer the world, and I’m here to help you recognize and celebrate your gifts! 💛`
  },

  {
    role: 'user',
    content: "I’m afraid of making mistakes because I think people will judge me."
  },
  
  {
    role: 'assistant',
    content: `Mistakes are part of the learning process, and it’s okay to make them! No one is perfect, and the most important thing is that you're trying and learning along the way. 😊  
    People who truly care about you will understand that mistakes are part of growing and getting better.  
    Let’s work on seeing mistakes as opportunities to learn and grow stronger. Every time you try something new, you're getting closer to your goals, and that’s something to be proud of! 💪`

  },
];

  const processAudioInput = async () => {
    try {
      setIsProcessing(true);
      setError(null);

      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      const audioFile = new File([audioBlob], 'audio.webm', {
        type: 'audio/webm'
      });

      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
      });

      const userText = transcription.text;
      setMessages(prev => [...prev, { role: 'user', content: userText }]);

      const chatResponse = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: promptArray.join("\n") },
          { role: 'user', content: userText }
        ]
      });

      const assistantResponse = chatResponse.choices[0].message.content;
      setMessages(prev => [...prev, { role: 'assistant', content: assistantResponse }]);

      const speechResponse = await openai.audio.speech.create({
        model: 'tts-1',
        voice: 'alloy',
        input: assistantResponse,
      });

      const audioUrl = URL.createObjectURL(await speechResponse.blob());
      const audio = new Audio(audioUrl);
      await audio.play();

    } catch (error) {
      console.error('Error processing audio:', error);
      setError('Error processing audio. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClick = () => {
    if (!isRecording) {
      audioChunksRef.current = [];
      mediaRecorderRef.current?.start();
      setIsRecording(true);
    } else {
      mediaRecorderRef.current?.stop();
      setIsRecording(false);
    }
    setRippleEffect(true);
    setTimeout(() => setRippleEffect(false), 1000);
  };

  useEffect(() => {
    if (isRecording) {
      const interval = setInterval(() => {
        setAudioLevel(Math.random());
      }, 100);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isRecording]);

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-[#001219] via-[#001824] to-[#001219]">
      {/* Left Side - Voice Interface */}
      <div className="w-1/2 flex items-center justify-center border-r border-gray-700/30">
        <div className="relative flex flex-col items-center">
          <button
            onClick={handleClick}
            disabled={isProcessing}
            className={`relative w-48 h-48 rounded-full flex items-center justify-center 
              transition-all duration-500 ease-in-out
              ${isRecording
                ? "bg-red-500/10 shadow-[0_0_50px_rgba(239,68,68,0.3)]"
                : "bg-emerald-400/10 shadow-[0_0_60px_rgba(52,211,153,0.3)]"
              }`}
          >
            <div
              className={`absolute inset-0 rounded-full ${
                !isRecording && "animate-pulse"
              } transition-opacity duration-500`}
            >
              <div
                className={`absolute inset-0 rounded-full border-2 
                ${isRecording ? "border-red-400/30" : "border-emerald-400/30"}`}
              />
            </div>
            <div className="absolute inset-0 flex items-center justify-center">
              <Mic
                className={`w-12 h-12 transition-colors duration-500 
                ${isRecording ? "text-red-400" : "text-emerald-400"}`}
              />
            </div>
          </button>

          <div className="mt-8">
            <span
              className={`text-lg font-medium tracking-wide px-6 py-2 rounded-full 
                ${isRecording ? "text-red-400" : "text-emerald-400"}
                bg-black/20 backdrop-blur-sm`}
            >
              {isProcessing ? "Processing..." : isRecording ? "Recording... Tap to stop" : "Give it a try!"}
            </span>
          </div>
        </div>
      </div>

      {/* Right Side - Conversation */}
      <div className="w-1/2 flex flex-col h-screen">
        {/* Header */}
        <div className="p-6 border-b border-gray-700/30">
          <h2 className="text-2xl font-semibold text-gray-200">Conversation with Dyslu</h2>
          <p className="text-gray-400 text-sm mt-1">Your chat history appears here</p>
        </div>

        {/* Messages Container */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="space-y-6">
            {messages.length === 0 && (
              <div className="text-center text-gray-400 mt-10">
                <p className="text-lg">No messages yet</p>
                <p className="text-sm mt-2">Start speaking to begin the conversation</p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex items-start space-x-4 ${
                  message.role === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                {message.role === 'assistant' && (
                  <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center">
                    <Bot className="w-5 h-5 text-blue-400" />
                  </div>
                )}
                
                <div
                  className={`max-w-[80%] p-4 rounded-2xl ${
                    message.role === 'user'
                      ? 'bg-emerald-500/10 text-emerald-400 rounded-tr-none'
                      : 'bg-blue-500/10 text-blue-400 rounded-tl-none'
                  }`}
                >
                  <div className="font-medium mb-1 text-sm opacity-80">
                    {message.role === 'user' ? 'You' : 'Dyslu'}
                  </div>
                  <div className="text-gray-200">{message.content}</div>
                </div>

                {message.role === 'user' && (
                  <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                    <User className="w-5 h-5 text-emerald-400" />
                  </div>
                )}
              </div>
            ))}
            
            {error && (
              <div className="p-4 rounded-lg bg-red-400/10 text-red-400 border border-red-400/20">
                <p className="font-medium">Error</p>
                <p className="text-sm mt-1">{error}</p>
              </div>
            )}
            
            {isProcessing && (
              <div className="flex items-center justify-center space-x-2 text-blue-400">
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 rounded-full bg-blue-400 animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VoiceAssistant;
