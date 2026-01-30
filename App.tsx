import React from 'react';
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom';
import { NotificationProvider } from './context/NotificationContext';
import LoginScreen from './screens/LoginScreen';
import HomeScreen from './screens/HomeScreen';
import ServiceCategoryScreen from './screens/ServiceCategoryScreen';
import PublishTaskScreen from './screens/PublishTaskScreen';
import OrderTrackingScreen from './screens/OrderTrackingScreen';
import MessageListScreen from './screens/MessageListScreen';
import ProfileScreen from './screens/ProfileScreen';
import DigitalCardScreen from './screens/DigitalCardScreen';
import ChatScreen from './screens/ChatScreen';
import BottomNav from './components/BottomNav';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const location = useLocation();
  // Hide bottom nav on specific full-screen flows
  const hideNavRoutes = ['/', '/login', '/publish', '/tracking', '/card', '/services', '/chat'];
  const showNav = !hideNavRoutes.includes(location.pathname);

  return (
    <div className="relative min-h-screen w-full max-w-full mx-auto sm:max-w-md md:max-w-lg lg:max-w-xl bg-background-light dark:bg-background-dark shadow-2xl overflow-hidden flex flex-col">
      <div className="flex-1 overflow-y-auto no-scrollbar relative w-full min-h-0">
        {children}
      </div>
      {showNav && <BottomNav />}
    </div>
  );
};

const App = () => {
  return (
    <HashRouter>
      <NotificationProvider>
        <Layout>
          <Routes>
          <Route path="/" element={<LoginScreen />} />
          <Route path="/home" element={<HomeScreen />} />
          <Route path="/services" element={<ServiceCategoryScreen />} />
          <Route path="/publish" element={<PublishTaskScreen />} />
          <Route path="/tracking" element={<OrderTrackingScreen />} />
          <Route path="/messages" element={<MessageListScreen />} />
          <Route path="/chat" element={<ChatScreen />} />
          <Route path="/profile" element={<ProfileScreen />} />
          <Route path="/card" element={<DigitalCardScreen />} />
          </Routes>
        </Layout>
      </NotificationProvider>
    </HashRouter>
  );
};

export default App;
