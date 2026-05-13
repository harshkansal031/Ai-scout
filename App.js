import 'react-native-url-polyfill/auto';
import React from 'react';
import { ActivityIndicator, Platform, Text, View } from 'react-native';
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
import AuthScreen from './screens/AuthScreen';

import { DARK, LIGHT } from './constants/theme';
import { AppProvider, useApp } from './context/AppProvider';

const Tab = createBottomTabNavigator();
const RootStack = createNativeStackNavigator();
const TodayStack = createNativeStackNavigator();
const NewsStack = createNativeStackNavigator();
const ExploreStack = createNativeStackNavigator();
const SavedStack = createNativeStackNavigator();
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

function MainTabs() {
  const { themeMode } = useApp();
  const theme = themeMode === 'dark' ? DARK : LIGHT;

  return (
    <Tab.Navigator
      initialRouteName="Today"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBar,
          borderTopColor: theme.tabBorder,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 82 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
          paddingTop: 8,
          elevation: 0,
          shadowOpacity: 0,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.textMuted,
      }}
    >
      <Tab.Screen
        name="Today"
        component={TodayStackNav}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
          ),
          tabBarLabel: ({ color, focused }) => <TabLabel label="Today" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="News"
        component={NewsStackNav}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'newspaper' : 'newspaper-outline'} size={22} color={color} />
          ),
          tabBarLabel: ({ color, focused }) => <TabLabel label="News" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Explore"
        component={ExploreStackNav}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'search' : 'search-outline'} size={22} color={color} />
          ),
          tabBarLabel: ({ color, focused }) => <TabLabel label="Explore" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Saved"
        component={SavedStackNav}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'bookmark' : 'bookmark-outline'} size={22} color={color} />
          ),
          tabBarLabel: ({ color, focused }) => <TabLabel label="Saved" focused={focused} color={color} />,
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileStackNav}
        options={{
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
          ),
          tabBarLabel: ({ color, focused }) => <TabLabel label="Profile" focused={focused} color={color} />,
        }}
      />
    </Tab.Navigator>
  );
}

function RootNavigation() {
  const { session, authLoading, backendKind } = useApp();

  if (authLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: DARK.bg, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
        <ActivityIndicator size="large" color={LIGHT.primary} />
        <Text style={{ color: '#FFFFFF', fontSize: 15, fontWeight: '600' }}>
          Loading {backendKind === 'supabase' ? 'backend session' : 'local workspace'}...
        </Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {session?.user ? (
          <RootStack.Screen name="AppTabs" component={MainTabs} />
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
          <RootNavigation />
        </AppProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
