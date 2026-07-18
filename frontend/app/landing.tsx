'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Menu, X, ChevronRight, Users, BarChart3, Clock, Shield, Zap, Smartphone } from 'lucide-react'

export default function LandingPage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Header/Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <div className="flex items-center space-x-2">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Disha</h1>
                <p className="text-xs text-gray-600">Education Management</p>
              </div>
            </div>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-gray-700 hover:text-blue-600 font-medium transition">Features</a>
              <a href="#benefits" className="text-gray-700 hover:text-blue-600 font-medium transition">Benefits</a>
              <a href="#contact" className="text-gray-700 hover:text-blue-600 font-medium transition">Contact</a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center space-x-4">
              <Link href="/login" className="px-6 py-2 text-blue-600 font-semibold hover:text-blue-700 transition">
                Sign In
              </Link>
              <Link href="/login" className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-lg transition">
                Get Started
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {isMenuOpen && (
            <div className="md:hidden mt-4 space-y-4 pb-4">
              <a href="#features" className="block text-gray-700 hover:text-blue-600 font-medium">Features</a>
              <a href="#benefits" className="block text-gray-700 hover:text-blue-600 font-medium">Benefits</a>
              <a href="#contact" className="block text-gray-700 hover:text-blue-600 font-medium">Contact</a>
              <Link href="/login" className="block px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold text-center">
                Get Started
              </Link>
            </div>
          )}
        </nav>
      </header>

      {/* Hero Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
        <div className="grid md:grid-cols-2 gap-12 items-center">
          <div className="space-y-8">
            <div className="space-y-4">
              <div className="inline-block bg-blue-100 text-blue-700 px-4 py-2 rounded-full font-semibold text-sm">
                ✨ Modern Education Management
              </div>
              <h1 className="text-5xl md:text-6xl font-bold text-gray-900 leading-tight">
                Transform Your School with <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Disha</span>
              </h1>
              <p className="text-xl text-gray-600 leading-relaxed">
                An all-in-one education management system designed to streamline operations, enhance communication, and empower educators to focus on what matters most: student success.
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/login" className="px-8 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg font-semibold hover:shadow-xl transition transform hover:scale-105 flex items-center justify-center space-x-2">
                <span>Start Free Trial</span>
                <ChevronRight size={20} />
              </Link>
              <button className="px-8 py-4 border-2 border-gray-300 text-gray-900 rounded-lg font-semibold hover:border-blue-600 hover:text-blue-600 transition">
                Watch Demo
              </button>
            </div>

            <div className="flex items-center space-x-6 text-sm text-gray-600">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>50+ Schools</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>10,000+ Users</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span>99.9% Uptime</span>
              </div>
            </div>
          </div>

          {/* Hero Image */}
          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-400 to-indigo-400 rounded-3xl opacity-10 blur-3xl"></div>
            <div className="relative bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl p-8 text-white shadow-2xl">
              <div className="space-y-4">
                <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                  <div className="text-sm font-semibold mb-2">Dashboard Overview</div>
                  <div className="space-y-2">
                    <div className="h-2 bg-white/30 rounded w-3/4"></div>
                    <div className="h-2 bg-white/30 rounded w-1/2"></div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                    <div className="text-3xl font-bold">2,450</div>
                    <div className="text-sm text-white/80">Active Students</div>
                  </div>
                  <div className="bg-white/20 rounded-lg p-4 backdrop-blur-sm">
                    <div className="text-3xl font-bold">94%</div>
                    <div className="text-sm text-white/80">Attendance Rate</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 bg-white/50 rounded-3xl">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Powerful Features Built for Schools
          </h2>
          <p className="text-xl text-gray-600">
            Everything you need to manage, engage, and inspire your school community
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Feature 1 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2">
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <Users className="text-blue-600" size={28} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Student Management</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Comprehensive student profiles, enrollment tracking, and performance monitoring all in one place.
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center space-x-2">
                <span className="text-blue-600">✓</span>
                <span>Quick enrollment</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-blue-600">✓</span>
                <span>Guardian communication</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-blue-600">✓</span>
                <span>Performance tracking</span>
              </li>
            </ul>
          </div>

          {/* Feature 2 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2">
            <div className="w-14 h-14 bg-indigo-100 rounded-xl flex items-center justify-center mb-6">
              <Clock className="text-indigo-600" size={28} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Attendance Tracking</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Real-time attendance marking, automated reports, and instant parent notifications.
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center space-x-2">
                <span className="text-indigo-600">✓</span>
                <span>Bulk marking</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-indigo-600">✓</span>
                <span>Automated alerts</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-indigo-600">✓</span>
                <span>Analytics & reports</span>
              </li>
            </ul>
          </div>

          {/* Feature 3 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2">
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <BarChart3 className="text-purple-600" size={28} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Assessment & Reports</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Create assessments, track progress, and generate detailed performance reports with ease.
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center space-x-2">
                <span className="text-purple-600">✓</span>
                <span>Easy assessment creation</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-purple-600">✓</span>
                <span>Visual analytics</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-purple-600">✓</span>
                <span>Export reports</span>
              </li>
            </ul>
          </div>

          {/* Feature 4 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2">
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center mb-6">
              <Zap className="text-green-600" size={28} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Communications Hub</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Centralized messaging, announcements, and notifications to keep everyone connected.
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>Parent notifications</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>Staff messaging</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-green-600">✓</span>
                <span>School announcements</span>
              </li>
            </ul>
          </div>

          {/* Feature 5 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2">
            <div className="w-14 h-14 bg-red-100 rounded-xl flex items-center justify-center mb-6">
              <Shield className="text-red-600" size={28} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Security & Privacy</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Bank-level encryption and role-based access control to protect your school's data.
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center space-x-2">
                <span className="text-red-600">✓</span>
                <span>End-to-end encryption</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-red-600">✓</span>
                <span>GDPR compliant</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-red-600">✓</span>
                <span>Regular backups</span>
              </li>
            </ul>
          </div>

          {/* Feature 6 */}
          <div className="bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition transform hover:-translate-y-2">
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center mb-6">
              <Smartphone className="text-orange-600" size={28} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-3">Mobile Accessible</h3>
            <p className="text-gray-600 leading-relaxed mb-4">
              Full functionality on mobile devices for on-the-go management and updates.
            </p>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-center space-x-2">
                <span className="text-orange-600">✓</span>
                <span>iOS & Android apps</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-orange-600">✓</span>
                <span>Offline access</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="text-orange-600">✓</span>
                <span>Real-time sync</span>
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Why Schools Choose Disha
          </h2>
          <p className="text-xl text-gray-600">
            Proven results that transform school operations and student outcomes
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-12">
          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-blue-600 text-white">
                  <span className="text-xl font-bold">1</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Save Time</h3>
                <p className="text-gray-600 mt-2">Automate administrative tasks and reduce paperwork by 80%, allowing teachers to focus on education.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-indigo-600 text-white">
                  <span className="text-xl font-bold">2</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Better Communication</h3>
                <p className="text-gray-600 mt-2">Strengthen parent-teacher relationships through instant messaging and real-time updates.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-purple-600 text-white">
                  <span className="text-xl font-bold">3</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Data-Driven Decisions</h3>
                <p className="text-gray-600 mt-2">Access real-time analytics and insights to identify trends and improve student performance.</p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-green-600 text-white">
                  <span className="text-xl font-bold">4</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Cost Effective</h3>
                <p className="text-gray-600 mt-2">Reduce operational costs with our affordable, scalable pricing model designed for schools.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-red-600 text-white">
                  <span className="text-xl font-bold">5</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">Enhanced Security</h3>
                <p className="text-gray-600 mt-2">Protect sensitive student and school data with enterprise-grade security protocols.</p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex-shrink-0">
                <div className="flex items-center justify-center h-12 w-12 rounded-md bg-orange-600 text-white">
                  <span className="text-xl font-bold">6</span>
                </div>
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900">24/7 Support</h3>
                <p className="text-gray-600 mt-2">Dedicated support team available round the clock to assist with any issues or questions.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-12 md:p-20 text-center text-white">
          <h2 className="text-4xl md:text-5xl font-bold mb-6">
            Ready to Transform Your School?
          </h2>
          <p className="text-xl text-blue-100 mb-10 max-w-2xl mx-auto">
            Join 50+ schools already using Disha to streamline operations and improve student outcomes.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login" className="px-8 py-4 bg-white text-blue-600 rounded-lg font-bold hover:shadow-lg transition transform hover:scale-105">
              Start Your Free Trial
            </Link>
            <button className="px-8 py-4 border-2 border-white text-white rounded-lg font-bold hover:bg-white/10 transition">
              Schedule a Demo
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-gray-900 text-gray-300 py-20 mt-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            {/* Company */}
            <div>
              <div className="flex items-center space-x-2 mb-6">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-indigo-400 rounded-lg"></div>
                <h3 className="text-xl font-bold text-white">Disha</h3>
              </div>
              <p className="text-gray-400 mb-6">
                Empowering schools with modern, accessible, and affordable education management solutions.
              </p>
              <div className="space-y-2">
                <p className="text-sm font-semibold text-white">Ryl Neuro Academy</p>
                <p className="text-sm text-gray-400">Education Technology & Solutions</p>
              </div>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-lg font-bold text-white mb-6">Product</h4>
              <ul className="space-y-3">
                <li><a href="#features" className="hover:text-blue-400 transition">Features</a></li>
                <li><a href="#pricing" className="hover:text-blue-400 transition">Pricing</a></li>
                <li><a href="#security" className="hover:text-blue-400 transition">Security</a></li>
                <li><a href="#roadmap" className="hover:text-blue-400 transition">Roadmap</a></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-lg font-bold text-white mb-6">Company</h4>
              <ul className="space-y-3">
                <li><a href="#about" className="hover:text-blue-400 transition">About Us</a></li>
                <li><a href="#blog" className="hover:text-blue-400 transition">Blog</a></li>
                <li><a href="#careers" className="hover:text-blue-400 transition">Careers</a></li>
                <li><a href="#contact" className="hover:text-blue-400 transition">Contact</a></li>
              </ul>
            </div>

            {/* Contact & Legal */}
            <div>
              <h4 className="text-lg font-bold text-white mb-6">Legal & Support</h4>
              <ul className="space-y-3">
                <li><a href="#privacy" className="hover:text-blue-400 transition">Privacy Policy</a></li>
                <li><a href="#terms" className="hover:text-blue-400 transition">Terms of Service</a></li>
                <li><a href="#security" className="hover:text-blue-400 transition">Security</a></li>
                <li><a href="mailto:support@disha.edu" className="hover:text-blue-400 transition">Support</a></li>
              </ul>
            </div>
          </div>

          {/* Contact Info */}
          <div className="border-t border-gray-800 pt-12 mb-12">
            <div className="grid md:grid-cols-3 gap-8">
              <div>
                <h4 className="text-white font-semibold mb-2">Email</h4>
                <a href="mailto:support@rylneuroacademy.com" className="text-gray-400 hover:text-blue-400 transition">
                  support@rylneuroacademy.com
                </a>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Phone</h4>
                <p className="text-gray-400">Available on request</p>
              </div>
              <div>
                <h4 className="text-white font-semibold mb-2">Website</h4>
                <a href="https://www.rylneuroacademy.com" target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-blue-400 transition">
                  www.rylneuroacademy.com
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Footer */}
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 text-sm">
              © 2026 Disha by Ryl Neuro Academy. All rights reserved.
            </p>
            <div className="flex space-x-6 mt-6 md:mt-0">
              <a href="#" className="text-gray-400 hover:text-blue-400 transition">Twitter</a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition">LinkedIn</a>
              <a href="#" className="text-gray-400 hover:text-blue-400 transition">Facebook</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
