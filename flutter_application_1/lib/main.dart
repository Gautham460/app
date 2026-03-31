import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'providers/auth_provider.dart';
import 'providers/fitbit_provider.dart';
import 'screens/login_screen.dart';
import 'screens/dashboard_screen.dart';
import 'theme/app_theme.dart';

void main() {
  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => FitbitProvider()),
      ],
      child: const EmotionalEnergyApp(),
    ),
  );
}

class EmotionalEnergyApp extends StatelessWidget {
  const EmotionalEnergyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Emotional Energy OS',
      theme: AppTheme.darkTheme,
      home: Consumer<AuthProvider>(
        builder: (ctx, auth, _) {
          if (auth.isAuthenticated) {
            return const DashboardScreen();
          }
          return const LoginScreen();
        },
      ),
    );
  }
}
