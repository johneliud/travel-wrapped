import React from 'react';
import { motion } from 'framer-motion';

interface HomePageProps {
  onGetStarted: () => void;
}

export const HomePage: React.FC<HomePageProps> = ({ onGetStarted }) => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
      {/* Hero Section */}
      <motion.div 
        initial="hidden"
        animate="visible"
        variants={containerVariants}
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-20"
      >
        {/* Header */}
        <motion.div variants={itemVariants} className="text-center mb-16">
          <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
            <span>🌍</span>
            <span>Your Personal Travel Analytics</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-6 leading-tight">
            Travel{' '}
            <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Wrapped
            </span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-600 mb-10 max-w-4xl mx-auto leading-relaxed">
            Transform your Google Maps Timeline into beautiful travel insights and shareable stories, 
            just like Spotify Wrapped but for your adventures
          </p>
          
          <motion.button
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={onGetStarted}
            className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-10 py-4 rounded-xl text-lg font-semibold shadow-lg hover:shadow-2xl transition-all duration-300 transform"
          >
            <span className="flex items-center space-x-2">
              <span>✨</span>
              <span>Create Your Travel Story</span>
            </span>
          </motion.button>
        </motion.div>

        {/* Process Steps */}
        <motion.div variants={itemVariants} className="mb-20">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: "📤",
                title: "Upload Timeline",
                description: "Upload your Google Maps Timeline data or manually enter your trips",
                color: "from-blue-500 to-cyan-500",
                bgColor: "bg-blue-50"
              },
              {
                icon: "🧠",
                title: "AI Enhancement",
                description: "Smart analysis with weather data, location names, and travel insights",
                color: "from-green-500 to-emerald-500",
                bgColor: "bg-green-50"
              },
              {
                icon: "🎨",
                title: "Beautiful Stories",
                description: "Interactive maps, visualizations, and shareable travel memories",
                color: "from-purple-500 to-pink-500",
                bgColor: "bg-purple-50"
              }
            ].map((step, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5, scale: 1.02 }}
                className="text-center group"
              >
                <div className={`w-20 h-20 mx-auto mb-6 ${step.bgColor} rounded-2xl flex items-center justify-center text-3xl shadow-lg group-hover:shadow-xl transition-all duration-300`}>
                  {step.icon}
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-3">{step.title}</h3>
                <p className="text-gray-600 leading-relaxed">{step.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Features Grid */}
        <motion.div variants={itemVariants} className="mb-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose Travel Wrapped?
            </h2>
            <p className="text-gray-600 text-lg max-w-2xl mx-auto">
              The most comprehensive and privacy-focused travel analytics platform
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[
              {
                icon: "🔒",
                title: "100% Private",
                description: "Your data never leaves your device. Complete privacy guaranteed.",
                color: "text-blue-600",
                bgColor: "bg-blue-100"
              },
              {
                icon: "🎮",
                title: "Gamified Experience",
                description: "Achievements, levels, and fun insights make exploring your data engaging.",
                color: "text-purple-600",
                bgColor: "bg-purple-100"
              },
              {
                icon: "🌟",
                title: "Beautiful Design",
                description: "Stunning visuals, smooth animations, and intuitive interface.",
                color: "text-pink-600",
                bgColor: "bg-pink-100"
              },
              {
                icon: "🚀",
                title: "Advanced Analytics",
                description: "Deep insights into your travel patterns, preferences, and statistics.",
                color: "text-green-600",
                bgColor: "bg-green-100"
              }
            ].map((feature, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -3, scale: 1.02 }}
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className={`w-12 h-12 ${feature.bgColor} rounded-xl flex items-center justify-center mb-4 text-xl`}>
                  {feature.icon}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats Section */}
        <motion.div variants={itemVariants} className="mb-20">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-8 text-white text-center">
            <h2 className="text-2xl md:text-3xl font-bold mb-6">Discover Your Travel Insights</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { number: "20+", label: "Unique Achievements", icon: "🏆" },
                { number: "10", label: "Travel Levels", icon: "📈" },
                { number: "∞", label: "Beautiful Memories", icon: "💫" }
              ].map((stat, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.05 }}
                  className="text-center"
                >
                  <div className="text-4xl mb-2">{stat.icon}</div>
                  <div className="text-3xl font-bold mb-1">{stat.number}</div>
                  <div className="text-blue-100">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Final CTA */}
        <motion.div variants={itemVariants} className="text-center">
          <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-12 max-w-3xl mx-auto border border-gray-100">
            <div className="text-4xl mb-4">🗺️</div>
            <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-4">
              Ready to Explore Your Travel Story?
            </h2>
            <p className="text-gray-600 mb-8 text-lg leading-relaxed">
              Get your Google Maps Timeline data and create your personalized Travel Wrapped in minutes. 
              Discover patterns, achievements, and beautiful visualizations of your adventures.
            </p>
            
            <div className="space-y-4">
              <motion.button
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={onGetStarted}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all duration-300 text-lg"
              >
                <span className="flex items-center justify-center space-x-2">
                  <span>🚀</span>
                  <span>Start Your Journey</span>
                </span>
              </motion.button>
              
              <p className="text-sm text-gray-500">
                No signup required • 100% free • Privacy guaranteed
              </p>
            </div>
          </div>
        </motion.div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 opacity-20">
          <motion.div
            animate={{ 
              y: [0, -20, 0],
              rotate: [0, 5, 0]
            }}
            transition={{ 
              duration: 6,
              repeat: Infinity,
              ease: "easeInOut"
            }}
            className="text-6xl"
          >
            ✈️
          </motion.div>
        </div>
        
        <div className="absolute top-40 right-20 opacity-20">
          <motion.div
            animate={{ 
              y: [0, 15, 0],
              rotate: [0, -5, 0]
            }}
            transition={{ 
              duration: 8,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 2
            }}
            className="text-5xl"
          >
            🌍
          </motion.div>
        </div>
        
        <div className="absolute bottom-40 left-20 opacity-20">
          <motion.div
            animate={{ 
              y: [0, -10, 0],
              x: [0, 10, 0]
            }}
            transition={{ 
              duration: 7,
              repeat: Infinity,
              ease: "easeInOut",
              delay: 1
            }}
            className="text-4xl"
          >
            📍
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
