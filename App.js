import 'react-native-url-polyfill/auto';
import React from 'react';
import { Platform, Text, View, ScrollView, TouchableOpacity, useWindowDimensions } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { Ionicons } from '@expo/vector-icons';

import TodayScreen from './screens/TodayScreen';
import LectureScreen from './screens/LectureScreen';
import NewsScreen from './screens/NewsScreen';
import ExploreScreen from './screens/ExploreScreen';
import SavedScreen from './screens/SavedScreen';
import UpcomingScreen from './screens/UpcomingScreen';
import ProfileScreen from './screens/ProfileScreen';
import AuthScreen from './screens/AuthScreen';

import { DARK, LIGHT } from './constants/theme';
import { AppProvider, useApp } from './context/AppProvider';
import SplashGate from './components/SplashGate';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();
const TodayStack = createNativeStackNavigator();
const NewsStack = createNativeStackNavigator();
const ExploreStack = createNativeStackNavigator();
const UpcomingStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

function TabLabel({ label, focused, color }) {
  return (
    <Text
      style={{
        fontSize: 10,
        fontWeight: focused ? '700' : '500',
        color,
        marginTop: 2,
      }}
    >
      {label}
    </Text>
  );
}

function TodayStackNav() {
  return (
    <TodayStack.Navigator screenOptions={{ headerShown: false }}>
      <TodayStack.Screen name="TodayHome" component={TodayScreen} />
      <TodayStack.Screen name="Lecture" component={LectureScreen} />
    </TodayStack.Navigator>
  );
}

function NewsStackNav() {
  return (
    <NewsStack.Navigator screenOptions={{ headerShown: false }}>
      <NewsStack.Screen name="NewsHome" component={NewsScreen} />
      <NewsStack.Screen name="Lecture" component={LectureScreen} />
    </NewsStack.Navigator>
  );
}

function ExploreStackNav() {
  return (
    <ExploreStack.Navigator screenOptions={{ headerShown: false }}>
      <ExploreStack.Screen name="ExploreHome" component={ExploreScreen} />
      <ExploreStack.Screen name="Lecture" component={LectureScreen} />
    </ExploreStack.Navigator>
  );
}

function UpcomingStackNav() {
  return (
    <UpcomingStack.Navigator screenOptions={{ headerShown: false }}>
      <UpcomingStack.Screen name="UpcomingHome" component={UpcomingScreen} />
      <UpcomingStack.Screen name="Lecture" component={LectureScreen} />
    </UpcomingStack.Navigator>
  );
}

function ProfileStackNav() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
      <ProfileStack.Screen name="SavedContent" component={SavedScreen} />
    </ProfileStack.Navigator>
  );
}

const PAGES = [
  { name: 'Today', component: TodayScreen, iconActive: 'home', iconInactive: 'home-outline' },
  { name: 'News', component: NewsScreen, iconActive: 'newspaper', iconInactive: 'newspaper-outline' },
  { name: 'Explore', component: ExploreScreen, iconActive: 'search', iconInactive: 'search-outline' },
  { name: 'Upcoming', component: UpcomingScreen, iconActive: 'calendar', iconInactive: 'calendar-outline' },
  { name: 'Profile', component: ProfileScreen, iconActive: 'person', iconInactive: 'person-outline' },
];

function MainTabs() {
  const { themeMode } = useApp();
  const theme = themeMode === 'dark' ? DARK : LIGHT;
  const { width } = useWindowDimensions();
  
  const [activeIndex, setActiveIndex] = React.useState(0);
  const scrollViewRef = React.useRef(null);

  const handleScroll = (event) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / width);
    if (index !== activeIndex && index >= 0 && index < PAGES.length) {
      setActiveIndex(index);
    }
  };

  const handleTabPress = (index) => {
    setActiveIndex(index);
    scrollViewRef.current?.scrollTo({ x: index * width, animated: false });
  };

  return (
    <View style={{ flex: 1, backgroundColor: theme.bg }}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        scrollEnabled={false}
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        bounces={false}
        keyboardShouldPersistTaps="handled"
        removeClippedSubviews={Platform.OS === 'android'}
        style={{ flex: 1 }}
      >
        {PAGES.map((page, index) => {
          const PageComponent = page.component;
          return (
            <View key={page.name} style={{ width, flex: 1 }}>
              <PageComponent />
            </View>
          );
        })}
      </ScrollView>

      {/* Premium glassmorphic style bottom tab bar */}
      <View
        style={{
          flexDirection: 'row',
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 82 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          alignItems: 'center',
          justifyContent: 'space-around',
        }}
      >
        {PAGES.map((page, index) => {
          const isActive = activeIndex === index;
          const tintColor = isActive ? theme.primary : theme.textMuted;
          
          return (
            <TouchableOpacity
              key={page.name}
              onPress={() => handleTabPress(index)}
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                flex: 1,
                height: '100%',
              }}
              activeOpacity={0.7}
            >
              <Ionicons
                name={isActive ? page.iconActive : page.iconInactive}
                size={22}
                color={tintColor}
              />
              <TabLabel label={page.name} focused={isActive} color={tintColor} />
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

function RootNavigation() {
  const { session, authLoading } = useApp();

  if (authLoading) {
    return null;
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {session?.user ? (
          <>
            <RootStack.Screen name="AppTabs" component={MainTabs} />
            <RootStack.Screen name="Lecture" component={LectureScreen} />
            <RootStack.Screen name="SavedContent" component={SavedScreen} />
          </>
        ) : (
          <RootStack.Screen name="Auth" component={AuthScreen} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppProvider>
          <SplashGate>
            <RootNavigation />
          </SplashGate>
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
