import 'react-native-url-polyfill/auto';
import React from 'react';
import { View, Text, Platform } from 'react-native';
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
import ProfileScreen from './screens/ProfileScreen';

import { LIGHT, DARK } from './constants/theme';

const Tab = createBottomTabNavigator();
const TodayStack = createNativeStackNavigator();
const NewsStack = createNativeStackNavigator();
const ExploreStack = createNativeStackNavigator();
const SavedStack = createNativeStackNavigator();
const ProfileStack = createNativeStackNavigator();

// ─── Stack navigators ────────────────────────────────────────────────────────

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

function SavedStackNav() {
  return (
    <SavedStack.Navigator screenOptions={{ headerShown: false }}>
      <SavedStack.Screen name="SavedHome" component={SavedScreen} />
      <SavedStack.Screen name="Lecture" component={LectureScreen} />
    </SavedStack.Navigator>
  );
}

function ProfileStackNav() {
  return (
    <ProfileStack.Navigator screenOptions={{ headerShown: false }}>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} />
    </ProfileStack.Navigator>
  );
}

// ─── Custom Tab Bar Label ────────────────────────────────────────────────────

function TabLabel({ label, focused, color }) {
  return (
    <Text style={{
      fontSize: 10,
      fontWeight: focused ? '700' : '500',
      color,
      marginTop: 2,
    }}>
      {label}
    </Text>
  );
}

// ─── Root App ────────────────────────────────────────────────────────────────

export default function App() {
  // For MVP, Today & Lecture use dark theme, others use light.
  // Tab bar switches based on active tab.

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <NavigationContainer>
          <Tab.Navigator
            initialRouteName="Today"
            screenOptions={({ route }) => {
              // Today and Explore tabs have dark backgrounds, others light
              const isDarkTab = route.name === 'Today' || route.name === 'Explore';
              const tabBarBg = isDarkTab ? DARK.tabBar : LIGHT.tabBar;
              const tabBarBorder = isDarkTab ? DARK.tabBorder : LIGHT.tabBorder;
              const activeTint = isDarkTab ? DARK.primary : LIGHT.primary;
              const inactiveTint = isDarkTab ? DARK.textMuted : LIGHT.textMuted;

              return {
                headerShown: false,
                tabBarStyle: {
                  backgroundColor: tabBarBg,
                  borderTopColor: tabBarBorder,
                  borderTopWidth: 1,
                  height: Platform.OS === 'ios' ? 82 : 64,
                  paddingBottom: Platform.OS === 'ios' ? 24 : 8,
                  paddingTop: 8,
                  elevation: 0,
                  shadowOpacity: 0,
                },
                tabBarActiveTintColor: activeTint,
                tabBarInactiveTintColor: inactiveTint,
              };
            }}
          >
            <Tab.Screen
              name="Today"
              component={TodayStackNav}
              options={{
                tabBarIcon: ({ color, size, focused }) => (
                  <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
                ),
                tabBarLabel: ({ color, focused }) => (
                  <TabLabel label="Today" focused={focused} color={color} />
                ),
              }}
            />
            <Tab.Screen
              name="News"
              component={NewsStackNav}
              options={{
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons name={focused ? 'newspaper' : 'newspaper-outline'} size={22} color={color} />
                ),
                tabBarLabel: ({ color, focused }) => (
                  <TabLabel label="News" focused={focused} color={color} />
                ),
              }}
            />
            <Tab.Screen
              name="Explore"
              component={ExploreStackNav}
              options={{
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons name={focused ? 'search' : 'search-outline'} size={22} color={color} />
                ),
                tabBarLabel: ({ color, focused }) => (
                  <TabLabel label="Explore" focused={focused} color={color} />
                ),
              }}
            />
            <Tab.Screen
              name="Saved"
              component={SavedStackNav}
              options={{
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons name={focused ? 'bookmark' : 'bookmark-outline'} size={22} color={color} />
                ),
                tabBarLabel: ({ color, focused }) => (
                  <TabLabel label="Saved" focused={focused} color={color} />
                ),
              }}
            />
            <Tab.Screen
              name="Profile"
              component={ProfileStackNav}
              options={{
                tabBarIcon: ({ color, focused }) => (
                  <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
                ),
                tabBarLabel: ({ color, focused }) => (
                  <TabLabel label="Profile" focused={focused} color={color} />
                ),
              }}
            />
          </Tab.Navigator>
        </NavigationContainer>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
