import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { StatusBar } from 'expo-status-bar';
import { View, Text, StyleSheet } from 'react-native';

const queryClient = new QueryClient();

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NavigationContainer>
        <StatusBar style="auto" />
        <View style={styles.container}>
          <Text style={styles.title}>CRM/ERP Mobile</Text>
          <Text style={styles.subtitle}>Yakında...</Text>
        </View>
      </NavigationContainer>
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f9fafb' },
  title: { fontSize: 28, fontWeight: 'bold', color: '#1f2937' },
  subtitle: { fontSize: 16, color: '#6b7280', marginTop: 8 }
});
