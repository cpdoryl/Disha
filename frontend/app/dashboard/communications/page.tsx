'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const messageSchema = z.object({
  subject: z.string().min(3, 'Subject required'),
  recipients: z.string().min(1, 'Recipients required'),
  message: z.string().min(10, 'Message must be at least 10 characters'),
})

type MessageFormData = z.infer<typeof messageSchema>

const mockAnnouncements = [
  {
    id: '1',
    title: 'School Annual Day - July 30, 2026',
    content: 'Mark your calendars! Our annual day celebration will be held on July 30, 2026. Students and parents are cordially invited.',
    date: '2026-07-15',
    author: 'Dr. Gupta',
    views: 342,
  },
  {
    id: '2',
    title: 'Examination Schedule Released',
    content: 'Final examination schedule for all classes has been released. Please check the notice board and download from the portal.',
    date: '2026-07-12',
    author: 'Mrs. Khan',
    views: 512,
  },
  {
    id: '3',
    title: 'Holiday Notice - Summer Vacation',
    content: 'Summer vacation starts from July 20 and will continue till August 15, 2026. School reopens on August 16.',
    date: '2026-07-10',
    author: 'Dr. Gupta',
    views: 678,
  },
]

const mockMessages = [
  {
    id: '1',
    from: 'Mrs. Sharma',
    subject: 'Class 10-A Performance Update',
    preview: 'The class performed well in the recent assessment...',
    date: '2026-07-15',
    read: false,
  },
  {
    id: '2',
    from: 'Mr. Patel',
    subject: 'Science Project Deadline',
    preview: 'Please remind students that the science project deadline is July 25...',
    date: '2026-07-14',
    read: true,
  },
  {
    id: '3',
    from: 'Mrs. Khan',
    subject: 'Staff Meeting Tomorrow',
    preview: 'Reminder: Staff meeting scheduled for tomorrow at 4 PM in the conference room...',
    date: '2026-07-13',
    read: true,
  },
]

export default function CommunicationsPage() {
  const [showForm, setShowForm] = useState(false)
  const [selectedMessage, setSelectedMessage] = useState<typeof mockMessages[0] | null>(null)
  const [tab, setTab] = useState<'announcements' | 'messages' | 'send'>('announcements')

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
  })

  const onSubmit = (data: MessageFormData) => {
    console.log('Sending message:', data)
    reset()
    setTab('announcements')
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Communications</h1>
          <p className="text-gray-600 mt-2">Announcements, messages, and notifications</p>
        </div>
        <button
          onClick={() => setTab('send')}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Message
        </button>
      </div>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200 flex">
          <button
            onClick={() => setTab('announcements')}
            className={`flex-1 px-6 py-4 text-center font-medium ${
              tab === 'announcements'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            📢 Announcements
          </button>
          <button
            onClick={() => setTab('messages')}
            className={`flex-1 px-6 py-4 text-center font-medium ${
              tab === 'messages'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            💬 Messages
          </button>
          <button
            onClick={() => setTab('send')}
            className={`flex-1 px-6 py-4 text-center font-medium ${
              tab === 'send'
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            ✉️ Send Message
          </button>
        </div>

        <div className="p-6">
          {tab === 'announcements' && (
            <div className="space-y-4">
              {mockAnnouncements.map((announcement) => (
                <div key={announcement.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{announcement.title}</h3>
                      <div className="flex items-center gap-3 text-sm text-gray-600 mt-1">
                        <span>{announcement.author}</span>
                        <span>•</span>
                        <span>{announcement.date}</span>
                        <span>•</span>
                        <span>👁️ {announcement.views} views</span>
                      </div>
                    </div>
                  </div>
                  <p className="text-gray-700 text-sm">{announcement.content}</p>
                  <button className="text-blue-600 hover:text-blue-900 text-sm font-medium mt-3">
                    Read Full →
                  </button>
                </div>
              ))}
            </div>
          )}

          {tab === 'messages' && (
            <div className="space-y-2">
              {mockMessages.map((message) => (
                <div
                  key={message.id}
                  onClick={() => setSelectedMessage(message)}
                  className={`p-4 border rounded-lg cursor-pointer hover:bg-gray-50 transition ${
                    message.read ? 'bg-white' : 'bg-blue-50 border-blue-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h4 className={`font-semibold ${message.read ? 'text-gray-900' : 'text-blue-900'}`}>
                          {message.from}
                        </h4>
                        {!message.read && <span className="w-2 h-2 bg-blue-600 rounded-full"></span>}
                      </div>
                      <p className={`text-sm mt-1 ${message.read ? 'text-gray-600' : 'text-gray-900 font-medium'}`}>
                        {message.subject}
                      </p>
                      <p className="text-sm text-gray-500 mt-1">{message.preview}</p>
                    </div>
                    <span className="text-xs text-gray-500">{message.date}</span>
                  </div>
                </div>
              ))}
            </div>
          )}

          {tab === 'send' && (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipients
                </label>
                <select
                  {...register('recipients')}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select recipients</option>
                  <option value="all_students">All Students</option>
                  <option value="all_parents">All Parents</option>
                  <option value="all_staff">All Staff</option>
                  <option value="class_10a">Class 10-A</option>
                  <option value="class_10b">Class 10-B</option>
                  <option value="class_11a">Class 11-A</option>
                  <option value="class_11b">Class 11-B</option>
                </select>
                {errors.recipients && <p className="text-red-500 text-sm mt-1">{errors.recipients.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Subject
                </label>
                <input
                  {...register('subject')}
                  type="text"
                  placeholder="Message subject"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                {errors.subject && <p className="text-red-500 text-sm mt-1">{errors.subject.message}</p>}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Message
                </label>
                <textarea
                  {...register('message')}
                  placeholder="Type your message here..."
                  rows={6}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                ></textarea>
                {errors.message && <p className="text-red-500 text-sm mt-1">{errors.message.message}</p>}
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  Send Message
                </button>
                <button
                  type="button"
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Save as Draft
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{selectedMessage.subject}</h2>
                  <p className="text-gray-600 mt-1">From: {selectedMessage.from}</p>
                </div>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ×
                </button>
              </div>
            </div>

            <div className="p-6">
              <p className="text-sm text-gray-500 mb-4">Date: {selectedMessage.date}</p>
              <div className="bg-gray-50 p-4 rounded text-gray-700">
                This is the full message content from {selectedMessage.from}. The message preview shows the beginning of the message, and here you can see the complete content of the communication.
              </div>

              <div className="mt-6 flex gap-3">
                <button className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">
                  Reply
                </button>
                <button className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium">
                  Forward
                </button>
                <button className="flex-1 px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 font-medium">
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
